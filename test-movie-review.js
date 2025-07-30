// 영화평 기능 테스트 스크립트
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');

async function testMovieReview() {
    console.log('[MOVIE] 영화평 기능 테스트 시작\n');
    
    // 테스트용 네이버 설정 (테스트 모드)
    const naverConfig = {
        clientId: 'test',
        clientSecret: 'test'
    };
    
    const classifier = new MessageClassifier();
    const extractor = new DataExtractor(naverConfig);
    
    // 테스트 케이스들
    const testCases = [
        "탑건 매버릭 영화평",
        "베놈2 평점 어때",
        "아바타 아바타2 평점",
        "F1 더무비 영화평",
        "러쉬 영화 평점",
        "기생충 영화 평점",
        "올드보이 영화평"
    ];
    
    for (const testMessage of testCases) {
        console.log(`[MEMO] 테스트: "${testMessage}"`);
        console.log('---'.repeat(20));
        
        try {
            // 1단계: 메시지 분류
            const classification = classifier.classifyMessage(testMessage);
            console.log(`[SUCCESS] 분류 결과: ${classification.category}`);
            console.log(`[INFO] 점수: ${classification.score}, 우선순위: ${classification.priority}`);
            console.log(`[FORM] 추출된 데이터:`, classification.data);
            
            // 2단계: 데이터 추출 시도 (간단한 테스트)
            if (classification.category === 'MOVIE_REVIEW') {
                console.log(`[MOVIE] 영화 제목: "${classification.data.title}"`);
                console.log(`[TARGET] 리뷰 타입: ${classification.data.reviewType}`);
                
                // 실제 API 호출은 스킵하고 성공 메시지만 표시
                console.log(`[SUCCESS] 영화평 추출 시스템 준비 완료!`);
            } else {
                console.log(`[WARN] 영화평이 아닌 다른 카테고리로 분류됨`);
            }
            
        } catch (error) {
            console.log(`[ERROR] 테스트 실패:`, error.message);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('[PARTY] 영화평 기능 테스트 완료!');
}

// 테스트 실행
testMovieReview().catch(console.error);