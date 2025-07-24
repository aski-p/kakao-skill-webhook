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
            display: 10,
            start: 1,
            sort: 'sim'
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
    
    // 쇼핑 관련 키워드가 있거나 제품 추천이면서 맛집 키워드가 없는 경우
    return (hasShoppingKeyword || hasProductKeyword || hasProductRecommend) && !hasRestaurantKeyword;
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
                let shoppingText = `🛒 "${searchQuery}" 쇼핑 검색 결과\n\n`;
                shoppingResults.slice(0, config.limits.search_results_count).forEach((product, index) => {
                    shoppingText += `${index + 1}. ${product.title}\n💰 ${product.price}\n🏪 ${product.mallName}\n🔗 ${product.link}\n\n`;
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
                let restaurantText = `🍽️ "${foundLocation || userMessage}" 맛집 검색 결과\n\n`;
                restaurantResults.slice(0, config.limits.search_results_count).forEach((restaurant, index) => {
                    restaurantText += `${index + 1}. ${restaurant.title}\n📍 ${restaurant.address}\n📞 ${restaurant.telephone}\n🏷️ ${restaurant.category}\n🔗 ${restaurant.link}\n\n`;
                });
                
                if (restaurantText.length > config.limits.message_max_length) {
                    restaurantText = restaurantText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 맛집은 네이버에서 확인하세요.';
                }
                
                responseText = restaurantText;
            } else {
                // 첫 번째 검색 실패 시 다양한 방법으로 재시도
                console.log(`🔄 첫 번째 검색 실패, 재시도 중...`);
                
                let retryResults = null;
                let retryQuery = userMessage;
                
                if (foundLocation) {
                    // 시도 1: "지역명 + 식당"으로 재시도
                    retryQuery = `${foundLocation} 식당`;
                    console.log(`🔍 재시도 1차: "${retryQuery}"`);
                    retryResults = await getLocalRestaurants(retryQuery);
                    
                    // 시도 2: "지역명 + 음식점"으로 재시도
                    if (!retryResults || retryResults.length === 0) {
                        retryQuery = `${foundLocation} 음식점`;
                        console.log(`🔍 재시도 2차: "${retryQuery}"`);
                        retryResults = await getLocalRestaurants(retryQuery);
                    }
                    
                    // 시도 3: "지역명"만으로 재시도 (주변 상권 검색)
                    if (!retryResults || retryResults.length === 0) {
                        retryQuery = foundLocation;
                        console.log(`🔍 재시도 3차: "${retryQuery}"`);
                        retryResults = await getLocalRestaurants(retryQuery);
                    }
                } else {
                    // 지역명을 못 찾은 경우 원본 메시지로 재시도
                    console.log(`🔍 지역명 없이 원본 메시지로 재시도: "${userMessage}"`);
                    retryResults = await getLocalRestaurants(userMessage);
                }
                
                if (retryResults && retryResults.length > 0) {
                    let restaurantText = `🍽️ "${foundLocation || userMessage}" 검색 결과\n\n`;
                    retryResults.slice(0, config.limits.search_results_count).forEach((restaurant, index) => {
                        restaurantText += `${index + 1}. ${restaurant.title}\n📍 ${restaurant.address}\n📞 ${restaurant.telephone}\n🏷️ ${restaurant.category}\n🔗 ${restaurant.link}\n\n`;
                    });
                    
                    if (restaurantText.length > config.limits.message_max_length) {
                        restaurantText = restaurantText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 맛집은 네이버에서 확인하세요.';
                    }
                    
                    responseText = restaurantText;
                } else {
                    // 모든 재시도 실패
                    if (foundLocation) {
                        responseText = `"${foundLocation}" 지역의 맛집을 찾을 수 없습니다.\n\n💡 다음과 같이 시도해보세요:\n• "${foundLocation} 한식"\n• "${foundLocation} 카페"\n• "${foundLocation} 치킨"\n\n또는 더 큰 지역명으로 검색해보세요.`;
                    } else {
                        responseText = `"${userMessage}" 관련 맛집을 찾을 수 없습니다.\n\n💡 검색 팁:\n• "지역명 + 맛집" (예: 강남 맛집)\n• "구/동 + 맛집" (예: 강북구 맛집)\n• "지역명 + 음식종류" (예: 홍대 카페)`;
                    }
                }
            }
        }
        // 맥미니 M4 vs M2 비교 질문 특별 처리
        else if (userMessage.includes('맥미니') && (userMessage.includes('M4') || userMessage.includes('m4')) && (userMessage.includes('M2') || userMessage.includes('m2'))) {
            responseText = `🖥️ 맥미니 M4 vs M2 성능 비교

🚀 CPU 성능
• M4: 10코어 CPU (4P+6E), 20% 향상
• M2: 8코어 CPU (4P+4E)

🎮 GPU 성능  
• M4: 10코어 GPU, 25% 향상
• M2: 10코어 GPU

🧠 메모리
• M4: 최대 64GB 통합 메모리
• M2: 최대 24GB 통합 메모리

💾 저장소
• M4: 최대 8TB SSD
• M2: 최대 2TB SSD

⚡ 전력효율
• M4: 3nm 공정, 더 효율적
• M2: 5nm 공정

💰 가격 (기본형)
• M4: 약 95만원
• M2: 약 80만원

📈 종합 성능 향상: 약 20-25%`;
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
                
                const claudeResponse = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: "claude-3-haiku-20240307",
                        system: `한국어로 답변하세요. 카카오톡 메시지에 적합하도록 다음 규칙을 따르세요:
- 800자 이내로 간결하게 작성
- 핵심 정보만 포함
- 이모지 적절히 사용
- 불필요한 설명 제거
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
                    responseText = `⚠️ AI 서비스가 일시 불안정합니다.\n\n잠시 후 다시 시도해주세요.`;
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