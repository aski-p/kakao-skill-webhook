// 모든 "알 수 없음" 영화들 찾아서 리스트 생성
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

async function checkAllUnknownMovies() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 "알 수 없음" 정보가 있는 모든 영화 검색 중...\n');

    try {
        // "알 수 없음" 감독이나 출연진이 있는 영화들 찾기
        const { data: unknownMovies, error } = await supabase
            .from('movies')
            .select('id, title, director, cast_members, genre, release_year, description')
            .or('director.eq.알 수 없음,cast_members.cs.{"알 수 없음"}')
            .order('id')
            .limit(50); // 처음 50개만

        if (error) {
            console.log(`❌ 검색 실패: ${error.message}`);
            return;
        }

        console.log(`⚠️ "알 수 없음" 정보가 있는 영화: ${unknownMovies.length}개 발견\n`);

        unknownMovies.forEach((movie, index) => {
            console.log(`${index + 1}. ID: ${movie.id} | 제목: "${movie.title}"`);
            console.log(`   감독: ${movie.director || '정보없음'}`);
            console.log(`   출연진: ${movie.cast_members?.join(', ') || '정보없음'}`);
            console.log(`   장르: ${movie.genre || '정보없음'}`);
            console.log(`   개봉년도: ${movie.release_year || '정보없음'}`);
            console.log('');
        });

        // 전체 통계
        const { data: totalMovies, error: totalError } = await supabase
            .from('movies')
            .select('id')
            .or('director.eq.알 수 없음,cast_members.cs.{"알 수 없음"}');

        if (!totalError) {
            console.log(`📊 전체 "알 수 없음" 영화 수: ${totalMovies.length}개`);
        }

        console.log('\n💡 이제 이 영화들의 실제 정보를 웹에서 찾아서 업데이트하겠습니다!');

        return unknownMovies;

    } catch (error) {
        console.log(`❌ 검색 중 오류: ${error.message}`);
    }
}

checkAllUnknownMovies().catch(console.error);