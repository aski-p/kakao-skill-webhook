// 전체 시스템 통합 테스트 (분류 → 추출 → 응답)
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');

async function testFullSystem() {
    console.log('🎮 전체 시스템 통합 테스트 시작\n');
    
    const classifier = new MessageClassifier();
    const extractor = new DataExtractor({
        clientId: 'test',
        clientSecret: 'test'
    });
    
    // 테스트 케이스들
    const testCases = [
        "F1 더무비 영화평",
        "탑건 매버릭 평점",
        "기생충 영화 평점"
    ];
    
    for (const testMessage of testCases) {
        console.log(`📝 테스트: "${testMessage}"`);
        console.log('='.repeat(60));
        
        try {
            // 1단계: 메시지 분류
            const classification = classifier.classifyMessage(testMessage);
            console.log(`✅ 분류: ${classification.category} (점수: ${classification.score})`);
            console.log(`📋 추출 데이터:`, classification.data);
            
            // 2단계: 데이터 추출
            if (classification.category === 'MOVIE_REVIEW') {
                const result = await extractor.extractData(classification);
                
                if (result.success) {
                    console.log(`\n✅ 추출 성공! 응답 길이: ${result.data.message.length}자`);
                    console.log('\n📝 실제 응답:');
                    console.log(result.data.message);
                } else {
                    console.log(`❌ 추출 실패:`, result.data.message);
                }
            } else {
                console.log(`⚠️ 영화평이 아닌 다른 카테고리: ${classification.category}`);
            }
            
        } catch (error) {
            console.error(`❌ 테스트 실패:`, error.message);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('🎉 전체 시스템 통합 테스트 완료!');
}

// 테스트 실행
testFullSystem().catch(console.error);