const express = require('express');
const app = express();

app.use(express.json());

// 기본 헬스 체크
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 카카오 챗봇 최소 테스트 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> /kakao-skill-webhook</p>
    `);
});

// 최소한의 카카오 웹훅 - 어떤 메시지든 간단히 응답
app.post('/kakao-skill-webhook', (req, res) => {
    console.log('🔔 카카오 웹훅 요청 받음!');
    console.log('요청 본문:', JSON.stringify(req.body, null, 2));
    
    try {
        const userMessage = req.body.userRequest?.utterance || '메시지 없음';
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        // 현재 시간
        const now = new Date();
        const koreaTime = now.toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 간단한 응답 메시지
        let responseText = `안녕하세요! 메시지를 받았습니다.

📝 받은 메시지: "${userMessage}"
🕐 현재 시간: ${koreaTime}
✅ 서버가 정상 작동 중입니다.

이 메시지가 보인다면 웹훅이 정상적으로 작동하고 있습니다.`;

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
        
        console.log('📤 응답 전송:', JSON.stringify(response, null, 2));
        
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(response);
        
        console.log('✅ 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 웹훅 처리 오류:', error);
        
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: "오류가 발생했습니다. 서버 로그를 확인해주세요."
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
    console.log(`✅ 최소 테스트 서버가 포트 ${PORT}에서 실행 중입니다.`);
});