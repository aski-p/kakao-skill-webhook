const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 헬스체크 엔드포인트
app.get('/', (req, res) => {
    console.log('헬스체크 요청');
    res.send('OK');
});

// 상태 페이지
app.get('/status', (req, res) => {
    const hasApiKey = !!process.env.CLAUDE_API_KEY;
    const status = hasApiKey ? '✅ Claude API 설정됨' : '❌ Claude API 미설정';
    
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>Claude API:</strong> ${status}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook</p>
        <p><strong>루트 웹훅:</strong> https://kakao-skill-webhook-production.up.railway.app</p>
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
        
        // Claude API 키 확인
        if (!process.env.CLAUDE_API_KEY) {
            console.log('⚠️ Claude API 키가 설정되지 않았습니다.');
            throw new Error('API 키가 설정되지 않았습니다');
        }
        
        console.log('✅ Claude API 호출 시작...');
        
        // Claude API 호출
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-haiku-20240307",
                messages: [{
                    role: "user",
                    content: userMessage
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
            errorMsg = `안녕하세요! 서버가 정상 작동 중입니다.\n받은 메시지: '${req.body.userRequest?.utterance || '메시지 없음'}'`;
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
    console.log(`🚀 Node.js 서버 시작: 포트 ${PORT}`);
    console.log(`💡 상태 페이지: http://0.0.0.0:${PORT}/status`);
    console.log(`🔗 웹훅 URL: http://0.0.0.0:${PORT}/kakao-skill-webhook`);
    console.log(`🔑 Claude API 키 설정: ${process.env.CLAUDE_API_KEY ? '✅' : '❌'}`);
});