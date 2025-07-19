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
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return {
        date: koreanTime.toISOString().split('T')[0],
        time: koreanTime.toTimeString().split(' ')[0],
        formatted: koreanTime.toLocaleDateString('ko-KR') + ' ' + koreanTime.toLocaleTimeString('ko-KR')
    };
}

// 뉴스 요청인지 확인하는 함수
function isNewsRequest(message) {
    const newsKeywords = ['뉴스', '최신뉴스', '오늘뉴스', '새로운소식', '헤드라인', '속보', '시사'];
    return newsKeywords.some(keyword => message.includes(keyword));
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
        console.log(`💬 사용자 메시지: '${userMessage}'`);
        
        if (!userMessage) {
            throw new Error('메시지가 없습니다');
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
        // 쇼핑 요청인지 먼저 확인
        if (isShoppingRequest(userMessage)) {
            console.log('🛒 쇼핑 요청 감지됨');
            
            // 상품명 추출 (개선된 방법)
            let searchQuery = userMessage;
            
            // 1. 먼저 핵심 상품 키워드 찾기
            const productKeywords = ['젖병', '세척기', '기저귀', '유모차', '카시트', '노트북', '휴대폰', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기', '마우스', '키보드', '모니터', '스피커'];
            let foundProducts = [];
            
            productKeywords.forEach(keyword => {
                if (userMessage.includes(keyword)) {
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
        
        // 뉴스 요청인지 확인
        if (isNewsRequest(userMessage)) {
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
        
        // Claude에게 현재 시간 정보와 함께 메시지 전달
        let enhancedMessage = userMessage;
        
        // 시간 관련 질문이면 현재 시간 정보 추가
        if (userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) {
            enhancedMessage = `현재 한국 시간: ${koreanTime.formatted}\n사용자 질문: ${userMessage}\n\n답변시 길이 제한 없이 상세하고 완전한 답변을 제공해주세요.`;
        }
        
        // 뉴스 관련 질문이면 최신 정보 안내
        if (isNewsRequest(userMessage)) {
            enhancedMessage = `현재 시간: ${koreanTime.formatted}\n사용자가 최신 뉴스를 요청했지만 네이버 검색 API가 사용 불가능합니다. 네이버 API 연동이 필요하다고 안내해주세요.\n사용자 질문: ${userMessage}\n\n답변시 길이 제한 없이 상세한 설명을 제공해주세요.`;
        }
        
        // 검색이나 설명 요청시 더 상세한 답변 유도
        if (userMessage.includes('검색') || userMessage.includes('설명') || userMessage.includes('알려줘') || userMessage.includes('가르쳐') || userMessage.includes('방법')) {
            enhancedMessage = `${enhancedMessage}\n\n[중요] 길이 제한 없이 가능한 한 상세하고 완전한 답변을 제공해주세요. 단계별 설명, 예시, 추가 정보를 모두 포함해주세요.`;
        }
        
        // Claude API 호출 (4초 타임아웃으로 단축)
        console.log('🔄 Claude API 호출 중...');
        const startTime = Date.now();
        
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-haiku-20240307",
                messages: [{
                    role: "user",
                    content: enhancedMessage
                }],
                max_tokens: 2000  // 토큰 수 줄여서 응답 속도 향상: 4000 → 2000
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: 4000  // 4초로 단축하여 카카오 5초 제한 준수
            }
        );
        
        const responseTime = Date.now() - startTime;
        let responseText = claudeResponse.data.content[0].text;
        console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
        console.log(`📝 응답 내용 일부: ${responseText.substring(0, 100)}...`);
        
        // 카카오 스킬 응답 길이 제한 처리 (1000자 제한)
        const maxLength = 1000;
        let kakaoResponse;
        
        if (responseText.length <= maxLength) {
            // 짧은 응답은 그대로 simpleText로
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
        } else {
            // 긴 응답은 1000자로 자르고 "... (더 보기)" 추가
            const truncatedText = responseText.substring(0, maxLength - 50) + '\n\n...(답변이 길어 일부만 표시됩니다)';
            
            console.log(`⚠️ 응답이 길어서 ${maxLength}자로 제한: ${responseText.length}자 → ${truncatedText.length}자`);
            
            kakaoResponse = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: truncatedText
                        }
                    }]
                }
            };
        }
        
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
        if (isShoppingRequest(userMessage)) {
            console.log('🛒 쇼핑 요청 감지됨');
            
            // 상품명 추출 (개선된 방법)
            let searchQuery = userMessage;
            
            // 1. 먼저 핵심 상품 키워드 찾기
            const productKeywords = ['젖병', '세척기', '기저귀', '유모차', '카시트', '노트북', '휴대폰', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기', '마우스', '키보드', '모니터', '스피커'];
            let foundProducts = [];
            
            productKeywords.forEach(keyword => {
                if (userMessage.includes(keyword)) {
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
        
        // 뉴스 요청인지 확인
        if (isNewsRequest(userMessage)) {
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
        
        // Claude에게 현재 시간 정보와 함께 메시지 전달
        let enhancedMessage = userMessage;
        
        // 시간 관련 질문이면 현재 시간 정보 추가
        if (userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) {
            enhancedMessage = `현재 한국 시간: ${koreanTime.formatted}\n사용자 질문: ${userMessage}\n\n답변시 길이 제한 없이 상세하고 완전한 답변을 제공해주세요.`;
        }
        
        // 뉴스 관련 질문이면 최신 정보 안내
        if (isNewsRequest(userMessage)) {
            enhancedMessage = `현재 시간: ${koreanTime.formatted}\n사용자가 최신 뉴스를 요청했지만 네이버 검색 API가 사용 불가능합니다. 네이버 API 연동이 필요하다고 안내해주세요.\n사용자 질문: ${userMessage}\n\n답변시 길이 제한 없이 상세한 설명을 제공해주세요.`;
        }
        
        // 검색이나 설명 요청시 더 상세한 답변 유도
        if (userMessage.includes('검색') || userMessage.includes('설명') || userMessage.includes('알려줘') || userMessage.includes('가르쳐') || userMessage.includes('방법')) {
            enhancedMessage = `${enhancedMessage}\n\n[중요] 길이 제한 없이 가능한 한 상세하고 완전한 답변을 제공해주세요. 단계별 설명, 예시, 추가 정보를 모두 포함해주세요.`;
        }
        
        // Claude API 호출 (4초 타임아웃으로 단축)
        const startTime = Date.now();
        
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-haiku-20240307",
                messages: [{
                    role: "user",
                    content: enhancedMessage
                }],
                max_tokens: 2000  // 토큰 수 줄여서 응답 속도 향상: 4000 → 2000
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: 4000  // 4초로 단축하여 카카오 5초 제한 준수
            }
        );
        
        const responseTime = Date.now() - startTime;
        let responseText = claudeResponse.data.content[0].text;
        console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
        console.log(`📝 응답 미리보기: ${responseText.substring(0, 100)}...`);
        
        // 카카오 스킬 응답 길이 제한 처리 (1000자 제한)
        const maxLength = 1000;
        let kakaoResponse;
        
        if (responseText.length <= maxLength) {
            // 짧은 응답은 그대로 simpleText로
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
        } else {
            // 긴 응답은 1000자로 자르고 "... (더 보기)" 추가
            const truncatedText = responseText.substring(0, maxLength - 50) + '\n\n...(답변이 길어 일부만 표시됩니다)';
            
            console.log(`⚠️ 응답이 길어서 ${maxLength}자로 제한: ${responseText.length}자 → ${truncatedText.length}자`);
            
            kakaoResponse = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: truncatedText
                        }
                    }]
                }
            };
        }
        
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