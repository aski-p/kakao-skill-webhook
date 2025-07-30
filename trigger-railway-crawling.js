// Railway에서 전체 크롤링 실행 스크립트
const axios = require('axios');

const RAILWAY_URL = 'https://kakao-skill-webhook-production.up.railway.app';

async function triggerFullCrawling() {
    console.log('🚀 Railway에서 전체 영화 데이터베이스 크롤링 시작\n');
    
    try {
        console.log('[INFO] 1단계: 현재 데이터베이스 상태 확인');
        const statusResponse = await axios.get(`${RAILWAY_URL}/api/crawling-status`, {
            timeout: 30000
        });
        
        if (statusResponse.data.success) {
            const data = statusResponse.data.data;
            console.log(`[INFO] 현재 영화 수: ${data.totalMovies}개`);
            console.log(`[FLASHCAMERA] 포스터: ${data.posterCount}개`);
            console.log(`[FAVORITE] 평점: ${data.ratingCount}개`);
            console.log(`[MSG] 리뷰: ${data.reviewCount}개`);
            
            console.log('\n[INFO] 데이터 소스 분포:');
            Object.entries(data.sourceDistribution).forEach(([source, count]) => {
                const sourceLabel = {
                    'kofic_api': '영화진흥위원회',
                    'naver_api': '네이버 API',
                    'hardcoded_db': '로컬 DB',
                    'unknown': '미상'
                }[source] || source;
                console.log(`  - ${sourceLabel}: ${count}개`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('[MOVIE] 2단계: 전체 크롤링 실행 시작');
        console.log('[CLOCK] 예상 소요 시간: 5-10분 (API 제한으로 인해)');
        console.log('='.repeat(60));
        
        const crawlingResponse = await axios.post(`${RAILWAY_URL}/api/execute-full-crawling`, {}, {
            timeout: 600000, // 10분 타임아웃
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (crawlingResponse.data.success) {
            const result = crawlingResponse.data.data;
            
            console.log('[PARTY] 전체 크롤링 성공!');
            console.log('='.repeat(50));
            console.log(`[INFO] 초기 영화 수: ${result.initialMovieCount}개`);
            console.log(`[INFO] 최종 영화 수: ${result.finalMovieCount}개`);
            console.log(`[SUCCESS] 추가된 영화: ${result.finalMovieCount - result.initialMovieCount}개`);
            console.log(`[FLASHCAMERA] 포스터 있는 영화: ${result.posterCount}개`);
            console.log(`[FAVORITE] 평점 데이터: ${result.ratingCount}개`);
            console.log(`[MSG] 리뷰 데이터: ${result.reviewCount}개`);
            console.log(`[SEARCH] 네이버 보완: ${result.naverEnhancementCount}개`);
            console.log(`⏱️ 소요 시간: ${Math.round(result.duration / 1000)}초`);
            
            if (result.koficResults) {
                console.log('\n[MOVIE] 영화진흥위원회 크롤링 결과:');
                console.log(`  - 처리된 영화: ${result.koficResults.totalProcessed}개`);
                console.log(`  - 새로 추가: ${result.koficResults.newMoviesAdded}개`);
                console.log(`  - 기존 영화: ${result.koficResults.existingMovies}개`);
            }
            
            if (result.errors && result.errors.length > 0) {
                console.log(`\n[WARN] 발생한 오류: ${result.errors.length}건`);
                result.errors.slice(0, 3).forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
                if (result.errors.length > 3) {
                    console.log(`  ... 그 외 ${result.errors.length - 3}건`);
                }
            }
            
        } else {
            console.log('[ERROR] 크롤링 실패:', crawlingResponse.data.message);
            if (crawlingResponse.data.error) {
                console.log('오류 세부사항:', crawlingResponse.data.error);
            }
        }
        
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('[CLOCK] 타임아웃 발생');
            console.log('[TIP] 크롤링이 백그라운드에서 계속 진행 중일 수 있습니다.');
            console.log('[INFO] 상태 확인: GET /api/crawling-status');
        } else if (error.response) {
            console.error('[ERROR] 서버 응답 오류:', error.response.status);
            console.error('📄 응답 내용:', error.response.data);
        } else {
            console.error('[ERROR] 네트워크 오류:', error.message);
        }
    }
}

async function checkFinalStatus() {
    console.log('\n' + '='.repeat(60));
    console.log('[INFO] 3단계: 최종 상태 확인');
    console.log('='.repeat(60));
    
    try {
        const statusResponse = await axios.get(`${RAILWAY_URL}/api/crawling-status`, {
            timeout: 30000
        });
        
        if (statusResponse.data.success) {
            const data = statusResponse.data.data;
            console.log('[TARGET] 최종 데이터베이스 상태:');
            console.log(`[INFO] 총 영화 수: ${data.totalMovies}개`);
            console.log(`[FLASHCAMERA] 포스터 이미지: ${data.posterCount}개`);
            console.log(`[FAVORITE] 평점 데이터: ${data.ratingCount}개`);
            console.log(`[MSG] 리뷰 데이터: ${data.reviewCount}개`);
            
            console.log('\n🆕 최근 추가된 영화:');
            data.recentMovies.slice(0, 5).forEach((movie, index) => {
                const sourceLabel = {
                    'kofic_api': 'KOFIC',
                    'naver_api': 'NAVER',
                    'hardcoded_db': 'LOCAL'
                }[movie.data_source] || movie.data_source;
                
                console.log(`  ${index + 1}. ${movie.title} (${movie.release_year}) [${sourceLabel}]`);
            });
            
            console.log('\n[INFO] 데이터 완성도:');
            const posterPercentage = Math.round((data.posterCount / data.totalMovies) * 100);
            const ratingPercentage = Math.round((data.ratingCount / data.totalMovies) * 100);
            const reviewPercentage = Math.round((data.reviewCount / data.totalMovies) * 100);
            
            console.log(`  - 포스터: ${posterPercentage}%`);
            console.log(`  - 평점: ${ratingPercentage}%`);
            console.log(`  - 리뷰: ${reviewPercentage}%`);
        }
        
    } catch (error) {
        console.error('[ERROR] 최종 상태 확인 오류:', error.message);
    }
}

// 메인 실행 함수
async function main() {
    console.log('[MOVIE] 전체 영화 데이터베이스 구축 시스템');
    console.log('Railway 배포 환경에서 실행');
    console.log('='.repeat(60));
    
    await triggerFullCrawling();
    
    // 5초 대기 후 최종 상태 확인
    await new Promise(resolve => setTimeout(resolve, 5000));
    await checkFinalStatus();
    
    console.log('\n[PARTY] 전체 프로세스 완료!');
    console.log('[TIP] 이제 영화 검색이 풍부한 데이터베이스를 바탕으로 동작합니다.');
    console.log('[LINK] 테스트: "기생충 영화평", "어벤져스 평점" 등으로 확인해보세요!');
}

// 스크립트 실행
if (require.main === module) {
    main().catch(error => {
        console.error('[ERROR] 실행 오류:', error.message);
        process.exit(1);
    });
}

module.exports = { triggerFullCrawling, checkFinalStatus };