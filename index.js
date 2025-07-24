const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');

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

// 카카오톡 5초 제한에 맞춘 최적화된 타임아웃 설정
const TIMEOUT_CONFIG = {
    naver_api: 3000,        // 네이버 API: 3초
    claude_general: 3000,   // Claude 일반: 3초
    claude_image: 4000,     // Claude 이미지: 4초
    image_download: 3000    // 이미지 다운로드: 3초
};

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
            display: 10,
            start: 1,
            sort: 'comment'
        };
        
        console.log(`🍽️ 네이버 지역검색: "${query}"`);
        
        const response = await axios.get(NAVER_LOCAL_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🍽️ 검색된 맛집이 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 맛집을 찾았습니다.`);
        
        return items.slice(0, 5).map(item => ({
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
        return null;
    }
}

// 요청 분석 함수들
function isNewsRequest(message) {
    const newsKeywords = ['뉴스', '최신뉴스', '오늘뉴스', '새로운소식', '헤드라인', '속보', '시사'];
    return newsKeywords.some(keyword => message.includes(keyword));
}

function isShoppingRequest(message) {
    const shoppingKeywords = ['상품', '제품', '구매', '쇼핑', '판매', '가격', '베스트', '인기', '랭킹', '순위', '리뷰', '후기'];
    const hasShoppingKeyword = shoppingKeywords.some(keyword => message.includes(keyword));
    
    const productKeywords = ['젖병', '세척기', '기저귀', '유모차', '카시트', '노트북', '휴대폰', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기'];
    const hasProductKeyword = productKeywords.some(keyword => message.includes(keyword));
    
    const restaurantKeywords = ['맛집', '음식점', '식당', '배달', '맛있는', '먹을곳', '밥집', '카페', '커피', '치킨', '피자'];
    const locationKeywords = ['역', '동', '구', '시', '군', '면', '근처', '주변'];
    
    const hasRestaurantKeyword = restaurantKeywords.some(keyword => message.includes(keyword));
    const hasLocationKeyword = locationKeywords.some(keyword => message.includes(keyword));
    
    const isRestaurantContext = hasRestaurantKeyword && hasLocationKeyword;
    const hasRecommendKeyword = message.includes('추천') && !isRestaurantContext;
    
    return (hasShoppingKeyword || hasProductKeyword || hasRecommendKeyword) && !isRestaurantContext;
}

function isRestaurantRequest(message) {
    const restaurantKeywords = [
        '맛집', '음식점', '식당', '배달', '맛있는', '먹을곳', '밥집',
        '카페', '커피', '디저트', '떡볶이', '치킨', '피자', '한식', '중식', '일식', '양식',
        '분식', '술집', '주점', '고기', '회', '초밥', '레스토랑'
    ];
    
    const locationKeywords = [
        '역', '동', '구', '시', '군', '면', '근처', '주변', '앞', '사거리', '거리'
    ];
    
    const excludeKeywords = [
        '상품', '제품', '구매', '쇼핑', '판매', '가격', '베스트', '인기', '랭킹', '순위',
        '온라인', '쿠팡', '11번가', '지마켓', '옥션', '티몬', 'G마켓', '네이버쇼핑',
        '할인', '세일', '특가', '리뷰', '후기', '배송', '무료배송', '당일배송'
    ];
    const hasExcludeKeyword = excludeKeywords.some(keyword => message.includes(keyword));
    
    const hasRestaurantKeyword = restaurantKeywords.some(keyword => message.includes(keyword));
    const hasLocationKeyword = locationKeywords.some(keyword => message.includes(keyword));
    
    return hasRestaurantKeyword && hasLocationKeyword && !hasExcludeKeyword;
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
        <p><strong>Claude API:</strong> ${hasClaudeApiKey ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>네이버 검색 API:</strong> ${(hasNaverClientId && hasNaverClientSecret) ? '✅ 설정됨' : '❌ 미설정'}</p>
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
        // 자주 묻는 질문들에 대한 간단한 답변
        else if (userMessage.includes('파이썬') && (userMessage.includes('뭐야') || userMessage.includes('무엇') || userMessage.includes('설명'))) {
            responseText = `🐍 파이썬(Python)

• 1991년 귀도 반 로섬이 개발한 프로그래밍 언어
• 읽기 쉽고 간결한 문법
• 웹 개발, 데이터 분석, AI/ML에 널리 사용
• 라이브러리가 풍부하고 커뮤니티 활발
• 초보자도 배우기 쉬운 언어

주요 특징:
- 인터프리터 언어
- 객체지향 프로그래밍 지원
- 무료 오픈소스
- 크로스 플랫폼 지원`;
        }
        else if (userMessage.includes('자바스크립트') && (userMessage.includes('뭐야') || userMessage.includes('무엇') || userMessage.includes('설명'))) {
            responseText = `⚡ 자바스크립트(JavaScript)

• 웹 브라우저에서 실행되는 프로그래밍 언어
• 웹페이지에 동적인 기능 추가
• 현재는 서버(Node.js)에서도 사용
• 프론트엔드와 백엔드 모두 개발 가능

주요 특징:
- 동적 타입 언어
- 이벤트 기반 프로그래밍
- 함수형 프로그래밍 지원
- 비동기 처리 가능
- 웹 개발의 필수 언어`;
        }
        else if (userMessage.includes('리액트') && (userMessage.includes('뭐야') || userMessage.includes('무엇') || userMessage.includes('설명'))) {
            responseText = `⚛️ 리액트(React)

• 페이스북이 개발한 자바스크립트 라이브러리
• 사용자 인터페이스(UI) 구축용
• 컴포넌트 기반 개발
• 가상 DOM으로 성능 최적화

주요 특징:
- 재사용 가능한 컴포넌트
- 단방향 데이터 흐름
- JSX 문법 사용
- 생태계가 매우 풍부
- 모바일 앱(React Native) 개발도 가능`;
        }
        // Claude API를 통한 일반 질문 처리 (최대 3초 제한)
        else {
            console.log('✅ Claude API 호출 시작...');
            const startTime = Date.now();
            
            try {
                const claudeResponse = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: "claude-3-haiku-20240307",
                        system: `한국어로 간결하게 답변하세요. 900자 이내로 작성하세요.`,
                        messages: [{
                            role: "user",
                            content: userMessage
                        }],
                        max_tokens: 500
                    },
                    {
                        headers: {
                            'x-api-key': process.env.CLAUDE_API_KEY,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        timeout: 3000  // 3초 제한
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseText = claudeResponse.data.content[0].text;
                console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                console.log(`⚠️ Claude API 에러 (${responseTime}ms):`, {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    code: error.code,
                    hasApiKey: !!process.env.CLAUDE_API_KEY,
                    apiKeyLength: process.env.CLAUDE_API_KEY?.length || 0
                });
                
                if (error.response?.status === 401) {
                    responseText = `🔑 AI 인증 오류가 발생했습니다.\n\n관리자가 API 키를 확인 중입니다.`;
                } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    responseText = `⏰ AI 응답 시간이 초과되었습니다.\n\n더 간단한 질문으로 다시 시도해주세요.`;
                } else if (error.response?.status === 429) {
                    responseText = `🚫 AI 사용량 한도에 도달했습니다.\n\n잠시 후 다시 시도해주세요.`;
                } else {
                    responseText = `⚠️ AI 서비스가 일시 불안정합니다.\n\n• 간단한 질문으로 다시 시도해주세요\n• 또는 잠시 후 다시 물어보세요`;
                }
            }
        }
        
        console.log(`📝 응답 내용: ${responseText.substring(0, 100)}...`);
        
        // 메시지 길이 제한 (카카오톡 호환성)
        if (responseText.length > 950) {
            responseText = responseText.substring(0, 947) + '...';
            console.log(`⚠️ 메시지가 길어서 950자로 제한됨`);
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
});