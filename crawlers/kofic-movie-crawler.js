// 영화진흥위원회 API를 통한 전체 영화 데이터 수집
const axios = require('axios');
const SupabaseClient = require('../config/supabase-client');

class KoficMovieCrawler {
    constructor() {
        this.apiKey = process.env.KOFIC_API_KEY;
        this.baseUrl = 'http://www.kobis.or.kr/kobisopenapi/webservice/rest';
        this.supabase = new SupabaseClient();
        
        if (!this.apiKey) {
            console.warn('⚠️ KOFIC_API_KEY 환경변수가 설정되지 않았습니다.');
        }
    }

    // 전체 영화 목록 수집 (박스오피스 + 영화 상세정보)
    async crawlAllMovies() {
        console.log('🎬 영화진흥위원회 전체 영화 데이터 수집 시작');
        
        if (!this.apiKey) {
            throw new Error('KOFIC_API_KEY가 설정되지 않았습니다.');
        }

        const results = {
            totalProcessed: 0,
            newMoviesAdded: 0,
            existingMovies: 0,
            errors: []
        };

        try {
            // 1. 최근 10년간 연도별 박스오피스 데이터 수집
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 10;

            console.log(`📅 ${startYear}년 ~ ${currentYear}년 영화 데이터 수집`);

            for (let year = startYear; year <= currentYear; year++) {
                console.log(`\n📊 ${year}년 영화 수집 중...`);
                
                try {
                    await this.crawlMoviesByYear(year, results);
                    // API 호출 간격 조절 (과부하 방지)
                    await this.sleep(500);
                } catch (error) {
                    console.error(`❌ ${year}년 데이터 수집 오류:`, error.message);
                    results.errors.push(`${year}년: ${error.message}`);
                }
            }

            // 2. 영화 상세 정보 보완
            await this.enrichMovieDetails(results);

            console.log('\n🎉 영화진흥위원회 데이터 수집 완료');
            console.log(`📊 총 처리: ${results.totalProcessed}개`);
            console.log(`✅ 신규 추가: ${results.newMoviesAdded}개`);
            console.log(`🔄 기존 영화: ${results.existingMovies}개`);

            if (results.errors.length > 0) {
                console.log(`⚠️ 오류 발생: ${results.errors.length}건`);
            }

            return {
                success: true,
                ...results
            };

        } catch (error) {
            console.error('❌ 영화진흥위원회 크롤링 실패:', error);
            return {
                success: false,
                error: error.message,
                ...results
            };
        }
    }

    // 연도별 영화 수집
    async crawlMoviesByYear(year, results) {
        // 월별로 박스오피스 데이터 수집
        for (let month = 1; month <= 12; month++) {
            const targetDate = `${year}${month.toString().padStart(2, '0')}`;
            
            try {
                // 월간 박스오피스 수집
                const monthlyMovies = await this.getMonthlyBoxOffice(targetDate);
                
                for (const movie of monthlyMovies) {
                    await this.processMovie(movie, results);
                    await this.sleep(200); // API 호출 간격
                }

            } catch (error) {
                console.error(`❌ ${year}년 ${month}월 데이터 오류:`, error.message);
                results.errors.push(`${year}-${month}: ${error.message}`);
            }
        }
    }

    // 월간 박스오피스 데이터 가져오기
    async getMonthlyBoxOffice(targetDate) {
        const url = `${this.baseUrl}/boxoffice/searchWeeklyBoxOfficeList.json`;
        const params = {
            key: this.apiKey,
            targetDt: targetDate + '01', // 해당 월 첫째 주
            weekGb: '0' // 주간
        };

        try {
            const response = await axios.get(url, { 
                params,
                timeout: 10000
            });

            if (response.data?.boxOfficeResult?.weeklyBoxOfficeList) {
                return response.data.boxOfficeResult.weeklyBoxOfficeList;
            }

            return [];

        } catch (error) {
            console.error(`❌ 박스오피스 API 오류 (${targetDate}):`, error.message);
            return [];
        }
    }

    // 개별 영화 처리
    async processMovie(boxOfficeMovie, results) {
        try {
            results.totalProcessed++;

            // 영화 상세 정보 가져오기
            const movieDetail = await this.getMovieDetail(boxOfficeMovie.movieCd);
            
            if (!movieDetail) {
                console.log(`⚠️ 영화 상세 정보 없음: ${boxOfficeMovie.movieNm}`);
                return;
            }

            // 중복 검사
            const existingMovie = await this.checkMovieExists(
                movieDetail.movieNm, 
                movieDetail.prdtYear
            );

            if (existingMovie) {
                results.existingMovies++;
                return;
            }

            // Supabase에 저장
            const success = await this.saveMovieToSupabase(movieDetail, boxOfficeMovie);
            
            if (success) {
                results.newMoviesAdded++;
                console.log(`✅ 저장 완료: ${movieDetail.movieNm} (${movieDetail.prdtYear})`);
            }

        } catch (error) {
            console.error(`❌ 영화 처리 오류:`, error.message);
            results.errors.push(`${boxOfficeMovie?.movieNm}: ${error.message}`);
        }
    }

