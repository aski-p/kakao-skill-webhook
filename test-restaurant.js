// 맛집 검색 테스트 스크립트
const axios = require('axios');

async function testRestaurantSearch() {
    const testCases = [
        "구의 맛집",
        "강남 맛집", 
        "홍대 맛집",
        "구의동 한식",
        "서울 피자"
    ];

    console.log('🍽️ 맛집 검색 테스트 시작...\n');

    for (const query of testCases) {
        console.log(`[SEARCH] 테스트: "${query}"`);
        
        try {
            const response = await axios.post('http://localhost:3000/webhook', {
                intent: {
                    name: "블록 이름"
                },
                userRequest: {
                    utterance: query,
                    user: {
                        id: "test_user"
                    }
                },
                action: {
                    name: "응답 처리",
                    clientExtra: {},
                    params: {},
                    id: "test_action",
                    detailParams: {}
                }
            });

            if (response.data && response.data.template && response.data.template.outputs) {
                const message = response.data.template.outputs[0].simpleText.text;
                console.log(`[SUCCESS] 응답: ${message.substring(0, 200)}...\n`);
            } else {
                console.log(`[ERROR] 응답 구조 오류\n`);
            }
        } catch (error) {
            console.log(`[ERROR] 오류: ${error.message}\n`);
        }
        
        // 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('[PARTY] 맛집 검색 테스트 완료!');
}

// 테스트 실행
testRestaurantSearch().catch(console.error);