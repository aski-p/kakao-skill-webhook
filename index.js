const express = require('express');
const axios = require('axios');
const app = express();

// Railway 최적화 설정
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// 응답 타임아웃 설정
app.use((req, res, next) => {
    res.setTimeout(25000, () => {
        console.log('⏰ 요청 타임아웃');
        res.status(408).json({
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: "응답 시간이 초과되었습니다. 다시 시도해주세요."
                    }
                }]
            }
        });
    });
    next();
});

// 네이버 검색 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_API_URL = 'https://openapi.naver.com/v1/search/shop.json';
const NAVER_LOCAL_API_URL = 'https://openapi.naver.com/v1/search/local.json';

// 분할된 메시지 임시 저장 (메모리 기반 - 단순한 구현)
const pendingMessages = new Map();

// 사용자별 이미지 URL 저장 (메모리 기반 - 단순한 구현)
const userImageUrls = new Map();

// 사용자별 대화 컨텍스트 저장 (이전 메시지 기억용)
const userContexts = new Map();

// Express 미들웨어는 이미 위에서 설정됨

// 네이버 검색 API로 뉴스 가져오기 함수
async function getLatestNews(query = '오늘 뉴스') {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 10,  // 5 → 10개로 증가
            start: 1,
            sort: 'date'  // 최신순 정렬
        };
        
        console.log(`📡 네이버 뉴스 검색: "${query}"`);
        
        const response = await axios.get(NAVER_NEWS_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: 8000
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('📰 검색된 뉴스가 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 뉴스를 찾았습니다.`);
        
        return items.slice(0, 5).map(item => ({  // 3 → 5개로 증가
            title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
            description: item.description.replace(/<[^>]*>/g, ''), // HTML 태그 제거 (전체 설명 표시)
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
            sort: 'sim'  // 정확도순 정렬 (sim: 정확도, date: 날짜, asc: 가격낮은순, dsc: 가격높은순)
        };
        
        console.log(`🛒 네이버 쇼핑 검색: "${query}"`);
        
        const response = await axios.get(NAVER_SHOPPING_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: 8000
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🛒 검색된 상품이 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 상품을 찾았습니다.`);
        
        return items.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
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

// 한국 시간 가져오기 함수
function getKoreanDateTime() {
    // 한국 표준시(KST/JST) UTC+9로 정확한 시간 계산
    const now = new Date();
    
    // 한국 시간으로 포맷팅
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
    
    // 날짜와 시간을 별도로 추출
    const koreanTimeStr = now.toLocaleDateString('en-CA', {timeZone: 'Asia/Seoul'});
    const koreanTimeOnly = now.toLocaleTimeString('en-GB', {timeZone: 'Asia/Seoul'});
    
    return {
        date: koreanTimeStr,
        time: koreanTimeOnly,
        formatted: formatted
    };
}

// 뉴스 요청인지 확인하는 함수
function isNewsRequest(message) {
    const newsKeywords = ['뉴스', '최신뉴스', '오늘뉴스', '새로운소식', '헤드라인', '속보', '시사'];
    return newsKeywords.some(keyword => message.includes(keyword));
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
            sort: 'comment'  // 댓글순 정렬 (random, comment, rating, distance)
        };
        
        console.log(`🍽️ 네이버 지역검색: "${query}"`);
        
        const response = await axios.get(NAVER_LOCAL_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: 8000
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🍽️ 검색된 맛집이 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 맛집을 찾았습니다.`);
        
        return items.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
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

// 맛집 요청인지 확인하는 함수
function isRestaurantRequest(message) {
    const restaurantKeywords = [
        '맛집', '음식점', '식당', '배달', '맛있는', '추천', '먹을곳', '밥집',
        '카페', '커피', '디저트', '떡볶이', '치킨', '피자', '한식', '중식', '일식', '양식',
        '분식', '술집', '주점', '고기', '회', '초밥'
    ];
    
    const locationKeywords = [
        '역', '동', '구', '시', '군', '면', '근처', '주변', '앞', '사거리', '거리'
    ];
    
    const hasRestaurantKeyword = restaurantKeywords.some(keyword => message.includes(keyword));
    const hasLocationKeyword = locationKeywords.some(keyword => message.includes(keyword));
    
    return hasRestaurantKeyword && hasLocationKeyword;
}

// 쇼핑 요청인지 확인하는 함수
function isShoppingRequest(message) {
    const shoppingKeywords = ['추천', '상품', '제품', '구매', '쇼핑', '판매', '가격', '베스트', '인기', '랭킹', '순위', '리뷰', '후기'];
    const hasShoppingKeyword = shoppingKeywords.some(keyword => message.includes(keyword));
    
    // 쇼핑 관련 키워드가 있거나, 구체적인 상품명이 있는 경우
    const productKeywords = ['젖병', '세척기', '기저귀', '유모차', '카시트', '노트북', '휴대폰', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기'];
    const hasProductKeyword = productKeywords.some(keyword => message.includes(keyword));
    
    return hasShoppingKeyword || hasProductKeyword;
}

// 이미지 요청인지 확인하는 함수
function isImageRequest(requestBody) {
    // 카카오 스킬에서 이미지 URL이 포함된 경우 확인
    const userMessage = requestBody.userRequest?.utterance || '';
    const blocks = requestBody.userRequest?.blocks || [];
    
    console.log(`🔍 이미지 감지 - 메시지: '${userMessage}'`);
    console.log(`🔍 이미지 감지 - 블록 수: ${blocks.length}`);
    
    // 1. 메시지에 이미지 URL이 있는지 확인 (카카오 이미지 URL 포함)
    const hasImageUrl = /https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp)/i.test(userMessage) ||
                       /https?:\/\/talk\.kakaocdn\.net.*\.(jpg|jpeg|png|gif|bmp|webp)/i.test(userMessage) ||
                       userMessage.includes('talk.kakaocdn.net');
    console.log(`🔍 이미지 URL 감지: ${hasImageUrl}`);
    
    // 2. 카카오 스킬 블록에 이미지가 있는지 확인
    const hasImageBlock = blocks.some(block => 
        block.listCard?.items?.some(item => item.imageUrl) ||
        block.basicCard?.thumbnail?.imageUrl ||
        block.commerceCard?.thumbnails?.length > 0
    );
    console.log(`🔍 이미지 블록 감지: ${hasImageBlock}`);
    
    // 3. 이미지 관련 키워드 확인
    const imageKeywords = ['이미지', '사진', '그림', '이미지분석', '사진분석', '이미지처리', '사진처리'];
    const hasImageKeyword = imageKeywords.some(keyword => userMessage.includes(keyword));
    console.log(`🔍 이미지 키워드 감지: ${hasImageKeyword}`);
    
    const result = hasImageUrl || hasImageBlock || hasImageKeyword;
    console.log(`🔍 최종 이미지 감지 결과: ${result}`);
    
    return result;
}

// 이미지 URL 추출 함수
function extractImageUrl(requestBody) {
    const userMessage = requestBody.userRequest?.utterance || '';
    const blocks = requestBody.userRequest?.blocks || [];
    
    // 메시지에서 이미지 URL 추출 (카카오 이미지 URL 포함)
    const urlMatch = userMessage.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp)/i) ||
                    userMessage.match(/https?:\/\/talk\.kakaocdn\.net[^\s;]*/i);
    if (urlMatch) {
        console.log(`📷 URL 추출 성공: ${urlMatch[0]}`);
        return urlMatch[0];
    }
    
    // 블록에서 이미지 URL 추출
    for (const block of blocks) {
        if (block.listCard?.items) {
            for (const item of block.listCard.items) {
                if (item.imageUrl) return item.imageUrl;
            }
        }
        if (block.basicCard?.thumbnail?.imageUrl) {
            return block.basicCard.thumbnail.imageUrl;
        }
        if (block.commerceCard?.thumbnails?.length > 0) {
            return block.commerceCard.thumbnails[0].imageUrl;
        }
    }
    
    return null;
}

// 이미지 분석 요청인지 확인하는 함수
function isImageAnalysisRequest(message) {
    const analysisKeywords = [
        '이미지 분석', '분석해줘', '분석하기', '내용 설명', '무엇인지',
        '텍스트 추출', '글자 읽기', '텍스트 읽기', 'OCR',
        '개선 제안', '개선해줘', '아이디어', '제안해줘',
        '설명 생성', '설명해줘', '묘사해줘', '상세히',
        '스타일 분석', '색상', '구성', '디자인'
    ];
    
    return analysisKeywords.some(keyword => message.includes(keyword));
}

// Claude Vision API를 사용한 이미지 분석 함수
async function analyzeImageWithClaude(imageUrl, analysisType, userMessage) {
    console.log(`🔍 이미지 분석 시작: ${analysisType}, URL: ${imageUrl}`);
    
    try {
        // 이미지를 base64로 변환
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; KakaoSkill/1.0)'
            }
        });
        
        const imageBuffer = Buffer.from(imageResponse.data);
        const base64Image = imageBuffer.toString('base64');
        
        // 파일 확장자에서 MIME 타입 추출
        const extension = imageUrl.split('.').pop().toLowerCase();
        const mimeTypeMap = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp'
        };
        const mimeType = mimeTypeMap[extension] || 'image/jpeg';
        
        // 분석 타입에 따른 프롬프트 설정
        let systemPrompt = '';
        let userPrompt = '';
        
        if (userMessage.includes('분석') || userMessage.includes('내용') || userMessage.includes('설명')) {
            systemPrompt = '이미지를 자세히 분석하여 한국어로 설명해주세요. 길게 작성해도 괜찮습니다.';
            userPrompt = '이 이미지에 무엇이 있는지 상세히 분석하고 설명해주세요. 주요 객체, 색상, 구성, 분위기 등을 포함해서 자세히 설명해주세요.';
        } else if (userMessage.includes('텍스트') || userMessage.includes('글자') || userMessage.includes('읽기') || userMessage.includes('OCR')) {
            systemPrompt = '이미지에서 텍스트를 추출하여 한국어로 정리해주세요.';
            userPrompt = '이 이미지에 있는 모든 텍스트를 읽어서 정확히 추출해주세요. 텍스트가 없다면 "텍스트가 발견되지 않았습니다"라고 알려주세요.';
        } else if (userMessage.includes('개선') || userMessage.includes('제안') || userMessage.includes('아이디어')) {
            systemPrompt = '이미지를 분석하여 개선 방안을 한국어로 제안해주세요. 자세히 작성해주세요.';
            userPrompt = '이 이미지를 분석하고 사진이나 디자인 개선을 위한 구체적인 제안사항을 알려주세요. 구도, 색상, 조명, 배치 등의 관점에서 자세히 조언해주세요.';
        } else if (userMessage.includes('스타일') || userMessage.includes('색상') || userMessage.includes('구성')) {
            systemPrompt = '이미지의 스타일과 디자인 요소를 한국어로 분석해주세요. 자세히 작성해주세요.';
            userPrompt = '이 이미지의 스타일, 색상 구성, 디자인 요소, 전체적인 분위기를 전문적으로 분석해주세요.';
        } else {
            systemPrompt = '이미지를 종합적으로 분석하여 한국어로 설명해주세요.';
            userPrompt = '이 이미지를 종합적으로 분석하고 설명해주세요.';
        }
        
        // Claude Vision API 호출
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-haiku-20240307",
                system: systemPrompt,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userPrompt
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }],
                max_tokens: 800
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: 15000
            }
        );
        
        const analysisResult = claudeResponse.data.content[0].text;
        console.log(`✅ 이미지 분석 완료: ${analysisResult.length}자`);
        
        return analysisResult;
        
    } catch (error) {
        console.error('❌ 이미지 분석 에러:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return '이미지 분석 서비스 인증에 문제가 있습니다. 관리자에게 문의해주세요.';
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return '이미지 분석 시간이 초과되었습니다. 이미지 크기가 클 수 있습니다. 다른 이미지로 시도해주세요.';
        } else if (error.message.includes('Invalid image')) {
            return '이미지 형식이 지원되지 않습니다. JPG, PNG, GIF, BMP, WebP 형식을 사용해주세요.';
        } else {
            return '이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
    }
}

