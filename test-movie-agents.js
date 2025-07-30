// 영화 서브에이전트 시스템 테스트

const MovieAgentCoordinator = require('./agents/movie-agent-coordinator');

async function testMovieAgents() {
    console.log('[MOVIE] 영화 서브에이전트 시스템 테스트 시작\n');
    
    const coordinator = new MovieAgentCoordinator();
    
    // 테스트할 영화들
    const testMovies = [
        '야당',
        '야당: 익스텐디드 컷', 
        'F1 더무비',
        'F1 더 무비',
        '기생충',
        '존재하지않는영화123456'
    ];
    
    for (const movieTitle of testMovies) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`[DRAMA] 테스트 영화: "${movieTitle}"`);
        console.log(`${'='.repeat(50)}`);
        
        try {
            const result = await coordinator.getMovieReview(movieTitle);
            
            if (result.success) {
                console.log('[SUCCESS] 검색 성공!');
                console.log('[MEMO] 응답 메시지:');
                console.log(result.data.message);
                
                if (result.metadata) {
                    console.log('\n[INFO] 메타데이터:');
                    console.log(`• 처리 시간: ${result.metadata.processingTime}ms`);
                    console.log(`• 검색 방법: ${result.metadata.searchMethod}`);
                    console.log(`• 데이터 소스: ${result.metadata.dataSource}`);
                }
            } else {
                console.log('[ERROR] 검색 실패');
                console.log('[MEMO] 응답 메시지:');
                console.log(result.data.message);
            }
        } catch (error) {
            console.error(`[ERROR] 테스트 오류: ${error.message}`);
        }
        
        // 테스트 간 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 전체 통계 출력
    console.log(`\n${'='.repeat(50)}`);
    console.log('[INFO] 전체 시스템 통계');
    console.log(`${'='.repeat(50)}`);
    
    const stats = coordinator.getFullStats();
    console.log('[DRAMA] 코디네이터 통계:');
    console.log(`• 총 요청: ${stats.coordinator.totalRequests}`);
    console.log(`• 성공률: ${stats.coordinator.successRate}`);
    console.log(`• 평균 처리 시간: ${stats.coordinator.averageProcessingTime}`);
    console.log(`• 오류 수: ${stats.coordinator.errorCount}`);
    
    console.log('\n[SEARCH] 검색 에이전트 통계:');
    console.log(`• 총 검색: ${stats.searchAgent.totalSearches}`);
    console.log(`• 성공률: ${stats.searchAgent.successRate}`);
    console.log(`• 평균 응답 시간: ${stats.searchAgent.averageResponseTime}`);
    
    console.log('\n[MEMO] 포맷터 통계:');
    console.log(`• 총 포맷팅: ${stats.reviewFormatter.totalFormats}`);
    console.log(`• 평균 처리 시간: ${stats.reviewFormatter.avgProcessingTime}`);
    
    // 건강 체크
    console.log(`\n${'='.repeat(50)}`);
    console.log('[HOSPITAL] 시스템 건강 체크');
    console.log(`${'='.repeat(50)}`);
    
    const health = await coordinator.healthCheck();
    console.log(JSON.stringify(health, null, 2));
    
    console.log('\n[PARTY] 영화 서브에이전트 시스템 테스트 완료!');
}

// 테스트 실행
if (require.main === module) {
    testMovieAgents().catch(console.error);
}

module.exports = testMovieAgents;