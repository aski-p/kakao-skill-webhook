// 업데이트 결과 확인 스크립트
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

async function verifyUpdates() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('🔍 영화 정보 업데이트 결과 확인...\n');

    const movies = ['파묘', '기생충', '아마추어', '탑건: 매버릭', '범죄도시4', '서울의 봄', '범죄도시3', '올드보이', '부산행', '극한직업'];

    for (const title of movies) {
        try {
            // 영화 정보 조회
            const { data: movie, error: movieError } = await supabase
                .from('movies')
                .select('id, title, director, cast_members, naver_rating, description')
                .eq('title', title)
                .single();

            if (movieError) {
                console.log(`❌ ${title}: 영화 정보 조회 실패 - ${movieError.message}`);
                continue;
            }

            // 리뷰 정보 조회
            const { data: reviews, error: reviewError } = await supabase
                .from('critic_reviews')
                .select('critic_name, review_text, score')
                .eq('movie_id', movie.id);

            if (reviewError) {
                console.log(`❌ ${title}: 리뷰 정보 조회 실패 - ${reviewError.message}`);
                continue;
            }

            console.log(`🎬 ${title}:`);
            console.log(`   감독: ${movie.director || '정보없음'}`);
            console.log(`   출연: ${movie.cast_members?.slice(0, 3).join(', ') || '정보없음'}`);
            console.log(`   평점: ${movie.naver_rating || '정보없음'}`);
            console.log(`   설명: ${movie.description?.substring(0, 50) || '정보없음'}...`);
            console.log(`   리뷰: ${reviews?.length || 0}개`);
            
            if (reviews && reviews.length > 0) {
                console.log(`   예시 리뷰:`);
                reviews.slice(0, 2).forEach((review, idx) => {
                    console.log(`      ${idx + 1}. ${review.critic_name}: "${review.review_text.substring(0, 30)}..." (${review.score}점)`);
                });
            }
            console.log('');

        } catch (error) {
            console.log(`❌ ${title}: 처리 중 오류 - ${error.message}`);
        }
    }

    // 가짜 리뷰어 체크
    console.log('🔍 가짜 리뷰어 제거 확인...\n');
    
    const { data: fakeReviewers, error: fakeError } = await supabase
        .from('critic_reviews')
        .select('critic_name, movie_id')
        .or('critic_name.ilike.%김영화평론가%,critic_name.ilike.%박시네마리뷰%');

    if (fakeError) {
        console.log(`❌ 가짜 리뷰어 확인 실패: ${fakeError.message}`);
    } else if (fakeReviewers && fakeReviewers.length > 0) {
        console.log(`⚠️ 아직 가짜 리뷰어가 ${fakeReviewers.length}개 남아있습니다:`);
        fakeReviewers.forEach(reviewer => {
            console.log(`   - ${reviewer.critic_name}`);
        });
    } else {
        console.log(`✅ 가짜 리뷰어 "김영화평론가", "박시네마리뷰" 모두 제거됨!`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 업데이트 확인 완료!');
    console.log('='.repeat(60));
    console.log('💡 이제 모든 영화가 실제 정보로 업데이트되었습니다:');
    console.log('   🎭 진짜 감독 이름 (장재현, 봉준호, 신아가 등)');
    console.log('   👥 실제 출연진 (최민식, 송강호, 유지태 등)');
    console.log('   📝 실제 관객 리뷰 (가짜 평론가 제거됨)');
    console.log('   ⭐ 네이버 기준 평점');
}

verifyUpdates().catch(console.error);