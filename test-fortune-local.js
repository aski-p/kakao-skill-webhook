const express = require('express');
const axios = require('axios');

// Claude API 키 확인
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
console.log('Claude API Key:', CLAUDE_API_KEY ? '설정됨' : '❌ 미설정');

// 운세 테스트
async function testFortuneQuery() {
    console.log('🔮 운세 질문 테스트 시작');
    
    const testMessage = "오늘 내 운세는?";
    console.log(`테스트 메시지: "${testMessage}"`);
    
    if (!CLAUDE_API_KEY) {
        console.error('❌ Claude API 키가 설정되지 않음');
        return;
    }

    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20240620", 
            max_tokens: 400,
            messages: [
                {
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

질문: ${testMessage}`
                }
            ],
            temperature: 1.0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            timeout: 15000
        });

        const aiResponse = response.data.content[0].text;
        console.log('✅ Claude AI 응답 성공!');
        console.log('응답:', aiResponse);
        console.log('응답 길이:', aiResponse.length, '자');
        
    } catch (error) {
        console.error('❌ Claude AI 호출 실패:', error.message);
        if (error.response) {
            console.error('응답 상태:', error.response.status);
            console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// 카카오 웹훅 시뮬레이션
async function simulateKakaoWebhook() {
    console.log('\n📱 카카오 웹훅 시뮬레이션');
    
    const mockRequest = {
        userRequest: {
            utterance: "오늘 내 운세는?",
            user: {
                id: "test-user"
            }
        }
    };
    
    console.log('요청 본문:', JSON.stringify(mockRequest, null, 2));
    
    const userMessage = mockRequest.userRequest.utterance;
    const userId = mockRequest.userRequest.user.id;
    
    console.log(`사용자 메시지: "${userMessage}"`);
    console.log(`사용자 ID: ${userId}`);
    
    // 날씨 질문 체크
    function isWeatherQuery(message) {
        const weatherKeywords = ['날씨', '기온', '온도', '비', '눈', '맑음', '흐림', '구름', '습도', '미세먼지', '날씨어때', '오늘날씨', '내일날씨'];
        return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }
    
    const isWeather = isWeatherQuery(userMessage);
    console.log(`날씨 질문 여부: ${isWeather}`);
    
    if (!isWeather) {
        console.log('→ Claude AI로 처리');
        await testFortuneQuery();
    }
}

// 실행
testFortuneQuery().then(() => {
    simulateKakaoWebhook();
});