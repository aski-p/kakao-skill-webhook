// Railway에서 네이버 직접 크롤링 실행
const axios = require('axios');

const RAILWAY_URL = 'https://kakao-skill-webhook-production.up.railway.app';

async function executeNaverCrawling() {
    console.log('[MOVIE] Railway에서 네이버 직접 크롤링 실행\n');
    
    try {
        console.log('[SATELLITE] 네이버 직접 크롤링 API 호출 중...');
        console.log('[CLOCK] 예상 소요 시간: 2-3분');
        
        const response = await axios.post(`${RAILWAY_URL}/api/direct-naver-crawling`, {}, {
            timeout: 300000, // 5분 타임아웃
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            const data = response.data.data;
            
            console.log('[PARTY] 네이버 크롤링 성공!');
            console.log('='.repeat(50));
            console.log(`[INFO] 크롤링 전 영화 수: ${data.initialMovieCount}개`);
            console.log(`[INFO] 크롤링 후 영화 수: ${data.finalMovieCount}개`);
            console.log(`[SUCCESS] 실제 추가된 영화: ${data.actualAdded}개`);
            console.log(`[LOADING] 기존 영화: ${data.existingMovies}개`);
            console.log(`[ERROR] 오류 발생: ${data.errors.length}개`);
            console.log(`⏱️ 소요 시간: ${data.duration}초`);
            
            if (data.errors.length > 0) {
                console.log('\n[WARN] 발생한 오류들:');
                data.errors.slice(0, 5).forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
                if (data.errors.length > 5) {
                    console.log(`  ... 그 외 ${data.errors.length - 5}건`);
                }
            }
            
        } else {
            console.log('[ERROR] 크롤링 실패:', response.data.message);
            if (response.data.error) {
                console.log('오류 세부사항:', response.data.error);
            }
        }
        
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('[CLOCK] 타임아웃 발생');
            console.log('[TIP] 크롤링이 백그라운드에서 계속 진행 중일 수 있습니다.');
        } else if (error.response) {
            console.error('[ERROR] 서버 응답 오류:', error.response.status);
            console.error('📄 응답 내용:', error.response.data);
        } else {
            console.error('[ERROR] 네트워크 오류:', error.message);
        }
    }
}

async function testSingleMovie() {
    console.log('\n🧪 단일 영화 추가 테스트');
    console.log('='.repeat(30));
    
    const testMovies = ['기생충', '어벤져스', '탑건 매버릭'];
    
    for (const movie of testMovies) {
        try {
            console.log(`\n[SEARCH] "${movie}" 추가 테스트...`);
            
            const response = await axios.post(`${RAILWAY_URL}/api/add-single-movie`, {
                movieTitle: movie
            }, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.success) {
                const data = response.data.data;
                console.log(`[SUCCESS] ${data.status === 'added' ? '추가됨' : '이미 존재'}: ${data.movieTitle} (${data.releaseYear})`);
                if (data.director) console.log(`   감독: ${data.director}`);
                if (data.naverRating) console.log(`   평점: ${data.naverRating}/10`);
            } else {
                console.log(`[ERROR] 실패: ${response.data.message}`);
            }
            
        } catch (error) {
            console.log(`[ERROR] "${movie}" 테스트 오류:`, error.response?.data?.message || error.message);
        }
    }
}

async function checkFinalStatus() {
    console.log('\n[INFO] 최종 데이터베이스 상태 확인');
    console.log('='.repeat(40));
    
    try {
        const response = await axios.get(`${RAILWAY_URL}/api/crawling-status`, {
            timeout: 30000
        });
        
        if (response.data.success) {
            const data = response.data.data;
            console.log(`[INFO] 총 영화 수: ${data.totalMovies}개`);
            console.log(`[FLASHCAMERA] 포스터 있는 영화: ${data.posterCount}개`);
            console.log(`[FAVORITE] 평점 데이터: ${data.ratingCount}개`);
            console.log(`[MSG] 리뷰 데이터: ${data.reviewCount}개`);
            
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
            
            if (data.recentMovies && data.recentMovies.length > 0) {
                console.log('\n🆕 최근 추가된 영화 (상위 5개):');
                data.recentMovies.slice(0, 5).forEach((movie, index) => {
                    console.log(`  ${index + 1}. ${movie.title} (${movie.release_year})`);
                });
            }
        }
        
    } catch (error) {
        console.error('[ERROR] 상태 확인 오류:', error.message);
    }
}

// 메인 실행
async function main() {
    console.log('🚀 네이버 영화 데이터 직접 크롤링 시스템');
    console.log('='.repeat(50));
    
    // 1. 네이버 크롤링 실행
    await executeNaverCrawling();
    
    // 2. 단일 영화 테스트
    await testSingleMovie();
    
    // 3. 최종 상태 확인
    await checkFinalStatus();
    
    console.log('\n[PARTY] 프로세스 완료!');
    console.log('[LINK] 테스트: 카카오톡에서 "기생충 영화평" 등으로 확인해보세요!');
}

// 실행
if (require.main === module) {
    main().catch(error => {
        console.error('[ERROR] 실행 오류:', error.message);
        process.exit(1);
    });
}

module.exports = { executeNaverCrawling, testSingleMovie, checkFinalStatus };