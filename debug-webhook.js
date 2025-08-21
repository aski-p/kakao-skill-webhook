// Railway 환경에서 디버깅을 위한 테스트 엔드포인트 추가
const express = require('express');
const app = express();
app.use(express.json());

// 디버깅용 엔드포인트
app.post('/debug-fortune', async (req, res) => {
    console.log('🔮 디버깅 엔드포인트 호출됨');
    
    const userMessage = "오늘 내 운세는?";
    const userId = "debug-user";
    
    console.log('환경변수 확인:');
    console.log('- CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '설정됨' : '❌ 없음');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- PORT:', process.env.PORT);
    
    // 날씨 질문 체크
    function isWeatherQuery(message) {
        const weatherKeywords = ['날씨', '기온', '온도', '비', '눈', '맑음', '흐림', '구름', '습도', '미세먼지', '날씨어때', '오늘날씨', '내일날씨'];
        return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }
    
    const isWeather = isWeatherQuery(userMessage);
    console.log(`날씨 질문 감지: ${isWeather}`);
    
    if (isWeather) {
        console.log('→ 날씨 처리 경로');
    } else {
        console.log('→ Claude AI 처리 경로');
        
        if (!process.env.CLAUDE_API_KEY) {
            console.log('❌ Claude API 키 없음 - 기본 응답');
            res.json({
                success: false,
                message: "Claude API 키가 설정되지 않음",
                debug: {
                    userMessage,
                    isWeather,
                    hasApiKey: false
                }
            });
            return;
        }
        
        try {
            // Claude AI 호출 테스트
            const axios = require('axios');
            
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-5-sonnet-20240620", 
                max_tokens: 400,
                messages: [{
                    role: "user",
                    content: `당신은 친근하고 간결한 대화를 나누는 AI 친구입니다. 

답변 가이드라인:
- 300자 내외의 간단명료한 답변을 제공하세요
- 핵심 정보만 포함하되 친근하게 답변하세요  
- 이모지를 적절히 사용하여 친근감을 더하세요
- 구체적이고 실용적인 답변을 해주세요
- 카카오톡 메시지에 적합한 길이로 답변하세요

특별 지침:
- 운세 질문을 받으면 재미있고 긍정적인 운세를 창의적으로 만들어 답변하세요
- 오늘의 행운 색상, 숫자, 방향 등도 포함하면 좋습니다
- 금전운, 애정운, 건강운, 학업운 등 구체적 운세도 재미있게 답변하세요

이전 대화: 

질문: ${userMessage}`
                }],
                temperature: 1.0
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 15000
            });

            const aiResponse = response.data.content[0].text;
            console.log('✅ Claude AI 응답 성공');
            console.log('응답 길이:', aiResponse.length);
            
            res.json({
                success: true,
                message: aiResponse,
                debug: {
                    userMessage,
                    isWeather,
                    hasApiKey: true,
                    responseLength: aiResponse.length
                }
            });
            
        } catch (error) {
            console.error('❌ Claude AI 호출 실패:', error.message);
            if (error.response) {
                console.error('응답 상태:', error.response.status);
                console.error('응답 데이터:', error.response.data);
            }
            
            res.json({
                success: false,
                message: `Claude AI 오류: ${error.message}`,
                debug: {
                    userMessage,
                    isWeather,
                    hasApiKey: true,
                    error: error.message,
                    status: error.response?.status
                }
            });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 디버깅 서버가 포트 ${PORT}에서 실행 중`);
});

module.exports = app;