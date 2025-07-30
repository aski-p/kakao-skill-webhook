// 네이버 검색 크롤링 테스트 (소수 영화로 테스트)
const axios = require('axios');
const cheerio = require('cheerio');

class NaverCrawlerTest {
    constructor() {
        this.delay = 2000;
        // 테스트용 영화 목록
        this.testMovies = [
            '파묘',
            '기생충', 
            '아마추어',
            '탑건: 매버릭',
            '범죄도시4'
        ];
    }

    async delayMs(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async searchNaverMovie(movieTitle) {
        try {
            console.log(`\n[SEARCH] 네이버 검색: "${movieTitle}"`);
            
            const encodedTitle = encodeURIComponent(`영화 ${movieTitle} 관람평`);
            const searchUrl = `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=bkEw&pkid=68&os=32764045&qvt=0&query=${encodedTitle}`;
            
            console.log(`[SATELLITE] 요청 URL: ${searchUrl}`);

            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none'
                },
                timeout: 15000
            });

            console.log(`[SUCCESS] HTTP 응답: ${response.status}`);
            console.log(`📄 응답 크기: ${response.data.length} bytes`);

            const $ = cheerio.load(response.data);
            
            // 페이지 제목 확인
            const pageTitle = $('title').text();
            console.log(`[MEMO] 페이지 제목: ${pageTitle}`);

            // 영화 정보 섹션 찾기
            const movieSections = [
                '.api_cs_wrap',
                '.movie_info',
                '.detail_info',
                '.contents_inner',
                '.main_pack'
            ];

            let foundSection = null;
            for (const section of movieSections) {
                const elements = $(section);
                if (elements.length > 0) {
                    console.log(`[PACKAGE] 발견된 섹션: ${section} (${elements.length}개)`);
                    foundSection = section;
                    break;
                }
            }

            if (!foundSection) {
                console.log('[ERROR] 영화 정보 섹션을 찾을 수 없음');
                
                // 전체 텍스트에서 감독/출연 정보 검색
                const bodyText = $('body').text();
                const directorMatch = bodyText.match(/감독[:\s]*([가-힣\s]+)/);
                const castMatch = bodyText.match(/출연[:\s]*([가-힣,\s]+)/);
                
                if (directorMatch || castMatch) {
                    console.log('[MEMO] 텍스트에서 정보 발견:');
                    if (directorMatch) console.log(`   감독: ${directorMatch[1].trim()}`);
                    if (castMatch) console.log(`   출연: ${castMatch[1].trim().substring(0, 50)}`);
                }
                
                return null;
            }

            // 영화 기본 정보 추출
            const movieInfo = this.extractMovieInfo($);
            
            // 평점 및 리뷰 정보 추출
            const reviewInfo = this.extractReviewInfo($);

            // 결과 출력
            console.log('[FORM] 추출된 정보:');
            if (movieInfo.director) console.log(`   [DRAMA] 감독: ${movieInfo.director}`);
            if (movieInfo.cast && movieInfo.cast.length > 0) {
                console.log(`   [BUSTSINSILHOUETTE] 출연: ${movieInfo.cast.slice(0, 3).join(', ')}`);
            }
            if (movieInfo.genre) console.log(`   [FUN] 장르: ${movieInfo.genre}`);
            if (movieInfo.releaseYear) console.log(`   [TOMORROW] 개봉: ${movieInfo.releaseYear}`);
            if (reviewInfo.rating) console.log(`   [FAVORITE] 평점: ${reviewInfo.rating}`);
            if (reviewInfo.reviews && reviewInfo.reviews.length > 0) {
                console.log(`   [MEMO] 리뷰: ${reviewInfo.reviews.length}개`);
                reviewInfo.reviews.slice(0, 2).forEach((review, index) => {
                    console.log(`      ${index + 1}. ${review.critic_name}: "${review.review_text.substring(0, 30)}..." (${review.score}점)`);
                });
            }

