const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('./config/keywords');

// HTTP Keep-Alive 최적화 및 연결 안정성 향상
const httpAgent = new http.Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 30000
});
const httpsAgent = new https.Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 30000
});
axios.defaults.httpAgent = httpAgent;
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 4000; // 전역 타임아웃 4초로 단축

const app = express();
app.use(express.json());

// 카카오톡 5초 제한에 맞춘 응답 타임아웃 설정
app.use((req, res, next) => {
    res.setTimeout(4500, () => {  // 4.5초로 단축
        console.log('⏰ 서버 타임아웃 (4.5초) - 카카오톡 호환성');
        
        if (!res.headersSent) {
            res.status(200).json({
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: "⏰ 처리 시간이 길어지고 있습니다.\n\n간단한 질문으로 다시 시도해주세요."
                        }
                    }]
                }
            });
        }
    });
    next();
});

// 네이버 검색 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_API_URL = 'https://openapi.naver.com/v1/search/shop.json';
const NAVER_LOCAL_API_URL = 'https://openapi.naver.com/v1/search/local.json';

// 설정 파일에서 타임아웃 설정 가져오기
const TIMEOUT_CONFIG = config.timeouts;

// 한국 시간 가져오기 함수
function getKoreanDateTime() {
    const now = new Date();
    const formatted = now.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }) + ' ' + now.toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    return {
        formatted: formatted
    };
}