    // 영화 상세 정보 조회
    async getMovieDetail(movieCd) {
        const url = `${this.baseUrl}/movie/searchMovieInfo.json`;
        const params = {
            key: this.apiKey,
            movieCd: movieCd
        };

        try {
            const response = await axios.get(url, { 
                params,
                timeout: 10000
            });

            if (response.data?.movieInfoResult?.movieInfo) {
                return response.data.movieInfoResult.movieInfo;
            }

            return null;

        } catch (error) {
            console.error(`❌ 영화 상세 정보 API 오류 (${movieCd}):`, error.message);
            return null;
        }
    }

    // 중복 영화 검사
    async checkMovieExists(title, year) {
        if (!this.supabase.client) {
            return false;
        }

        try {
            const { data, error } = await this.supabase.client
                .from('movies')
                .select('id')
                .eq('title', title)
                .eq('release_year', parseInt(year))
                .limit(1);

            if (error) {
                console.error('중복 검사 오류:', error);
                return false;
            }

            return data && data.length > 0;

        } catch (error) {
            console.error('중복 검사 예외:', error);
            return false;
        }
    }

    // Supabase에 영화 데이터 저장
    async saveMovieToSupabase(movieDetail, boxOfficeData) {
        if (!this.supabase.client) {
            console.warn('Supabase 연결 없음 - 저장 스킵');
            return false;
        }

        try {
            // 감독 정보 추출
            const directors = movieDetail.directors?.map(d => d.peopleNm).join(', ') || '';
            
            // 출연진 정보 추출
            const actors = movieDetail.actors?.slice(0, 5).map(a => a.peopleNm).join(', ') || '';
            
            // 장르 정보 추출
            const genres = movieDetail.genres?.map(g => g.genreNm).join(', ') || '';

            // 영화 기본 정보
            const movieData = {
                title: movieDetail.movieNm,
                title_english: movieDetail.movieNmEn || null,
                director: directors,
                cast: actors,
                genre: genres,
                release_year: parseInt(movieDetail.prdtYear) || null,
                release_date: movieDetail.openDt || null,
                running_time: parseInt(movieDetail.showTm) || null,
                rating: movieDetail.watchGradeNm || null,
                country: movieDetail.nations?.map(n => n.nationNm).join(', ') || '한국',
                production_company: movieDetail.companys?.find(c => c.companyPartNm === '제작사')?.companyNm || '',
                plot_summary: `${movieDetail.movieNm} (${movieDetail.prdtYear}) - ${genres}`,
                poster_image: null, // 영화진흥위원회 API는 포스터 제공 안함
                naver_rating: null,
                critic_score: null,
                audience_score: null,
                data_source: 'kofic_api',
                kofic_movie_code: movieDetail.movieCd,
                box_office_rank: parseInt(boxOfficeData?.rank) || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // movies 테이블에 삽입
            const { data, error } = await this.supabase.client
                .from('movies')
                .insert([movieData])
                .select();

            if (error) {
                console.error('영화 저장 오류:', error);
                return false;
            }

            return true;

        } catch (error) {
            console.error('영화 저장 예외:', error);
            return false;
        }
    }

    // 영화 상세 정보 보완 (네이버 API 활용)
    async enrichMovieDetails(results) {
        console.log('\n🔍 영화 상세 정보 보완 시작...');
        
        try {
            // 포스터가 없는 영화들 조회
            const { data: moviesNeedPoster, error } = await this.supabase.client
                .from('movies')
                .select('id, title, release_year')
                .is('poster_image', null)
                .eq('data_source', 'kofic_api')
                .limit(100); // 한 번에 100개씩 처리

            if (error || !moviesNeedPoster) {
                console.log('포스터 보완할 영화 없음');
                return;
            }

            console.log(`📸 포스터 정보 보완 대상: ${moviesNeedPoster.length}개`);

            const NaverMovieCrawler = require('./naver-movie-crawler');
            const naverCrawler = new NaverMovieCrawler();

            for (const movie of moviesNeedPoster) {
                try {
                    const naverMovieData = await naverCrawler.searchMovieByTitle(movie.title);
                    
                    if (naverMovieData && naverMovieData.image) {
                        await this.supabase.client
                            .from('movies')
                            .update({
                                poster_image: naverMovieData.image,
                                naver_rating: naverMovieData.userRating || null,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', movie.id);

                        console.log(`📸 포스터 추가: ${movie.title}`);
                    }

                    await this.sleep(500); // API 호출 간격

                } catch (error) {
                    console.error(`포스터 보완 오류 (${movie.title}):`, error.message);
                }
            }

        } catch (error) {
            console.error('상세 정보 보완 오류:', error);
        }
    }

    // 지연 함수
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = KoficMovieCrawler;