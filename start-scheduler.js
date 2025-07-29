// 영화 데이터 자동 업데이트 스케줄러 시작 스크립트
const movieScheduler = require('./scheduler/movie-update-scheduler');

console.log('🎬 영화 데이터 자동 업데이트 시스템 시작');
console.log('='.repeat(60));
console.log('📅 스케줄: 매일 오전 12시 (한국 시간)');
console.log('🎯 대상: KOFIC API + 네이버 API 영화 정보');
console.log('🗄️ 데이터베이스: Supabase');
console.log('='.repeat(60));

// 스케줄러 시작
movieScheduler.start();

// 현재 상태 출력
const status = movieScheduler.getStatus();
console.log('\n📊 스케줄러 상태:');
console.log(`  - 실행 중: ${status.isRunning ? '✅' : '⏸️'}`);
console.log(`  - 일일 작업: ${status.dailyJobRunning ? '🟢 활성' : '🔴 비활성'}`);
console.log(`  - 다음 실행: ${status.nextExecutionTime}`);

// 수동 실행 옵션 안내
console.log('\n🔧 수동 실행 방법:');
console.log('  - 즉시 실행: node -e "require(\'./scheduler/movie-update-scheduler\').runNow()"');
console.log('  - 상태 확인: node -e "console.log(require(\'./scheduler/movie-update-scheduler\').getStatus())"');

// 프로세스 종료 처리
process.on('SIGINT', () => {
    console.log('\n🛑 스케줄러 종료 중...');
    movieScheduler.stop();
    console.log('✅ 스케줄러가 안전하게 종료되었습니다.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 스케줄러 종료 중...');
    movieScheduler.stop();
    console.log('✅ 스케줄러가 안전하게 종료되었습니다.');
    process.exit(0);
});

// 프로세스 유지
console.log('\n✅ 스케줄러가 실행 중입니다. 종료하려면 Ctrl+C를 누르세요.');
console.log('📝 로그는 실시간으로 출력됩니다.\n');

// 시작 상태 확인 (5초 후)
setTimeout(() => {
    console.log('⏰ 스케줄러 상태 확인...');
    const currentStatus = movieScheduler.getStatus();
    if (currentStatus.dailyJobRunning) {
        console.log('✅ 스케줄러가 정상적으로 실행 중입니다.');
        console.log(`🕐 다음 실행 시간: 매일 오전 12시 (현재: ${new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})})`);
    } else {
        console.log('❌ 스케줄러 설정에 문제가 있습니다.');
    }
}, 5000);