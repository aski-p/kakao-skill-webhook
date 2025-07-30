// 야당 영화 평론가 리뷰 확인
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

async function checkYadangReviews() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        console.log('🎬 야당 영화 평론가 리뷰 확인 중...');
        
        // 1. 야당 영화 정보 찾기
        const { data: movies, error: movieError } = await supabase
            .from('movies')
            .select('id, title, director, cast_members')
            .eq('title', '야당')
            .limit(1);
        
        if (movieError) {
            console.error('❌ 영화 검색 오류:', movieError);
            return;
        }
        
        if (!movies || movies.length === 0) {
            console.log('❌ 야당 영화를 찾을 수 없습니다.');
            return;
        }
        
        const movie = movies[0];
        console.log(`✅ 야당 영화 발견:`);
        console.log(`   ID: ${movie.id}`);
        console.log(`   제목: ${movie.title}`);
        console.log(`   감독: ${movie.director}`);
        console.log(`   출연: ${movie.cast_members?.join(', ') || '정보없음'}`);
        
        // 2. 평론가 리뷰 확인
        const { data: reviews, error: reviewError } = await supabase
            .from('critic_reviews')
            .select('*')
            .eq('movie_id', movie.id)
            .order('created_at', { ascending: false });
        
        if (reviewError) {
            console.error('❌ 리뷰 검색 오류:', reviewError);
            return;
        }
        
        console.log(`\n📋 평론가 리뷰 개수: ${reviews?.length || 0}개`);
        
        if (reviews && reviews.length > 0) {
            console.log('\n👨‍💼 평론가 리뷰 목록:');
            reviews.forEach((review, index) => {
                console.log(`${index + 1}. ${review.critic_name}: ${review.score}/10`);
                console.log(`   "${review.review_text}"`);
                console.log('');
            });
            
            // 박평식, 이동진 확인
            const hasParkPyeongSik = reviews.some(r => r.critic_name === '박평식');
            const hasLeeDongJin = reviews.some(r => r.critic_name === '이동진');
            
            console.log('🔍 필수 평론가 확인:');
            console.log(`   박평식: ${hasParkPyeongSik ? '✅ 있음' : '❌ 없음'}`);
            console.log(`   이동진: ${hasLeeDongJin ? '✅ 있음' : '❌ 없음'}`);
            
        } else {
            console.log('❌ 평론가 리뷰가 없습니다.');
            console.log('\n💡 해결 방법:');
            console.log('   1. mass-critic-updater.js 실행 필요');
            console.log('   2. 또는 check-and-update-movies.js 실행');
        }
        
    } catch (error) {
        console.error('❌ 전체 오류:', error);
    }
}

checkYadangReviews().catch(console.error);