// 스마트 메시지 분할 시스템
function smartSplit(text, maxLength = 1500) {
    if (text.length <= maxLength) return [text];
    
    const sentences = text.split(/([.!?]\s+)/);
    const chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        const testChunk = currentChunk + part;
        
        if (testChunk.length > maxLength - 100) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = part;
            } else {
                const forceSplit = part.match(/.{1,600}/g) || [part];
                for (let j = 0; j < forceSplit.length; j++) {
                    if (j === 0) {
                        chunks.push(forceSplit[j] + '...');
                    } else if (j === forceSplit.length - 1) {
                        currentChunk = '...' + forceSplit[j];
                    } else {
                        chunks.push('...' + forceSplit[j] + '...');
                    }
                }
            }
        } else {
            currentChunk = testChunk;
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

// 응답 분할 처리 함수
const pendingMessages = new Map();

function handleLongResponse(text, userId, responseType = 'general') {
    const chunks = smartSplit(text, 1500);
    
    if (chunks.length === 1) {
        return { text: chunks[0], hasMore: false };
    }
    
    const firstChunk = chunks[0];
    const remainingChunks = chunks.slice(1).join('\n\n');
    
    pendingMessages.set(userId, remainingChunks);
    
    const responseTypeEmoji = {
        'image': '🖼️',
        'restaurant': '🍽️',
        'news': '📰',
        'shopping': '🛒',
        'general': '💬'
    };
    
    const emoji = responseTypeEmoji[responseType] || '💬';
    const continueText = `\n\n${emoji} "계속" 또는 "더보기"를 입력하면 나머지 내용을 확인할 수 있습니다.`;
    
    console.log(`📄 ${responseType} 응답 분할: 총 ${chunks.length}개 청크, 첫 청크 ${firstChunk.length}자`);
    
    return {
        text: firstChunk + continueText,
        hasMore: true,
        totalChunks: chunks.length
    };
}

// 네이버 뉴스 검색 함수
async function getLatestNews(query = '오늘 뉴스') {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 10,
            start: 1,
            sort: 'date'
        };
        
        console.log(`📡 네이버 뉴스 검색: "${query}"`);
        
        const response = await axios.get(NAVER_NEWS_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('📰 검색된 뉴스가 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 뉴스를 찾았습니다.`);
        
        return items.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            description: item.description.replace(/<[^>]*>/g, ''),
            link: item.link,
            pubDate: item.pubDate
        }));
        
    } catch (error) {
        console.error('❌ 네이버 뉴스 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 쇼핑 검색 함수
async function getShoppingResults(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 15,  // 더 많이 가져와서 필터링
            start: 1,
            sort: 'price'  // 가격순으로 정렬
        };
        
        console.log(`🛒 네이버 쇼핑 검색: "${query}"`);
        
        const response = await axios.get(NAVER_SHOPPING_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🛒 검색된 상품이 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 상품을 찾았습니다.`);
        
        return items.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            title: item.title.replace(/<[^>]*>/g, ''),
            price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격정보없음',
            mallName: item.mallName || '쇼핑몰정보없음',
            brand: item.brand || '',
            link: item.link,
            image: item.image,
            productId: item.productId,
            category1: item.category1,
            category2: item.category2
        }));
        
    } catch (error) {
        console.error('❌ 네이버 쇼핑 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 지역검색 API로 맛집 가져오기 함수
async function getLocalRestaurants(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 20,  // 필터링을 위해 더 많이 가져옴
            start: 1,
            sort: 'comment'  // 리뷰/댓글 많은 순으로 정렬 (사용자 검색 많은 곳)
        };
        
        console.log(`🍽️ 네이버 지역검색: "${query}"`);
        console.log(`📊 API 요청 파라미터:`, params);
        
        const response = await axios.get(NAVER_LOCAL_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        console.log(`📈 API 응답 상태: ${response.status}`);
        console.log(`📊 API 응답 데이터:`, {
            total: response.data.total || 0,
            start: response.data.start || 0,
            display: response.data.display || 0,
            itemsCount: response.data.items?.length || 0
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🍽️ 검색된 맛집이 없습니다.');
            console.log(`🔍 API 응답 전체:`, JSON.stringify(response.data, null, 2));
            return null;
        }
        
        console.log(`✅ ${items.length}개의 원본 결과를 받았습니다.`);
        
        // 패스트푸드점 및 체인점 필터링 (설정 파일 기반)
        const filteredItems = items.filter(item => {
            const title = item.title.replace(/<[^>]*>/g, '');
            const category = item.category || '';
            
            // 제외 키워드 체크 (체인점, 패스트푸드)
            const hasExcludeKeyword = config.restaurant_filters.exclude_keywords.some(keyword => 
                title.includes(keyword) || category.includes(keyword)
            );
            
            // 제외 카테고리 체크 (편의점, 마트 등)
            const hasExcludeCategory = config.restaurant_filters.exclude_categories.some(excludeCategory =>
                category.includes(excludeCategory)
            );
            
            // 필터링 결과를 로그로 남김 (디버깅용)
            if (hasExcludeKeyword || hasExcludeCategory) {
                console.log(`🚫 필터링 제외: "${title}" (카테고리: ${category})`);
            }
            
            return !hasExcludeKeyword && !hasExcludeCategory;
        });
        
        console.log(`🔍 필터링 완료: ${items.length}개 → ${filteredItems.length}개 (패스트푸드/체인점 제외)`);
        
        if (filteredItems.length === 0) {
            console.log('🍽️ 필터링 후 맛집이 없습니다.');
            return null;
        }
        
        // 인기도 기준 추가 정렬 (사용자 검색량 기준, 설정 파일 기반)
        const sortedItems = filteredItems.sort((a, b) => {
            const titleA = a.title.replace(/<[^>]*>/g, '');
            const titleB = b.title.replace(/<[^>]*>/g, '');
            
            // 인기 키워드 점수 계산
            const popularKeywordScoreA = config.restaurant_filters.popular_keywords
                .filter(keyword => titleA.includes(keyword)).length;
            const popularKeywordScoreB = config.restaurant_filters.popular_keywords
                .filter(keyword => titleB.includes(keyword)).length;
            
            // 카테고리 우선순위 점수
            const categoryScoreA = config.restaurant_filters.category_priority[a.category] || 0;
            const categoryScoreB = config.restaurant_filters.category_priority[b.category] || 0;
            
            // 총 점수 계산 (인기 키워드 가중치를 높게)
            const totalScoreA = (popularKeywordScoreA * 3) + categoryScoreA;
            const totalScoreB = (popularKeywordScoreB * 3) + categoryScoreB;
            
            return totalScoreB - totalScoreA; // 높은 점수가 우선
        });
        
        console.log(`📊 인기도순 정렬 완료: ${sortedItems.length}개`);
        
        // 첫 번째 결과 샘플 로깅
        if (sortedItems.length > 0) {
            console.log(`🏪 첫 번째 결과 샘플:`, {
                title: sortedItems[0].title?.replace(/<[^>]*>/g, ''),
                category: sortedItems[0].category,
                address: sortedItems[0].address
            });
        }
        
        // 최대 5개까지 반환
        return sortedItems.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            category: item.category,
            description: item.description ? item.description.replace(/<[^>]*>/g, '') : '',
            telephone: item.telephone || '전화번호 없음',
            address: item.address,
            roadAddress: item.roadAddress,
            mapx: item.mapx,
            mapy: item.mapy,
            link: item.link
        }));
        
    } catch (error) {
        console.error('❌ 네이버 지역검색 API 오류:', error.response?.data || error.message);
        console.error('🔍 오류 세부사항:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        return null;
    }
}

// 요청 분석 함수들
function isNewsRequest(message) {
    return config.news.some(keyword => message.includes(keyword));
}

function isShoppingRequest(message) {
    const hasShoppingKeyword = config.shopping.general.some(keyword => message.includes(keyword));
    const hasProductKeyword = config.shopping.products.some(keyword => message.includes(keyword));
    const hasRestaurantKeyword = config.restaurant.food.some(keyword => message.includes(keyword));
    
    // 제품 추천의 경우: "제품명 + 추천" 형태
    const hasProductRecommend = hasProductKeyword && message.includes('추천');
    
    // 가격 비교 요청: "제일 싼곳", "저렴한", "가격", "어디서 사야" 등
    const hasPriceKeyword = config.shopping.price_keywords.some(keyword => message.includes(keyword));
    
    // 특정 제품명이 포함된 경우 (맥미니, 아이폰 등)
    const hasSpecificProduct = config.shopping.products.some(product => message.includes(product));
    
    // 리뷰/평가 관련 질문은 쇼핑이 아닌 Claude AI로 처리
    const isReviewQuestion = config.shopping.review_keywords.some(keyword => message.includes(keyword));
    
    // 명확한 쇼핑 의도가 있고, 리뷰 질문이 아니며, 맛집 키워드가 없는 경우만 쇼핑 검색
    const hasShoppingIntent = hasShoppingKeyword || hasProductRecommend || (hasPriceKeyword && hasSpecificProduct);
    
    return hasShoppingIntent && !isReviewQuestion && !hasRestaurantKeyword;
}

function isRestaurantRequest(message) {
    const hasRestaurantKeyword = config.restaurant.food.some(keyword => message.includes(keyword));
    
    // 기존 지역 키워드 확인
    const allLocationKeywords = [
        ...config.restaurant.locations.seoul,
        ...config.restaurant.locations.gyeonggi,
        ...config.restaurant.locations.major_cities,
        ...config.restaurant.locations.general
    ];
    const hasLocationKeyword = allLocationKeywords.some(keyword => message.includes(keyword));
    
    // 지능형 지역 패턴 매칭 (구, 동, 시, 군, 읍, 면, 역 등)
    const locationPatterns = [
        /\w+구(?:\s|$)/,     // OO구 (예: 강북구, 서초구)
        /\w+동(?:\s|$)/,     // OO동 (예: 번3동, 역삼동)
        /\w+시(?:\s|$)/,     // OO시 (예: 성남시, 고양시)
        /\w+군(?:\s|$)/,     // OO군 (예: 양평군)
        /\w+읍(?:\s|$)/,     // OO읍 (예: 진접읍)
        /\w+면(?:\s|$)/,     // OO면 (예: 청평면)
        /\w+역(?:\s|$)/,     // OO역 (예: 강남역, 홍대입구역)
        /\w+대(?:\s|$)/,     // OO대 (예: 연세대, 고려대)
        /\w+로(?:\s|$)/,     // OO로 (예: 테헤란로, 강남대로)
        /\w+거리(?:\s|$)/,   // OO거리 (예: 명동거리, 인사동거리)
        /\w+타운(?:\s|$)/,   // OO타운 (예: 이태원, 강남타운)
        /\w+단지(?:\s|$)/,   // OO단지 (예: 분당신도시, 일산신도시)
    ];
    
    const hasLocationPattern = locationPatterns.some(pattern => pattern.test(message));
    
    const hasExcludeKeyword = config.exclude.shopping_from_restaurant.some(keyword => message.includes(keyword));
    
    return hasRestaurantKeyword && (hasLocationKeyword || hasLocationPattern) && !hasExcludeKeyword;
}

// Basic health check
app.get('/', (req, res) => {
    const koreanTime = getKoreanDateTime();
    const hasClaudeApiKey = !!process.env.CLAUDE_API_KEY;
    const hasNaverClientId = !!process.env.NAVER_CLIENT_ID;
    const hasNaverClientSecret = !!process.env.NAVER_CLIENT_SECRET;
    
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${koreanTime.formatted}</p>
        <p><strong>Claude AI API:</strong> ${hasClaudeApiKey ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>네이버 검색 API:</strong> ${(hasNaverClientId && hasNaverClientSecret) ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>Client ID:</strong> ${hasNaverClientId ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>Client Secret:</strong> ${hasNaverClientSecret ? '✅ 설정됨' : '❌ 미설정'}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> /kakao-skill-webhook</p>
        <hr>
        <p><strong>기능:</strong></p>
        <ul>
            <li>🤖 Claude AI 답변 (M4 vs M2 성능비교 등)</li>
            <li>📰 실시간 뉴스 제공 (예: "오늘 뉴스", "최신 뉴스")</li>
            <li>🛒 쇼핑 상품 검색 (예: "노트북 추천", "휴대폰 베스트")</li>
            <li>🍽️ 맛집 검색 (예: "강남역 맛집", "홍대 카페")</li>
            <li>💬 긴 답변 자동 분할 및 "계속" 기능</li>
        </ul>
    `);
});

