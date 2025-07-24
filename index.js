const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
    res.send(`
        <h1>Kakao Skill Webhook Server</h1>
        <p>서버 상태: 정상 동작</p>
        <p>현재 시간: ${new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})}</p>
    `);
});

// Main webhook endpoint
app.post('/kakao-skill-webhook', async (req, res) => {
    console.log('🔔 카카오 웹훅 요청 받음!');
    
    try {
        const userMessage = req.body.userRequest?.utterance || '';
        console.log(`💬 사용자 메시지: '${userMessage}'`);
        
        // Simple response for now
        const responseText = `안녕하세요! 메시지를 받았습니다: "${userMessage}"`;
        
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
        console.log('✅ 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: "죄송합니다. 처리 중 오류가 발생했습니다."
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