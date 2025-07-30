// 데이터베이스에 있는 정확한 영화 제목 확인
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

async function checkMovieTitles() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[SEARCH] 데이터베이스에서 영화 제목 검색 중...\n');

    const searchTitles = ['파묘', '기생충', '아마추어', '탑건', '매버릭', '범죄도시4', '범죄도시 4'];

    for (const searchTitle of searchTitles) {
        console.log(`[PROJECTOR] "${searchTitle}" 검색...`);
        
        const { data, error } = await supabase
            .from('movies')
            .select('id, title, director, cast_members')
            .ilike('title', `%${searchTitle}%`)
            .order('id');

        if (error) {
            console.log(`   [ERROR] 검색 실패: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`   [SUCCESS] ${data.length}개 발견:`);
            data.forEach(movie => {
                console.log(`      ID: ${movie.id} | 제목: "${movie.title}" | 감독: ${movie.director || '정보없음'}`);
            });
        } else {
            console.log(`   [ERROR] 검색 결과 없음`);
        }
        console.log('');
    }

    // 가짜 평론가가 있는 영화들 찾기
    console.log('[SEARCH] 가짜 평론가가 있는 영화들 찾기...\n');
    
    const { data: fakeReviews, error: fakeError } = await supabase
        .from('critic_reviews')
        .select(`
            id, 
            critic_name, 
            movie_id,
            movies!inner(title)
        `)
        .or('critic_name.ilike.%김영화평론가%,critic_name.ilike.%박시네마리뷰%');

    if (fakeError) {
        console.log(`[ERROR] 가짜 평론가 검색 실패: ${fakeError.message}`);
    } else if (fakeReviews && fakeReviews.length > 0) {
        console.log(`[WARN] 가짜 평론가 ${fakeReviews.length}개 발견:`);
        fakeReviews.forEach(review => {
            console.log(`   영화: "${review.movies.title}" | 평론가: ${review.critic_name}`);
        });
    } else {
        console.log(`[SUCCESS] 가짜 평론가 없음 - 모두 제거됨!`);
    }

    // "알 수 없음" 감독이나 출연진이 있는 영화들 찾기
    console.log('\n[SEARCH] "알 수 없음" 정보가 있는 영화들 찾기...\n');
    
    const { data: unknownMovies, error: unknownError } = await supabase
        .from('movies')
        .select('id, title, director, cast_members')
        .or('director.eq.알 수 없음,cast_members.cs.{"알 수 없음"}')
        .order('id')
        .limit(10);

    if (unknownError) {
        console.log(`[ERROR] "알 수 없음" 검색 실패: ${unknownError.message}`);
    } else if (unknownMovies && unknownMovies.length > 0) {
        console.log(`[WARN] "알 수 없음" 정보가 있는 영화 ${unknownMovies.length}개 발견:`);
        unknownMovies.forEach(movie => {
            console.log(`   ID: ${movie.id} | 제목: "${movie.title}" | 감독: ${movie.director || '정보없음'} | 출연진: ${movie.cast_members?.join(', ') || '정보없음'}`);
        });
    } else {
        console.log(`[SUCCESS] "알 수 없음" 정보 없음 - 모두 업데이트됨!`);
    }
}

checkMovieTitles().catch(console.error);