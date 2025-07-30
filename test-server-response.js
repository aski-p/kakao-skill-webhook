// 서버 응답 실제 테스트 (카카오 스킬 웹훅 형식)
const axios = require('axios');

async function testServerResponse() {
    console.log('🌐 서버 응답 테스트 시작\n');
    
    const testCases = [
        "F1 더무비 영화평",
        "탑건 매버릭 평점",
        "기생충 영화평"
    ];
    
    for (const message of testCases) {
        console.log(`[MEMO] 테스트: "${message}"`);
        console.log('='.repeat(60));
        
        try {
            // 카카오 스킬 웹훅 형식으로 요청
            const requestBody = {
                userRequest: {
                    utterance: message,
                    user: {
                        id: "test-user"
                    }
                }
            };
            
            console.log('[SATELLITE] 로컬 서버에 요청 전송...');
            
            const response = await axios.post('http://localhost:3000/kakao-skill-webhook', requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            if (response.data && response.data.template && response.data.template.outputs) {
                const responseText = response.data.template.outputs[0].simpleText.text;
                console.log('[SUCCESS] 서버 응답 성공!');
                console.log(`[RULER] 응답 길이: ${responseText.length}자`);
                console.log('\n[MEMO] 응답 내용:');
                console.log(responseText);
            } else {
                console.log('[ERROR] 서버 응답 형식 오류:', response.data);
            }
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('[WARN] 서버가 실행되지 않음. 먼저 서버를 시작하세요:');
                console.log('   npm start 또는 node index.js');
            } else {
                console.log('[ERROR] 요청 실패:', error.message);
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('[PARTY] 서버 응답 테스트 완료!');
}

// 테스트 실행
testServerResponse().catch(console.error);