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

// 분할된 메시지 임시 저장 (메모리 기반 - 단순한 구현)
const pendingMessages = new Map();

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
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        if (!userMessage) {
            throw new Error('메시지가 없습니다');
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
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
        const isTimeQuestion = timeQuestionPatterns.some(pattern => pattern.test(userMessage));
        
        if (isTimeQuestion) {
            console.log('🕐 시간/날짜 질문 감지됨 - 직접 처리');
            
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const now = new Date();
            const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
            const dayOfWeek = dayNames[koreaDate.getDay()];
            
            let timeResponse = '';
            if (userMessage.includes('날짜') || userMessage.includes('며칠') || userMessage.includes('몇일') || userMessage.includes('몇월') || userMessage.includes('오늘')) {
                const dateOnly = koreanTime.formatted.replace(/\s\d{2}:\d{2}:\d{2}/, ''); // 시간 부분 제거
                timeResponse = `오늘은 ${dateOnly} ${dayOfWeek}입니다.`;
            } else if (userMessage.includes('시간') || userMessage.includes('몇시') || userMessage.includes('지금')) {
                timeResponse = `현재 시간은 ${koreanTime.formatted}입니다.`;
            } else if (userMessage.includes('요일')) {
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
1. 가능한 한 상세하고 도움이 되는 답변을 제공하세요.
2. 구체적인 예시와 설명을 포함하세요.
3. 질문에 대해 단계별로 설명하거나 여러 관점에서 답변하세요.
4. 추가적인 유용한 정보나 팁을 포함하세요.
5. 답변 길이는 1000-1500자 정도로 충분히 작성하세요.`,
                    messages: [{
                        role: "user",
                        content: userMessage
                    }],
                    max_tokens: 2000  // 토큰 수 늘림: 800 → 2000 (더 상세한 답변)
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
            else if (userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) {
                const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                const now = new Date();
                const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
                const dayOfWeek = dayNames[koreaDate.getDay()];
                responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            // 간단한 인사 응답
            else if (userMessage.includes('안녕') || userMessage.includes('hi') || userMessage.includes('hello')) {
                responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
            }
            // 일반적인 질문에 대한 기본 안내
            else {
                responseText = `현재 AI 서비스가 일시적으로 불안정합니다. 간단한 질문이나 뉴스/쇼핑 검색은 가능합니다. (현재 시간: ${koreanTime.formatted})`;
            }
        }
        console.log(`📝 응답 내용 일부: ${responseText.substring(0, 100)}...`);
        
        // 카카오 스킬 응답 스마트 분할 처리
        const maxLength = 950;  // 카카오톡 호환성을 위해 950자로 제한
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
            // 긴 응답을 자연스럽게 분할
            const sentences = responseText.split(/[.!?]\s+/);
            let firstPart = '';
            let secondPart = '';
            let charCount = 0;
            let splitIndex = 0;
            
            // 문장 단위로 나누어 적절한 분할점 찾기
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i] + (i < sentences.length - 1 ? '. ' : '');
                if (charCount + sentence.length < maxLength - 50) {
                    charCount += sentence.length;
                    splitIndex = i + 1;
                } else {
                    break;
                }
            }
            
            if (splitIndex === 0) {
                // 문장이 너무 길면 강제로 나누기
                firstPart = responseText.substring(0, maxLength - 50) + '\n\n...(계속)';
                secondPart = '(이어서)\n\n' + responseText.substring(maxLength - 50);
            } else {
                firstPart = sentences.slice(0, splitIndex).join('. ') + '\n\n...(계속)';
                secondPart = '(이어서)\n\n' + sentences.slice(splitIndex).join('. ');
            }
            
            // 두 번째 부분도 950자를 초과하면 추가로 자르기
            if (secondPart.length > maxLength) {
                secondPart = secondPart.substring(0, maxLength - 50) + '\n\n...(더 자세한 내용은 구체적으로 물어보세요)';
            }
            
            console.log(`📝 스마트 분할: ${responseText.length}자 → ${firstPart.length}자 + ${secondPart.length}자`);
            
            // 두 번째 부분을 임시 저장
            pendingMessages.set(userId, secondPart);
            console.log(`💾 나머지 내용 저장: ${secondPart.length}자`);
            
            // 첫 번째 부분만 전송
            kakaoResponse = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: firstPart + '\n\n💬 "계속"이라고 말씀하시면 나머지 내용을 보여드릴게요!'
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
        const isTimeQuestion = timeQuestionPatterns.some(pattern => pattern.test(userMessage));
        
        if (isTimeQuestion) {
            console.log('🕐 시간/날짜 질문 감지됨 - 직접 처리');
            
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const now = new Date();
            const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
            const dayOfWeek = dayNames[koreaDate.getDay()];
            
            let timeResponse = '';
            if (userMessage.includes('날짜') || userMessage.includes('며칠') || userMessage.includes('몇일') || userMessage.includes('몇월') || userMessage.includes('오늘')) {
                const dateOnly = koreanTime.formatted.replace(/\s\d{2}:\d{2}:\d{2}/, ''); // 시간 부분 제거
                timeResponse = `오늘은 ${dateOnly} ${dayOfWeek}입니다.`;
            } else if (userMessage.includes('시간') || userMessage.includes('몇시') || userMessage.includes('지금')) {
                timeResponse = `현재 시간은 ${koreanTime.formatted}입니다.`;
            } else if (userMessage.includes('요일')) {
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
1. 가능한 한 상세하고 도움이 되는 답변을 제공하세요.
2. 구체적인 예시와 설명을 포함하세요.
3. 질문에 대해 단계별로 설명하거나 여러 관점에서 답변하세요.
4. 추가적인 유용한 정보나 팁을 포함하세요.
5. 답변 길이는 1000-1500자 정도로 충분히 작성하세요.`,
                    messages: [{
                        role: "user",
                        content: userMessage
                    }],
                    max_tokens: 2000  // 토큰 수 늘림: 800 → 2000 (더 상세한 답변)
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
            else if (userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) {
                const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                const now = new Date();
                const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
                const dayOfWeek = dayNames[koreaDate.getDay()];
                responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            // 간단한 인사 응답
            else if (userMessage.includes('안녕') || userMessage.includes('hi') || userMessage.includes('hello')) {
                responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
            }
            // 일반적인 질문에 대한 기본 안내
            else {
                responseText = `현재 AI 서비스가 일시적으로 불안정합니다. 간단한 질문이나 뉴스/쇼핑 검색은 가능합니다. (현재 시간: ${koreanTime.formatted})`;
            }
        }
        console.log(`📝 응답 미리보기: ${responseText.substring(0, 100)}...`);
        
        // 카카오 스킬 응답 길이 제한 처리 (950자로 제한)
        const maxLength = 950;
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
            // 긴 응답을 자연스럽게 분할 (메인 웹훅과 동일한 로직)
            const sentences = responseText.split(/[.!?]\s+/);
            let firstPart = '';
            let charCount = 0;
            let splitIndex = 0;
            
            // 문장 단위로 나누어 적절한 분할점 찾기
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i] + (i < sentences.length - 1 ? '. ' : '');
                if (charCount + sentence.length < maxLength - 50) {
                    charCount += sentence.length;
                    splitIndex = i + 1;
                } else {
                    break;
                }
            }
            
            if (splitIndex === 0) {
                // 문장이 너무 길면 강제로 나누기
                firstPart = responseText.substring(0, maxLength - 50) + '\n\n...(답변이 길어 일부만 표시됩니다)';
            } else {
                firstPart = sentences.slice(0, splitIndex).join('. ') + '\n\n...(답변이 길어 일부만 표시됩니다)';
            }
            
            console.log(`⚠️ 응답이 길어서 ${maxLength}자로 제한: ${responseText.length}자 → ${firstPart.length}자`);
            
            kakaoResponse = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: firstPart
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