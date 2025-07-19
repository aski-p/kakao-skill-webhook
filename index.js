const express = require('express');
const axios = require('axios');
const app = express();

// 뉴스 API 설정
const NEWS_API_KEY = process.env.NEWS_API_KEY; // newsapi.org에서 발급받은 키
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/top-headlines';

app.use(express.json());

// 뉴스 가져오기 함수
async function getLatestNews(query = '', country = 'kr') {
    try {
        if (!NEWS_API_KEY) {
            return null;
        }
        
        const params = {
            apiKey: NEWS_API_KEY,
            country: country,
            pageSize: 5
        };
        
        if (query) {
            params.q = query;
        }
        
        const response = await axios.get(NEWS_API_BASE_URL, {
            params: params,
            timeout: 3000
        });
        
        const articles = response.data.articles;
        if (!articles || articles.length === 0) {
            return null;
        }
        
        return articles.slice(0, 3).map(article => ({
            title: article.title,
            description: article.description,
            publishedAt: article.publishedAt,
            source: article.source.name
        }));
        
    } catch (error) {
        console.error('뉴스 API 오류:', error.message);
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
    const hasNewsApiKey = !!process.env.NEWS_API_KEY;
    const claudeStatus = hasClaudeApiKey ? '✅ Claude API 설정됨' : '❌ Claude API 미설정';
    const newsStatus = hasNewsApiKey ? '✅ News API 설정됨' : '❌ News API 미설정';
    const koreanTime = getKoreanDateTime();
    
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${koreanTime.formatted}</p>
        <p><strong>Claude API:</strong> ${claudeStatus}</p>
        <p><strong>News API:</strong> ${newsStatus}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook</p>
        <p><strong>루트 웹훅:</strong> https://kakao-skill-webhook-production.up.railway.app</p>
        <hr>
        <p><strong>기능:</strong> 뉴스 요청시 실시간 뉴스 제공 (예: "오늘 뉴스", "최신 뉴스")</p>
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
            
            const news = await getLatestNews();
            if (news && news.length > 0) {
                const newsText = `📰 ${koreanTime.formatted} 최신 뉴스\n\n` +
                    news.map((article, index) => 
                        `${index + 1}. ${article.title}\n${article.description || ''}\n📅 ${new Date(article.publishedAt).toLocaleString('ko-KR')}\n📺 ${article.source}\n`
                    ).join('\n');
                
                console.log('✅ 뉴스 데이터 제공 완료');
                
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
            enhancedMessage = `현재 한국 시간: ${koreanTime.formatted}\n사용자 질문: ${userMessage}`;
        }
        
        // 뉴스 관련 질문이면 최신 정보 안내
        if (isNewsRequest(userMessage)) {
            enhancedMessage = `현재 시간: ${koreanTime.formatted}\n사용자가 최신 뉴스를 요청했지만 실시간 뉴스 API가 사용 불가능합니다. 뉴스 API 연동이 필요하다고 안내해주세요.\n사용자 질문: ${userMessage}`;
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
                max_tokens: 400
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: 4500
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
    console.log(`📰 News API 키 설정: ${process.env.NEWS_API_KEY ? '✅' : '❌'}`);
    console.log(`📋 기능: 실시간 뉴스 제공, 한국 시간 인식`);
});