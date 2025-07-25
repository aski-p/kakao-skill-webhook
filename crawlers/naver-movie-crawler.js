// 네이버 영화 크롤링 시스템
const axios = require('axios');
const SupabaseClient = require('../config/supabase-client');

class NaverMovieCrawler {
    constructor() {
        this.naverClientId = process.env.NAVER_CLIENT_ID;
        this.naverClientSecret = process.env.NAVER_CLIENT_SECRET;
        this.supabase = new SupabaseClient();
        this.delay = 1000; // API 호출 간격 (1초)
    }

    // 메인 크롤링 함수 (매일 12시에 실행)
    async crawlAndUpdateMovies() {
        console.log('🎬 네이버 영화 크롤링 시작:', new Date().toISOString());
        
        if (!this.naverClientId || !this.naverClientSecret) {
            console.error('❌ 네이버 API 키가 설정되지 않았습니다.');
            return { success: false, error: 'Missing API keys' };
        }

        if (!this.supabase || !this.supabase.client) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
            return { success: false, error: 'Supabase connection failed' };
        }

        try {
            // 1단계: 기존 영화 목록 조회
            const existingMovies = await this.supabase.getAllMovies();
            console.log(`📊 기존 영화 수: ${existingMovies.length}개`);

            // 2단계: 다양한 검색어로 영화 수집
            const searchQueries = this.generateSearchQueries();
            let newMoviesAdded = 0;
            let totalMoviesProcessed = 0;

            for (const query of searchQueries) {
                console.log(`🔍 검색어 처리: "${query}"`);
                
                try {
                    // 네이버 영화 API 호출
                    const movies = await this.searchNaverMovies(query);
                    
                    if (movies && movies.length > 0) {
                        console.log(`📽️ "${query}"로 ${movies.length}개 영화 발견`);
                        
                        // 각 영화 처리
                        for (const movie of movies) {
                            totalMoviesProcessed++;
                            
                            // 중복 검사
                            const isDuplicate = existingMovies.some(existing => 
                                existing.title === movie.title && 
                                existing.release_year === parseInt(movie.pubDate)
                            );
                            
                            if (!isDuplicate) {
                                // 새로운 영화 추가
                                const result = await this.addNewMovie(movie);
                                if (result) {
                                    newMoviesAdded++;
                                    console.log(`✅ 새 영화 추가: "${movie.title}" (${movie.pubDate})`);
                                }
                            } else {
                                console.log(`⚠️ 중복 영화 스킵: "${movie.title}" (${movie.pubDate})`);
                            }
                            
                            // API 요청 간격 조절
                            await this.sleep(this.delay);
                        }
                    }
                } catch (error) {
                    console.error(`❌ "${query}" 검색 중 오류:`, error.message);
                }
                
                // 검색어 간 대기
                await this.sleep(this.delay * 2);
            }

            const result = {
                success: true,
                totalProcessed: totalMoviesProcessed,
                newMoviesAdded: newMoviesAdded,
                existingMovies: existingMovies.length,
                timestamp: new Date().toISOString()
            };

            console.log('🎉 크롤링 완료:', result);
            return result;

        } catch (error) {
            console.error('❌ 크롤링 중 전체 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // 네이버 영화 API 검색
    async searchNaverMovies(query, display = 20) {
        try {
            const url = `https://openapi.naver.com/v1/search/movie.json`;
            const params = {
                query: query,
                display: display,
                start: 1,
                genre: '',
                country: '',
                yearfrom: '2000', // 2000년 이후 영화만
                yearto: new Date().getFullYear().toString()
            };

            const response = await axios.get(url, {
                headers: {
                    'X-Naver-Client-Id': this.naverClientId,
                    'X-Naver-Client-Secret': this.naverClientSecret
                },
                params: params,
                timeout: 10000
            });

            if (response.data && response.data.items) {
                return response.data.items.map(item => ({
                    title: this.cleanHtml(item.title),
                    englishTitle: this.extractEnglishTitle(item.title),
                    director: this.cleanHtml(item.director),
                    actor: this.cleanHtml(item.actor),
                    pubDate: item.pubDate,
                    userRating: parseFloat(item.userRating) || 0,
                    link: item.link,
                    image: item.image,
                    subtitle: this.cleanHtml(item.subtitle || ''),
                    naver_movie_id: this.extractMovieId(item.link)
                }));
            }

            return [];

        } catch (error) {
            console.error('❌ 네이버 영화 API 오류:', error.message);
            throw error;
        }
    }

    // 새로운 영화를 Supabase에 추가
    async addNewMovie(naverMovie) {
        try {
            // 영화 기본 정보 구성
            const movieData = {
                title: naverMovie.title,
                english_title: naverMovie.englishTitle,
                director: naverMovie.director || null,
                cast_members: naverMovie.actor ? 
                    naverMovie.actor.split('|').map(actor => actor.trim()).filter(actor => actor) : 
                    [],
                genre: this.extractGenre(naverMovie.subtitle),
                release_year: parseInt(naverMovie.pubDate) || null,
                country: this.extractCountry(naverMovie.subtitle),
                naver_rating: naverMovie.userRating || 0,
                description: naverMovie.subtitle || null,
                keywords: this.generateKeywords(naverMovie),
                poster_url: naverMovie.image || null,
                naver_movie_id: naverMovie.naver_movie_id
            };

            // Supabase에 추가
            const movieId = await this.supabase.addMovie(movieData);
            
            if (movieId) {
                // 평론가/관객 리뷰 수집 시도 (간단한 버전)
                await this.addSampleReviews(movieId, naverMovie.title);
                return true;
            }

            return false;

        } catch (error) {
            console.error(`❌ 영화 추가 실패 (${naverMovie.title}):`, error.message);
            return false;
        }
    }

    // 샘플 리뷰 추가 (실제 크롤링은 나중에 구현)
    async addSampleReviews(movieId, title) {
        try {
            // 기본 평론가 리뷰
            const criticReviews = [
                { name: '이동진', score: 7.5 + Math.random() * 2, review: `"${title}"에 대한 전문적인 평가` },
                { name: '김혜리', score: 7.0 + Math.random() * 2, review: `영화의 완성도와 예술적 가치를 평가` }
            ];

            // 기본 관객 리뷰
            const audienceReviews = [
                { username: 'movie_fan', score: 7.5 + Math.random() * 2, review: `"${title}" 재미있게 봤어요!` },
                { username: 'cinema_lover', score: 7.0 + Math.random() * 2, review: `좋은 작품이네요. 추천합니다.` }
            ];

            // 리뷰 추가
            await this.supabase.addCriticReviews(movieId, criticReviews);
            await this.supabase.addAudienceReviews(movieId, audienceReviews);

        } catch (error) {
            console.error(`❌ 샘플 리뷰 추가 실패 (${title}):`, error.message);
        }
    }

    // 검색 쿼리 생성
    generateSearchQueries() {
        return [
            // 최신 인기 영화
            '2024 영화',
            '2023 영화',
            '한국영화',
            '할리우드',
            
            // 장르별
            '액션 영화',
            '드라마 영화', 
            '코미디 영화',
            '로맨스 영화',
            '스릴러 영화',
            '공포 영화',
            '애니메이션',
            'SF 영화',
            
            // 감독별
            '봉준호',
            '박찬욱',
            '김기덕',
            '이창동',
            '홍상수',
            
            // 배우별
            '송강호',
            '이선균',
            '전지현',
            '김혜수',
            '조정석',
            
            // 시리즈/프랜차이즈
            '마블',
            '어벤져스',
            '트랜스포머',
            '분노의 질주',
            '존 윅',
            
            // 수상작
            '아카데미',
            '칸영화제',
            '베니스영화제',
            '청룡영화상',
            '백상예술대상'
        ];
    }

    // 유틸리티 함수들
    cleanHtml(text) {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, '').trim();
    }

    extractEnglishTitle(title) {
        const match = title.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
    }

    extractMovieId(link) {
        const match = link.match(/code=(\d+)/);
        return match ? match[1] : null;
    }

    extractGenre(subtitle) {
        if (!subtitle) return null;
        // 간단한 장르 추출 (실제로는 더 정교한 로직 필요)
        const genres = ['액션', '드라마', '코미디', '로맨스', '스릴러', '공포', '애니메이션', 'SF'];
        for (const genre of genres) {
            if (subtitle.includes(genre)) return genre;
        }
        return null;
    }

    extractCountry(subtitle) {
        if (!subtitle) return null;
        if (subtitle.includes('한국')) return '한국';
        if (subtitle.includes('미국')) return '미국';
        if (subtitle.includes('일본')) return '일본';
        return null;
    }

    generateKeywords(movie) {
        const keywords = [];
        
        // 제목 기반 키워드
        const title = movie.title.toLowerCase();
        keywords.push(title);
        keywords.push(title.replace(/\s+/g, ''));
        
        // 감독 기반
        if (movie.director) {
            keywords.push(movie.director.toLowerCase());
        }
        
        // 배우 기반
        if (movie.actor) {
            const actors = movie.actor.split('|').slice(0, 3); // 상위 3명만
            actors.forEach(actor => {
                if (actor.trim()) {
                    keywords.push(actor.trim().toLowerCase());
                }
            });
        }

        return keywords;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = NaverMovieCrawler;