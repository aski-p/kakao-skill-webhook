// DataExtractor 실제 테스트
const DataExtractor = require('./config/data-extractor');

async function testDataExtractor() {
    console.log('[INFO] DataExtractor 실제 테스트 시작\n');
    
    const extractor = new DataExtractor({
        clientId: 'test',
        clientSecret: 'test'
    });
    
    try {
        // F1 더무비 테스트
        console.log('[MEMO] 테스트: "F1더무비 네이버"');
        console.log('='.repeat(60));
        
        const movieTitle = "F1더무비 네이버";
        
        // MOVIE_REVIEW 카테고리로 데이터 추출 요청 (올바른 형식)
        const classification = {
            category: 'MOVIE_REVIEW',
            data: {
                title: movieTitle,
                reviewType: 'general'
            }
        };
        
        const result = await extractor.extractData(classification);
        
        console.log('\n[INFO] DataExtractor 결과:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n[MEMO] 실제 메시지:');
        console.log(result.data.message);
        
    } catch (error) {
        console.error('[ERROR] 테스트 실패:', error.message);
        console.error(error.stack);
    }
    
    console.log('\n[PARTY] DataExtractor 테스트 완료!');
}

// 테스트 실행
testDataExtractor().catch(console.error);