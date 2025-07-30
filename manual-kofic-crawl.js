// 영화진흥위원회 크롤링 수동 실행 스크립트
const axios = require('axios');

async function triggerKoficCrawling() {
    console.log('[MOVIE] 영화진흥위원회 크롤링 수동 실행 시작\n');
    
    try {
        // Railway 배포된 서버의 크롤링 API 호출
        console.log('[SATELLITE] 크롤링 API 호출 중...');
        
        const response = await axios.post('https://kakao-skill-webhook-production.up.railway.app/api/crawl-kofic-movies', {}, {
            timeout: 300000, // 5분 타임아웃 (크롤링은 시간이 오래 걸림)
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[SUCCESS] 크롤링 완료!');
        console.log('[INFO] 결과:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log(`\n[PARTY] 성공적으로 완료됨!`);
            console.log(`[INFO] 총 처리된 영화: ${response.data.data.totalProcessed}개`);
            console.log(`[SUCCESS] 새로 추가된 영화: ${response.data.data.newMoviesAdded}개`);
            console.log(`[LOADING] 기존 영화: ${response.data.data.existingMovies}개`);
            console.log(`[WARN] 오류 발생: ${response.data.data.errors}건`);
        } else {
            console.log('[ERROR] 크롤링 실패:', response.data.message);
        }
        
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('[CLOCK] 타임아웃 발생 - 백그라운드에서 크롤링이 계속 진행 중일 수 있습니다.');
            console.log('[TIP] Railway 로그를 확인하여 진행 상황을 모니터링하세요.');
        } else if (error.response) {
            console.error('[ERROR] 서버 응답 오류:', error.response.status);
            console.error('📄 응답 내용:', error.response.data);
        } else {
            console.error('[ERROR] 네트워크 오류:', error.message);
        }
    }
}

// 통합 크롤링도 함께 실행
async function triggerIntegratedCrawling() {
    console.log('\n🚀 통합 크롤링 (영화진흥위원회 + 네이버) 실행\n');
    
    try {
        console.log('[SATELLITE] 통합 크롤링 API 호출 중...');
        
        const response = await axios.post('https://kakao-skill-webhook-production.up.railway.app/api/crawl-movies', {}, {
            timeout: 600000, // 10분 타임아웃
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[SUCCESS] 통합 크롤링 완료!');
        console.log('[INFO] 결과:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('[CLOCK] 타임아웃 발생 - 백그라운드에서 통합 크롤링이 계속 진행 중일 수 있습니다.');
        } else {
            console.error('[ERROR] 통합 크롤링 오류:', error.message);
        }
    }
}

// API 상태 확인
async function checkKoficStatus() {
    console.log('[SEARCH] 영화진흥위원회 API 상태 확인\n');
    
    try {
        const response = await axios.get('https://kakao-skill-webhook-production.up.railway.app/api/kofic-status');
        console.log('[INFO] API 상태:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('[ERROR] 상태 확인 오류:', error.message);
    }
}

// 실행 순서
async function main() {
    console.log('[MOVIE] 영화진흥위원회 크롤링 시스템 실행\n');
    console.log('='.repeat(60));
    
    // 1. API 상태 확인
    await checkKoficStatus();
    
    console.log('\n' + '='.repeat(60));
    
    // 2. 영화진흥위원회 전용 크롤링 실행
    await triggerKoficCrawling();
    
    console.log('\n' + '='.repeat(60));
    
    // 3. 통합 크롤링 (선택사항)
    console.log('\n[TIP] 통합 크롤링도 실행하시겠습니까? (영화진흥위원회 + 네이버)');
    console.log('ℹ️  통합 크롤링은 시간이 더 오래 걸릴 수 있습니다.');
    
    // 자동으로 통합 크롤링도 실행
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    await triggerIntegratedCrawling();
    
    console.log('\n[PARTY] 모든 크롤링 작업 완료!');
    console.log('[TIP] Railway 대시보드에서 로그를 확인하여 진행 상황을 모니터링하세요.');
}

// 스크립트 실행
main().catch(console.error);