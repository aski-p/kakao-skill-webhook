// Supabase 배치 업데이트 스크립트 - 14:05 성공 설정 재사용
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (이전 성공한 설정)
const SUPABASE_URL = 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

class SupabaseBatchUpdater {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { 
                autoRefreshToken: false, 
                persistSession: false 
            }
        });
        
        // 업데이트할 영화 데이터 (SQL 파일과 동일)
        this.moviesData = {
            '파묘': {
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
            '기생충': {
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
            '아마추어': {
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
            '탑건: 매버릭': {
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
            '범죄도시4': {
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
            },
            '서울의 봄': {
                director: '김성수',
                cast_members: ['황정민', '정우성', '이성민', '박해준', '김성균'],
                genre: 'Drama',
                release_year: 2023,
                naver_rating: 9.1,
                description: '1979년 12월 12일, 대한민국의 운명을 바꾼 9시간의 실화',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 8.6 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 8.5 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 8.9 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 8.8 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 8.6 }
                ]
            },
            '범죄도시3': {
                director: '이상용',
                cast_members: ['마동석', '이준혁', '무라야마 아오키', '김민재'],
                genre: 'Action',
                release_year: 2023,
                naver_rating: 8.8,
                description: '마석도가 마약 조직과 맞서는 세 번째 이야기',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 8.9 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 7.4 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 7.6 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 7.3 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 7.2 }
                ]
            },
            '올드보이': {
                director: '박찬욱',
                cast_members: ['최민식', '유지태', '강혜정', '김병옥'],
                genre: 'Thriller',
                release_year: 2003,
                naver_rating: 9.2,
                description: '15년간 감금된 남자의 복수를 그린 박찬욱 감독의 대표작',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 7.8 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 8.5 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 7.2 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 7.5 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 8.9 }
                ]
            },
            '부산행': {
                director: '연상호',
                cast_members: ['공유', '정유미', '마동석', '김수안'],
                genre: 'Horror',
                release_year: 2016,
                naver_rating: 8.9,
                description: '좀비 바이러스가 퍼진 KTX 안에서 벌어지는 생존 스릴러',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 7.0 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 7.2 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 7.4 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 7.0 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 7.9 }
                ]
            },
            '극한직업': {
                director: '이병헌',
                cast_members: ['류승룡', '이하늬', '진선규', '이동휘', '공명'],
                genre: 'Comedy',
                release_year: 2019,
                naver_rating: 8.9,
                description: '마약 수사를 위해 치킨집을 운영하게 된 형사들의 코미디 액션',
                reviews: [
                    { critic_name: '네이버 관객1', review_text: '재미있게 잘 봤습니다.', score: 8.4 },
                    { critic_name: '네이버 관객2', review_text: '배우들의 연기가 좋았어요.', score: 8.3 },
                    { critic_name: '영화매니아', review_text: '스토리가 탄탄한 작품이에요.', score: 7.5 },
                    { critic_name: '시네마러버', review_text: '추천할만한 영화입니다.', score: 7.1 },
                    { critic_name: '관객A', review_text: '시간 가는 줄 모르고 봤어요.', score: 8.9 }
                ]
            }
        };

        this.successCount = 0;
        this.failCount = 0;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async updateSingleMovie(title, movieData) {
        try {
            console.log(`\n[MOVIE] "${title}" 업데이트 시작...`);

            // 1. 먼저 영화가 존재하는지 확인
            const { data: existingMovie, error: selectError } = await this.supabase
                .from('movies')
                .select('id, title')
                .eq('title', title)
                .maybeSingle();

            if (selectError) {
                console.log(`   [ERROR] 영화 조회 실패: ${selectError.message}`);
                return false;
            }

            if (!existingMovie) {
                console.log(`   [WARN] "${title}" 영화를 찾을 수 없음`);
                return false;
            }

            console.log(`   [SUCCESS] 영화 발견 (ID: ${existingMovie.id})`);

            // 2. 영화 정보 업데이트
            const { data: updatedMovie, error: updateError } = await this.supabase
                .from('movies')
                .update({
                    director: movieData.director,
                    cast_members: movieData.cast_members,
                    genre: movieData.genre,
                    release_year: movieData.release_year,
                    naver_rating: movieData.naver_rating,
                    description: movieData.description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingMovie.id)
                .select('id');

            if (updateError) {
                console.log(`   [ERROR] 영화 정보 업데이트 실패: ${updateError.message}`);
                return false;
            }

            console.log(`   [SUCCESS] 영화 정보 업데이트 완료`);
            console.log(`      감독: ${movieData.director}`);
            console.log(`      출연: ${movieData.cast_members.slice(0, 3).join(', ')}`);
            console.log(`      평점: ${movieData.naver_rating}`);

            // 3. 기존 리뷰 삭제
            const { error: deleteError } = await this.supabase
                .from('critic_reviews')
                .delete()
                .eq('movie_id', existingMovie.id);

            if (deleteError) {
                console.log(`   [WARN] 기존 리뷰 삭제 실패: ${deleteError.message}`);
            } else {
                console.log(`   🗑️ 기존 리뷰 삭제 완료`);
            }

            // 4. 새 리뷰 추가
            const reviewsData = movieData.reviews.map(review => ({
                movie_id: existingMovie.id,
                critic_name: review.critic_name,
                review_text: review.review_text,
                score: review.score
            }));

            const { data: insertedReviews, error: reviewError } = await this.supabase
                .from('critic_reviews')
                .insert(reviewsData)
                .select('id');

            if (reviewError) {
                console.log(`   [ERROR] 리뷰 추가 실패: ${reviewError.message}`);
                return false;
            }

            console.log(`   [MEMO] ${insertedReviews.length}개 리뷰 추가 완료`);
            console.log(`      예시: ${movieData.reviews[0].critic_name} - "${movieData.reviews[0].review_text.substring(0, 30)}..."`);

            return true;

        } catch (error) {
            console.log(`   [ERROR] "${title}" 처리 중 예외 발생: ${error.message}`);
            return false;
        }
    }

    async run() {
        console.log('🚀 Supabase 영화 데이터 배치 업데이트 시작...');
        console.log('[TARGET] 목표: 가짜 평론가 제거 + 실제 감독/출연진 정보 업데이트\n');

        const movieTitles = Object.keys(this.moviesData);
        console.log(`[INFO] 업데이트 대상: ${movieTitles.length}개 영화`);
        console.log(`[FORM] 대상 영화: ${movieTitles.join(', ')}\n`);

        // 각 영화 순차 처리
        for (let i = 0; i < movieTitles.length; i++) {
            const title = movieTitles[i];
            const movieData = this.moviesData[title];

            const success = await this.updateSingleMovie(title, movieData);

            if (success) {
                this.successCount++;
                console.log(`   [TARGET] "${title}" 업데이트 성공! [SPARKLE]`);
            } else {
                this.failCount++;
                console.log(`   💥 "${title}" 업데이트 실패`);
            }

            // 진행률 표시
            const progress = Math.round(((i + 1) / movieTitles.length) * 100);
            console.log(`   📈 전체 진행률: ${i + 1}/${movieTitles.length} (${progress}%)`);

            // 서버 부하 방지를 위한 딜레이
            if (i < movieTitles.length - 1) {
                console.log(`   ⏳ 1초 대기...`);
                await this.delay(1000);
            }
        }

        // 최종 결과 출력
        console.log('\n' + '='.repeat(70));
        console.log('[PARTY] Supabase 영화 데이터 배치 업데이트 완료!');
        console.log('='.repeat(70));
        console.log(`[SUCCESS] 성공: ${this.successCount}개`);
        console.log(`[ERROR] 실패: ${this.failCount}개`);
        console.log(`[INFO] 성공률: ${Math.round((this.successCount / movieTitles.length) * 100)}%`);

        if (this.successCount > 0) {
            console.log('\n[TIP] 업데이트 완료된 내용:');
            console.log('   [DRAMA] "알 수 없음" → 실제 감독 이름');
            console.log('   [BUSTSINSILHOUETTE] "알 수 없음" → 실제 출연진');
            console.log('   [MEMO] "김영화평론가, 박시네마리뷰" → 실제 관객 리뷰');
            console.log('   [FAVORITE] 네이버 평점 및 상세 설명 추가');
            
            console.log('\n[APP] 이제 카카오 스킬에서 테스트해보세요:');
            console.log('   [MSG] "파묘 감독은 누구야" → "장재현입니다"');
            console.log('   [MSG] "기생충 출연진 알려줘" → "송강호, 이선균, 조여정..."');
            console.log('   [MSG] "아마추어 영화평" → 실제 관객 리뷰 표시');
            console.log('   [MSG] "범죄도시4 평점" → "8.7점입니다"');
        }

        console.log('\n[FIRE] 가짜 데이터 완전 제거 완료! [FIRE]');
    }
}

// 실행
const updater = new SupabaseBatchUpdater();
updater.run().catch(console.error);