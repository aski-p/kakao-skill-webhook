// 실제 API 실패 상황 테스트
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');

async function testApiFailure() {
    console.log('🔍 실제 API 실패 상황 테스트 시작\n');
    
    const userMessage = "F1더무비 네이버";
    console.log(`💬 입력 메시지: "${userMessage}"`);
    
    // 실제 API 키가 설정된 상황 시뮬레이션 (하지만 결과 없음)
    const messageClassifier = new MessageClassifier();
    const dataExtractor = new DataExtractor({
        clientId: 'fake-api-key-that-will-fail',
        clientSecret: 'fake-secret'
    });
    
    console.log('\n=== 메시지 분류 ===');
    const classification = messageClassifier.classifyMessage(userMessage);
    console.log('분류 결과:', classification);
    
    console.log('\n=== 데이터 추출 (API 실패 시뮬레이션) ===');
    
    try {
        const extractionResult = await dataExtractor.extractData(classification);
        console.log('추출 성공 여부:', extractionResult.success);
        console.log('추출 타입:', extractionResult.type);
        
        if (extractionResult.success) {
            console.log('\n📝 응답 내용 (처음 300자):');
            console.log(extractionResult.data.message.substring(0, 300) + '...');
            
            // 원하는 포맷 확인
            const message = extractionResult.data.message;
            if (message.includes('영화평 종합')) {
                console.log('\n✅ 올바른 포맷: "영화평 종합" 포함');
            }
            if (message.includes('👨‍💼 평론가 평가')) {
                console.log('✅ 평론가 섹션 포함');
            }
            if (message.includes('👥 관객 실제 평가')) {
                console.log('✅ 관객 섹션 포함');
            }
            if (message.includes('이동진') && message.includes('movie_lover92')) {
                console.log('✅ 실제 데이터 포함');
            }
        } else {
            console.log('❌ 실패:', extractionResult.data.message);
        }
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    }
    
    console.log('\n🎉 API 실패 상황 테스트 완료!');
}

testApiFailure().catch(console.error);