// 헬스체크 엔드포인트 (Railway 최적화)
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Railway 헬스체크 (메모리 사용량 포함)
app.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        memory: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        },
        uptime: `${Math.round(process.uptime())}s`
    });
});

// 상태 페이지
app.get('/status', (req, res) => {
    const hasClaudeApiKey = !!process.env.CLAUDE_API_KEY;
    const hasNaverClientId = !!process.env.NAVER_CLIENT_ID;
    const hasNaverClientSecret = !!process.env.NAVER_CLIENT_SECRET;
    const claudeStatus = hasClaudeApiKey ? '✅ Claude API 설정됨' : '❌ Claude API 미설정';
    const naverStatus = (hasNaverClientId && hasNaverClientSecret) ? '✅ 네이버 API 설정됨' : '❌ 네이버 API 미설정';
    const koreanTime = getKoreanDateTime();
    
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${koreanTime.formatted}</p>
        <p><strong>Claude API:</strong> ${claudeStatus}</p>
        <p><strong>네이버 검색 API:</strong> ${naverStatus}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook</p>
        <p><strong>루트 웹훅:</strong> https://kakao-skill-webhook-production.up.railway.app</p>
        <hr>
        <p><strong>기능:</strong></p>
        <ul>
            <li>📰 실시간 뉴스 제공 (예: "오늘 뉴스", "최신 뉴스")</li>
            <li>🛒 쇼핑 상품 검색 (예: "젖병 세척기 추천", "노트북 베스트")</li>
            <li>🕐 한국 시간 인식 및 제공</li>
            <li>💬 무제한 길이 상세 답변</li>
        </ul>
        <hr>
        <p><strong>환경변수 설정:</strong></p>
        <ul>
            <li>NAVER_CLIENT_ID: ${hasNaverClientId ? '설정됨' : '미설정'}</li>
            <li>NAVER_CLIENT_SECRET: ${hasNaverClientSecret ? '설정됨' : '미설정'}</li>
        </ul>
    `);
});

// 카카오 스킬 웹훅
app.post('/kakao-skill-webhook', async (req, res) => {
    console.log('🔔 카카오 웹훅 요청 받음!');
    
    try {
        const userMessage = req.body.userRequest?.utterance;
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        console.log(`💬 사용자 메시지 길이: ${userMessage.length}자`);
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        // 전체 요청 바디를 로그로 출력 (디버깅용)
        if (userMessage.length > 500) {
            console.log(`📊 긴 메시지 감지됨. 전체 요청 바디:`, JSON.stringify(req.body, null, 2));
        }
        
        if (!userMessage) {
            throw new Error('메시지가 없습니다');
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
        // 긴 메시지 감지 및 컨텍스트 병합 처리
        let finalMessage = userMessage;
        const previousContext = userContexts.get(userId);
        
        // 메시지가 이전 메시지의 연속으로 보이면 합치기
        if (previousContext && 
            userMessage.length > 200 && 
            (userMessage.includes('1.') || userMessage.includes('2.') || userMessage.includes('3.') ||
             userMessage.startsWith('안녕하세요') || 
             (previousContext.timestamp && Date.now() - previousContext.timestamp < 30000))) {
            
            finalMessage = previousContext.message + '\n\n' + userMessage;
            console.log(`🔗 이전 컨텍스트와 병합됨. 총 길이: ${finalMessage.length}자`);
            
            // 컨텍스트 업데이트
            userContexts.set(userId, {
                message: finalMessage,
                timestamp: Date.now()
            });
        } else {
            // 새로운 컨텍스트 저장
            userContexts.set(userId, {
                message: userMessage,
                timestamp: Date.now()
            });
        }
        
        // 최종 메시지로 처리 계속
        const processMessage = finalMessage;
        console.log(`📝 최종 처리할 메시지 길이: ${processMessage.length}자`);
        
        // 이미지 요청 처리 (최우선 처리)
        console.log(`🔍 이미지 감지 테스트: 메시지='${userMessage.substring(0, 100)}'`);
        console.log(`🔍 이미지 감지 함수 결과: ${isImageRequest(req.body)}`);
        
        if (isImageRequest(req.body)) {
            console.log('🖼️ 이미지 요청 감지됨');
            
            const imageUrl = extractImageUrl(req.body);
            if (imageUrl) {
                console.log(`📷 이미지 URL 발견: ${imageUrl}`);
                
                // 사용자별로 이미지 URL 저장
                userImageUrls.set(userId, imageUrl);
                console.log(`💾 사용자 ${userId}의 이미지 URL 저장됨`);
                
                // 이미지가 있을 때 처리 옵션 제공
                const imageOptionsText = `🖼️ 이미지를 받았습니다!

어떤 작업을 도와드릴까요?

1️⃣ 이미지 분석 - 이미지 내용 설명
2️⃣ 텍스트 추출 - 이미지 속 텍스트 읽기  
3️⃣ 개선 제안 - 사진/디자인 개선 아이디어
4️⃣ 설명 생성 - 상품/장면 설명 작성
5️⃣ 스타일 분석 - 색상, 구성, 스타일 분석

예: "이미지 분석해줘" 또는 "텍스트 추출해줘"`;

                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: imageOptionsText
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 이미지 처리 옵션 전송 완료');
                return;
            } else {
                // 이미지 키워드는 있지만 실제 이미지 URL이 없는 경우
                const noImageText = `🖼️ 이미지 처리를 도와드리고 싶지만, 이미지를 찾을 수 없습니다.

이미지를 다시 전송하거나 이미지 URL을 포함해서 보내주세요.

지원 형식: JPG, PNG, GIF, BMP, WebP`;

                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: noImageText
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 이미지 없음 안내 전송 완료');
                return;
            }
        }
        
        // "계속" 요청 처리
        if (userMessage.includes('계속') || userMessage.includes('이어서') || userMessage.includes('더보기')) {
            console.log('📄 계속 요청 감지됨');
            const pendingMessage = pendingMessages.get(userId);
            if (pendingMessage) {
                console.log('✅ 저장된 나머지 내용 전송');
                pendingMessages.delete(userId); // 사용 후 삭제
                
                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: pendingMessage
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 나머지 내용 전송 완료');
                return;
            } else {
                console.log('⚠️ 저장된 내용이 없음');
                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: '전송할 나머지 내용이 없습니다. 새로운 질문을 해주세요!'
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 안내 메시지 전송 완료');
                return;
            }
        }
        
        // 이미지 분석 요청 처리 (기존 이미지 URL로)
        if (isImageAnalysisRequest(processMessage)) {
            console.log('🔍 이미지 분석 요청 감지됨');
            
            const storedImageUrl = userImageUrls.get(userId);
            if (storedImageUrl) {
                console.log(`📷 저장된 이미지 URL로 분석: ${storedImageUrl}`);
                
                const analysisResult = await analyzeImageWithClaude(storedImageUrl, 'analysis', processMessage);
                let responseText = `🖼️ 이미지 분석 결과:\n\n${analysisResult}`;
                
                // 이미지 분석 결과도 분할 전송 처리
                const maxLength = 800;
                if (responseText.length > maxLength) {
                    const firstPart = responseText.substring(0, maxLength - 100);
                    const remainingPart = responseText.substring(maxLength - 100);
                    
                    // 나머지 부분을 사용자별로 저장
                    pendingMessages.set(userId, remainingPart);
                    
                    responseText = firstPart + '\n\n📄 "계속"이라고 입력하시면 나머지 내용을 보실 수 있습니다.';
                    console.log(`📄 이미지 분석 결과가 길어서 분할됨: 첫 부분 ${firstPart.length}자, 나머지 ${remainingPart.length}자`);
                }
                
                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: responseText
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 이미지 분석 결과 전송 완료');
                return;
            } else {
                const noStoredImageText = `🖼️ 분석할 이미지가 없습니다.

먼저 이미지를 전송한 후에 분석을 요청해주세요.

지원 형식: JPG, PNG, GIF, BMP, WebP`;

                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: noStoredImageText
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 저장된 이미지 없음 안내 전송 완료');
                return;
            }
        }
        
        // 이미지 수정/개선 예시 요청 처리
        if (processMessage.includes('이미지 수정') || processMessage.includes('이미지 개선') || processMessage.includes('사진 편집') || processMessage.includes('이미지 예시')) {
            console.log('🎨 이미지 수정/개선 예시 요청 감지됨');
            
            const imageEditExamples = `🎨 이미지 수정/개선 예시

AI로 이미지를 분석하고 다음과 같은 개선사항을 제안할 수 있습니다:

📸 사진 개선:
• 밝기/대비 조정 제안
• 색상 보정 방향 안내
• 구도 개선 아이디어

🖼️ 디자인 개선:
• 레이아웃 최적화 제안
• 색상 조합 추천
• 시각적 균형 조언

📝 텍스트 추출:
• 이미지 속 글자 읽기
• 문서 내용 정리
• 번역 도움

🔍 상세 분석:
• 객체 식별 및 설명
• 스타일 분석
• 품질 평가

이미지를 업로드하고 "이미지 분석해줘" 또는 "개선 제안해줘"라고 말씀해보세요!`;

            const response = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: imageEditExamples
                        }
                    }]
                }
            };
            
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(response);
            console.log('✅ 이미지 수정/개선 예시 전송 완료');
            return;
        }
        
        // 맛집 요청 처리
        if (isRestaurantRequest(processMessage)) {
            console.log('🍽️ 맛집 요청 감지됨');
            
            // 지역명 추출 (간단한 방법)
            let searchQuery = processMessage;
            
            // 불필요한 단어 제거하고 핵심 지역 + 맛집 키워드로 검색어 구성
            const removeWords = ['추천', '해주세요', '알려주세요', '찾아주세요', '맛있는', '근처', '주변', '맛집'];
            removeWords.forEach(word => {
                searchQuery = searchQuery.replace(new RegExp(word, 'gi'), '').trim();
            });
            
            // 연속된 공백 제거
            searchQuery = searchQuery.replace(/\s+/g, ' ').trim();
            
            // 만약 검색어가 너무 짧으면 원본 메시지에서 지역명 추출
            if (searchQuery.length < 3) {
                const locationMatch = processMessage.match(/([\w]+역|[\w]+동|[\w]+구|[\w]+시|[\w]+군)/);
                if (locationMatch) {
                    searchQuery = locationMatch[1] + ' 맛집';
                } else {
                    searchQuery = processMessage.substring(0, 10) + ' 맛집';
                }
            } else {
                searchQuery += ' 맛집';
            }
            
            const restaurants = await getLocalRestaurants(searchQuery);
            if (restaurants && restaurants.length > 0) {
                let restaurantText = `🍽️ ${koreanTime.formatted} "${searchQuery}" 검색 결과\n\n` +
                    restaurants.map((restaurant, index) => {
                        let result = `${index + 1}. ${restaurant.title}\n`;
                        result += `📍 ${restaurant.roadAddress || restaurant.address}\n`;
                        result += `📞 ${restaurant.telephone}\n`;
                        if (restaurant.category) {
                            result += `🏷️ ${restaurant.category}\n`;
                        }
                        result += `🔗 ${restaurant.link}\n`;
                        return result + '\n' + '='.repeat(50) + '\n';
                    }).join('');
                
                console.log('✅ 맛집 데이터 제공 완료');
                console.log(`📊 응답 길이: ${restaurantText.length}자`);
                
                // 응답이 길면 분할 전송
                const maxLength = 800;
                if (restaurantText.length > maxLength) {
                    const firstPart = restaurantText.substring(0, maxLength - 100);
                    const remainingPart = restaurantText.substring(maxLength - 100);
                    
                    // 나머지 부분을 사용자별로 저장
                    pendingMessages.set(userId, remainingPart);
                    
                    restaurantText = firstPart + '\n\n📄 "계속"이라고 입력하시면 나머지 맛집을 보실 수 있습니다.';
                    console.log(`📄 맛집 정보가 길어서 분할됨: 첫 부분 ${firstPart.length}자, 나머지 ${remainingPart.length}자`);
                }
                
                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: restaurantText
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 맛집 응답 전송 완료');
                return;
            } else {
                console.log('⚠️ 맛집 API 사용 불가 - Claude로 폴백');
            }
        }
        
        // 쇼핑 요청인지 먼저 확인
        if (isShoppingRequest(processMessage)) {
            console.log('🛒 쇼핑 요청 감지됨');
            
            // 상품명 추출 (개선된 방법)
            let searchQuery = processMessage;
            
            // 1. 먼저 핵심 상품 키워드 찾기
            const productKeywords = ['젖병', '세척기', '기저귀', '유모차', '카시트', '노트북', '휴대폰', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기', '마우스', '키보드', '모니터', '스피커'];
            let foundProducts = [];
            
            productKeywords.forEach(keyword => {
                if (processMessage.includes(keyword)) {
                    foundProducts.push(keyword);
                }
            });
            
            // 2. 핵심 상품명이 있으면 그것을 중심으로 검색어 구성
            if (foundProducts.length > 0) {
                searchQuery = foundProducts.join(' ');
            } else {
                // 3. 핵심 상품명이 없으면 불필요한 단어만 제거
                const removeWords = ['추천', '해주세요', '알려주세요', '찾아주세요', '드리겠습니다', '함께', '가장', '현재', '지금', '스마트', '스토어', '링크', '해줘'];
                removeWords.forEach(word => {
                    searchQuery = searchQuery.replace(new RegExp(word, 'gi'), '').trim();
                });
                
                // 숫자 제거 (5개, 10개 등)
                searchQuery = searchQuery.replace(/\d+개?/g, '').trim();
                
                // 연속된 공백 제거
                searchQuery = searchQuery.replace(/\s+/g, ' ').trim();
            }
            
            const shopping = await getShoppingResults(searchQuery);
            if (shopping && shopping.length > 0) {
                const shoppingText = `🛒 ${koreanTime.formatted} "${searchQuery}" 검색 결과\n\n` +
                    shopping.map((product) => {
                        return `${product.rank}. ${product.title}\n💰 ${product.price}\n🏪 ${product.mallName}\n🔗 ${product.link}\n\n${'='.repeat(50)}\n`;
                    }).join('');
                
                console.log('✅ 쇼핑 데이터 제공 완료');
                console.log(`📊 응답 길이: ${shoppingText.length}자`);
                
                // 카카오 스킬 텍스트 길이 제한 확인
                if (shoppingText.length > 1000) {
                    console.log('⚠️ 응답이 길어서 리스트 카드로 변환');
                    
                    // 리스트 카드 형태로 제공
                    const listItems = shopping.map((product) => ({
                        title: `${product.rank}. ${product.title}`,
                        description: `💰 ${product.price} | 🏪 ${product.mallName}`,
                        imageUrl: product.image || null,
                        link: {
                            web: product.link
                        }
                    }));
                    
                    const response = {
                        version: "2.0",
                        template: {
                            outputs: [{
                                listCard: {
                                    header: {
                                        title: `🛒 "${searchQuery}" 쇼핑 검색 결과`
                                    },
                                    items: listItems.slice(0, 5),
                                    buttons: [{
                                        label: "네이버쇼핑에서 더보기",
                                        action: "webLink",
                                        webLinkUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(searchQuery)}`
                                    }]
                                }
                            }]
                        }
                    };
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.status(200).json(response);
                    console.log('✅ 응답 전송 완료');
                } else {
                    // 짧은 텍스트는 그대로 텍스트로 제공
                    const response = {
                        version: "2.0",
                        template: {
                            outputs: [{
                                simpleText: {
                                    text: shoppingText
                                }
                            }]
                        }
                    };
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.status(200).json(response);
                    console.log('✅ 응답 전송 완료');
                }
                return;
            } else {
                console.log('⚠️ 쇼핑 API 사용 불가 - Claude로 폴백');
            }
        }
        
        // 시간/날짜 질문을 더 구체적으로 확인하여 직접 처리
        const timeQuestionPatterns = [
            /오늘.*날짜/,
            /오늘.*며칠/,
            /오늘.*몇일/,
            /오늘.*몇월/,
            /날짜.*며칠/,
            /날짜.*몇일/,
            /지금.*시간/,
            /현재.*시간/,
            /몇시.*지금/,
            /몇시.*현재/,
            /오늘.*요일/,
            /무슨.*요일/,
            /^시간$/,
            /^날짜$/,
            /^오늘$/,
            /^지금$/
        ];
        const isTimeQuestion = timeQuestionPatterns.some(pattern => pattern.test(processMessage));
        
        if (isTimeQuestion) {
            console.log('🕐 시간/날짜 질문 감지됨 - 직접 처리');
            
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const now = new Date();
            const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
            const dayOfWeek = dayNames[koreaDate.getDay()];
            
            let timeResponse = '';
            if (processMessage.includes('날짜') || processMessage.includes('며칠') || processMessage.includes('몇일') || processMessage.includes('몇월') || processMessage.includes('오늘')) {
                const dateOnly = koreanTime.formatted.replace(/\s\d{2}:\d{2}:\d{2}/, ''); // 시간 부분 제거
                timeResponse = `오늘은 ${dateOnly} ${dayOfWeek}입니다.`;
            } else if (processMessage.includes('시간') || processMessage.includes('몇시') || processMessage.includes('지금')) {
                timeResponse = `현재 시간은 ${koreanTime.formatted}입니다.`;
            } else if (processMessage.includes('요일')) {
                timeResponse = `오늘은 ${dayOfWeek}입니다.`;
            } else {
                timeResponse = `현재 시간은 ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            
            const response = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: timeResponse
                        }
                    }]
                }
            };
            
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(response);
            console.log('✅ 시간/날짜 응답 전송 완료');
            return;
        }

        // 뉴스 요청인지 확인
        if (isNewsRequest(processMessage)) {
            console.log('📰 뉴스 요청 감지됨');
            
            const news = await getLatestNews('최신 뉴스');
            if (news && news.length > 0) {
                const newsText = `📰 ${koreanTime.formatted} 네이버 최신 뉴스\n\n` +
                    news.map((article, index) => {
                        const date = new Date(article.pubDate).toLocaleString('ko-KR');
                        const description = article.description || '내용이 없습니다.';
                        
                        return `📌 ${index + 1}. ${article.title}\n\n${description}\n\n📅 ${date}\n🔗 ${article.link}\n\n${'='.repeat(50)}\n`;
                    }).join('');
                
                console.log('✅ 뉴스 데이터 제공 완료');
                console.log(`📊 응답 길이: ${newsText.length}자`);
                
                // 카카오 스킬 텍스트 길이 제한 (일반적으로 1000자) 확인
                if (newsText.length > 1000) {
                    console.log('⚠️ 응답이 길어서 리스트 카드로 변환');
                    
                    // 리스트 카드 형태로 제공
                    const listItems = news.map((article, index) => ({
                        title: `${index + 1}. ${article.title}`,
                        description: article.description.length > 100 ? 
                            article.description.substring(0, 100) + '...' : 
                            article.description,
                        imageUrl: null,
                        link: {
                            web: article.link
                        }
                    }));
                    
                    res.json({
                        version: "2.0",
                        template: {
                            outputs: [{
                                listCard: {
                                    header: {
                                        title: `📰 ${koreanTime.formatted} 최신 뉴스`
                                    },
                                    items: listItems.slice(0, 5),
                                    buttons: [{
                                        label: "더보기",
                                        action: "webLink",
                                        webLinkUrl: "https://news.naver.com/"
                                    }]
                                }
                            }]
                        }
                    });
                } else {
                    // 짧은 텍스트는 그대로 텍스트로 제공
                    res.json({
                        version: "2.0",
                        template: {
                            outputs: [{
                                simpleText: {
                                    text: newsText
                                }
                            }]
                        }
                    });
                }
                return;
            } else {
                console.log('⚠️ 뉴스 API 사용 불가 - Claude로 폴백');
            }
        }
        
        // Claude API 키 확인
        if (!process.env.CLAUDE_API_KEY) {
            console.log('⚠️ Claude API 키가 설정되지 않았습니다.');
            throw new Error('API 키가 설정되지 않았습니다');
        }
        
        console.log('✅ Claude API 호출 시작...');
        
        // Claude API 호출 (더 관대한 타임아웃)
        console.log('🔄 Claude API 호출 중...');
        const startTime = Date.now();
        
        let responseText;
        try {
            const claudeResponse = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: "claude-3-haiku-20240307",
                    system: `현재 정확한 한국 시간은 ${koreanTime.formatted}입니다. 
사용자가 시간이나 날짜를 물어보면 이 정보를 사용해주세요.

답변 가이드라인:
1. 명확하고 도움이 되는 답변을 제공하세요.
2. 핵심 내용을 간결하게 설명하세요.
3. 답변 길이는 반드시 950자 이내로 작성하세요.
4. 카카오톡 메시지 형태에 적합하도록 간결하게 작성하세요.`,
                    messages: [{
                        role: "user",
                        content: processMessage
                    }],
                    max_tokens: 800  // 토큰 수 조정: 분할 전송으로 더 긴 응답 가능
                },
                {
                    headers: {
                        'x-api-key': process.env.CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    timeout: 12000  // 12초로 늘림 (긴 응답을 위해 충분한 시간 확보)
                }
            );
            
            const responseTime = Date.now() - startTime;
            responseText = claudeResponse.data.content[0].text;
            console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.log(`⚠️ Claude API 에러 (${responseTime}ms): ${error.message}`);
            
            // API 키 문제인지 확인
            if (error.response?.status === 401) {
                responseText = `Claude API 인증에 문제가 있습니다. 서버 관리자에게 문의해주세요.`;
            }
            // 네트워크 문제
            else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                responseText = `네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.`;
            }
            // 시간 관련 질문 특별 처리
            else if (processMessage.includes('시간') || processMessage.includes('날짜') || processMessage.includes('오늘') || processMessage.includes('지금')) {
                const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                const now = new Date();
                const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
                const dayOfWeek = dayNames[koreaDate.getDay()];
                responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            // 간단한 인사 응답
            else if (processMessage.includes('안녕') || processMessage.includes('hi') || processMessage.includes('hello')) {
                responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
            }
            // 일반적인 질문에 대한 기본 안내
            else {
                responseText = `현재 AI 서비스가 일시적으로 불안정합니다. 간단한 질문이나 뉴스/쇼핑 검색은 가능합니다. (현재 시간: ${koreanTime.formatted})`;
            }
        }
        console.log(`📝 응답 내용 일부: ${responseText.substring(0, 100)}...`);
        
        // 카카오 스킬 응답 처리 - 800자로 분할 전송
        const maxLength = 800;
        let kakaoResponse;
        
        // 응답이 800자를 초과하면 분할
        if (responseText.length > maxLength) {
            const firstPart = responseText.substring(0, maxLength - 100);
            const remainingPart = responseText.substring(maxLength - 100);
            
            // 나머지 부분을 사용자별로 저장
            pendingMessages.set(userId, remainingPart);
            
            responseText = firstPart + '\n\n📄 "계속"이라고 입력하시면 나머지 내용을 보실 수 있습니다.';
            console.log(`📄 응답이 길어서 분할됨: 첫 부분 ${firstPart.length}자, 나머지 ${remainingPart.length}자`);
        }
        
        kakaoResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: responseText
                    }
                }]
            }
        };
        
        // Kakao Skills 응답 검증
        if (!kakaoResponse.template || !kakaoResponse.template.outputs || !Array.isArray(kakaoResponse.template.outputs)) {
            throw new Error('Invalid Kakao response format');
        }
        
        console.log(`📤 카카오 응답 전송: ${JSON.stringify(kakaoResponse, null, 2).substring(0, 300)}...`);
        
        // 응답 헤더 명시적 설정 (Kakao Skills 호환성)
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(kakaoResponse);
        console.log('✅ 카카오 웹훅 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 에러 발생:', error.response?.data || error.message);
        
        // 에러별 메시지
        let errorMsg = "죄송합니다. 잠시 후 다시 시도해주세요.";
        
        if (error.message.includes('API 키')) {
            errorMsg = `안녕하세요! 서버가 정상 작동 중입니다.\n현재 시간: ${getKoreanDateTime().formatted}\n받은 메시지: '${req.body.userRequest?.utterance || '메시지 없음'}'`;
        } else if (error.response?.status === 401) {
            errorMsg = "Claude API 인증 오류가 발생했습니다.";
        } else if (error.code === 'ECONNABORTED') {
            errorMsg = "응답 시간이 초과되었습니다. 다시 시도해주세요.";
        }
        
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: errorMsg
                    }
                }]
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(errorResponse);
    }
});

// 루트 웹훅 (POST /)
app.post('/', async (req, res) => {
    console.log('🔔 루트 웹훅 호출');
    
    try {
        const userMessage = req.body.userRequest?.utterance;
        console.log(`💬 사용자 메시지: '${userMessage}'`);
        
        if (!userMessage) {
            throw new Error('메시지가 없습니다');
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
        // 쇼핑 요청인지 먼저 확인
        if (isShoppingRequest(processMessage)) {
            console.log('🛒 쇼핑 요청 감지됨');
            
            // 상품명 추출 (개선된 방법)
            let searchQuery = processMessage;
            
            // 1. 먼저 핵심 상품 키워드 찾기
            const productKeywords = ['젖병', '세척기', '기저귀', '유모차', '카시트', '노트북', '휴대폰', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기', '마우스', '키보드', '모니터', '스피커'];
            let foundProducts = [];
            
            productKeywords.forEach(keyword => {
                if (processMessage.includes(keyword)) {
                    foundProducts.push(keyword);
                }
            });
            
            // 2. 핵심 상품명이 있으면 그것을 중심으로 검색어 구성
            if (foundProducts.length > 0) {
                searchQuery = foundProducts.join(' ');
            } else {
                // 3. 핵심 상품명이 없으면 불필요한 단어만 제거
                const removeWords = ['추천', '해주세요', '알려주세요', '찾아주세요', '드리겠습니다', '함께', '가장', '현재', '지금', '스마트', '스토어', '링크'];
                removeWords.forEach(word => {
                    searchQuery = searchQuery.replace(new RegExp(word, 'g'), '');
                });
                
                // 숫자 제거 (5개, 10개 등)
                searchQuery = searchQuery.replace(/\d+개?/g, '').trim();
            }
            
            const shopping = await getShoppingResults(searchQuery);
            if (shopping && shopping.length > 0) {
                const shoppingText = `🛒 ${koreanTime.formatted} "${searchQuery}" 검색 결과\n\n` +
                    shopping.map((product) => {
                        return `${product.rank}. ${product.title}\n💰 ${product.price}\n🏪 ${product.mallName}\n🔗 ${product.link}\n\n${'='.repeat(50)}\n`;
                    }).join('');
                
                console.log('✅ 쇼핑 데이터 제공 완료');
                console.log(`📊 응답 길이: ${shoppingText.length}자`);
                
                // 카카오 스킬 텍스트 길이 제한 확인
                if (shoppingText.length > 1000) {
                    console.log('⚠️ 응답이 길어서 리스트 카드로 변환');
                    
                    // 리스트 카드 형태로 제공
                    const listItems = shopping.map((product) => ({
                        title: `${product.rank}. ${product.title}`,
                        description: `💰 ${product.price} | 🏪 ${product.mallName}`,
                        imageUrl: product.image || null,
                        link: {
                            web: product.link
                        }
                    }));
                    
                    const response = {
                        version: "2.0",
                        template: {
                            outputs: [{
                                listCard: {
                                    header: {
                                        title: `🛒 "${searchQuery}" 쇼핑 검색 결과`
                                    },
                                    items: listItems.slice(0, 5),
                                    buttons: [{
                                        label: "네이버쇼핑에서 더보기",
                                        action: "webLink",
                                        webLinkUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(searchQuery)}`
                                    }]
                                }
                            }]
                        }
                    };
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.status(200).json(response);
                    console.log('✅ 응답 전송 완료');
                } else {
                    // 짧은 텍스트는 그대로 텍스트로 제공
                    const response = {
                        version: "2.0",
                        template: {
                            outputs: [{
                                simpleText: {
                                    text: shoppingText
                                }
                            }]
                        }
                    };
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.status(200).json(response);
                    console.log('✅ 응답 전송 완료');
                }
                return;
            } else {
                console.log('⚠️ 쇼핑 API 사용 불가 - Claude로 폴백');
            }
        }
        
        // 시간/날짜 질문을 더 구체적으로 확인하여 직접 처리
        const timeQuestionPatterns = [
            /오늘.*날짜/,
            /오늘.*며칠/,
            /오늘.*몇일/,
            /오늘.*몇월/,
            /날짜.*며칠/,
            /날짜.*몇일/,
            /지금.*시간/,
            /현재.*시간/,
            /몇시.*지금/,
            /몇시.*현재/,
            /오늘.*요일/,
            /무슨.*요일/,
            /^시간$/,
            /^날짜$/,
            /^오늘$/,
            /^지금$/
        ];
        const isTimeQuestion = timeQuestionPatterns.some(pattern => pattern.test(processMessage));
        
        if (isTimeQuestion) {
            console.log('🕐 시간/날짜 질문 감지됨 - 직접 처리');
            
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const now = new Date();
            const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
            const dayOfWeek = dayNames[koreaDate.getDay()];
            
            let timeResponse = '';
            if (processMessage.includes('날짜') || processMessage.includes('며칠') || processMessage.includes('몇일') || processMessage.includes('몇월') || processMessage.includes('오늘')) {
                const dateOnly = koreanTime.formatted.replace(/\s\d{2}:\d{2}:\d{2}/, ''); // 시간 부분 제거
                timeResponse = `오늘은 ${dateOnly} ${dayOfWeek}입니다.`;
            } else if (processMessage.includes('시간') || processMessage.includes('몇시') || processMessage.includes('지금')) {
                timeResponse = `현재 시간은 ${koreanTime.formatted}입니다.`;
            } else if (processMessage.includes('요일')) {
                timeResponse = `오늘은 ${dayOfWeek}입니다.`;
            } else {
                timeResponse = `현재 시간은 ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            
            const response = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: timeResponse
                        }
                    }]
                }
            };
            
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(response);
            console.log('✅ 시간/날짜 응답 전송 완료');
            return;
        }

        // 뉴스 요청인지 확인
        if (isNewsRequest(processMessage)) {
            console.log('📰 뉴스 요청 감지됨');
            
            const news = await getLatestNews('최신 뉴스');
            if (news && news.length > 0) {
                const newsText = `📰 ${koreanTime.formatted} 네이버 최신 뉴스\n\n` +
                    news.map((article, index) => {
                        const date = new Date(article.pubDate).toLocaleString('ko-KR');
                        const description = article.description || '내용이 없습니다.';
                        
                        return `📌 ${index + 1}. ${article.title}\n\n${description}\n\n📅 ${date}\n🔗 ${article.link}\n\n${'='.repeat(50)}\n`;
                    }).join('');
                
                console.log('✅ 뉴스 데이터 제공 완료');
                console.log(`📊 응답 길이: ${newsText.length}자`);
                
                // 카카오 스킬 텍스트 길이 제한 (일반적으로 1000자) 확인
                if (newsText.length > 1000) {
                    console.log('⚠️ 응답이 길어서 리스트 카드로 변환');
                    
                    // 리스트 카드 형태로 제공
                    const listItems = news.map((article, index) => ({
                        title: `${index + 1}. ${article.title}`,
                        description: article.description.length > 100 ? 
                            article.description.substring(0, 100) + '...' : 
                            article.description,
                        imageUrl: null,
                        link: {
                            web: article.link
                        }
                    }));
                    
                    res.json({
                        version: "2.0",
                        template: {
                            outputs: [{
                                listCard: {
                                    header: {
                                        title: `📰 ${koreanTime.formatted} 최신 뉴스`
                                    },
                                    items: listItems.slice(0, 5),
                                    buttons: [{
                                        label: "더보기",
                                        action: "webLink",
                                        webLinkUrl: "https://news.naver.com/"
                                    }]
                                }
                            }]
                        }
                    });
                } else {
                    // 짧은 텍스트는 그대로 텍스트로 제공
                    res.json({
                        version: "2.0",
                        template: {
                            outputs: [{
                                simpleText: {
                                    text: newsText
                                }
                            }]
                        }
                    });
                }
                return;
            } else {
                console.log('⚠️ 뉴스 API 사용 불가 - Claude로 폴백');
            }
        }
        
        // Claude API 키 확인
        if (!process.env.CLAUDE_API_KEY) {
            console.log('⚠️ Claude API 키가 설정되지 않았습니다.');
            throw new Error('API 키가 설정되지 않았습니다');
        }
        
        console.log('✅ Claude API 호출 시작...');
        
        // Claude API 호출 (더 관대한 타임아웃)
        const startTime = Date.now();
        
        let responseText;
        try {
            const claudeResponse = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: "claude-3-haiku-20240307",
                    system: `현재 정확한 한국 시간은 ${koreanTime.formatted}입니다. 
사용자가 시간이나 날짜를 물어보면 이 정보를 사용해주세요.

답변 가이드라인:
1. 명확하고 도움이 되는 답변을 제공하세요.
2. 핵심 내용을 간결하게 설명하세요.
3. 답변 길이는 반드시 950자 이내로 작성하세요.
4. 카카오톡 메시지 형태에 적합하도록 간결하게 작성하세요.`,
                    messages: [{
                        role: "user",
                        content: processMessage
                    }],
                    max_tokens: 800  // 토큰 수 조정: 분할 전송으로 더 긴 응답 가능
                },
                {
                    headers: {
                        'x-api-key': process.env.CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    timeout: 12000  // 12초로 늘림 (긴 응답을 위해 충분한 시간 확보)
                }
            );
            
            const responseTime = Date.now() - startTime;
            responseText = claudeResponse.data.content[0].text;
            console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.log(`⚠️ Claude API 에러 (${responseTime}ms): ${error.message}`);
            
            // API 키 문제인지 확인
            if (error.response?.status === 401) {
                responseText = `Claude API 인증에 문제가 있습니다. 서버 관리자에게 문의해주세요.`;
            }
            // 네트워크 문제
            else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                responseText = `네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.`;
            }
            // 시간 관련 질문 특별 처리
            else if (processMessage.includes('시간') || processMessage.includes('날짜') || processMessage.includes('오늘') || processMessage.includes('지금')) {
                const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                const now = new Date();
                const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
                const dayOfWeek = dayNames[koreaDate.getDay()];
                responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            // 간단한 인사 응답
            else if (processMessage.includes('안녕') || processMessage.includes('hi') || processMessage.includes('hello')) {
                responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
            }
            // 일반적인 질문에 대한 기본 안내
            else {
                responseText = `현재 AI 서비스가 일시적으로 불안정합니다. 간단한 질문이나 뉴스/쇼핑 검색은 가능합니다. (현재 시간: ${koreanTime.formatted})`;
            }
        }
        console.log(`📝 응답 미리보기: ${responseText.substring(0, 100)}...`);
        
        // 카카오 스킬 응답 처리 - 800자로 분할 전송
        const maxLength = 800;
        let kakaoResponse;
        
        // 응답이 800자를 초과하면 분할
        if (responseText.length > maxLength) {
            const firstPart = responseText.substring(0, maxLength - 100);
            const remainingPart = responseText.substring(maxLength - 100);
            
            // 나머지 부분을 사용자별로 저장
            pendingMessages.set(userId, remainingPart);
            
            responseText = firstPart + '\n\n📄 "계속"이라고 입력하시면 나머지 내용을 보실 수 있습니다.';
            console.log(`📄 응답이 길어서 분할됨: 첫 부분 ${firstPart.length}자, 나머지 ${remainingPart.length}자`);
        }
        
        kakaoResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: responseText
                    }
                }]
            }
        };
        
        // Kakao Skills 응답 검증
        if (!kakaoResponse.template || !kakaoResponse.template.outputs || !Array.isArray(kakaoResponse.template.outputs)) {
            throw new Error('Invalid Kakao response format');
        }
        
        console.log(`📤 루트 웹훅 카카오 응답 전송: ${JSON.stringify(kakaoResponse, null, 2).substring(0, 300)}...`);
        
        // 응답 헤더 명시적 설정 (Kakao Skills 호환성)
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(kakaoResponse);
        console.log('✅ 루트 웹훅 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 루트 웹훅 에러 발생:', error.response?.data || error.message);
        
        // 에러별 메시지
        let errorMsg = "죄송합니다. 잠시 후 다시 시도해주세요.";
        
        if (error.message.includes('API 키')) {
            errorMsg = `안녕하세요! 서버가 정상 작동 중입니다.\n현재 시간: ${getKoreanDateTime().formatted}\n받은 메시지: '${req.body.userRequest?.utterance || '메시지 없음'}'`;
        } else if (error.response?.status === 401) {
            errorMsg = "Claude API 인증 오류가 발생했습니다.";
        } else if (error.code === 'ECONNABORTED') {
            errorMsg = "응답 시간이 초과되었습니다. 다시 시도해주세요.";
        }
        
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: errorMsg
                    }
                }]
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(errorResponse);
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    const koreanTime = getKoreanDateTime();
    console.log(`🚀 Node.js 서버 시작: 포트 ${PORT}`);
    console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
    console.log(`💡 상태 페이지: http://0.0.0.0:${PORT}/status`);
    console.log(`🔗 웹훅 URL: http://0.0.0.0:${PORT}/kakao-skill-webhook`);
    console.log(`🔑 Claude API 키 설정: ${process.env.CLAUDE_API_KEY ? '✅' : '❌'}`);
    console.log(`📰 네이버 Client ID 설정: ${process.env.NAVER_CLIENT_ID ? '✅' : '❌'}`);
    console.log(`🔐 네이버 Client Secret 설정: ${process.env.NAVER_CLIENT_SECRET ? '✅' : '❌'}`);
    console.log(`📋 기능: 네이버 검색 뉴스 제공, 한국 시간 인식`);
});

// Railway 배포를 위한 Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`🛑 ${signal} 신호 받음. 서버 종료 중...`);
    server.close(() => {
        console.log('✅ 서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    });
    
    // 10초 후 강제 종료
    setTimeout(() => {
        console.log('⚠️ 강제 종료됩니다.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 메모리 사용량 모니터링 (Railway 최적화)
setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (memUsedMB > 450) { // 450MB 이상시 경고
        console.log(`⚠️ 높은 메모리 사용량: ${memUsedMB}MB`);
        if (global.gc) {
            global.gc();
            console.log('🧹 가비지 컬렉션 실행');
        }
    }
}, 60000); // 1분마다 체크