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
            console.log('[DRAMA] Playwright 브라우저 초기화 중...');
            this.browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('[SUCCESS] Playwright 브라우저 준비 완료');
            return true;
        } catch (error) {
            console.error('[ERROR] Playwright 초기화 실패:', error.message);
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
            console.log(`[MOVIE] 네이버 영화 검색: ${movieTitle}`);
            
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
                console.log(`[SUCCESS] ${movieTitle} 실시간 데이터 수집 완료`);
                
                return movieData;
            } else {
                console.log(`[WARN] ${movieTitle} 검색 결과 없음`);
                return null;
            }
            
        } catch (error) {
            console.error(`[ERROR] ${movieTitle} 크롤링 실패:`, error.message);
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

    // 전문가 평점 크롤링 (개선된 버전)
    async crawlExpertReviews(page, movieInfo) {
        try {
            console.log('[TARGET] 전문가 평점 크롤링 시작...');
            
            // 평론가/전문가 평점 섹션 찾기
            const expertSelectors = [
                '.score_result .expert_reiv',  // 전문가 리뷰 섹션
                '.expert_review_area',         // 전문가 리뷰 영역
                '.point_affair_list .expert',  // 전문가 평점 리스트
                '.score_result .critic'        // 평론가 섹션
            ];
            
            for (const selector of expertSelectors) {
                const expertSection = await page.locator(selector);
                if (await expertSection.count() > 0) {
                    console.log(`[MEMO] 전문가 섹션 발견: ${selector}`);
                    
                    const expertItems = await expertSection.locator('.star_score').all();
                    console.log(`[MAN]‍💼 발견된 전문가 리뷰: ${expertItems.length}개`);
                    
                    for (let i = 0; i < Math.min(expertItems.length, 5); i++) {
                        const item = expertItems[i];
                        
                        try {
                            // 평론가 이름 추출 (다양한 셀렉터 시도)
                            let critic = '';
                            const nameSelectors = ['.name', '.user_name', '.critic_name', '.reviewer_name'];
                            for (const nameSelector of nameSelectors) {
                                const nameElement = await item.locator(nameSelector);
                                if (await nameElement.count() > 0) {
                                    critic = await nameElement.textContent() || '';
                                    break;
                                }
                            }
                            
                            // 점수 추출
                            const scoreElement = await item.locator('.num, .score_num, .rating');
                            const score = await scoreElement.textContent() || '';
                            
                            // 리뷰 내용 추출
                            const reviewSelectors = ['.user_tx_area', '.review_text', '.comment', '.review_content'];
                            let review = '';
                            for (const reviewSelector of reviewSelectors) {
                                const reviewElement = await item.locator(reviewSelector);
                                if (await reviewElement.count() > 0) {
                                    review = await reviewElement.textContent() || '';
                                    break;
                                }
                            }
                            
                            if (critic || score || review) {
                                movieInfo.expertReviews.push({
                                    critic: critic.trim() || `평론가${i + 1}`,
                                    score: score.trim(),
                                    review: review.trim().substring(0, 120)
                                });
                                console.log(`[SUCCESS] 전문가 ${i + 1}: ${critic.trim()} - ${score.trim()}`);
                            }
                        } catch (itemError) {
                            console.log(`[WARN] 전문가 리뷰 ${i + 1} 추출 실패:`, itemError.message);
                        }
                    }
                    
                    if (movieInfo.expertReviews.length > 0) break;
                }
            }
            
            console.log(`[INFO] 전문가 리뷰 수집 완료: ${movieInfo.expertReviews.length}개`);
            
        } catch (error) {
            console.log('[ERROR] 전문가 리뷰 크롤링 실패:', error.message);
        }
    }

    // 관객 평점 크롤링 (개선된 버전 - 실제 아이디와 한줄평 수집)
    async crawlAudienceReviews(page, movieInfo) {
        try {
            console.log('[BUSTSINSILHOUETTE] 관객 평점 크롤링 시작...');
            
            // 네티즌/관객 평점 섹션 찾기
            const audienceSelectors = [
                '.score_result .user_review',     // 사용자 리뷰 섹션
                '.audience_review_area',          // 관객 리뷰 영역
                '.point_affair_list .user',       // 사용자 평점 리스트
                '.netizen_review_area',           // 네티즌 리뷰 영역
                '.user_score_area'                // 사용자 점수 영역
            ];
            
            for (const selector of audienceSelectors) {
                const audienceSection = await page.locator(selector);
                if (await audienceSection.count() > 0) {
                    console.log(`[BUSTINSILHOUETTE] 관객 섹션 발견: ${selector}`);
                    
                    const audienceItems = await audienceSection.locator('.star_score, .review_item').all();
                    console.log(`[BUSTSINSILHOUETTE] 발견된 관객 평가: ${audienceItems.length}개`);
                    
                    for (let i = 0; i < Math.min(audienceItems.length, 8); i++) {
                        const item = audienceItems[i];
                        
                        try {
                            // 사용자 아이디/닉네임 추출 (실제 아이디)
                            let username = '';
                            const userSelectors = [
                                '.user_id_inner .name',    // 사용자 아이디
                                '.user_name',              // 사용자 이름
                                '.nickname',               // 닉네임
                                '.user_nick',              // 사용자 닉네임
                                '.reviewer_name'           // 리뷰어 이름
                            ];
                            
                            for (const userSelector of userSelectors) {
                                const userElement = await item.locator(userSelector);
                                if (await userElement.count() > 0) {
                                    username = await userElement.textContent() || '';
                                    if (username.trim()) break;
                                }
                            }
                            
                            // 점수 추출
                            const scoreSelectors = ['.num', '.score_num', '.rating', '.star_score .num'];
                            let score = '';
                            for (const scoreSelector of scoreSelectors) {
                                const scoreElement = await item.locator(scoreSelector);
                                if (await scoreElement.count() > 0) {
                                    score = await scoreElement.textContent() || '';
                                    if (score.trim()) break;
                                }
                            }
                            
                            // 한줄평/리뷰 내용 추출
                            const reviewSelectors = [
                                '.user_tx_area',           // 사용자 텍스트 영역
                                '.review_text',            // 리뷰 텍스트
                                '.comment_text',           // 코멘트 텍스트
                                '.user_comment',           // 사용자 코멘트  
                                '.review_content'          // 리뷰 컨텐츠
                            ];
                            
                            let review = '';
                            for (const reviewSelector of reviewSelectors) {
                                const reviewElement = await item.locator(reviewSelector);
                                if (await reviewElement.count() > 0) {
                                    review = await reviewElement.textContent() || '';
                                    if (review.trim()) break;
                                }
                            }
                            
                            // 유효한 데이터가 있는 경우만 추가
                            if ((username && username.trim()) || (score && score.trim()) || (review && review.trim())) {
                                const cleanedUsername = username.trim() || `관람객${i + 1}`;
                                const cleanedScore = score.trim();
                                const cleanedReview = review.trim().substring(0, 100);
                                
                                movieInfo.audienceReviews.push({
                                    username: cleanedUsername,
                                    score: cleanedScore,
                                    review: cleanedReview
                                });
                                
                                console.log(`[SUCCESS] 관객 ${i + 1}: ${cleanedUsername} - ${cleanedScore} - "${cleanedReview.substring(0, 30)}..."`);
                            }
                        } catch (itemError) {
                            console.log(`[WARN] 관객 리뷰 ${i + 1} 추출 실패:`, itemError.message);
                        }
                    }
                    
                    if (movieInfo.audienceReviews.length > 0) break;
                }
            }
            
            console.log(`[INFO] 관객 평가 수집 완료: ${movieInfo.audienceReviews.length}개`);
            
        } catch (error) {
            console.log('[ERROR] 관객 리뷰 크롤링 실패:', error.message);
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
            console.log(`[MOVIE] CGV 영화 검색: ${movieTitle}`);
            
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
            console.error(`[ERROR] CGV ${movieTitle} 크롤링 실패:`, error.message);
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

    // 크롤링 결과를 카카오 스킬 형식으로 변환 (개선된 영화평 포맷)
    formatForKakaoSkill(crawlResults, movieTitle) {
        if (!crawlResults.naver && !crawlResults.cgv) {
            return {
                success: false,
                type: 'error',
                data: { message: `[MOVIE] "${movieTitle}" 영화 정보를 찾을 수 없습니다.` }
            };
        }

        let message = `[MOVIE] "${movieTitle}" 영화평 종합\n\n`;
        
        // 네이버 영화 정보
        if (crawlResults.naver) {
            const naver = crawlResults.naver;
            
            // 기본 정보
            message += `[PROJECTOR] 기본 정보\n`;
            if (naver.basicInfo.director) message += `감독: ${naver.basicInfo.director}\n`;
            if (naver.basicInfo.actors) message += `출연: ${naver.basicInfo.actors.substring(0, 50)}...\n`;
            if (naver.basicInfo.genre) message += `장르: ${naver.basicInfo.genre}\n`;
            
            // 네이버 전체 평점
            if (naver.rating) {
                const ratingNum = parseFloat(naver.rating);
                const stars = this.convertToStars(naver.rating);
                message += `\n[FAVORITE] 네이버 전체 평점: ${naver.rating}/10 ${stars}\n`;
                
                // 평점 해석
                if (ratingNum >= 8.0) message += `💫 매우 높은 평점! 강력 추천작\n`;
                else if (ratingNum >= 7.0) message += `[THUMBSUP] 좋은 평점의 추천작\n`;
                else if (ratingNum >= 6.0) message += `[SMILE] 무난한 평점의 볼만한 작품\n`;
                else if (ratingNum >= 5.0) message += `😐 평범한 평점\n`;
                else message += `😕 아쉬운 평점\n`;
            }
            
            // 전문가(평론가) 평가
            if (naver.expertReviews.length > 0) {
                message += `\n[MAN]‍💼 평론가 평가:\n`;
                naver.expertReviews.forEach((review, index) => {
                    const stars = this.convertToStars(review.score);
                    message += `${index + 1}. ${review.critic} ${stars} (${review.score}/10)\n`;
                    if (review.review) {
                        message += `   "${review.review.substring(0, 40)}..."\n`;
                    }
                });
            }
            
            // 관객 평가 (실제 아이디와 한줄평)
            if (naver.audienceReviews.length > 0) {
                message += `\n[BUSTSINSILHOUETTE] 관객 실제 평가:\n`;
                naver.audienceReviews.forEach((review, index) => {
                    const stars = this.convertToStars(review.score);
                    message += `${index + 1}. ${review.username} ${stars} (${review.score}/10)\n`;
                    if (review.review) {
                        message += `   "${review.review.substring(0, 35)}..."\n`;
                    }
                });
            }
        }

        message += `\n[TIME] 실시간 수집: ${new Date(crawlResults.timestamp).toLocaleString('ko-KR')}`;
        message += `\n[INFO] 네이버 영화에서 실시간 크롤링한 최신 데이터`;

        return {
            success: true,
            type: 'comprehensive_movie_review',
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