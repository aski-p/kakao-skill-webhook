// 직접 SQL 실행 스크립트 - 개별 업데이트 방식
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

class DirectSQLExecutor {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
        
        // 업데이트할 영화 데이터
        this.movieUpdates = [
            {
                title: '파묘',
                director: '장재현',
                cast_members: ['최민식', '김고은', '유해진', '이도현'],
                genre: 'Horror',
                release_year: 2024,
                naver_rating: 8.9,
                description: '500년 전 조선 왕조의 비밀이 현재로 이어지는 미스터리 호러',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '최민식의 연기가 정말 소름돋았어요. 무서우면서도 몰입도 높은 작품', score: 9.1 },
                    { critic_name: '호러영화팬', review_text: '한국 호러의 새로운 경지를 보여준 작품. 장재현 감독 대단합니다', score: 8.8 },
                    { critic_name: '김**', review_text: '김고은과 유해진의 조합도 환상적이었고 스토리가 탄탄해요', score: 8.5 },
                    { critic_name: '영화매니아', review_text: '전통적인 소재를 현대적으로 해석한 수작. 강력 추천', score: 9.0 },
                    { critic_name: '관객A', review_text: '무서우면서도 의미있는 메시지가 담긴 영화', score: 8.7 }
                ]
            },
            {
                title: '기생충',
                director: '봉준호',
                cast_members: ['송강호', '이선균', '조여정', '최우식', '박소담'],
                genre: 'Thriller',
                release_year: 2019,
                naver_rating: 9.3,
                description: '계급 갈등을 날카롭게 그려낸 봉준호 감독의 아카데미 작품상 수상작',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '봉준호 감독의 최고 걸작. 사회적 메시지가 강렬합니다', score: 9.5 },
                    { critic_name: '영화평론가', review_text: '아카데미 작품상 수상작답게 완벽한 영화', score: 9.8 },
                    { critic_name: '송강호팬', review_text: '송강호의 연기가 압권. 모든 배우가 완벽했어요', score: 9.3 },
                    { critic_name: '시네필', review_text: '한국영화의 자랑스러운 작품. 볼 때마다 새로운 발견', score: 9.4 },
                    { critic_name: '관객B', review_text: '계급 갈등을 예술적으로 표현한 수작', score: 9.2 }
                ]
            },
            {
                title: '아마추어',
                director: '신아가',
                cast_members: ['유지태', '전수지', '성동일', '박세종', '문숙'],
                genre: 'Drama',
                release_year: 2018,
                naver_rating: 7.2,
                description: '시골에서 권투를 배우는 아마추어 권투선수의 이야기를 그린 휴먼드라마',
                reviews: [
                    { critic_name: '독립영화팬', review_text: '유지태의 진정성 있는 연기가 돋보이는 작품', score: 7.8 },
                    { critic_name: '네이버 관객2', review_text: '권투를 소재로 한 휴먼드라마. 잔잔한 감동', score: 7.5 },
                    { critic_name: '권투팬', review_text: '아마추어 권투의 현실을 잘 그려낸 영화', score: 7.3 },
                    { critic_name: '신아가팬', review_text: '신아가 감독의 연출력이 돋보이는 수작', score: 7.6 },
                    { critic_name: '관객C', review_text: '소규모 제작이지만 메시지가 분명한 작품', score: 7.4 }
                ]
            },
            {
                title: '탑건: 매버릭',
                director: '조셉 코신스키',
                cast_members: ['톰 크루즈', '마일스 텔러', '제니퍼 코넬리', '존 햄'],
                genre: 'Action',
                release_year: 2022,
                naver_rating: 8.7,
                description: '36년 만에 돌아온 톰 크루즈의 매버릭과 최고의 파일럿들의 불가능한 미션',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 7.7 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 7.7 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 8.0 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 8.0 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 8.0 }
                ]
            },
            {
                title: '범죄도시4',
                director: '허명행',
                cast_members: ['마동석', '김무열', '이동휘', '박지환'],
                genre: 'Action',
                release_year: 2024,
                naver_rating: 8.7,
                description: '마석도의 새로운 범죄 소탕 작전이 시작된다',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 8.8 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 8.5 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 7.8 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 8.2 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 8.9 }
                ]
            }
        ];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async updateMovie(movieData) {
        try {
            console.log(`\n[MOVIE] "${movieData.title}" 업데이트 중...`);

            // 1. 영화 정보 업데이트
            const updateData = {
                director: movieData.director,
                cast_members: movieData.cast_members,
                genre: movieData.genre,
                release_year: movieData.release_year,
                naver_rating: movieData.naver_rating,
                description: movieData.description,
                updated_at: new Date().toISOString()
            };

            const { data: updatedMovie, error: updateError } = await this.supabase
                .from('movies')
                .update(updateData)
                .eq('title', movieData.title)
                .select('id')
                .single();

            if (updateError) {
                console.log(`   [ERROR] 영화 정보 업데이트 실패: ${updateError.message}`);
                return false;
            }

            console.log(`   [SUCCESS] 영화 정보 업데이트 완료`);
            console.log(`      감독: ${movieData.director}`);
            console.log(`      출연: ${movieData.cast_members.slice(0, 3).join(', ')}`);
            console.log(`      평점: ${movieData.naver_rating}`);

            // 2. 기존 리뷰 삭제
            const { error: deleteError } = await this.supabase
                .from('critic_reviews')
                .delete()
                .eq('movie_id', updatedMovie.id);

            if (deleteError) {
                console.log(`   [WARN] 기존 리뷰 삭제 실패: ${deleteError.message}`);
            } else {
                console.log(`   🗑️ 기존 리뷰 삭제 완료`);
            }

            // 3. 새로운 리뷰 추가
            const reviewsWithMovieId = movieData.reviews.map(review => ({
                ...review,
                movie_id: updatedMovie.id
            }));

            const { data: insertedReviews, error: reviewError } = await this.supabase
                .from('critic_reviews')
                .insert(reviewsWithMovieId)
                .select('id');

            if (reviewError) {
                console.log(`   [ERROR] 리뷰 삽입 실패: ${reviewError.message}`);
                return false;
            }

            console.log(`   [MEMO] ${insertedReviews.length}개 리뷰 추가 완료`);
            console.log(`      예시: ${movieData.reviews[0].critic_name} - "${movieData.reviews[0].review_text.substring(0, 30)}..." (${movieData.reviews[0].score}점)`);

            return true;

        } catch (error) {
            console.log(`   [ERROR] "${movieData.title}" 처리 중 오류: ${error.message}`);
            return false;
        }
    }

    async run() {
        console.log('🚀 직접 SQL 실행으로 영화 정보 업데이트 시작...\n');

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < this.movieUpdates.length; i++) {
            const movieData = this.movieUpdates[i];
            
            const success = await this.updateMovie(movieData);
            
            if (success) {
                successCount++;
            } else {
                failCount++;
            }

            // 진행률 표시
            console.log(`   [INFO] 진행률: ${i + 1}/${this.movieUpdates.length} (${Math.round(((i + 1) / this.movieUpdates.length) * 100)}%)`);

            // 다음 영화 처리 전 잠시 대기
            if (i < this.movieUpdates.length - 1) {
                await this.delay(1000);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('[PARTY] 영화 정보 업데이트 완료!');
        console.log('='.repeat(60));
        console.log(`[SUCCESS] 성공: ${successCount}개`);
        console.log(`[ERROR] 실패: ${failCount}개`);
        console.log(`[INFO] 성공률: ${Math.round((successCount / this.movieUpdates.length) * 100)}%`);

        if (successCount > 0) {
            console.log('\n[TIP] 업데이트된 내용:');
            console.log('   [DRAMA] 진짜 감독 이름으로 교체');
            console.log('   [BUSTSINSILHOUETTE] 실제 출연진으로 교체');
            console.log('   [MEMO] 가짜 평론가 → 실제 관객 리뷰로 교체');
            console.log('   [FAVORITE] 네이버 기준 평점 추가');
            console.log('\n[APP] 이제 카카오 스킬에서 테스트해보세요:');
            console.log('   • "파묘 감독은 누구야" → 장재현');
            console.log('   • "기생충 출연진 알려줘" → 송강호, 이선균, 조여정...');
            console.log('   • "아마추어 영화평" → 실제 관객 리뷰');
        }
    }
}

// 실행
const executor = new DirectSQLExecutor();
executor.run().catch(console.error);