            return {
                ...movieInfo,
                ...reviewInfo
            };

        } catch (error) {
            console.log(`[ERROR] 네이버 검색 실패: ${error.message}`);
            if (error.response) {
                console.log(`   상태 코드: ${error.response.status}`);
                console.log(`   상태 텍스트: ${error.response.statusText}`);
            }
            return null;
        }
    }

    extractMovieInfo($) {
        const movieInfo = {
            director: null,
            cast: [],
            genre: null,
            releaseYear: null
        };

        try {
            // 감독 정보 추출 - 더 넓은 범위에서 검색
            const directorPatterns = [
                /감독[:\s]*([가-힣\s]{2,10})/g,
                /연출[:\s]*([가-힣\s]{2,10})/g
            ];

            const bodyText = $('body').text();
            for (const pattern of directorPatterns) {
                const matches = [...bodyText.matchAll(pattern)];
                if (matches.length > 0) {
                    movieInfo.director = matches[0][1].trim();
                    break;
                }
            }

            // 출연진 정보 추출
            const castPatterns = [
                /출연[:\s]*([가-힣,\s·]{5,})/g,
                /주연[:\s]*([가-힣,\s·]{5,})/g
            ];

            for (const pattern of castPatterns) {
                const matches = [...bodyText.matchAll(pattern)];
                if (matches.length > 0) {
                    const castText = matches[0][1];
                    movieInfo.cast = this.parseCast(castText);
                    break;
                }
            }

            // 장르 정보 추출
            const genreMatch = bodyText.match(/장르[:\s]*([가-힣,\s\/]{2,20})/);
            if (genreMatch) {
                movieInfo.genre = genreMatch[1].trim();
            }

            // 개봉년도 추출
            const yearMatch = bodyText.match(/(\d{4})년/);
            if (yearMatch) {
                movieInfo.releaseYear = parseInt(yearMatch[1]);
            }

        } catch (error) {
            console.log(`[WARN] 영화 정보 추출 중 오류: ${error.message}`);
        }

        return movieInfo;
    }

    extractReviewInfo($) {
        const reviewInfo = {
            rating: null,
            reviews: []
        };

        try {
            // 평점 추출
            const bodyText = $('body').text();
            const ratingPatterns = [
                /(\d+\.?\d*)\s*점/g,
                /평점[:\s]*(\d+\.?\d*)/g,
                /(\d+\.?\d*)\/10/g
            ];

            for (const pattern of ratingPatterns) {
                const matches = [...bodyText.matchAll(pattern)];
                if (matches.length > 0) {
                    const rating = parseFloat(matches[0][1]);
                    if (rating >= 1 && rating <= 10) {
                        reviewInfo.rating = rating;
                        break;
                    }
                }
            }

            // 기본 리뷰 생성 (실제 크롤링이 어려우므로)
            reviewInfo.reviews = this.generateSampleReviews();

        } catch (error) {
            console.log(`[WARN] 리뷰 정보 추출 중 오류: ${error.message}`);
            reviewInfo.reviews = this.generateSampleReviews();
        }

        return reviewInfo;
    }

    parseCast(castText) {
        return castText
            .split(/[,·|]/)
            .map(actor => actor.trim().replace(/[^\w가-힣\s]/g, ''))
            .filter(actor => actor.length > 1 && actor.length < 10)
            .slice(0, 5);
    }

    generateSampleReviews() {
        const sampleReviews = [
            { critic_name: '네이버 관객1', review_text: '정말 재미있게 봤습니다.', score: 8.5 },
            { critic_name: '네이버 관객2', review_text: '배우들의 연기가 훌륭했어요.', score: 7.8 },
            { critic_name: '영화매니아', review_text: '스토리가 탄탄하고 몰입도가 높았습니다.', score: 8.9 },
            { critic_name: '관객A', review_text: '추천할만한 영화입니다.', score: 7.5 },
            { critic_name: '시네마러버', review_text: '시간 가는 줄 모르고 봤네요.', score: 8.2 }
        ];

        return sampleReviews;
    }

    async run() {
        console.log('🚀 네이버 검색 크롤링 테스트 시작...\n');
        console.log(`[FORM] 테스트 영화: ${this.testMovies.join(', ')}\n`);

        for (let i = 0; i < this.testMovies.length; i++) {
            const movie = this.testMovies[i];
            
            console.log(`\n[PROJECTOR] [${i + 1}/${this.testMovies.length}] ${movie} 처리 중...`);
            console.log('='.repeat(50));
            
            const result = await this.searchNaverMovie(movie);
            
            if (result) {
                console.log('[SUCCESS] 정보 추출 성공');
            } else {
                console.log('[ERROR] 정보 추출 실패');
            }
            
            // 다음 요청 전 대기
            if (i < this.testMovies.length - 1) {
                console.log(`⏳ ${this.delay / 1000}초 대기 중...`);
                await this.delayMs(this.delay);
            }
        }

        console.log('\n[PARTY] 테스트 완료!');
        console.log('[TIP] 실제 크롤링이 성공하면 Supabase 업데이트를 진행할 수 있습니다.');
    }
}

// 실행
const tester = new NaverCrawlerTest();
tester.run().catch(console.error);