// 영화 서브에이전트 코디네이터
// 영화 검색과 리뷰 포맷팅을 통합 관리하는 마스터 에이전트

const MovieSearchAgent = require('./movie-search-agent');
const MovieReviewFormatter = require('./movie-review-formatter');

class MovieAgentCoordinator {
    constructor() {
        // 서브에이전트 인스턴스 생성
        this.searchAgent = new MovieSearchAgent();
        this.reviewFormatter = new MovieReviewFormatter();
        
        // 성능 통계
        this.coordinatorStats = {
            totalRequests: 0,
            successfulRequests: 0,
            averageProcessingTime: 0,
            errorCount: 0
        };
        
        console.log('[MOVIE] 영화 에이전트 코디네이터 초기화 완료');
    }
    
    // 메인 영화 검색 및 리뷰 생성 함수
    async getMovieReview(movieTitle, options = {}) {
        const startTime = Date.now();
        this.coordinatorStats.totalRequests++;
        
        console.log(`[DRAMA] 영화 에이전트 코디네이터 시작: "${movieTitle}"`);
        
        try {
            // 1단계: 영화 검색 에이전트 호출
            console.log(`[SEARCH] 1단계: 영화 검색 에이전트 실행`);
            const movieData = await this.searchAgent.searchMovie(movieTitle, options);
            
            if (!movieData) {
                console.log(`[ERROR] 영화 검색 실패: "${movieTitle}"`);
                return this.reviewFormatter.createNotFoundResponse(movieTitle);
            }
            
            console.log(`[SUCCESS] 영화 검색 성공: "${movieData.title}"`);
            
            // 2단계: 리뷰 포맷터 에이전트 호출
            console.log(`[MEMO] 2단계: 리뷰 포맷팅 에이전트 실행`);
            const formattedReview = await this.reviewFormatter.formatMovieReview(movieData, movieTitle);
            
            // 성공 통계 업데이트
            this.coordinatorStats.successfulRequests++;
            const processingTime = Date.now() - startTime;
            this.updateProcessingTime(processingTime);
            
            console.log(`[PARTY] 영화 리뷰 생성 완료 (총 ${processingTime}ms)`);
            
            // 추가 메타데이터 포함
            if (formattedReview.success) {
                formattedReview.metadata = {
                    processingTime: processingTime,
                    searchMethod: this.getSearchMethodUsed(movieData),
                    dataSource: movieData.id ? 'supabase' : 'hardcoded',
                    timestamp: new Date().toISOString()
                };
            }
            
            return formattedReview;
            
        } catch (error) {
            console.error(`[ERROR] 코디네이터 처리 오류: ${error.message}`);
            this.coordinatorStats.errorCount++;
            
            return {
                success: false,
                type: 'coordinator_error',
                data: {
                    message: `[MOVIE] "${movieTitle}" 영화평 처리 중 시스템 오류가 발생했습니다.\n\n[ERROR] 오류: ${error.message}\n\n[LOADING] 잠시 후 다시 시도해주세요.`
                }
            };
        }
    }
    
    // 영화 검색 방법 추론
    getSearchMethodUsed(movieData) {
        if (!movieData.id) {
            return 'hardcoded_fallback';
        }
        
        // ID 패턴으로 검색 방법 추론
        if (movieData.id && typeof movieData.id === 'string' && movieData.id.startsWith('hc_')) {
            return 'hardcoded_fallback';
        }
        
        return 'database_search';
    }
    
    // 영화 검색 성능 최적화 (캐싱 등)
    async optimizedMovieSearch(movieTitle, options = {}) {
        // TODO: 캐싱 로직 추가 (자주 검색되는 영화들)
        // TODO: 검색 결과 로컬 캐시
        
        return await this.getMovieReview(movieTitle, options);
    }
    
    // 배치 영화 검색 (여러 영화 동시 처리)
    async batchMovieSearch(movieTitles) {
        console.log(`[MOVIE] 배치 영화 검색: ${movieTitles.length}개 영화`);
        
        const results = await Promise.allSettled(
            movieTitles.map(title => this.getMovieReview(title))
        );
        
        const processed = results.map((result, index) => ({
            title: movieTitles[index],
            success: result.status === 'fulfilled' && result.value.success,
            data: result.status === 'fulfilled' ? result.value : { error: result.reason }
        }));
        
        const successCount = processed.filter(r => r.success).length;
        console.log(`[SUCCESS] 배치 처리 완료: ${successCount}/${movieTitles.length} 성공`);
        
        return processed;
    }
    
    // 인기 영화 추천 (데이터베이스 기반)
    async getPopularMovies(limit = 10) {
        console.log(`[TROPHY] 인기 영화 ${limit}개 조회`);
        
        try {
            // SearchAgent를 통해 고평점 영화들 조회
            if (this.searchAgent.supabase) {
                const { data, error } = await this.searchAgent.supabase
                    .from('movies')
                    .select('title, director, naver_rating, genre, release_year')
                    .not('naver_rating', 'is', null)
                    .order('naver_rating', { ascending: false })
                    .limit(limit);
                
                if (!error && data) {
                    return {
                        success: true,
                        data: {
                            movies: data,
                            message: this.formatPopularMoviesResponse(data)
                        }
                    };
                }
            }
            
            // Fallback: 하드코딩된 인기 영화들
            return this.getHardcodedPopularMovies(limit);
            
        } catch (error) {
            console.error(`[ERROR] 인기 영화 조회 오류: ${error.message}`);
            return this.getHardcodedPopularMovies(limit);
        }
    }
    
