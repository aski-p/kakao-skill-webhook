// 네이버 API로 직접 영화 데이터 크롤링하여 Supabase에 저장
const axios = require('axios');
const SupabaseClient = require('./config/supabase-client');

class DirectNaverMovieCrawler {
    constructor() {
        this.clientId = process.env.NAVER_CLIENT_ID;
        this.clientSecret = process.env.NAVER_CLIENT_SECRET;
        this.supabase = new SupabaseClient();
        
        // 인기 영화 검색 키워드들
        this.popularMovies = [
            '기생충', '어벤져스', '탑건 매버릭', '인터스텔라', '라라랜드',
            '조커', '겨울왕국', '타이타닉', '아바타', '스파이더맨',
            '아이언맨', '캡틴 아메리카', '토르', '블랙팬서', '닥터 스트레인지',
            '미션 임파서블', '분노의 질주', '트랜스포머', '쥬라기 공원', '해리포터',
            '반지의 제왕', '스타워즈', '배트맨', '슈퍼맨', '원더우먼',
            '범죄도시', '극한직업', '명량', '신과함께', '택시운전사',
            '부산행', '오징어게임', '킹덤', '미나리', '기적',
            '모가디슈', '마이웨이', '국제시장', '베테랑', '암살',
            '실미도', '태극기 휘날리며', '친구', '올드보이', '살인의 추억',
            '도둑들', '광해', '왕의 남자', '관상', '명량',
            '내부자들', '밀정', '아가씨', '곡성', '박쥐',
            '마더', '괴물', '추격자', '황해', '아저씨'
        ];
    }

