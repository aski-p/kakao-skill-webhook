// Playwright 기반 실시간 영화 데이터 크롤러
const { chromium } = require('playwright');
const cheerio = require('cheerio');

class PlaywrightCrawler {
    constructor() {
        this.browser = null;
        this.timeout = 10000;
    }

    async init() {
        try {
            console.log('🎭 Playwright 브라우저 초기화 중...');
            this.browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('✅ Playwright 브라우저 준비 완료');
            return true;
        } catch (error) {
            console.error('❌ Playwright 초기화 실패:', error.message);
            return false;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // 네이버 영화 실시간 평점 크롤링
    async crawlNaverMovie(movieTitle) {
        if (!this.browser) {
            const initialized = await this.init();
            if (!initialized) return null;
        }

        const page = await this.browser.newPage();
        
        try {
            console.log(`🎬 네이버 영화 검색: ${movieTitle}`);
            
            // 네이버 영화 검색
            const searchUrl = `https://movie.naver.com/movie/search/result.naver?query=${encodeURIComponent(movieTitle)}&section=all&ie=utf8`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            // 첫 번째 영화 결과 클릭
            const firstMovie = await page.locator('.search_list_1 .result_thumb a').first();
            if (await firstMovie.count() > 0) {
                await firstMovie.click();
                await page.waitForLoadState('networkidle');
                
                // 영화 상세 정보 추출
                const movieData = await this.extractMovieDetails(page);
                console.log(`✅ ${movieTitle} 실시간 데이터 수집 완료`);
                
                return movieData;
            } else {
                console.log(`⚠️ ${movieTitle} 검색 결과 없음`);
                return null;
            }
            
        } catch (error) {
            console.error(`❌ ${movieTitle} 크롤링 실패:`, error.message);
            return null;
        } finally {
            await page.close();
        }
    }

    // 영화 상세 정보 추출
    async extractMovieDetails(page) {
        try {
            const movieInfo = {
                title: '',
                rating: '',
                expertReviews: [],
                audienceReviews: [],
                basicInfo: {}
            };

            // 영화 제목
            movieInfo.title = await page.locator('.mv_info_area .h_movie a').textContent() || '';
            
            // 평점 정보
            const ratingElement = await page.locator('.score .star_score .num');
            if (await ratingElement.count() > 0) {
                movieInfo.rating = await ratingElement.textContent();
            }

            // 기본 정보 (감독, 출연진 등)
            const infoItems = await page.locator('.mv_info .info_spec dd').all();
            for (let i = 0; i < infoItems.length; i++) {
                const text = await infoItems[i].textContent();
                if (i === 0) movieInfo.basicInfo.director = text?.trim();
                if (i === 1) movieInfo.basicInfo.actors = text?.trim();
                if (i === 2) movieInfo.basicInfo.genre = text?.trim();
            }

            // 전문가 평점 크롤링
            await this.crawlExpertReviews(page, movieInfo);
            
            // 관객 평점 크롤링  
            await this.crawlAudienceReviews(page, movieInfo);

            return movieInfo;
            
        } catch (error) {
            console.error('영화 정보 추출 실패:', error.message);
            return null;
        }
    }

    // 전문가 평점 크롤링
    async crawlExpertReviews(page, movieInfo) {
        try {
            // 평점 탭으로 이동
            const reviewTab = await page.locator('a[href*="point"]');
            if (await reviewTab.count() > 0) {
                await reviewTab.click();
                await page.waitForTimeout(2000);
                
                // 전문가 리뷰 추출
                const expertItems = await page.locator('.score_result .star_score').all();
                
                for (let item of expertItems.slice(0, 5)) {
                    const critic = await item.locator('.user_id_inner .name').textContent() || '평론가';
                    const score = await item.locator('.star_score .num').textContent() || '';
                    const review = await item.locator('.user_tx_area').textContent() || '';
                    
                    if (score || review) {
                        movieInfo.expertReviews.push({
                            critic: critic.trim(),
                            score: score.trim(),
                            review: review.trim().substring(0, 100)
                        });
                    }
                }
            }
        } catch (error) {
            console.log('전문가 리뷰 크롤링 실패:', error.message);
        }
    }

    // 관객 평점 크롤링
    async crawlAudienceReviews(page, movieInfo) {
        try {
            // 네티즌 평점 탭으로 이동
            const audienceTab = await page.locator('a[href*="netizen"]');
            if (await audienceTab.count() > 0) {
                await audienceTab.click();
                await page.waitForTimeout(2000);
                
                // 관객 리뷰 추출
                const audienceItems = await page.locator('.score_result .star_score').all();
                
                for (let item of audienceItems.slice(0, 5)) {
                    const username = await item.locator('.user_id_inner .name').textContent() || '관람객';
                    const score = await item.locator('.star_score .num').textContent() || '';
                    const review = await item.locator('.user_tx_area').textContent() || '';
                    
                    if (score || review) {
                        movieInfo.audienceReviews.push({
                            username: username.trim(),
                            score: score.trim(),
                            review: review.trim().substring(0, 80)
                        });
                    }
                }
            }
        } catch (error) {
            console.log('관객 리뷰 크롤링 실패:', error.message);
        }
    }

    // CGV 평점 크롤링
    async crawlCGVMovie(movieTitle) {
        if (!this.browser) {
            const initialized = await this.init();
            if (!initialized) return null;
        }

        const page = await this.browser.newPage();
        
        try {
            console.log(`🎬 CGV 영화 검색: ${movieTitle}`);
            
            const searchUrl = `http://www.cgv.co.kr/search/?query=${encodeURIComponent(movieTitle)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            // CGV 영화 정보 추출 로직
            // (실제 구현시 CGV 사이트 구조에 맞게 조정 필요)
            
            return {
                title: movieTitle,
                source: 'CGV',
                rating: '수집 중...',
                reviews: []
            };
            
        } catch (error) {
            console.error(`❌ CGV ${movieTitle} 크롤링 실패:`, error.message);
            return null;
        } finally {
            await page.close();
        }
    }

    // 실시간 다중 사이트 크롤링
    async crawlMultipleSites(movieTitle) {
        const results = {
            naver: null,
            cgv: null,
            timestamp: new Date().toISOString()
        };

        try {
            // 병렬로 여러 사이트 크롤링
            const [naverResult, cgvResult] = await Promise.allSettled([
                this.crawlNaverMovie(movieTitle),
                this.crawlCGVMovie(movieTitle)
            ]);

            if (naverResult.status === 'fulfilled') {
                results.naver = naverResult.value;
            }
            
            if (cgvResult.status === 'fulfilled') {
                results.cgv = cgvResult.value;
            }

            return results;
            
        } catch (error) {
            console.error('다중 사이트 크롤링 실패:', error.message);
            return results;
        }
    }

    // 크롤링 결과를 카카오 스킬 형식으로 변환
    formatForKakaoSkill(crawlResults, movieTitle) {
        if (!crawlResults.naver && !crawlResults.cgv) {
            return {
                success: false,
                type: 'error',
                data: { message: `🎬 "${movieTitle}" 실시간 영화 정보를 찾을 수 없습니다.` }
            };
        }

        let message = `🎬 "${movieTitle}" 실시간 영화 정보\n\n`;
        
        // 네이버 영화 정보
        if (crawlResults.naver) {
            const naver = crawlResults.naver;
            message += `📊 네이버 영화 평점: ${naver.rating || '정보없음'}\n`;
            
            if (naver.expertReviews.length > 0) {
                message += `\n👨‍🎓 전문가 평가 (실시간):\n`;
                naver.expertReviews.forEach((review, index) => {
                    const stars = this.convertToStars(review.score);
                    message += `${index + 1}. ${review.critic} ${stars} (${review.review.substring(0, 30)}...)\n`;
                });
            }
            
            if (naver.audienceReviews.length > 0) {
                message += `\n⭐ 관객 평가 (실시간):\n`;
                naver.audienceReviews.forEach((review, index) => {
                    const stars = this.convertToStars(review.score);
                    message += `${index + 1}. ${review.username} ${stars} (${review.review.substring(0, 25)}...)\n`;
                });
            }
        }

        message += `\n🕐 수집 시간: ${new Date(crawlResults.timestamp).toLocaleString('ko-KR')}`;
        message += `\n🎯 실시간 크롤링으로 수집된 최신 데이터입니다!`;

        return {
            success: true,
            type: 'realtime_movie',
            data: {
                title: movieTitle,
                message: message,
                crawlResults: crawlResults
            }
        };
    }

    // 점수를 별점으로 변환
    convertToStars(score) {
        if (!score) return '★★★☆☆';
        
        const num = parseFloat(score);
        if (num >= 9) return '★★★★★';
        if (num >= 7) return '★★★★☆';
        if (num >= 5) return '★★★☆☆';
        if (num >= 3) return '★★☆☆☆';
        return '★☆☆☆☆';
    }
}

module.exports = PlaywrightCrawler;