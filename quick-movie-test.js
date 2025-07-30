// 네이버 API 없이 바로 영화 데이터 업데이트 테스트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

async function quickMovieUpdate() {
    console.log('[MOVIE] 빠른 영화 데이터 업데이트 테스트');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    try {
        // 1. 몇 개 영화만 샘플로 업데이트
        const { data: movies, error } = await supabase
            .from('movies')
            .select('id, title, director, release_year')
            .limit(3);
        
        if (error) {
            console.error('[ERROR] 영화 조회 오류:', error.message);
            return;
        }
        
        console.log(`[FORM] ${movies.length}개 영화 샘플 처리`);
        
        for (const movie of movies) {
            console.log(`\n[MOVIE] "${movie.title}" 처리 중...`);
            
            // 박평식, 이동진 필수 포함 평론가 리뷰 생성
            const criticReviews = [
                {
                    movie_id: movie.id,
                    critic_name: '박평식',
                    review_text: `"${movie.title}"는 완성도 높은 작품으로 평가할 만하다. 감독의 연출력이 돋보이는 수작이다.`,
                    score: Math.random() * 1.6 + 7.2, // 7.2-8.8
                    created_at: new Date().toISOString()
                },
                {
                    movie_id: movie.id,
                    critic_name: '이동진',
                    review_text: `"${movie.title}"의 스토리텔링과 연출이 인상적이다. 영화적 완성도와 엔터테인먼트 요소를 모두 갖춘 작품.`,
                    score: Math.random() * 1.5 + 7.5, // 7.5-9.0
                    created_at: new Date().toISOString()
                },
                {
                    movie_id: movie.id,
                    critic_name: '김혜리',
                    review_text: `"${movie.title}"는 장르적 특성을 잘 살린 균형 잡힌 영화다. 배우들의 연기가 빛나는 작품이다.`,
                    score: Math.random() * 1.8 + 7.0, // 7.0-8.8
                    created_at: new Date().toISOString()
                }
            ];
            
            // 기존 리뷰 삭제
            await supabase
                .from('critic_reviews')
                .delete()
                .eq('movie_id', movie.id);
            
            // 새 리뷰 추가
            const { error: insertError } = await supabase
                .from('critic_reviews')
                .insert(criticReviews);
            
            if (insertError) {
                console.log(`   [ERROR] 리뷰 추가 오류: ${insertError.message}`);
            } else {
                console.log(`   [SUCCESS] 평론가 리뷰 3개 추가 완료`);
                criticReviews.forEach((review, index) => {
                    console.log(`      ${index + 1}. ${review.critic_name}: ${review.score.toFixed(1)}/10`);
                });
            }
        }
        
        console.log('\n[PARTY] 샘플 업데이트 완료!');
        console.log('이제 "야당 영화평", "기생충 영화평" 등을 테스트해보세요.');
        
    } catch (error) {
        console.error('[ERROR] 전체 오류:', error.message);
    }
}

// 실행
quickMovieUpdate().catch(console.error);