// Main webhook endpoint with Claude AI integration
app.post('/kakao-skill-webhook', async (req, res) => {
    console.log('🔔 카카오 웹훅 요청 받음!');
    console.log('요청 본문:', JSON.stringify(req.body, null, 2));
    
    try {
        const userMessage = req.body.userRequest?.utterance || '';
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        if (!userMessage) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: "메시지를 입력해주세요."
                        }
                    }]
                }
            };
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(response);
            return;
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
        // 키워드 감지 디버깅
        const debugInfo = {
            isNews: isNewsRequest(userMessage),
            isShopping: isShoppingRequest(userMessage), 
            isRestaurant: isRestaurantRequest(userMessage),
            isReviewQuestion: config.shopping.review_keywords.some(keyword => userMessage.includes(keyword)),
            message: userMessage
        };
        
        // 맛집 요청인 경우 추가 디버깅 정보
        if (debugInfo.isRestaurant) {
            const hasRestaurantKeyword = config.restaurant.food.some(keyword => userMessage.includes(keyword));
            const allLocationKeywords = [
                ...config.restaurant.locations.seoul,
                ...config.restaurant.locations.gyeonggi,
                ...config.restaurant.locations.major_cities,
                ...config.restaurant.locations.general
            ];
            const hasLocationKeyword = allLocationKeywords.some(keyword => userMessage.includes(keyword));
            
            const locationPatterns = [
                /\w+구(?:\s|$)/,     // OO구
                /\w+동(?:\s|$)/,     // OO동
                /\w+시(?:\s|$)/,     // OO시
                /\w+군(?:\s|$)/,     // OO군
                /\w+읍(?:\s|$)/,     // OO읍
                /\w+면(?:\s|$)/,     // OO면
                /\w+역(?:\s|$)/,     // OO역
                /\w+로(?:\s|$)/,     // OO로
                /\w+거리(?:\s|$)/,   // OO거리
            ];
            const hasLocationPattern = locationPatterns.some(pattern => pattern.test(userMessage));
            
            debugInfo.restaurantDebug = {
                hasRestaurantKeyword,
                hasLocationKeyword, 
                hasLocationPattern,
                foundRestaurantKeywords: config.restaurant.food.filter(keyword => userMessage.includes(keyword)),
                foundLocationKeywords: allLocationKeywords.filter(keyword => userMessage.includes(keyword)),
                locationPatternMatches: locationPatterns.filter(pattern => pattern.test(userMessage)).map(pattern => pattern.toString())
            };
        }
        
        console.log(`🔍 키워드 감지 결과:`, debugInfo);
        
        let responseText;
        
        // 간단한 인사나 기본 질문 처리
        if (userMessage.includes('안녕') || userMessage.includes('hi') || userMessage.includes('hello')) {
            responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
        }
        // 시간 관련 질문
        else if (userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) {
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const now = new Date();
            const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
            const dayOfWeek = dayNames[koreaDate.getDay()];
            responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
        }
        // 네이버 뉴스 검색
        else if (isNewsRequest(userMessage)) {
            console.log('📰 뉴스 요청 감지됨');
            const newsResults = await getLatestNews(userMessage);
            
            if (newsResults && newsResults.length > 0) {
                let newsText = `📰 최신 뉴스 (${newsResults.length}개)\n\n`;
                newsResults.forEach((news, index) => {
                    newsText += `${index + 1}. ${news.title}\n${news.description}\n🔗 ${news.link}\n\n`;
                });
                
                if (newsText.length > config.limits.message_max_length) {
                    newsText = newsText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 뉴스는 네이버에서 확인하세요.';
                }
                
                responseText = newsText;
            } else {
                responseText = '죄송합니다. 현재 뉴스를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.';
            }
        }
        // 네이버 쇼핑 검색
        else if (isShoppingRequest(userMessage)) {
            console.log('🛒 쇼핑 요청 감지됨');
            
            let searchQuery = userMessage;
            let foundProducts = [];
            
            config.shopping.products.forEach(keyword => {
                if (userMessage.includes(keyword)) {
                    foundProducts.push(keyword);
                }
            });
            
            if (foundProducts.length > 0) {
                searchQuery = foundProducts.join(' ');
            } else {
                searchQuery = userMessage.replace(/추천|상품|제품|쇼핑|구매|베스트|인기|랭킹|순위|어떤|좋은/g, '').trim();
            }
            
            const shoppingResults = await getShoppingResults(searchQuery);
            
            if (shoppingResults && shoppingResults.length > 0) {
                // 가격 중심의 쇼핑 검색 결과 표시
                const hasPriceRequest = config.shopping.price_keywords.some(keyword => userMessage.includes(keyword));
                
                let shoppingText;
                if (hasPriceRequest) {
                    shoppingText = `💰 "${searchQuery}" 최저가 검색 결과 (가격순)\n\n`;
                } else {
                    shoppingText = `🛒 "${searchQuery}" 쇼핑 검색 결과\n\n`;
                }
                
                shoppingResults.slice(0, config.limits.search_results_count).forEach((product, index) => {
                    // 가격을 더 눈에 띄게 표시
                    const priceDisplay = product.price !== '가격정보없음' ? `💰 ${product.price}` : '💰 가격문의';
                    shoppingText += `${index + 1}. ${product.title}\n${priceDisplay}\n🏪 ${product.mallName}\n🔗 ${product.link}\n\n`;
                });
                
                if (shoppingText.length > config.limits.message_max_length) {
                    shoppingText = shoppingText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 상품은 네이버쇼핑에서 확인하세요.';
                }
                
                responseText = shoppingText;
            } else {
                responseText = `"${searchQuery}" 관련 상품을 찾을 수 없습니다. 다른 키워드로 다시 검색해보세요.`;
            }
        }
        // 네이버 지역검색 (맛집)
        else if (isRestaurantRequest(userMessage)) {
            console.log('🍽️ 맛집 요청 감지됨');
            
            // 검색 쿼리 최적화: 지역명 추출 및 검색어 개선
            let searchQuery = userMessage;
            let foundLocation = null;
            
            // 1. 기존 키워드 방식으로 지역명 찾기
            const allLocationKeywords = [
                ...config.restaurant.locations.seoul,
                ...config.restaurant.locations.gyeonggi,
                ...config.restaurant.locations.major_cities,
                ...config.restaurant.locations.general
            ];
            
            foundLocation = allLocationKeywords.find(location => userMessage.includes(location));
            
            // 2. 패턴 매칭으로 지역명 추출 (구, 동, 시 등)
            if (!foundLocation) {
                const locationPatterns = [
                    /(\w+구)(?:\s|맛집|식당|음식점)/,     // OO구
                    /(\w+동)(?:\s|맛집|식당|음식점)/,     // OO동  
                    /(\w+시)(?:\s|맛집|식당|음식점)/,     // OO시
                    /(\w+군)(?:\s|맛집|식당|음식점)/,     // OO군
                    /(\w+읍)(?:\s|맛집|식당|음식점)/,     // OO읍
                    /(\w+면)(?:\s|맛집|식당|음식점)/,     // OO면
                    /(\w+역)(?:\s|맛집|식당|음식점)/,     // OO역
                    /(\w+로)(?:\s|맛집|식당|음식점)/,     // OO로
                    /(\w+거리)(?:\s|맛집|식당|음식점)/,   // OO거리
                ];
                
                for (const pattern of locationPatterns) {
                    const match = userMessage.match(pattern);
                    if (match) {
                        foundLocation = match[1];
                        break;
                    }
                }
            }
            
            // 3. 검색 쿼리 구성
            if (foundLocation) {
                // 지역명이 있으면 "지역명 + 맛집"으로 검색
                searchQuery = `${foundLocation} 맛집`;
                console.log(`🔍 최적화된 검색어: "${searchQuery}" (원본: "${userMessage}", 추출된 지역: "${foundLocation}")`);
            } else {
                // 지역명을 못 찾았으면 원본 메시지 그대로 사용
                console.log(`🔍 지역명 추출 실패, 원본 검색어 사용: "${searchQuery}"`);
            }
            
            const restaurantResults = await getLocalRestaurants(searchQuery);
            
            if (restaurantResults && restaurantResults.length > 0) {
                // 첫 번째 검색 성공
                const displayLocation = foundLocation || userMessage.replace(/\s+(맛집|식당|음식점).*$/, '');
                let restaurantText = `🍽️ "${displayLocation}" 맛집 검색 결과\n\n`;
                
                restaurantResults.slice(0, config.limits.search_results_count).forEach((restaurant, index) => {
                    restaurantText += `${index + 1}. ${restaurant.title}\n📍 ${restaurant.address}\n📞 ${restaurant.telephone}\n🏷️ ${restaurant.category}\n🔗 ${restaurant.link}\n\n`;
                });
                
                if (restaurantText.length > config.limits.message_max_length) {
                    restaurantText = restaurantText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 맛집은 네이버에서 확인하세요.';
                }
                
                responseText = restaurantText;
            } else {
                // 첫 번째 검색 실패 시 다양한 방법으로 재시도
                console.log(`🔄 첫 번째 검색 실패, 스마트 재시도 시작...`);
                
                let retryResults = null;
                let retryQuery = userMessage;
                let retryAttempts = [];
                
                if (foundLocation) {
                    // 지역명 변형 생성 (구 제거, 축약형 등)
                    const locationVariations = [foundLocation];
                    
                    // "OO구" → "OO" 변형
                    if (foundLocation.endsWith('구')) {
                        locationVariations.push(foundLocation.replace('구', ''));
                    }
                    
                    // "OO동" → "OO" 변형  
                    if (foundLocation.endsWith('동')) {
                        locationVariations.push(foundLocation.replace('동', ''));
                    }
                    
                    // 각 지역명 변형에 대해 다양한 키워드로 시도
                    for (const location of locationVariations) {
                        const searchTerms = ['맛집', '식당', '음식점', ''];
                        
                        for (const term of searchTerms) {
                            if (retryResults && retryResults.length > 0) break;
                            
                            retryQuery = term ? `${location} ${term}` : location;
                            console.log(`🔍 재시도: "${retryQuery}"`);
                            retryAttempts.push(retryQuery);
                            
                            retryResults = await getLocalRestaurants(retryQuery);
                            
                            if (retryResults && retryResults.length > 0) {
                                console.log(`✅ 성공한 검색어: "${retryQuery}"`);
                                break;
                            }
                        }
                        
                        if (retryResults && retryResults.length > 0) break;
                    }
                    
                    // 여전히 실패하면 더 넓은 범위로 시도
                    if (!retryResults || retryResults.length === 0) {
                        // "강북구 번3동" → 다양한 조합 시도
                        const broaderSearches = [];
                        
                        if (foundLocation.includes('구')) {
                            const district = foundLocation.replace('구', '');
                            // 강북구 → 강북 관련 검색 확장
                            broaderSearches.push(
                                `서울 ${district}`,
                                `${district}역`, 
                                `${district}동`,
                                `${district}구청`,
                                `${district} 지역`,
                                `${district} 근처`,
                                `서울시 ${district}구`,
                                `${district} 상권`
                            );
                        }
                        
                        if (foundLocation.includes('동')) {
                            const neighborhood = foundLocation.replace('동', '');
                            broaderSearches.push(`${neighborhood}역`, `${neighborhood}`);
                        }
                        
                        // 모든 검색어에 대해 '맛집' 뿐만 아니라 다른 키워드도 시도
                        const searchKeywords = ['맛집', '음식점', '식당'];
                        
                        for (const broadSearch of broaderSearches) {
                            if (retryResults && retryResults.length > 0) break;
                            
                            for (const keyword of searchKeywords) {
                                if (retryResults && retryResults.length > 0) break;
                                
                                retryQuery = `${broadSearch} ${keyword}`;
                                console.log(`🔍 확장 검색: "${retryQuery}"`);
                                retryAttempts.push(retryQuery);
                                
                                retryResults = await getLocalRestaurants(retryQuery);
                                
                                if (retryResults && retryResults.length > 0) {
                                    console.log(`✅ 확장 검색 성공: "${retryQuery}"`);
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 최후 시도: 인근 대형 지역으로 검색
                    if (!retryResults || retryResults.length === 0) {
                        console.log(`🚨 최후 시도: 인근 주요 지역으로 검색...`);
                        
                        // 강북 관련 인근 주요 지역들
                        const nearbyAreas = [];
                        
                        if (foundLocation.includes('강북')) {
                            nearbyAreas.push('노원', '수유', '미아', '도봉', '성북');
                        }
                        
                        // 다른 지역들도 추가 가능
                        if (foundLocation.includes('강남')) {
                            nearbyAreas.push('서초', '송파', '역삼', '삼성');
                        }
                        
                        if (foundLocation.includes('마포')) {
                            nearbyAreas.push('홍대', '상수', '합정', '연남');
                        }
                        
                        for (const area of nearbyAreas) {
                            if (retryResults && retryResults.length > 0) break;
                            
                            retryQuery = `${area} 맛집`;
                            console.log(`🔍 인근 지역 검색: "${retryQuery}"`);
                            retryAttempts.push(retryQuery);
                            
                            retryResults = await getLocalRestaurants(retryQuery);
                            
                            if (retryResults && retryResults.length > 0) {
                                console.log(`✅ 인근 지역 검색 성공: "${retryQuery}" (${foundLocation} 대신)`);
                                break;
                            }
                        }
                    }
                } else {
                    // 지역명을 못 찾은 경우 원본 메시지로 재시도
                    console.log(`🔍 지역명 없이 원본 메시지로 재시도: "${userMessage}"`);
                    retryAttempts.push(userMessage);
                    retryResults = await getLocalRestaurants(userMessage);
                }
                
                console.log(`📊 총 ${retryAttempts.length}번의 재시도 완료:`, retryAttempts);
                
                if (retryResults && retryResults.length > 0) {
                    // 성공한 검색어에서 키워드 추출해서 사용자에게 표시
                    const successfulSearchTerm = retryQuery.replace(/\s+(맛집|식당|음식점)$/, '');
                    const displayLocation = successfulSearchTerm || foundLocation || userMessage;
                    
                    let restaurantText = `🍽️ "${displayLocation}" 맛집 검색 결과\n\n`;
                    
                    // 원래 요청과 다른 검색어로 찾았다면 알림 추가
                    if (retryQuery !== searchQuery) {
                        restaurantText += `💡 "${successfulSearchTerm}" 지역 맛집을 찾았습니다\n\n`;
                    }
                    
                    retryResults.slice(0, config.limits.search_results_count).forEach((restaurant, index) => {
                        restaurantText += `${index + 1}. ${restaurant.title}\n📍 ${restaurant.address}\n📞 ${restaurant.telephone}\n🏷️ ${restaurant.category}\n🔗 ${restaurant.link}\n\n`;
                    });
                    
                    if (restaurantText.length > config.limits.message_max_length) {
                        restaurantText = restaurantText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 맛집은 네이버에서 확인하세요.';
                    }
                    
                    responseText = restaurantText;
                } else {
                    // 모든 재시도 실패 - 더 구체적인 안내
                    console.log(`❌ 모든 검색 시도 실패. 시도한 검색어들:`, retryAttempts);
                    
                    if (foundLocation) {
                        // 지역명 기반 대안 제시
                        const alternatives = [];
                        
                        if (foundLocation.includes('구')) {
                            const district = foundLocation.replace('구', '');
                            alternatives.push(`"${district} 맛집"`, `"${district}역 맛집"`);
                        }
                        
                        if (foundLocation.includes('동')) {
                            const neighborhood = foundLocation.replace('동', '');
                            alternatives.push(`"${neighborhood} 맛집"`, `"${neighborhood}역 맛집"`);
                        }
                        
                        // 기본 대안들도 추가
                        alternatives.push(`"${foundLocation} 한식"`, `"${foundLocation} 카페"`);
                        
                        // 중복 제거 후 최대 4개만
                        const uniqueAlternatives = [...new Set(alternatives)].slice(0, 4);
                        
                        responseText = `"${foundLocation}" 지역 검색 결과가 없습니다.\n\n💡 이렇게 검색해보세요:\n${uniqueAlternatives.map(alt => `• ${alt}`).join('\n')}\n\n또는 더 큰 지역명 (예: 강북구→강북)으로 시도해보세요.`;
                    } else {
                        responseText = `"${userMessage}" 검색 결과가 없습니다.\n\n💡 검색 팁:\n• "지역명 + 맛집" (예: 강남 맛집)\n• "구/동 + 맛집" (예: 강북구 맛집)\n• "역 + 맛집" (예: 강북역 맛집)\n• "지역명 + 음식종류" (예: 홍대 카페)`;
                    }
                }
            }
        }
        // 맥미니 가격 관련 질문은 쇼핑 검색으로 처리되므로 제외
        // 맥미니 관련 질문 - 최신 정보로 Claude API 사용 (가격 질문 제외)
        else if (userMessage.includes('맥미니') && (userMessage.includes('최신') || userMessage.includes('M4') || userMessage.includes('m4') || userMessage.includes('M2') || userMessage.includes('m2')) && !config.shopping.price_keywords.some(keyword => userMessage.includes(keyword))) {
            console.log('✅ 맥미니 관련 질문 - Claude API로 최신 정보 검색');
            const startTime = Date.now();
            
            try {
                if (!process.env.CLAUDE_API_KEY) {
                    throw new Error('CLAUDE_API_KEY not found in environment variables');
                }
                
                // 현재 날짜 정보 포함하여 요청
                const currentDate = new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const claudeResponse = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: "claude-3-haiku-20240307",
                        system: `현재 날짜: ${currentDate}
                        
한국어로 답변하세요. 카카오톡 메시지에 적합하도록 다음 규칙을 따르세요:
- 800자 이내로 간결하게 작성
- 2025년 최신 정보로 답변 (추측하지 말고 확실한 정보만)
- M4 맥미니가 최신 모델임을 반영
- 확실하지 않은 정보는 "정확한 정보를 찾기 어렵습니다"라고 안내
- 핵심 정보만 포함
- 이모지 적절히 사용
- 읽기 쉬운 구조로 작성`,
                        messages: [{
                            role: "user",
                            content: userMessage
                        }],
                        max_tokens: config.limits.claude_max_tokens
                    },
                    {
                        headers: {
                            'x-api-key': process.env.CLAUDE_API_KEY,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        timeout: 4000
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseText = claudeResponse.data.content[0].text;
                console.log(`✅ 맥미니 Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
                
                // 응답 후처리: 카카오톡에 맞게 최적화
                if (responseText.length > config.limits.message_max_length) {
                    const sentences = responseText.split(/[.!?]\s+/);
                    let truncated = '';
                    for (const sentence of sentences) {
                        if ((truncated + sentence).length > config.limits.message_truncate_length) break;
                        truncated += sentence + '. ';
                    }
                    responseText = truncated.trim();
                    console.log(`📝 맥미니 응답 길이 조정: ${responseText.length}자로 단축`);
                }
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                console.log(`⚠️ 맥미니 Claude API 에러 (${responseTime}ms):`, error.message);
                
                // 에러 시 백업 최신 정보
                responseText = `🖥️ 맥미니 최신 정보 (2024년 말 기준)

🆕 **M4 맥미니** (최신, 2024년 10월 출시)
• CPU: 10코어 (4P+6E), M2 대비 25% 빠름
• GPU: 10코어, Ray Tracing 지원
• 메모리: 최대 64GB 통합 메모리
• 저장용량: 최대 8TB SSD
• 가격: 기본형 약 95만원

📊 **M2와 비교**
• 성능: 전체적으로 20-25% 향상
• AI 작업: 훨씬 빠른 처리 속도
• 게임: Ray Tracing으로 그래픽 향상

💡 M4가 현재 **최신 맥미니**입니다!`;
            }
        }
        // Claude API를 통한 일반 질문 처리 (카카오톡 최적화)
        else {
            console.log('✅ Claude API 호출 시작...');
            const startTime = Date.now();
            
            try {
                // API 키 확인
                if (!process.env.CLAUDE_API_KEY) {
                    throw new Error('CLAUDE_API_KEY not found in environment variables');
                }
                
                // 현재 날짜 정보 포함하여 요청
                const currentDate = new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // 게임 정보 요청인 경우 네이버 검색 API로 실제 정보 확인
                let searchResults = null;
                let gameSearchSummary = '';
                const isGameInfoRequest = userMessage.includes('게임') && config.shopping.review_keywords.some(keyword => userMessage.includes(keyword));
                
                if (isGameInfoRequest) {
                    console.log('🎮 게임 정보 요청 감지 - 네이버 검색 API로 정확한 정보 확인');
                    
                    // 게임명 추출 개선 (호칭 제거 및 정확한 패턴 매칭)
                    let gameName = null;
                    
                    // 호칭 제거 (지피티야, 챗봇아, 등)
                    let cleanMessage = userMessage.replace(/(지피티야|챗봇아|봇아|ai야|에이아이야|클로드야)\s*/gi, '').trim();
                    
                    // 1. "OOO 게임 어때" 패턴
                    let gameNameMatch = cleanMessage.match(/([가-힣a-zA-Z0-9\s]+?)\s*(게임|어때|할만해|추천|평가|리뷰)/);
                    if (gameNameMatch) {
                        gameName = gameNameMatch[1].trim();
                    }
                    
                    // 2. "벨브 데드락" 같은 개발사+게임명 패턴
                    if (!gameName) {
                        gameNameMatch = cleanMessage.match(/(벨브|밸브|valve)\s*([가-힣a-zA-Z0-9]+)/i);
                        if (gameNameMatch) {
                            gameName = `${gameNameMatch[1]} ${gameNameMatch[2]}`;
                        }
                    }
                    
                    // 3. 간단한 게임명 추출 (호칭 제거된 메시지에서)
                    if (!gameName) {
                        // "데드락 어때?" → "데드락"
                        gameNameMatch = cleanMessage.match(/([가-힣a-zA-Z0-9]+)\s*(어때|할만해|재밌어|좋아|괜찮아)/);
                        if (gameNameMatch) {
                            gameName = gameNameMatch[1].trim();
                        }
                    }
                    
                    // 4. 마지막 시도: 첫 번째 단어 추출
                    if (!gameName) {
                        const words = cleanMessage.split(/\s+/);
                        if (words.length > 0 && words[0].length > 1) {
                            gameName = words[0];
                        }
                    }
                    
                    if (gameName) {
                        try {
                            console.log(`🔍 "${gameName}" 게임 정보 검색 시작...`);
                            
                            // 네이버 검색 API 활용한 종합 검색
                            let searchPromises = [
                                getLatestNews(`${gameName} 게임`),
                                getLatestNews(`${gameName} 리뷰`), 
                                getLatestNews(`${gameName} 평가`)
                            ];
                            
                            // 데드락의 경우 영문명도 추가 검색
                            if (gameName.includes('데드락') || gameName.toLowerCase().includes('deadlock')) {
                                searchPromises.push(
                                    getLatestNews(`Deadlock 게임`),
                                    getLatestNews(`Deadlock Valve`),
                                    getLatestNews(`밸브 데드락`)
                                );
                            }
                            
                            // 기타 유명 게임들의 영문명 검색도 추가 가능
                            if (gameName.includes('발로란트') || gameName.toLowerCase().includes('valorant')) {
                                searchPromises.push(getLatestNews(`Valorant 게임`));
                            }
                            
                            const searchResults_raw = await Promise.all(searchPromises);
                            
                            // 모든 검색 결과 통합
                            searchResults = [];
                            searchResults_raw.forEach(results => {
                                if (results && results.length > 0) {
                                    searchResults.push(...results);
                                }
                            });
                            
                            // 중복 제거 (제목 기준)
                            const uniqueResults = [];
                            const seenTitles = new Set();
                            
                            for (const result of searchResults) {
                                const cleanTitle = result.title.replace(/<[^>]*>/g, '').trim();
                                if (!seenTitles.has(cleanTitle)) {
                                    seenTitles.add(cleanTitle);
                                    uniqueResults.push({
                                        ...result,
                                        title: cleanTitle
                                    });
                                }
                            }
                            
                            searchResults = uniqueResults.slice(0, 10); // 최대 10개까지
                            
                            console.log(`📊 "${gameName}" 검색 완료: ${searchResults.length}개 결과`);
                            
                            // 검색 결과 요약 생성
                            if (searchResults.length > 0) {
                                gameSearchSummary = `🔍 "${gameName}" 관련 최신 정보:\n`;
                                searchResults.slice(0, 3).forEach((result, index) => {
                                    gameSearchSummary += `${index + 1}. ${result.title}\n`;
                                });
                                gameSearchSummary += `\n총 ${searchResults.length}개의 관련 정보를 찾았습니다.\n`;
                            } else {
                                gameSearchSummary = `❌ "${gameName}"에 대한 최신 정보를 찾을 수 없습니다.\n`;
                            }
                            
                        } catch (error) {
                            console.log(`❌ 게임 정보 검색 오류: ${error.message}`);
                            gameSearchSummary = `⚠️ 검색 중 오류가 발생했습니다.\n`;
                        }
                    } else {
                        console.log(`⚠️ 게임명을 추출할 수 없습니다: "${userMessage}"`);
                        gameSearchSummary = `❓ 게임명을 정확히 파악하기 어렵습니다.\n`;
                    }
                }
                
                const claudeResponse = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: "claude-3-haiku-20240307",
                        system: `현재 날짜: ${currentDate}

한국어로 답변하세요. 카카오톡 메시지에 적합하도록 다음 규칙을 따르세요:
- 800자 이내로 간결하게 작성
- 2025년 최신 정보로 답변 (추측하지 말고 확실한 정보만)
- 게임 정보는 정확성을 최우선으로 (틀린 정보 제공 금지)
- 네이버 검색 결과가 있으면 반드시 그 정보를 바탕으로 답변
- 검색 결과 없이는 게임 정보 추측 금지
- 확실하지 않은 게임 정보는 "정확한 정보를 찾기 어렵습니다"라고 안내
- 핵심 정보만 포함
- 이모지 적절히 사용
- 읽기 쉬운 구조로 작성

${searchResults && searchResults.length > 0 ? `🔍 네이버 검색으로 찾은 실제 정보 (반드시 이 정보를 바탕으로 답변하세요):
${gameSearchSummary}

상세 검색 결과:
${searchResults.slice(0, 5).map((item, index) => `${index + 1}. ${item.title}\n   ${item.description || '설명 없음'}`).join('\n\n')}

위 검색 결과를 바탕으로 정확한 정보만 제공하세요.` : `❌ 네이버 검색에서 관련 정보를 찾을 수 없습니다.
${gameSearchSummary}

검색 결과가 없으므로 "죄송합니다. 해당 게임에 대한 정확한 정보를 네이버에서 찾을 수 없습니다"라고 답변하세요.`}`,
                        messages: [{
                            role: "user",
                            content: userMessage
                        }],
                        max_tokens: config.limits.claude_max_tokens
                    },
                    {
                        headers: {
                            'x-api-key': process.env.CLAUDE_API_KEY,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        timeout: 4000  // 4초로 약간 늘림
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseText = claudeResponse.data.content[0].text;
                console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
                
                // 응답 후처리: 카카오톡에 맞게 최적화
                if (responseText.length > config.limits.message_max_length) {
                    // 문장 단위로 자르기
                    const sentences = responseText.split(/[.!?]\s+/);
                    let truncated = '';
                    for (const sentence of sentences) {
                        if ((truncated + sentence).length > config.limits.message_truncate_length) break;
                        truncated += sentence + '. ';
                    }
                    responseText = truncated.trim();
                    console.log(`📝 응답 길이 조정: ${responseText.length}자로 단축`);
                }
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                console.log(`⚠️ Claude API 에러 (${responseTime}ms):`, {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    code: error.code,
                    hasApiKey: !!process.env.CLAUDE_API_KEY,
                    apiKeyLength: process.env.CLAUDE_API_KEY?.length || 0,
                    apiKeyStart: process.env.CLAUDE_API_KEY?.substring(0, 10) || 'none'
                });
                
                if (error.response?.status === 401) {
                    responseText = `🔑 AI 서비스 인증에 문제가 있습니다.\n\n관리자에게 문의해주세요.`;
                } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    responseText = `⏰ AI 응답 시간이 초과되었습니다.\n\n더 간단한 질문으로 다시 시도해주세요.`;
                } else if (error.response?.status === 429) {
                    responseText = `🚫 AI 사용량 한도에 도달했습니다.\n\n잠시 후 다시 시도해주세요.`;
                } else if (error.message.includes('CLAUDE_API_KEY not found')) {
                    responseText = `⚙️ AI 서비스 설정이 필요합니다.\n\n관리자가 설정을 확인 중입니다.`;
                } else {
                    // 게임 정보 요청인 경우 안전한 에러 메시지
                    if (isGameInfoRequest) {
                        responseText = `🎮 죄송합니다. AI 서비스 오류로 게임 정보를 처리할 수 없습니다.\n\n${gameSearchSummary || ''}💡 정확한 게임 정보를 원하시면:\n• 네이버에서 "게임명 + 리뷰" 검색\n• 스팀, 플레이스토어 등 공식 스토어 확인\n• 게임 공식 웹사이트 방문\n\n네이버 검색 API를 통한 실시간 정보 제공을 목표로 하고 있습니다.`;
                    } else {
                        responseText = `⚠️ AI 서비스가 일시 불안정합니다.\n\n잠시 후 다시 시도해주세요.`;
                    }
                }
            }
        }
        
        console.log(`📝 응답 내용: ${responseText.substring(0, 100)}...`);
        
        // 메시지 길이 제한 (카카오톡 호환성)
        if (responseText.length > config.limits.message_max_length) {
            responseText = responseText.substring(0, config.limits.message_max_length - 3) + '...';
            console.log(`⚠️ 메시지가 길어서 ${config.limits.message_max_length}자로 제한됨`);
        }
        
        const kakaoResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: responseText
                    }
                }]
            }
        };
        
        console.log(`📤 카카오 응답 전송: ${JSON.stringify(kakaoResponse, null, 2)}`);
        
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(kakaoResponse);
        console.log('✅ 카카오 웹훅 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 웹훅 처리 중 전체 오류:', error);
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: "죄송합니다. 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                    }
                }]
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(errorResponse);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🔑 Claude API 키 상태: ${process.env.CLAUDE_API_KEY ? '설정됨 (' + process.env.CLAUDE_API_KEY.length + '자)' : '미설정'}`);
    console.log(`📡 네이버 API 키 상태: ${(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) ? '설정됨' : '미설정'}`);
});