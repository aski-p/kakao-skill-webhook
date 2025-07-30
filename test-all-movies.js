// 모든 영화평 요청 테스트
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');

async function testAllMovieRequests() {
    console.log('[MOVIE] 모든 영화평 요청 테스트 시작\n');
    
    const messageClassifier = new MessageClassifier();
    const dataExtractor = new DataExtractor({
        clientId: 'test',
        clientSecret: 'test'
    });
    
    // 다양한 영화평 요청 테스트
    const testCases = [
        "F1더무비 네이버",
        "탑건 매버릭 평점",
        "기생충 영화평",
        "아바타2 영화 평점",
        "베놈2 평점 어때",
        "오징어게임 영화 리뷰",
        "인터스텔라 별점",
        "어벤져스 평가"
    ];
    
    for (const userMessage of testCases) {
        console.log(`[MEMO] 테스트: "${userMessage}"`);
        console.log('='.repeat(60));
        
        try {
            // 정규식 패턴 체크 (개선된 패턴)
            const isMovieRequest = /영화.*평점|평점.*영화|영화평|영화.*평가|평가.*영화|영화.*리뷰|리뷰.*영화|영화.*별점|별점.*영화|.*영화.*어때|.*평점.*어때|.*리뷰.*어때|.*별점.*어때|F1|더무비|평가|평점|별점|리뷰/.test(userMessage);
            console.log(`[SEARCH] 영화평 패턴 매칭: ${isMovieRequest}`);
            
            if (isMovieRequest) {
                // 새로운 시스템으로 처리
                const classification = messageClassifier.classifyMessage(userMessage);
                console.log(`[INFO] 분류: ${classification.category}`);
                console.log(`[MOVIE] 영화 제목: "${classification.data.title}"`);
                
                // MOVIE_REVIEW로 분류되지 않은 경우 강제 처리
                if (classification.category !== 'MOVIE_REVIEW') {
                    console.log('[LOADING] 강제 영화평 분류 적용');
                    classification.category = 'MOVIE_REVIEW';
                    classification.data = {
                        title: userMessage.replace(/\b(영화평|평점|평가|리뷰|별점|어때|영화|네이버)\b/g, '').trim(),
                        reviewType: 'general'
                    };
                }
                
                const extractionResult = await dataExtractor.extractData(classification);
                
                if (extractionResult.success) {
                    console.log('[SUCCESS] 성공 - 종합 영화평 포맷 생성');
                    
                    // 응답 형식 검증
                    const message = extractionResult.data.message;
                    if (message.includes('영화평 종합')) {
                        console.log('[SUCCESS] 올바른 포맷: "영화평 종합"');
                    }
                    if (message.includes('[MAN]‍💼 평론가 평가')) {
                        console.log('[SUCCESS] 평론가 섹션 포함');
                    }
                    if (message.includes('[BUSTSINSILHOUETTE] 관객 실제 평가')) {
                        console.log('[SUCCESS] 관객 섹션 포함');
                    }
                    
                    console.log('\n[MEMO] 응답 미리보기 (처음 150자):');
                    console.log(message.substring(0, 150) + '...');
                } else {
                    console.log('[ERROR] 실패:', extractionResult.data.message);
                }
            } else {
                console.log('[WARN] 영화평 패턴에 매칭되지 않음');
            }
            
        } catch (error) {
            console.error('[ERROR] 테스트 실패:', error.message);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('[PARTY] 모든 영화평 요청 테스트 완료!');
}

testAllMovieRequests().catch(console.error);