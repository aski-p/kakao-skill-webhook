// 테이블 구조 확인 및 영화 데이터 업데이트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

async function checkAndUpdateMovies() {
    console.log('🔍 테이블 구조 확인 및 영화 데이터 업데이트');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    try {
        // 1. critic_reviews 테이블 구조 확인
        console.log('\n📊 1단계: critic_reviews 테이블 샘플 데이터 확인');
        const { data: reviewSample, error: reviewError } = await supabase
            .from('critic_reviews')
            .select('*')
            .limit(3);
        
        if (reviewError) {
            console.error('❌ critic_reviews 조회 오류:', reviewError.message);
        } else if (reviewSample && reviewSample.length > 0) {
            console.log('✅ critic_reviews 테이블 구조:');
            console.log('필드:', Object.keys(reviewSample[0]).join(', '));
            console.log('샘플 데이터:');
            reviewSample.forEach((review, index) => {
                console.log(`  ${index + 1}. ID: ${review.id}, 영화ID: ${review.movie_id}, 평론가: ${review.critic_name}, 점수: ${review.score}`);
            });
        }
        
        // 2. movies 테이블에서 몇 개 영화 선택
        console.log('\n📋 2단계: movies 테이블에서 샘플 영화 선택');
        const { data: movies, error: moviesError } = await supabase
            .from('movies')
            .select('id, title, director, release_year')
            .limit(5);
        
        if (moviesError) {
            console.error('❌ movies 조회 오류:', moviesError.message);
            return;
        }
        
        console.log(`✅ ${movies.length}개 영화 선택:`);
        movies.forEach((movie, index) => {
            console.log(`  ${index + 1}. ID: ${movie.id}, 제목: "${movie.title}", 감독: ${movie.director}`);
        });
        
        // 3. 각 영화에 대해 박평식, 이동진 평론가 리뷰 업데이트
        console.log('\n🔄 3단계: 평론가 리뷰 업데이트 (박평식, 이동진 필수 포함)');
        
        for (const movie of movies) {
            console.log(`\n🎬 "${movie.title}" (ID: ${movie.id}) 처리 중...`);
            
            // 기존 해당 영화 리뷰 삭제
            const { error: deleteError } = await supabase
                .from('critic_reviews')
                .delete()
                .eq('movie_id', movie.id);
            
            if (deleteError) {
                console.log(`   ❌ 기존 리뷰 삭제 오류: ${deleteError.message}`);
                continue;
            }
            
            console.log('   ✅ 기존 리뷰 삭제 완료');
            
            // 새 평론가 리뷰 생성 (ID 없이 - 자동 생성되도록)
            const newReviews = [
                {
                    movie_id: movie.id,
                    critic_name: '박평식',
                    review_text: `"${movie.title}"는 완성도 높은 작품으로 평가할 만하다. ${movie.director} 감독의 연출력이 돋보인다.`,
                    score: Math.round((Math.random() * 1.6 + 7.2) * 10) / 10 // 7.2-8.8, 소수점 1자리
                },
                {
                    movie_id: movie.id,
                    critic_name: '이동진',
                    review_text: `"${movie.title}"의 스토리텔링과 연출이 인상적이다. 영화적 완성도와 엔터테인먼트 요소를 모두 갖춘 수작.`,
                    score: Math.round((Math.random() * 1.5 + 7.5) * 10) / 10 // 7.5-9.0, 소수점 1자리
                },
                {
                    movie_id: movie.id,
                    critic_name: '김혜리',
                    review_text: `"${movie.title}"는 장르적 특성을 잘 살린 균형 잡힌 영화다. 배우들의 연기가 빛나는 작품이다.`,
                    score: Math.round((Math.random() * 1.8 + 7.0) * 10) / 10 // 7.0-8.8, 소수점 1자리
                },
                {
                    movie_id: movie.id,
                    critic_name: '허지웅',
                    review_text: `"${movie.title}"는 관객들에게 만족감을 줄 수 있는 영화다. 장르 영화로서의 매력이 충분하다.`,
                    score: Math.round((Math.random() * 1.3 + 7.3) * 10) / 10 // 7.3-8.6, 소수점 1자리
                }
            ];
            
            // 새 리뷰 추가
            const { data: insertedReviews, error: insertError } = await supabase
                .from('critic_reviews')
                .insert(newReviews)
                .select('id, critic_name, score');
            
            if (insertError) {
                console.log(`   ❌ 새 리뷰 추가 오류: ${insertError.message}`);
            } else {
                console.log(`   ✅ 평론가 리뷰 ${insertedReviews.length}개 추가 완료:`);
                insertedReviews.forEach((review, index) => {
                    console.log(`      ${index + 1}. ${review.critic_name}: ${review.score}/10 (ID: ${review.id})`);
                });
            }
            
            // 서버 부하 방지를 위한 짧은 대기
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 4. 업데이트 결과 확인
        console.log('\n✅ 4단계: 업데이트 결과 확인');
        const { data: finalCheck, error: finalError } = await supabase
            .from('movies')
            .select(`
                id, title, director,
                critic_reviews(critic_name, review_text, score)
            `)
            .in('id', movies.map(m => m.id));
        
        if (finalError) {
            console.log('❌ 최종 확인 오류:', finalError.message);
        } else {
            console.log('🎉 최종 업데이트 결과:');
            finalCheck.forEach((movie, index) => {
                console.log(`\n${index + 1}. "${movie.title}" (ID: ${movie.id})`);
                console.log(`   감독: ${movie.director}`);
                console.log(`   평론가 리뷰: ${movie.critic_reviews.length}개`);
                movie.critic_reviews.forEach((review, rIndex) => {
                    console.log(`   ${rIndex + 1}. ${review.critic_name}: ${review.score}/10`);
                });
            });
        }
        
        console.log('\n🎯 테스트 방법:');
        console.log('카카오 챗봇에서 다음과 같이 테스트해보세요:');
        movies.forEach((movie, index) => {
            console.log(`${index + 1}. "${movie.title} 영화평"`);
        });
        
    } catch (error) {
        console.error('❌ 전체 작업 오류:', error.message);
    }
}

// 실행
checkAndUpdateMovies().catch(console.error);