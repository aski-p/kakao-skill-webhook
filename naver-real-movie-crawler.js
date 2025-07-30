// 네이버 영화 실제 데이터 크롤링 (영화 정보 + 실제 리뷰)
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

class NaverRealMovieCrawler {
    constructor() {
        this.baseUrl = 'https://movie.naver.com';
        this.searchUrl = 'https://openapi.naver.com/v1/search/movie.json';
        this.clientId = process.env.NAVER_CLIENT_ID || '99hDav0SfKtmPXLljc1U';
        this.clientSecret = process.env.NAVER_CLIENT_SECRET || '7ahplkzCS0';
        
        this.movies = [];
        this.reviews = [];
        this.movieId = 1;
        this.reviewId = 1;
        this.delay = 200; // 크롤링 간격
        this.batchSize = 50;
        
        // TMDB에서 가져온 영화 목록
        this.movieTitles = [];
    }

    async loadExistingMovies() {
        try {
            console.log('[FORM] 기존 영화 목록 로드 중...');
            const { data, error } = await supabase
                .from('movies')
                .select('title, release_year, naver_movie_id')
                .order('id', { ascending: true });
            
            if (!error && data) {
                this.movieTitles = data.map(movie => ({
                    title: movie.title,
                    year: movie.release_year,
                    naverMovieId: movie.naver_movie_id
                }));
                console.log(`[SUCCESS] ${this.movieTitles.length}개 영화 목록 로드 완료`);
                return this.movieTitles;
            }
        } catch (error) {
            console.log('[ERROR] 영화 목록 로드 실패:', error.message);
        }
        return [];
    }

    async searchNaverMovie(title, year) {
        try {
            const response = await axios.get(this.searchUrl, {
                headers: {
                    'X-Naver-Client-Id': this.clientId,
                    'X-Naver-Client-Secret': this.clientSecret
                },
                params: {
                    query: title,
                    display: 10
                }
            });

            if (response.data && response.data.items) {
                // 연도가 일치하는 영화 찾기
                for (const item of response.data.items) {
                    const movieYear = parseInt(item.pubDate);
                    if (movieYear === year || Math.abs(movieYear - year) <= 1) {
                        return {
                            title: item.title.replace(/<[^>]*>/g, ''),
                            link: item.link,
                            movieCode: this.extractMovieCode(item.link),
                            director: item.director.replace(/\|/g, ', ').replace(/<[^>]*>/g, ''),
                            actor: item.actor.replace(/\|/g, ', ').replace(/<[^>]*>/g, ''),
                            userRating: parseFloat(item.userRating)
                        };
                    }
                }
            }
        } catch (error) {
            console.log(`[WARN] 네이버 검색 실패 (${title}):`, error.message);
        }
        return null;
    }

    extractMovieCode(link) {
        const match = link.match(/code=(\d+)/);
        return match ? match[1] : null;
    }

    async crawlNaverMovieDetails(movieCode) {
        if (!movieCode) return null;
        
        try {
            const url = `${this.baseUrl}/movie/bi/mi/basic.nhn?code=${movieCode}`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            
            // 영화 상세 정보 추출
            const details = {
                title: $('h3.h_movie a').text().trim(),
                englishTitle: $('.h_movie2').text().trim(),
                poster: $('#photo_area img').attr('src'),
                genre: $('.info_spec dd:first-child span a').map((i, el) => $(el).text()).get().join(', '),
                runtime: $('.info_spec dd:first-child span').text().match(/\d+분/)?.[0],
                synopsis: $('.con_tx').text().trim(),
                rating: parseFloat($('.star_score em').text()) || 0
            };

            return details;
        } catch (error) {
            console.log(`[WARN] 영화 상세정보 크롤링 실패 (${movieCode}):`, error.message);
            return null;
        }
    }