    async crawlAndInsertMovies() {
        console.log('🎬 네이버 API 직접 크롤링으로 영화 데이터 수집 시작\n');
        
        if (!this.clientId || !this.clientSecret) {
            console.log('❌ 네이버 API 키가 설정되지 않았습니다.');
            return { success: false, message: 'API 키 미설정' };
        }

        if (!this.supabase.client) {
            console.log('❌ Supabase 연결이 되지 않았습니다.');
            return { success: false, message: 'Supabase 연결 실패' };
        }

        const results = {
            totalProcessed: 0,
            newMoviesAdded: 0,
            existingMovies: 0,
            errors: []
        };

        console.log(`📊 검색 대상 영화: ${this.popularMovies.length}개`);
        
        for (const movieTitle of this.popularMovies) {
            try {
                console.log(`\n🔍 "${movieTitle}" 검색 중...`);
                
                // 1. 네이버 영화 API 검색
                const movieData = await this.searchNaverMovie(movieTitle);
                
                if (!movieData) {
                    console.log(`⚠️ "${movieTitle}" 검색 결과 없음`);
                    continue;
                }

                results.totalProcessed++;

                // 2. 중복 확인
                const exists = await this.checkMovieExists(movieData.title, movieData.pubDate);
                
                if (exists) {
                    console.log(`🔄 "${movieData.title}" 이미 존재함`);
                    results.existingMovies++;
                    continue;
                }

                // 3. Supabase에 삽입
                const inserted = await this.insertMovieToSupabase(movieData);
                
                if (inserted) {
                    console.log(`✅ "${movieData.title}" (${movieData.pubDate}) 저장 완료`);
                    results.newMoviesAdded++;
                } else {
                    console.log(`❌ "${movieData.title}" 저장 실패`);
                    results.errors.push(`${movieTitle}: 저장 실패`);
                }

                // API 제한 준수 (초당 10회)
                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (error) {
                console.error(`❌ "${movieTitle}" 처리 중 오류:`, error.message);
                results.errors.push(`${movieTitle}: ${error.message}`);
            }
        }

        console.log('\n🎉 네이버 크롤링 완료!');
        console.log(`📊 총 처리: ${results.totalProcessed}개`);
        console.log(`✅ 새로 추가: ${results.newMoviesAdded}개`);
        console.log(`🔄 기존 영화: ${results.existingMovies}개`);
        console.log(`❌ 오류: ${results.errors.length}개`);

        return {
            success: true,
            message: '네이버 크롤링 완료',
            data: results
        };
    }

    async searchNaverMovie(title) {
        try {
            const response = await axios.get('https://openapi.naver.com/v1/search/movie.json', {
                params: {
                    query: title,
                    display: 1,
                    start: 1
                },
                headers: {
                    'X-Naver-Client-Id': this.clientId,
                    'X-Naver-Client-Secret': this.clientSecret
                },
                timeout: 10000
            });

            if (response.data.items && response.data.items.length > 0) {
                return this.processMovieData(response.data.items[0]);
            }

            return null;

        } catch (error) {
            console.error(`네이버 검색 오류 (${title}):`, error.message);
            return null;
        }
    }

    processMovieData(item) {
        // HTML 태그 제거
        const cleanTitle = item.title.replace(/<\/?[^>]+(>|$)/g, '');
        const cleanDirector = item.director ? item.director.replace(/\|/g, ', ').replace(/,$/, '') : '';
        const cleanActor = item.actor ? item.actor.replace(/\|/g, ', ').replace(/,$/, '') : '';

        return {
            title: cleanTitle,
            director: cleanDirector,
            cast: cleanActor,
            release_year: item.pubDate ? parseInt(item.pubDate) : null,
            poster_image: item.image || null,
            naver_rating: item.userRating ? parseFloat(item.userRating) : null,
            link: item.link || null,
            subtitle: item.subtitle || null,
            pubDate: item.pubDate
        };
    }

    async checkMovieExists(title, year) {
        try {
            const { data, error } = await this.supabase.client
                .from('movies')
                .select('id')
                .eq('title', title)
                .limit(1);

            if (error) {
                console.error('중복 확인 오류:', error);
                return false;
            }

            return data && data.length > 0;

        } catch (error) {
            console.error('중복 확인 예외:', error);
            return false;
        }
    }

    async insertMovieToSupabase(movieData) {
        try {
            const insertData = {
                title: movieData.title,
                title_english: null,
                director: movieData.director || null,
                cast: movieData.cast || null,
                genre: null,
                release_year: movieData.release_year,
                release_date: null,
                running_time: null,
                rating: null,
                country: '한국',
                production_company: null,
                plot_summary: `${movieData.title}${movieData.director ? ` - 감독: ${movieData.director}` : ''}${movieData.cast ? `, 출연: ${movieData.cast.split(', ').slice(0, 3).join(', ')}` : ''}`,
                poster_image: movieData.poster_image,
                naver_rating: movieData.naver_rating,
                critic_score: null,
                audience_score: movieData.naver_rating,
                data_source: 'naver_api',
                naver_link: movieData.link,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase.client
                .from('movies')
                .insert([insertData])
                .select();

            if (error) {
                console.error('영화 삽입 오류:', error);
                return false;
            }

            return true;

        } catch (error) {
            console.error('영화 삽입 예외:', error);
            return false;
        }
    }

    // 현재 데이터베이스 상태 확인
    async checkDatabaseStatus() {
        try {
            const { count, error } = await this.supabase.client
                .from('movies')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error('DB 상태 확인 오류:', error);
                return 0;
            }

            return count || 0;

        } catch (error) {
            console.error('DB 상태 확인 예외:', error);
            return 0;
        }
    }
}

// 실행 함수
async function executeDirectCrawling() {
    console.log('🚀 네이버 API 직접 크롤링 실행\n');
    
    const crawler = new DirectNaverMovieCrawler();
    
    // 현재 상태 확인
    const initialCount = await crawler.checkDatabaseStatus();
    console.log(`📊 크롤링 시작 전 영화 수: ${initialCount}개\n`);
    
    // 크롤링 실행
    const result = await crawler.crawlAndInsertMovies();
    
    // 최종 상태 확인
    const finalCount = await crawler.checkDatabaseStatus();
    console.log(`\n📊 크롤링 완료 후 영화 수: ${finalCount}개`);
    console.log(`✅ 실제 추가된 영화: ${finalCount - initialCount}개`);
    
    return result;
}

// 스크립트로 실행시
if (require.main === module) {
    executeDirectCrawling().catch(error => {
        console.error('❌ 크롤링 실행 오류:', error);
        process.exit(1);
    });
}

module.exports = { DirectNaverMovieCrawler, executeDirectCrawling };