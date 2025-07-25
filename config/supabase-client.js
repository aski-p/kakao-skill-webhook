// Supabase 클라이언트 설정
const { createClient } = require('@supabase/supabase-js');

class SupabaseClient {
    constructor() {
        // 환경변수에서 Supabase 설정 가져오기 (Railway 환경변수명 사용)
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!this.supabaseUrl) {
            console.log('⚠️ SUPABASE_URL 환경변수가 설정되지 않았습니다.');
            this.client = null;
            return;
        }
        
        if (!this.supabaseKey) {
            console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.');
            this.client = null;
            return;
        }

        // Supabase 클라이언트 생성
        this.client = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✅ Supabase 클라이언트 초기화 완료');
    }

    // 영화 검색 (제목으로)
    async searchMovieByTitle(title) {
        try {
            if (!this.client) {
                console.log('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
                return null;
            }

            console.log(`🔍 Supabase에서 영화 검색: "${title}"`);
            
            // 제목으로 영화 검색 (부분 일치)
            const { data, error } = await this.client
                .from('movies')
                .select(`
                    *,
                    critic_reviews (
                        critic_name,
                        score,
                        review_text
                    ),
                    audience_reviews (
                        username,
                        score,
                        review_text
                    )
                `)
                .or(`title.ilike.%${title}%, keywords.cs.{${title}}`);

            if (error) {
                console.error('❌ Supabase 쿼리 오류:', error);
                return null;
            }

            if (!data || data.length === 0) {
                console.log(`❌ "${title}" 영화를 찾을 수 없습니다.`);
                return null;
            }

            console.log(`✅ "${data[0].title}" 영화 정보 조회 성공`);
            return data[0]; // 첫 번째 매치 반환

        } catch (error) {
            console.error('❌ 영화 검색 중 오류:', error);
            return null;
        }
    }

    // 키워드로 영화 검색 (더 정확한 매칭)
    async searchMovieByKeywords(title) {
        try {
            if (!this.client) {
                console.log('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
                return null;
            }

            console.log(`🔍 키워드로 영화 검색: "${title}"`);
            
            // 정규화된 검색어 생성
            const normalizedTitle = title.toLowerCase().replace(/\s+/g, '').replace(/네이버/g, '');
            
            // 키워드 배열에서 검색
            const { data, error } = await this.client
                .from('movies')
                .select(`
                    *,
                    critic_reviews (
                        critic_name,
                        score,
                        review_text
                    ),
                    audience_reviews (
                        username,
                        score,
                        review_text
                    )
                `)
                .contains('keywords', [normalizedTitle]);

            if (error) {
                console.error('❌ 키워드 검색 오류:', error);
                return null;
            }

            if (data && data.length > 0) {
                console.log(`✅ 키워드 매칭으로 "${data[0].title}" 발견`);
                return data[0];
            }

            // 키워드 검색 실패시 제목 부분 일치로 재시도
            const { data: titleData, error: titleError } = await this.client
                .from('movies')
                .select(`
                    *,
                    critic_reviews (
                        critic_name,
                        score,
                        review_text
                    ),
                    audience_reviews (
                        username,
                        score,
                        review_text
                    )
                `)
                .ilike('title', `%${title}%`);

            if (titleError) {
                console.error('❌ 제목 검색 오류:', titleError);
                return null;
            }

            if (titleData && titleData.length > 0) {
                console.log(`✅ 제목 부분일치로 "${titleData[0].title}" 발견`);
                return titleData[0];
            }

            console.log(`❌ "${title}" 영화를 찾을 수 없습니다.`);
            return null;

        } catch (error) {
            console.error('❌ 키워드 검색 중 오류:', error);
            return null;
        }
    }

    // 새로운 영화 추가
    async addMovie(movieData) {
        try {
            if (!this.client) {
                console.log('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
                return null;
            }

            console.log(`📽️ 새 영화 추가: "${movieData.title}"`);

            // 중복 체크 (제목 + 연도)
            const { data: existing } = await this.client
                .from('movies')
                .select('id')
                .eq('title', movieData.title)
                .eq('release_year', movieData.release_year);

            if (existing && existing.length > 0) {
                console.log(`⚠️ "${movieData.title}" (${movieData.release_year})는 이미 존재합니다.`);
                return existing[0].id;
            }

            // 새 영화 삽입
            const { data, error } = await this.client
                .from('movies')
                .insert(movieData)
                .select();

            if (error) {
                console.error('❌ 영화 추가 오류:', error);
                return null;
            }

            console.log(`✅ "${movieData.title}" 영화 추가 완료`);
            return data[0].id;

        } catch (error) {
            console.error('❌ 영화 추가 중 오류:', error);
            return null;
        }
    }

    // 평론가 리뷰 추가
    async addCriticReviews(movieId, reviews) {
        try {
            if (!this.client || !reviews || reviews.length === 0) {
                return false;
            }

            const reviewsToInsert = reviews.map(review => ({
                movie_id: movieId,
                critic_name: review.name,
                score: review.score,
                review_text: review.review
            }));

            const { error } = await this.client
                .from('critic_reviews')
                .insert(reviewsToInsert);

            if (error) {
                console.error('❌ 평론가 리뷰 추가 오류:', error);
                return false;
            }

            console.log(`✅ ${reviews.length}개 평론가 리뷰 추가 완료`);
            return true;

        } catch (error) {
            console.error('❌ 평론가 리뷰 추가 중 오류:', error);
            return false;
        }
    }

    // 관객 리뷰 추가
    async addAudienceReviews(movieId, reviews) {
        try {
            if (!this.client || !reviews || reviews.length === 0) {
                return false;
            }

            const reviewsToInsert = reviews.map(review => ({
                movie_id: movieId,
                username: review.username,
                score: review.score,
                review_text: review.review
            }));

            const { error } = await this.client
                .from('audience_reviews')
                .insert(reviewsToInsert);

            if (error) {
                console.error('❌ 관객 리뷰 추가 오류:', error);
                return false;
            }

            console.log(`✅ ${reviews.length}개 관객 리뷰 추가 완료`);
            return true;

        } catch (error) {
            console.error('❌ 관객 리뷰 추가 중 오류:', error);
            return false;
        }
    }

    // 모든 영화 목록 조회 (크롤링용)
    async getAllMovies() {
        try {
            if (!this.client) {
                return [];
            }

            const { data, error } = await this.client
                .from('movies')
                .select('title, naver_movie_id, release_year');

            if (error) {
                console.error('❌ 영화 목록 조회 오류:', error);
                return [];
            }

            return data || [];

        } catch (error) {
            console.error('❌ 영화 목록 조회 중 오류:', error);
            return [];
        }
    }

    // 연결 테스트
    async testConnection() {
        try {
            if (!this.client) {
                return false;
            }

            const { data, error } = await this.client
                .from('movies')
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Supabase 연결 테스트 실패:', error);
                return false;
            }

            console.log(`✅ Supabase 연결 성공 - 총 ${data} 개 영화`);
            return true;

        } catch (error) {
            console.error('❌ Supabase 연결 테스트 중 오류:', error);
            return false;
        }
    }
}

module.exports = SupabaseClient;