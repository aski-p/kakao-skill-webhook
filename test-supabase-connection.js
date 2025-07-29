// Supabase 연결 테스트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

async function testConnection() {
    console.log('🔧 Supabase 연결 테스트 시작...\n');

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { 
                autoRefreshToken: false, 
                persistSession: false 
            }
        });

        // 1. movies 테이블 존재 확인
        console.log('📊 movies 테이블 조회 중...');
        const { data: movies, error: moviesError } = await supabase
            .from('movies')
            .select('count')
            .limit(1);

        if (moviesError) {
            console.error('❌ movies 테이블 조회 실패:', moviesError.message);
        } else {
            console.log('✅ movies 테이블 연결 성공');
        }

        // 2. 간단한 데이터 삽입 테스트
        console.log('\n📝 테스트 데이터 삽입 시도...');
        const testMovie = {
            title: '테스트 영화',
            english_title: 'Test Movie',
            director: '테스트 감독',
            cast_members: ['배우1', '배우2'],
            genre: 'Drama',
            release_year: 2024,
            country: '한국',
            description: 'KOFIC API 테스트를 위한 영화',
            keywords: ['테스트', 'KOFIC']
        };

        const { data: insertData, error: insertError } = await supabase
            .from('movies')
            .insert([testMovie])
            .select();

        if (insertError) {
            console.error('❌ 데이터 삽입 실패:', insertError.message);
            console.error('상세 오류:', insertError);
        } else {
            console.log('✅ 테스트 데이터 삽입 성공');
            console.log('삽입된 데이터 ID:', insertData[0].id);

            // 3. 삽입한 데이터 삭제
            console.log('\n🗑️ 테스트 데이터 삭제 중...');
            const { error: deleteError } = await supabase
                .from('movies')
                .delete()
                .eq('id', insertData[0].id);

            if (deleteError) {
                console.error('❌ 데이터 삭제 실패:', deleteError.message);
            } else {
                console.log('✅ 테스트 데이터 삭제 성공');
            }
        }

        console.log('\n✅ Supabase 연결 테스트 완료!');

    } catch (error) {
        console.error('❌ 치명적 오류:', error.message);
        console.error('상세 정보:', error);
    }
}

testConnection();