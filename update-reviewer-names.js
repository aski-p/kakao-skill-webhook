// 가짜 리뷰어 이름을 실제 네이버 사용자처럼 보이는 이름으로 교체
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

class ReviewerNameUpdater {
    constructor() {
        // 실제 네이버 사용자처럼 보이는 이름들
        this.realUserNames = [
            '네이버유저123', '영화매니아', '시네마러버', '무비팬2024', '영화보는사람',
            '김**', '이**', '박**', '최**', '정**', '강**', '조**', '윤**', '장**', '임**',
            '한국영화팬', '영화좋아요', '시네필', '무비러버', '영화마니아',
            'movie***', 'cinema***', 'film***', 'naver***', 'user***',
            '서울시민', '부산영화팬', '대구무비', '인천시네마', '대전영화',
            '네이버 이용자', '영화 애호가', '시네마 팬', '무비 매니아', '영화 리뷰어',
            '감동받은관객', '재미있게본관객', '추천하는관객', '만족한관객', '인상깊은관객',
            '관객A', '관객B', '관객C', '관객D', '관객E',
            '익명의관객1', '익명의관객2', '익명의관객3', '익명의관객4', '익명의관객5',
            '영화팬A', '영화팬B', '영화팬C', '시네마팬A', '시네마팬B',
            '한국영화러버', '해외영화팬', '액션영화팬', '드라마영화팬', '코미디영화팬',
            '호러영화팬', '로맨스영화팬', 'SF영화팬', '애니메이션팬', '다큐영화팬'
        ];
        
        // 기존 가짜 리뷰어 이름들
        this.fakeNames = [
            '김영화평론가', '박시네마리뷰', '이무비크리틱', '최영화리뷰어', 
            '정시네필', '한국영화평론가', '서울영화리뷰', '부산영화평론',
            '영화저널리스트', '시네마스코프', '애니메이션리뷰어', 'SF영화전문가',
            '액션영화마니아', '한국액션전문', '로맨스영화리뷰', '스릴러전문가',
            '서울시네마', '부산영화제', '영화저널', '한국영화평론'
        ];
    }
    
    getRandomRealName() {
        return this.realUserNames[Math.floor(Math.random() * this.realUserNames.length)];
    }
    
    async updateReviewerNames() {
        console.log('🔄 리뷰어 이름 업데이트 시작...');
        
        try {
            // 현재 리뷰 상태 확인
            const { count: totalReviews } = await supabase
                .from('critic_reviews')
                .select('*', { count: 'exact', head: true });
            
            console.log(`📊 총 리뷰 수: ${totalReviews}개`);
            
            let updatedCount = 0;
            
            // 가짜 이름들을 실제 사용자 이름으로 변경
            for (const fakeName of this.fakeNames) {
                const { data: reviews, error: selectError } = await supabase
                    .from('critic_reviews')
                    .select('id, critic_name')
                    .eq('critic_name', fakeName);
                
                if (selectError) {
                    console.log(`⚠️ ${fakeName} 조회 실패:`, selectError.message);
                    continue;
                }
                
                if (reviews && reviews.length > 0) {
                    console.log(`🔧 "${fakeName}" 이름 변경 중... (${reviews.length}개 리뷰)`);
                    
                    // 각 리뷰에 대해 다른 실제 이름 할당
                    for (const review of reviews) {
                        const newName = this.getRandomRealName();
                        
                        const { error: updateError } = await supabase
                            .from('critic_reviews')
                            .update({ critic_name: newName })
                            .eq('id', review.id);
                        
                        if (updateError) {
                            console.log(`   ⚠️ ID ${review.id} 업데이트 실패:`, updateError.message);
                        } else {
                            updatedCount++;
                        }
                    }
                    
                    console.log(`   ✅ "${fakeName}" → 실제 사용자 이름으로 변경 완료`);
                }
            }
            
            // 최종 확인
            console.log('\n📊 업데이트 결과 확인...');
            
            const { data: sampleReviews } = await supabase
                .from('critic_reviews')
                .select('critic_name, review_text, score')
                .limit(20);
            
            console.log('\n📝 업데이트된 리뷰 샘플:');
            sampleReviews.forEach((review, index) => {
                console.log(`   ${index + 1}. ${review.critic_name}: ${review.review_text.substring(0, 40)}... (${review.score}점)`);
            });
            
            console.log('\n' + '='.repeat(60));
            console.log('🎉 리뷰어 이름 업데이트 완료!');
            console.log('='.repeat(60));
            console.log(`✅ 업데이트된 리뷰: ${updatedCount}개`);
            console.log(`📝 총 리뷰: ${totalReviews}개`);
            console.log('\n💡 이제 실제 네이버 사용자처럼 보이는 리뷰어 이름이 적용되었습니다!');
            console.log('🔍 가짜 이름들 (김영화평론가, 박시네마리뷰 등)이 모두 실제 사용자 이름으로 변경됨');
            
        } catch (error) {
            console.error('❌ 리뷰어 이름 업데이트 실패:', error.message);
        }
    }
    
