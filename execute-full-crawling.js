// 전체 영화 데이터베이스 구축 스크립트
const KoficMovieCrawler = require('./crawlers/kofic-movie-crawler');
const NaverMovieCrawler = require('./crawlers/naver-movie-crawler');
const SupabaseClient = require('./config/supabase-client');

async function executeFullMovieCrawling() {
    console.log('[MOVIE] 전체 영화 데이터베이스 구축 시작\n');
    console.log('='.repeat(60));
    
    const supabase = new SupabaseClient();
    
    // 1. 현재 데이터베이스 상태 확인
    console.log('1️⃣ 현재 데이터베이스 상태 확인');
    console.log('-'.repeat(40));
    
    if (!supabase.client) {
        console.log('[ERROR] Supabase 연결 실패');
        console.log('환경변수 확인 필요:');
        console.log('- SUPABASE_URL');
        console.log('- SUPABASE_SERVICE_ROLE_KEY');
        return;
    }
    
    try {
        const { count: currentMovieCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        console.log(`[INFO] 현재 movies 테이블 영화 수: ${currentMovieCount || 0}개`);
        
        if (currentMovieCount > 0) {
            const { data: sampleMovies } = await supabase.client
                .from('movies')
                .select('title, director, release_year, data_source')
                .limit(5);
                
            console.log('[MOVIE] 현재 저장된 영화 예시:');
            sampleMovies?.forEach((movie, index) => {
                console.log(`  ${index + 1}. ${movie.title} (${movie.release_year}) - ${movie.data_source}`);
            });
        }
        
    } catch (error) {
        console.log('[ERROR] 데이터베이스 상태 확인 오류:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 2. 영화진흥위원회 크롤링 실행
    console.log('2️⃣ 영화진흥위원회 박스오피스 크롤링 시작');
    console.log('-'.repeat(40));
    
    const koficCrawler = new KoficMovieCrawler();
    
    try {
        const koficResult = await koficCrawler.crawlAllMovies();
        
        if (koficResult.success) {
            console.log('[SUCCESS] 영화진흥위원회 크롤링 성공!');
            console.log(`[INFO] 총 처리된 영화: ${koficResult.totalProcessed}개`);
            console.log(`[SUCCESS] 새로 추가된 영화: ${koficResult.newMoviesAdded}개`);
            console.log(`[LOADING] 기존 영화: ${koficResult.existingMovies}개`);
            
            if (koficResult.errors && koficResult.errors.length > 0) {
                console.log(`[WARN] 오류 발생: ${koficResult.errors.length}건`);
                console.log('오류 예시:', koficResult.errors.slice(0, 3));
            }
        } else {
            console.log('[ERROR] 영화진흥위원회 크롤링 실패:', koficResult.error);
        }
        
    } catch (error) {
        console.log('[ERROR] 영화진흥위원회 크롤링 예외:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 3. 네이버 API로 상세 정보 보완
    console.log('3️⃣ 네이버 API로 영화 상세 정보 보완');
    console.log('-'.repeat(40));
    
    try {
        // 포스터가 없거나 평점이 없는 영화들 조회
        const { data: moviesNeedEnhancement } = await supabase.client
            .from('movies')
            .select('id, title, release_year, poster_image, naver_rating')
            .or('poster_image.is.null,naver_rating.is.null')
            .limit(100); // 한 번에 100개씩 처리
            
        if (moviesNeedEnhancement && moviesNeedEnhancement.length > 0) {
            console.log(`[SEARCH] 보완이 필요한 영화: ${moviesNeedEnhancement.length}개`);
            
            const naverCrawler = new NaverMovieCrawler();
            let enhancedCount = 0;
            
            for (const movie of moviesNeedEnhancement) {
                try {
                    console.log(`[SEARCH] "${movie.title}" 네이버 정보 검색 중...`);
                    
                    const naverData = await naverCrawler.searchMovieByTitle(movie.title);
                    
                    if (naverData) {
                        const updateData = {};
                        
                        if (!movie.poster_image && naverData.image) {
                            updateData.poster_image = naverData.image;
                        }
                        
                        if (!movie.naver_rating && naverData.userRating) {
                            updateData.naver_rating = parseFloat(naverData.userRating);
                        }
                        
                        if (Object.keys(updateData).length > 0) {
                            updateData.updated_at = new Date().toISOString();
                            
                            await supabase.client
                                .from('movies')
                                .update(updateData)
                                .eq('id', movie.id);
                                
                            enhancedCount++;
                            console.log(`[SUCCESS] "${movie.title}" 정보 보완 완료`);
                        }
                    }
                    
                    // API 호출 제한 준수
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                } catch (error) {
                    console.log(`[WARN] "${movie.title}" 보완 실패:`, error.message);
                }
            }
            
            console.log(`[SUCCESS] 총 ${enhancedCount}개 영화 정보 보완 완료`);
            
        } else {
            console.log('ℹ️ 보완이 필요한 영화가 없습니다.');
        }
        
    } catch (error) {
        console.log('[ERROR] 네이버 정보 보완 오류:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 4. 최종 결과 확인
    console.log('4️⃣ 최종 데이터베이스 상태 확인');
    console.log('-'.repeat(40));
    
    try {
        const { count: finalMovieCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        console.log(`[INFO] 최종 movies 테이블 영화 수: ${finalMovieCount || 0}개`);
        
        // 데이터 소스별 분포
        const { data: sourceDistribution } = await supabase.client
            .from('movies')
            .select('data_source');
            
        if (sourceDistribution) {
            const sourceCounts = {};
            sourceDistribution.forEach(movie => {
                const source = movie.data_source || 'unknown';
                sourceCounts[source] = (sourceCounts[source] || 0) + 1;
            });
            
            console.log('\n[INFO] 데이터 소스별 분포:');
            Object.entries(sourceCounts).forEach(([source, count]) => {
                const sourceLabel = {
                    'kofic_api': '영화진흥위원회 API',
                    'naver_api': '네이버 영화 API',
                    'hardcoded_db': '공개 영화 DB',
                    'unknown': '출처 미상'
                }[source] || source;
                
                console.log(`  - ${sourceLabel}: ${count}개`);
            });
        }
        
        // 최근 추가된 영화들
        const { data: recentMovies } = await supabase.client
            .from('movies')
            .select('title, director, release_year, data_source, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (recentMovies && recentMovies.length > 0) {
            console.log('\n🆕 최근 추가된 영화 (상위 10개):');
            recentMovies.forEach((movie, index) => {
                const sourceLabel = {
                    'kofic_api': 'KOFIC',
                    'naver_api': 'NAVER',
                    'hardcoded_db': 'LOCAL'
                }[movie.data_source] || movie.data_source;
                
                console.log(`  ${index + 1}. ${movie.title} (${movie.release_year}) [${sourceLabel}]`);
                console.log(`     감독: ${movie.director || '정보 없음'}`);
            });
        }
        
        // 포스터와 평점 보완 현황
        const { count: posterCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true })
            .not('poster_image', 'is', null);
            
        const { count: ratingCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true })
            .not('naver_rating', 'is', null);
            
        console.log(`\n[FLASHCAMERA] 포스터 정보가 있는 영화: ${posterCount || 0}개`);
        console.log(`[FAVORITE] 네이버 평점이 있는 영화: ${ratingCount || 0}개`);
        
    } catch (error) {
        console.log('[ERROR] 최종 상태 확인 오류:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('[PARTY] 전체 영화 데이터베이스 구축 완료!');
    console.log('[TIP] 이제 모든 영화 검색이 풍부한 데이터베이스를 바탕으로 동작합니다.');
}

// 스크립트 실행
if (require.main === module) {
    executeFullMovieCrawling().catch(error => {
        console.error('[ERROR] 전체 크롤링 실행 오류:', error);
        process.exit(1);
    });
}

module.exports = executeFullMovieCrawling;