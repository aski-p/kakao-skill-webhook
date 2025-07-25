// 전체 흐름 디버깅 - 실제 서버와 동일한 로직
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');

async function debugFullFlow() {
    console.log('🔍 전체 흐름 디버깅 시작\n');
    
    const userMessage = "F1더무비 네이버";
    console.log(`💬 입력 메시지: "${userMessage}"`);
    
    // 1단계: 메시지 분류
    console.log('\n=== 1단계: 메시지 분류 ===');
    const messageClassifier = new MessageClassifier();
    const classification = messageClassifier.classifyMessage(userMessage);
    console.log('분류 결과:', classification);
    
    // 2단계: 데이터 추출
    console.log('\n=== 2단계: 데이터 추출 ===');
    const dataExtractor = new DataExtractor({
        clientId: 'test',
        clientSecret: 'test'
    });
    
    const extractionResult = await dataExtractor.extractData(classification);
    console.log('추출 성공 여부:', extractionResult.success);
    console.log('추출 타입:', extractionResult.type);
    
    // 3단계: 최종 응답
    console.log('\n=== 3단계: 최종 응답 ===');
    if (extractionResult.success) {
        console.log('✅ 성공 - 응답 길이:', extractionResult.data.message.length);
        console.log('\n📝 응답 내용 (처음 200자):');
        console.log(extractionResult.data.message.substring(0, 200) + '...');
        
        // 응답이 원하는 포맷인지 확인
        const message = extractionResult.data.message;
        if (message.includes('영화평 종합')) {
            console.log('\n✅ 원하는 포맷: "영화평 종합" 포함');
        } else if (message.includes('평점/평론 모음')) {
            console.log('\n❌ 이전 포맷: "평점/평론 모음" 포함');
        }
        
        if (message.includes('👨‍💼 평론가 평가')) {
            console.log('✅ 평론가 섹션 올바름');
        }
        
        if (message.includes('👥 관객 실제 평가')) {
            console.log('✅ 관객 섹션 올바름');
        }
        
    } else {
        console.log('❌ 실패:', extractionResult.data.message);
    }
}

debugFullFlow().catch(console.error);