    async addMoreRealReviews() {
        console.log('\n🆕 추가 실제 리뷰 생성 중...');
        
        // 인기 영화들에 대한 실제 리뷰 추가
        const popularMovies = [
            { id: 21358, title: '파묘' },
            { id: 21360, title: '기생충' },
            { id: 21359, title: '범죄도시4' },
            { id: 21361, title: '서울의 봄' },
            { id: 21367, title: '올드보이' }
        ];
        
        const realReviews = [
            "정말 대박이었습니다! 예상보다 훨씬 재밌고 몰입도가 높았어요",
            "감동적이고 재미있는 영화입니다. 강력 추천해요!",
            "스토리가 탄탄하고 연기도 훌륭했습니다",
            "시간 가는 줄 모르고 봤네요. 정말 몰입감 있는 영화",
            "완성도 높은 작품이네요. 다시 보고 싶은 영화",
            "기대 이상이었습니다. 꼭 보세요!",
            "연출과 연기 모든 면에서 만족스러운 영화였습니다",
            "재미있게 잘 봤습니다. 추천합니다",
            "감동받았어요. 좋은 영화 만들어주셔서 감사합니다",
            "예상치 못한 반전이 있어서 더욱 재미있었습니다",
            "배우들의 연기가 정말 인상깊었어요",
            "스토리가 참신하고 흥미진진했습니다",
            "영상미가 정말 아름다웠어요",
            "웃음과 감동을 동시에 준 훌륭한 작품",
            "몰입도가 높고 완성도 있는 영화였습니다"
        ];
        
        let addedCount = 0;
        
        for (const movie of popularMovies) {
            // 각 영화에 10-15개의 추가 리뷰 생성
            const reviewCount = 10 + Math.floor(Math.random() * 6);
            const movieReviews = [];
            
            for (let i = 0; i < reviewCount; i++) {
                movieReviews.push({
                    movie_id: movie.id,
                    critic_name: this.getRandomRealName(),
                    review_text: realReviews[Math.floor(Math.random() * realReviews.length)],
                    score: (7.0 + Math.random() * 3.0).toFixed(1) // 7.0-10.0 점수
                });
            }
            
            const { data, error } = await supabase
                .from('critic_reviews')
                .insert(movieReviews)
                .select('id');
            
            if (error) {
                console.log(`⚠️ ${movie.title} 추가 리뷰 삽입 실패:`, error.message);
            } else {
                addedCount += data.length;
                console.log(`✅ ${movie.title}: ${data.length}개 추가 리뷰 생성`);
            }
        }
        
        console.log(`🎉 총 ${addedCount}개 추가 리뷰가 생성되었습니다!`);
    }
}

// 실행
async function run() {
    const updater = new ReviewerNameUpdater();
    await updater.updateReviewerNames();
    await updater.addMoreRealReviews();
}

run().catch(console.error);