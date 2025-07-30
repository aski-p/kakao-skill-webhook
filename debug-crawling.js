// 크롤링 결과 디버깅
const SupabaseClient = require('./config/supabase-client');

async function debugCrawlingResults() {
    console.log('[SEARCH] 크롤링 결과 디버깅 시작\n');
    
    const supabase = new SupabaseClient();
    
    if (!supabase.client) {
        console.log('[ERROR] Supabase 클라이언트 연결 실패');
        console.log('[TIP] 환경변수 확인이 필요합니다.');
        return;
    }
    
    try {
        // 1. 전체 영화 수 확인
        const { count, error: countError } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('[ERROR] 영화 수 조회 오류:', countError);
        } else {
            console.log(`[INFO] 총 영화 수: ${count}개`);
        }
        
        // 2. 최근 추가된 영화들 확인
        const { data: recentMovies, error: recentError } = await supabase.client
            .from('movies')
            .select('id, title, director, release_year, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (recentError) {
            console.error('[ERROR] 최근 영화 조회 오류:', recentError);
        } else {
            console.log('\n[MOVIE] 최근 추가된 영화들 (상위 10개):');
            console.log('='.repeat(60));
            recentMovies.forEach((movie, index) => {
                console.log(`${index + 1}. ${movie.title} (${movie.release_year})`);
                console.log(`   감독: ${movie.director || '정보 없음'}`);
                console.log(`   추가일: ${new Date(movie.created_at).toLocaleString('ko-KR')}`);
                console.log('');
            });
        }
        
        // 3. 연도별 영화 분포
        const { data: yearStats, error: yearError } = await supabase.client
            .from('movies')
            .select('release_year')
            .not('release_year', 'is', null);
            
        if (yearError) {
            console.error('[ERROR] 연도별 통계 오류:', yearError);
        } else {
            const yearCounts = {};
            yearStats.forEach(movie => {
                const year = movie.release_year;
                yearCounts[year] = (yearCounts[year] || 0) + 1;
            });
            
            console.log('[TOMORROW] 연도별 영화 분포:');
            console.log('='.repeat(30));
            Object.keys(yearCounts)
                .sort((a, b) => b - a)
                .slice(0, 10)
                .forEach(year => {
                    console.log(`${year}년: ${yearCounts[year]}개`);
                });
        }
        
        // 4. 평론가 리뷰 수 확인
        const { count: criticCount, error: criticError } = await supabase.client
            .from('critic_reviews')
            .select('*', { count: 'exact', head: true });
            
        if (criticError) {
            console.error('[ERROR] 평론가 리뷰 수 조회 오류:', criticError);
        } else {
            console.log(`\n[MAN]‍💼 총 평론가 리뷰 수: ${criticCount}개`);
        }
        
        // 5. 관객 리뷰 수 확인
        const { count: audienceCount, error: audienceError } = await supabase.client
            .from('audience_reviews')
            .select('*', { count: 'exact', head: true });
            
        if (audienceError) {
            console.error('[ERROR] 관객 리뷰 수 조회 오류:', audienceError);
        } else {
            console.log(`[BUSTSINSILHOUETTE] 총 관객 리뷰 수: ${audienceCount}개`);
        }
        
    } catch (error) {
        console.error('[ERROR] 디버깅 중 오류:', error);
    }
}

debugCrawlingResults().catch(console.error);