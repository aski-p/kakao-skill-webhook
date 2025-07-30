// 스케줄러 테스트 스크립트
const movieScheduler = require('./scheduler/movie-update-scheduler');

async function testScheduler() {
    console.log('🧪 영화 데이터 업데이트 스케줄러 테스트 시작\n');
    
    try {
        // 현재 상태 확인
        console.log('[INFO] 현재 스케줄러 상태:');
        const status = movieScheduler.getStatus();
        console.log(JSON.stringify(status, null, 2));
        
        // 수동 실행 테스트
        console.log('\n🚀 수동 업데이트 실행 테스트...');
        const result = await movieScheduler.runNow();
        
        console.log('\n[INFO] 테스트 결과:');
        console.log('='.repeat(50));
        console.log(`[SUCCESS] 성공: ${result.success ? '예' : '아니오'}`);
        
        if (result.success) {
            console.log(`[MOVIE] KOFIC 영화 추가: ${result.koficMoviesAdded || 0}개`);
            console.log(`[SEARCH] 네이버 영화 추가: ${result.naverMoviesAdded || 0}개`);
            console.log(`[INBOX] 총 새 영화: ${result.totalNewMovies || 0}개`);
            console.log(`[CLOCK] 실행 시간: ${result.executedAt}`);
        } else {
            console.log(`[ERROR] 오류: ${result.error || result.message}`);
        }
        
        console.log('='.repeat(50));
        console.log('[PARTY] 테스트 완료!');
        
    } catch (error) {
        console.error('[ERROR] 테스트 중 오류 발생:', error.message);
    }
}

// 테스트 실행
if (require.main === module) {
    testScheduler();
}

module.exports = testScheduler;