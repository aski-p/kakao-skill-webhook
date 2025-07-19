const express = require('express');
const axios = require('axios');
const app = express();

// 네이버 검색 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';

app.use(express.json());

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
            timeout: 5000
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

// 헬스체크 엔드포인트
app.get('/', (req, res) => {
    console.log('헬스체크 요청');
    res.send('OK');
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
        <p><strong>기능:</strong> 네이버 검색으로 실시간 뉴스 제공 (예: "오늘 뉴스", "최신 뉴스")</p>
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
    console.log('요청 데이터:', JSON.stringify(req.body, null, 2));
    
    try {
        const userMessage = req.body.userRequest?.utterance;
        console.log(`💬 사용자 메시지: '${userMessage}'`);
        
        if (!userMessage) {
            throw new Error('메시지가 없습니다');
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
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
        
        // Claude API 호출
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-haiku-20240307",
                messages: [{
                    role: "user",
                    content: enhancedMessage
                }],
                max_tokens: 4000  // 10배 증가: 400 → 4000
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: 15000  // 4.5초 → 15초로 증가 (긴 응답 대기)
            }
        );
        
        const responseText = claudeResponse.data.content[0].text;
        console.log(`✅ Claude 응답 받음 (${responseText.length}자)`);
        
        // 카카오 응답
        res.json({
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: responseText
                    }
                }]
            }
        });
        
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
        
        res.json({
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: errorMsg
                    }
                }]
            }
        });
    }
});

// 루트 웹훅 (POST /)
app.post('/', async (req, res) => {
    console.log('루트 웹훅 호출');
    return app.post('/kakao-skill-webhook')(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
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