    // 하드코딩된 인기 영화 목록
    getHardcodedPopularMovies(limit) {
        const popularMovies = [
            { title: '기생충', director: '봉준호', naver_rating: 8.5, genre: '드라마, 스릴러', release_year: 2019 },
            { title: '아바타: 물의 길', director: '제임스 카메론', naver_rating: 8.2, genre: 'SF, 액션', release_year: 2022 },
            { title: '탑건: 매버릭', director: '조제프 코신스키', naver_rating: 8.8, genre: '액션, 드라마', release_year: 2022 },
            { title: '미나리', director: '정이삭', naver_rating: 8.0, genre: '드라마', release_year: 2020 },
            { title: '어벤져스: 엔드게임', director: '루소 형제', naver_rating: 8.7, genre: '액션, SF', release_year: 2019 }
        ].slice(0, limit);
        
        return {
            success: true,
            data: {
                movies: popularMovies,
                message: this.formatPopularMoviesResponse(popularMovies)
            }
        };
    }
    
    // 인기 영화 응답 포맷팅
    formatPopularMoviesResponse(movies) {
        let response = `[TROPHY] 인기 영화 TOP ${movies.length}\n\n`;
        
        movies.forEach((movie, index) => {
            const stars = this.reviewFormatter.convertToStars(parseFloat(movie.naver_rating));
            response += `${index + 1}. ${movie.title} ${stars}\n`;
            response += `   [DRAMA] ${movie.director} | ${movie.genre}\n`;
            response += `   [TOMORROW] ${movie.release_year}년 | [FAVORITE] ${movie.naver_rating}/10\n\n`;
        });
        
        response += `[TIP] 영화 제목으로 상세 리뷰를 요청하세요!\n`;
        response += `예: "${movies[0].title} 영화평"`;
        
        return response;
    }
    
    // 영화 추천 (장르 기반)
    async recommendMoviesByGenre(genre, limit = 5) {
        console.log(`[FUN] 장르별 영화 추천: ${genre}`);
        
        try {
            if (this.searchAgent.supabase) {
                const { data, error } = await this.searchAgent.supabase
                    .from('movies')
                    .select('title, director, naver_rating, genre, release_year')
                    .ilike('genre', `%${genre}%`)
                    .not('naver_rating', 'is', null)
                    .order('naver_rating', { ascending: false })
                    .limit(limit);
                
                if (!error && data && data.length > 0) {
                    return {
                        success: true,
                        data: {
                            genre: genre,
                            movies: data,
                            message: `[FUN] ${genre} 장르 추천 영화 ${data.length}편\n\n${this.formatPopularMoviesResponse(data)}`
                        }
                    };
                }
            }
            
            // 검색 결과가 없는 경우
            return {
                success: false,
                data: {
                    message: `[FUN] "${genre}" 장르 영화를 찾을 수 없습니다.\n\n[TIP] 다른 장르로 시도해보세요:\n• 액션, 드라마, 코미디, 로맨스\n• 스릴러, 호러, SF, 애니메이션`
                }
            };
            
        } catch (error) {
            console.error(`[ERROR] 장르별 추천 오류: ${error.message}`);
            return {
                success: false,
                data: {
                    message: `[FUN] 장르별 영화 추천 중 오류가 발생했습니다.\n\n[LOADING] 잠시 후 다시 시도해주세요.`
                }
            };
        }
    }
    
    // 건강 체크 (모든 서브에이전트 상태 확인)
    async healthCheck() {
        console.log('[HOSPITAL] 영화 에이전트 시스템 건강 체크');
        
        const health = {
            coordinator: {
                status: 'healthy',
                stats: this.coordinatorStats
            },
            searchAgent: {
                status: 'healthy',
                supabaseConnected: !!this.searchAgent.supabase,
                stats: this.searchAgent.getStats()
            },
            reviewFormatter: {
                status: 'healthy',
                stats: this.reviewFormatter.getStats()
            },
            timestamp: new Date().toISOString()
        };
        
        // 간단한 테스트 검색 수행
        try {
            const testResult = await this.searchAgent.searchMovie('테스트영화1234567890');
            health.testSearch = testResult ? 'available' : 'no_results';
        } catch (error) {
            health.testSearch = 'error';
            health.searchAgent.status = 'degraded';
        }
        
        return health;
    }
    
    // 통계 리셋
    resetStats() {
        this.coordinatorStats = {
            totalRequests: 0,
            successfulRequests: 0,
            averageProcessingTime: 0,
            errorCount: 0
        };
        
        console.log('[INFO] 영화 에이전트 통계 리셋 완료');
    }
    
    // 처리 시간 업데이트
    updateProcessingTime(processingTime) {
        const current = this.coordinatorStats.averageProcessingTime;
        const total = this.coordinatorStats.totalRequests;
        this.coordinatorStats.averageProcessingTime = 
            (current * (total - 1) + processingTime) / total;
    }
    
    // 전체 통계 조회
    getFullStats() {
        const successRate = this.coordinatorStats.totalRequests > 0 
            ? (this.coordinatorStats.successfulRequests / this.coordinatorStats.totalRequests * 100).toFixed(1)
            : 0;
            
        return {
            coordinator: {
                ...this.coordinatorStats,
                successRate: `${successRate}%`,
                averageProcessingTime: `${this.coordinatorStats.averageProcessingTime.toFixed(0)}ms`
            },
            searchAgent: this.searchAgent.getStats(),
            reviewFormatter: this.reviewFormatter.getStats()
        };
    }
}

module.exports = MovieAgentCoordinator;