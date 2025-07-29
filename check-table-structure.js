// movies 테이블 구조 확인 스크립트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTableStructure() {
    console.log('🔍 movies 테이블 구조 확인 중...\n');
    
    try {
        // 첫 번째 행 가져와서 컬럼 확인
        const { data: sampleData, error } = await supabase
            .from('movies')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ 테이블 조회 오류:', error);
            return;
        }
        
        if (sampleData && sampleData.length > 0) {
            console.log('📋 테이블 컬럼 목록:');
            console.log('='.repeat(50));
            const columns = Object.keys(sampleData[0]);
            columns.forEach((col, index) => {
                console.log(`${index + 1}. ${col}`);
            });
            
            console.log('\n📊 샘플 데이터:');
            console.log('='.repeat(100));
            console.log(JSON.stringify(sampleData[0], null, 2));
        }
        
        // 샘플 영화 몇 개 더 확인
        const { data: moreMovies, error: moreError } = await supabase
            .from('movies')
            .select('id, title, director, cast_members')
            .limit(10);
            
        if (!moreError && moreMovies) {
            console.log('\n🎬 샘플 영화 데이터 (10개):');
            console.log('='.repeat(100));
            moreMovies.forEach((movie, index) => {
                console.log(`\n${index + 1}. ID: ${movie.id}`);
                console.log(`   제목: "${movie.title || 'NULL'}"`);
                console.log(`   감독: "${movie.director || 'NULL'}"`);
                console.log(`   출연진: "${movie.cast_members || 'NULL'}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
    }
}

checkTableStructure();