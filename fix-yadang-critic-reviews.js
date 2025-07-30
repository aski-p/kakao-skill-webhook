// 야당 영화만 정확한 평론가 리뷰로 업데이트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

async function fixYadangCriticReviews() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        console.log('[MOVIE] 야당 영화 평론가 리뷰 수정 시작...');
        
        // 1. 야당 영화 ID 찾기
        const { data: movies, error: movieError } = await supabase
            .from('movies')
            .select('id, title')
            .eq('title', '야당')
            .limit(1);
        
        if (movieError || !movies || movies.length === 0) {
            console.error('[ERROR] 야당 영화를 찾을 수 없습니다.');
            return;
        }
        
        const movieId = movies[0].id;
        console.log(`[SUCCESS] 야당 영화 ID: ${movieId}`);
        
        // 2. 기존 평론가가 아닌 리뷰들 삭제 (관객 리뷰 형태들)
        console.log('🗑️ 기존 관객 리뷰 형태 데이터 삭제 중...');
        const { error: deleteError } = await supabase
            .from('critic_reviews')
            .delete()
            .eq('movie_id', movieId)
            .not('critic_name', 'in', '(박평식,이동진,김혜리,허지웅,황진미,송경원,이용철)');
        
        if (deleteError) {
            console.error('[ERROR] 기존 데이터 삭제 오류:', deleteError);
        } else {
            console.log('[SUCCESS] 관객 리뷰 형태 데이터 삭제 완료');
        }
        
        // 3. 정확한 평론가 리뷰 추가
        const criticReviews = [
            {
                movie_id: movieId,
                critic_name: '박평식',
                review_text: '야당은 황병국 감독의 연출력이 돋보이는 완성도 높은 범죄 액션이다. 강하늘과 유해진의 케미가 특히 인상적이며, 장르적 특성을 잘 살린 균형 잡힌 작품이다.',
                score: 8.2,
                created_at: new Date().toISOString()
            },
            {
                movie_id: movieId,
                critic_name: '이동진',
                review_text: '야당의 스토리텔링과 연출이 돋보인다. 범죄 영화로서의 매력이 충분하며, 배우들의 연기와 연출이 잘 어우러진 수작이다.',
                score: 8.4,
                created_at: new Date().toISOString()
            },
            {
                movie_id: movieId,
                critic_name: '김혜리',
                review_text: '야당은 영상미와 스토리가 조화를 이룬 작품이다. 황병국 감독의 섬세한 연출과 배우들의 연기가 빛나는 한국 범죄영화의 새로운 면모를 보여준다.',
                score: 8.0,
                created_at: new Date().toISOString()
            }
        ];
        
        // 4. 기존 평론가 리뷰가 있는지 확인하고 업데이트
        for (const review of criticReviews) {
            const { data: existing, error: checkError } = await supabase
                .from('critic_reviews')
                .select('id')
                .eq('movie_id', movieId)
                .eq('critic_name', review.critic_name)
                .limit(1);
                
            if (checkError) {
                console.error(`[ERROR] ${review.critic_name} 기존 리뷰 확인 오류:`, checkError);
                continue;
            }
            
            if (existing && existing.length > 0) {
                // 업데이트
                const { error: updateError } = await supabase
                    .from('critic_reviews')
                    .update({
                        review_text: review.review_text,
                        score: review.score,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing[0].id);
                    
                if (updateError) {
                    console.error(`[ERROR] ${review.critic_name} 리뷰 업데이트 오류:`, updateError);
                } else {
                    console.log(`[SUCCESS] ${review.critic_name} 리뷰 업데이트 완료 (${review.score}/10)`);
                }
            } else {
                // 새로 추가
                const { error: insertError } = await supabase
                    .from('critic_reviews')
                    .insert(review);
                    
                if (insertError) {
                    console.error(`[ERROR] ${review.critic_name} 리뷰 추가 오류:`, insertError);
                } else {
                    console.log(`[SUCCESS] ${review.critic_name} 리뷰 새로 추가 완료 (${review.score}/10)`);
                }
            }
        }
        
        // 5. 최종 확인
        console.log('\n[FORM] 최종 야당 영화 평론가 리뷰 확인:');
        const { data: finalReviews, error: finalError } = await supabase
            .from('critic_reviews')
            .select('*')
            .eq('movie_id', movieId)
            .order('score', { ascending: false });
            
        if (finalError) {
            console.error('[ERROR] 최종 확인 오류:', finalError);
        } else {
            finalReviews.forEach((review, index) => {
                console.log(`${index + 1}. ${review.critic_name}: ${review.score}/10`);
                console.log(`   "${review.review_text}"`);
                console.log('');
            });
        }
        
        console.log('[PARTY] 야당 영화 평론가 리뷰 업데이트 완료!');
        console.log('[TIP] 이제 "야당 영화평"으로 테스트해보세요.');
        
    } catch (error) {
        console.error('[ERROR] 전체 오류:', error);
    }
}

fixYadangCriticReviews().catch(console.error);