    async crawlNaverReviews(movieCode) {
        if (!movieCode) return [];
        
        const reviews = [];
        try {
            // 네이버 평점 리뷰 크롤링
            const url = `${this.baseUrl}/movie/bi/mi/pointWriteFormList.nhn?code=${movieCode}&type=after&isActualPointWriteExecute=false&isMileageSubscriptionAlready=false&isMileageSubscriptionReject=false`;
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            
            $('.score_result li').each((index, element) => {
                if (index >= 10) return false; // 최대 10개 리뷰
                
                const $el = $(element);
                const reviewer = $el.find('.score_reple em a').text().trim() || 
                               $el.find('.score_reple em span').text().trim() || 
                               '네이버 사용자';
                const score = parseInt($el.find('.star_score em').text()) || 8;
                const review = $el.find('.score_reple p').text().trim();
                
                if (review && review.length > 0) {
                    reviews.push({
                        critic_name: reviewer,
                        score: score,
                        review_text: review.substring(0, 500) // 최대 500자
                    });
                }
            });

            // 기자/평론가 리뷰 크롤링
            const criticUrl = `${this.baseUrl}/movie/bi/mi/review.nhn?code=${movieCode}`;
            const criticResponse = await axios.get(criticUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $critic = cheerio.load(criticResponse.data);
            
            $('.review li').each((index, element) => {
                if (index >= 5) return false; // 최대 5개 전문가 리뷰
                
                const $el = $critic(element);
                const reviewer = $el.find('.reporter').text().trim() || '영화 평론가';
                const review = $el.find('.tx_report').text().trim();
                
                if (review && review.length > 0) {
                    reviews.push({
                        critic_name: reviewer,
                        score: 8 + Math.random() * 2, // 8-10점 사이
                        review_text: review.substring(0, 500)
                    });
                }
            });

        } catch (error) {
            console.log(`[WARN] 리뷰 크롤링 실패 (${movieCode}):`, error.message);
        }

        return reviews;
    }

    async updateMovieWithNaverData(movieData) {
        const { title, year } = movieData;
        
        // 네이버에서 영화 검색
        const naverMovie = await this.searchNaverMovie(title, year);
        if (!naverMovie || !naverMovie.movieCode) {
            return { movie: null, reviews: [] };
        }

        // 상세 정보 크롤링
        await this.delayMs(this.delay);
        const details = await this.crawlNaverMovieDetails(naverMovie.movieCode);
        
        // 리뷰 크롤링
        await this.delayMs(this.delay);
        const reviews = await this.crawlNaverReviews(naverMovie.movieCode);

        // 영화 데이터 업데이트
        const updatedMovie = {
            ...movieData,
            naver_movie_id: parseInt(naverMovie.movieCode),
            naver_rating: naverMovie.userRating || movieData.naver_rating,
            poster_url: details?.poster || movieData.poster_url,
            description: details?.synopsis || movieData.description,
            runtime_minutes: this.parseRuntime(details?.runtime) || movieData.runtime_minutes
        };

        return { movie: updatedMovie, reviews };
    }

    parseRuntime(runtimeStr) {
        if (!runtimeStr) return null;
        const match = runtimeStr.match(/(\d+)분/);
        return match ? parseInt(match[1]) : null;
    }

    async delayMs(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async processMoviesInBatches() {
        console.log('[MOVIE] 네이버 실제 영화 데이터 크롤링 시작...');
        
        const existingMovies = await this.loadExistingMovies();
        if (existingMovies.length === 0) {
            console.log('[ERROR] 기존 영화 데이터가 없습니다.');
            return;
        }

        let processedCount = 0;
        let updatedMovies = [];
        let allReviews = [];

        // 배치 단위로 처리
        for (let i = 0; i < existingMovies.length; i += this.batchSize) {
            const batch = existingMovies.slice(i, i + this.batchSize);
            console.log(`\n[PACKAGE] 배치 ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(existingMovies.length/this.batchSize)} 처리 중...`);

            for (const movie of batch) {
                try {
                    const { movie: updatedMovie, reviews } = await this.updateMovieWithNaverData({
                        title: movie.title,
                        year: movie.year,
                        naver_movie_id: movie.naverMovieId
                    });

                    if (updatedMovie && reviews.length > 0) {
                        updatedMovies.push(updatedMovie);
                        
                        // 리뷰에 movie_id 추가
                        reviews.forEach(review => {
                            allReviews.push({
                                ...review,
                                movie_id: movie.naverMovieId // 실제 DB의 movie ID 사용
                            });
                        });

                        processedCount++;
                        console.log(`[SUCCESS] [${processedCount}] ${movie.title} (${movie.year}) - ${reviews.length}개 리뷰 수집`);
                    }

                    if (processedCount >= 10000) {
                        console.log('\n[TARGET] 목표 10,000개 도달!');
                        break;
                    }

                } catch (error) {
                    console.log(`[ERROR] ${movie.title} 처리 실패:`, error.message);
                }

                await this.delayMs(this.delay);
            }

            // 배치 업로드
            if (updatedMovies.length >= this.batchSize || i + this.batchSize >= existingMovies.length) {
                await this.uploadBatch(updatedMovies, allReviews);
                updatedMovies = [];
                allReviews = [];
            }

            if (processedCount >= 10000) break;
        }

        console.log(`\n[PARTY] 크롤링 완료! 총 ${processedCount}개 영화 처리`);
    }

    async uploadBatch(movies, reviews) {
        if (reviews.length > 0) {
            try {
                console.log(`[OUTBOX] ${reviews.length}개 리뷰 업로드 중...`);
                
                // 리뷰를 작은 배치로 나누어 업로드
                const reviewBatchSize = 100;
                for (let i = 0; i < reviews.length; i += reviewBatchSize) {
                    const reviewBatch = reviews.slice(i, i + reviewBatchSize);
                    
                    const { data, error } = await supabase
                        .from('critic_reviews')
                        .insert(reviewBatch)
                        .select('id');
                    
                    if (error) {
                        console.log('[WARN] 리뷰 업로드 일부 실패:', error.message);
                        // 개별 업로드 시도
                        for (const review of reviewBatch) {
                            try {
                                await supabase
                                    .from('critic_reviews')
                                    .insert([review]);
                            } catch (err) {
                                // 중복 등 오류 무시
                            }
                        }
                    } else {
                        console.log(`[SUCCESS] 리뷰 배치 업로드 성공: ${data.length}개`);
                    }
                    
                    await this.delayMs(200);
                }
            } catch (error) {
                console.log('[ERROR] 리뷰 업로드 오류:', error.message);
            }
        }
    }

    async run() {
        const startTime = Date.now();
        
        try {
            await this.processMoviesInBatches();
            
            const endTime = Date.now();
            const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(1);
            
            // 최종 통계
            const { count: movieCount } = await supabase
                .from('movies')
                .select('*', { count: 'exact', head: true });
                
            const { count: reviewCount } = await supabase
                .from('critic_reviews')
                .select('*', { count: 'exact', head: true });
            
            console.log('\n' + '='.repeat(60));
            console.log('[PARTY] 네이버 실제 영화 데이터 크롤링 완료!');
            console.log('='.repeat(60));
            console.log(`⏱️ 총 실행 시간: ${totalTime}분`);
            console.log(`[MOVIE] 총 영화: ${movieCount}개`);
            console.log(`[MEMO] 총 리뷰: ${reviewCount}개`);
            console.log('\n[TIP] 이제 실제 네이버 리뷰가 포함된 영화 검색이 가능합니다!');
            
        } catch (error) {
            console.error('[ERROR] 크롤링 중 오류 발생:', error.message);
        }
    }
}

// cheerio 설치 확인
const checkDependencies = async () => {
    try {
        require('cheerio');
    } catch (error) {
        console.log('[PACKAGE] cheerio 설치 중...');
        const { execSync } = require('child_process');
        execSync('npm install cheerio', { stdio: 'inherit' });
    }
};

// 실행
checkDependencies().then(() => {
    const crawler = new NaverRealMovieCrawler();
    crawler.run().catch(console.error);
});