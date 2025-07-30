// 현재 movies 테이블의 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkCurrentMovies() {
    console.log('[MOVIE] 현재 movies 테이블 데이터 확인 중...\n');
    
    try {
        // 전체 영화 수 확인
        const { count: totalCount, error: countError } = await supabase
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('[ERROR] 총 영화 수 조회 오류:', countError);
            return;
        }
        
        console.log(`[INFO] 총 영화 개수: ${totalCount}개`);
        
        // 샘플 데이터 확인 (처음 20개)
        const { data: sampleMovies, error: sampleError } = await supabase
            .from('movies')
            .select('id, title, director, cast_members, kofic_movie_cd, kofic_title, kofic_director, kofic_cast')
            .limit(20);
            
        if (sampleError) {
            console.error('[ERROR] 샘플 데이터 조회 오류:', sampleError);
            return;
        }
        
        console.log('\n[FORM] 샘플 데이터 (처음 20개):');
        console.log('='.repeat(120));
        
        sampleMovies.forEach((movie, index) => {
            console.log(`\n${index + 1}. ID: ${movie.id}`);
            console.log(`   현재 제목: "${movie.title || 'NULL'}"`);
            console.log(`   KOFIC 제목: "${movie.kofic_title || 'NULL'}"`);
            console.log(`   현재 감독: "${movie.director || 'NULL'}"`);
            console.log(`   KOFIC 감독: "${movie.kofic_director || 'NULL'}"`);
            console.log(`   현재 출연진: "${movie.cast_members || 'NULL'}"`);
            console.log(`   KOFIC 출연진: "${movie.kofic_cast || 'NULL'}"`);
            console.log(`   KOFIC 영화코드: "${movie.kofic_movie_cd || 'NULL'}"`);
        });
        
        // 불일치 데이터 확인
        console.log('\n[SEARCH] 데이터 불일치 분석...');
        
        // title과 kofic_title이 다른 경우
        const { data: titleMismatch, error: titleError } = await supabase
            .from('movies')
            .select('id, title, kofic_title')
            .neq('title', 'kofic_title')
            .not('kofic_title', 'is', null)
            .limit(10);
            
        if (!titleError && titleMismatch) {
            console.log(`\n[MEMO] 제목 불일치: ${titleMismatch.length}개 샘플`);
            titleMismatch.forEach(movie => {
                console.log(`   ID ${movie.id}: "${movie.title}" ≠ "${movie.kofic_title}"`);
            });
        }
        
        // director와 kofic_director가 다른 경우
        const { data: directorMismatch, error: directorError } = await supabase
            .from('movies')
            .select('id, title, director, kofic_director')
            .neq('director', 'kofic_director')
            .not('kofic_director', 'is', null)
            .limit(10);
            
        if (!directorError && directorMismatch) {
            console.log(`\n[DRAMA] 감독 불일치: ${directorMismatch.length}개 샘플`);
            directorMismatch.forEach(movie => {
                console.log(`   "${movie.title}": "${movie.director}" ≠ "${movie.kofic_director}"`);
            });
        }
        
        // cast_members와 kofic_cast가 다른 경우
        const { data: castMismatch, error: castError } = await supabase
            .from('movies')
            .select('id, title, cast_members, kofic_cast')
            .neq('cast_members', 'kofic_cast')
            .not('kofic_cast', 'is', null)
            .limit(10);
            
        if (!castError && castMismatch) {
            console.log(`\n[BUSTSINSILHOUETTE] 출연진 불일치: ${castMismatch.length}개 샘플`);
            castMismatch.forEach(movie => {
                console.log(`   "${movie.title}": "${movie.cast_members}" ≠ "${movie.kofic_cast}"`);
            });
        }
        
        // 통계 정보
        console.log('\n[INFO] 데이터 통계:');
        console.log('='.repeat(60));
        
        const stats = await Promise.all([
            supabase.from('movies').select('*', { count: 'exact', head: true }).not('kofic_title', 'is', null),
            supabase.from('movies').select('*', { count: 'exact', head: true }).not('kofic_director', 'is', null),
            supabase.from('movies').select('*', { count: 'exact', head: true }).not('kofic_cast', 'is', null),
            supabase.from('movies').select('*', { count: 'exact', head: true }).not('kofic_movie_cd', 'is', null)
        ]);
        
        console.log(`KOFIC 제목 데이터가 있는 영화: ${stats[0].count || 0}개`);
        console.log(`KOFIC 감독 데이터가 있는 영화: ${stats[1].count || 0}개`);
        console.log(`KOFIC 출연진 데이터가 있는 영화: ${stats[2].count || 0}개`);
        console.log(`KOFIC 영화코드가 있는 영화: ${stats[3].count || 0}개`);
        
    } catch (error) {
        console.error('[ERROR] 오류 발생:', error);
    }
}

// 실행
if (require.main === module) {
    checkCurrentMovies();
}

module.exports = checkCurrentMovies;