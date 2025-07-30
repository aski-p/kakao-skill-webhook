// 영화 검색 전문 서브에이전트
// Supabase movies 테이블에서 정확한 영화 검색 및 평점 제공

const { createClient } = require('@supabase/supabase-js');

class MovieSearchAgent {
    constructor() {
        // Supabase 클라이언트 초기화
        this.supabase = null;
        this.initSupabase();
        
        // 검색 성능 통계
        this.searchStats = {
            totalSearches: 0,
            successfulSearches: 0,
            averageResponseTime: 0
        };
    }
    
    initSupabase() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL || 'https://dpmoafgaysocfjxlmaum.supabase.co';
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';
            
            if (supabaseUrl && supabaseKey) {
                this.supabase = createClient(supabaseUrl, supabaseKey);
                console.log('[SUCCESS] 영화 검색 에이전트: Supabase 연결 성공');
            } else {
                console.log('[ERROR] 영화 검색 에이전트: Supabase 환경변수 누락');
            }
        } catch (error) {
            console.error('[ERROR] 영화 검색 에이전트: Supabase 초기화 실패:', error.message);
        }
    }
    
    // 메인 영화 검색 함수
    async searchMovie(movieTitle, options = {}) {
        const startTime = Date.now();
        this.searchStats.totalSearches++;
        
        console.log(`[MOVIE] 영화 검색 에이전트 시작: "${movieTitle}"`);
        
        try {
            // 1단계: 정확한 제목 매칭 우선 시도
            let movieResult = await this.exactTitleSearch(movieTitle);
            
            // 2단계: 부분 매칭 검색
            if (!movieResult) {
                movieResult = await this.partialTitleSearch(movieTitle);
            }
            
            // 3단계: 유사 제목 검색 (한글/영어 변환 포함)
            if (!movieResult) {
                movieResult = await this.similarTitleSearch(movieTitle);
            }
            
            // 4단계: 키워드 기반 검색
            if (!movieResult) {
                movieResult = await this.keywordBasedSearch(movieTitle);
            }
            
            if (movieResult) {
                // 영화를 찾은 경우 상세 정보와 리뷰 수집
                const detailedResult = await this.getMovieDetails(movieResult);
                
                this.searchStats.successfulSearches++;
                const responseTime = Date.now() - startTime;
                this.updateResponseTime(responseTime);
                
                console.log(`[SUCCESS] 영화 검색 성공: "${detailedResult.title}" (${responseTime}ms)`);
                return detailedResult;
            } else {
                console.log(`[ERROR] 영화 검색 실패: "${movieTitle}"`);
                return null;
            }
            
        } catch (error) {
            console.error(`[ERROR] 영화 검색 에이전트 오류: ${error.message}`);
            return null;
        }
    }
    
    // 1단계: 정확한 제목 매칭
    async exactTitleSearch(movieTitle) {
        console.log(`[TARGET] 정확한 제목 매칭 검색: "${movieTitle}"`);
        
        if (!this.supabase) {
            console.log('[WARN] Supabase 연결 없음 - 하드코딩 데이터 사용');
            return this.searchInHardcodedData(movieTitle);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('movies')
                .select(`
                    id, title, english_title, director, cast_members, 
                    genre, release_year, runtime_minutes, country,
                    naver_rating, description, keywords
                `)
                .eq('title', movieTitle)
                .limit(1);
            
            if (error) {
                console.error('[ERROR] 정확한 제목 검색 오류:', error.message);
                return null;
            }
            
            if (data && data.length > 0) {
                console.log(`[SUCCESS] 정확한 제목 매칭 성공: "${data[0].title}"`);
                return data[0];
            }
            
            return null;
        } catch (error) {
            console.error('[ERROR] 정확한 제목 검색 예외:', error.message);
            return null;
        }
    }
    
    // 2단계: 부분 매칭 검색
    async partialTitleSearch(movieTitle) {
        console.log(`[SEARCH] 부분 매칭 검색: "${movieTitle}"`);
        
        if (!this.supabase) {
            return this.searchInHardcodedData(movieTitle);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('movies')
                .select(`
                    id, title, english_title, director, cast_members, 
                    genre, release_year, runtime_minutes, country,
                    naver_rating, description, keywords
                `)
                .or(`title.ilike.%${movieTitle}%,english_title.ilike.%${movieTitle}%`)
                .order('naver_rating', { ascending: false })
                .limit(5);
            
            if (error) {
                console.error('[ERROR] 부분 매칭 검색 오류:', error.message);
                return null;
            }
            
            if (data && data.length > 0) {
                // 가장 유사한 제목 선택
                const bestMatch = this.findBestMatch(movieTitle, data);
                console.log(`[SUCCESS] 부분 매칭 성공: "${bestMatch.title}"`);
                return bestMatch;
            }
            
            return null;
        } catch (error) {
            console.error('[ERROR] 부분 매칭 검색 예외:', error.message);
            return null;
        }
    }
    
    // 3단계: 유사 제목 검색 (한글/영어 변환 포함)
    async similarTitleSearch(movieTitle) {
        console.log(`[LOADING] 유사 제목 검색: "${movieTitle}"`);
        
        // 검색 변형 생성
        const searchVariants = this.generateSearchVariants(movieTitle);
        console.log(`[DICE] 검색 변형들: ${searchVariants.join(', ')}`);
        
        if (!this.supabase) {
            // 하드코딩 데이터에서 검색
            for (const variant of searchVariants) {
                const result = this.searchInHardcodedData(variant);
                if (result) {
                    return result;
                }
            }
            return null;
        }
        
        try {
            for (const variant of searchVariants) {
                const { data, error } = await this.supabase
                    .from('movies')
                    .select(`
                        id, title, english_title, director, cast_members, 
                        genre, release_year, runtime_minutes, country,
                        naver_rating, description, keywords
                    `)
                    .or(`title.ilike.%${variant}%,english_title.ilike.%${variant}%`)
                    .order('naver_rating', { ascending: false })
                    .limit(3);
                
                if (!error && data && data.length > 0) {
                    const bestMatch = this.findBestMatch(movieTitle, data);
                    console.log(`[SUCCESS] 유사 제목 매칭 성공: "${bestMatch.title}" (변형: "${variant}")`);
                    return bestMatch;
                }
            }
            
            return null;
        } catch (error) {
            console.error('[ERROR] 유사 제목 검색 예외:', error.message);
            return null;
        }
    }
    
    // 4단계: 키워드 기반 검색
    async keywordBasedSearch(movieTitle) {
        console.log(`[LABEL] 키워드 기반 검색: "${movieTitle}"`);
        
        if (!this.supabase) {
            return this.searchInHardcodedData(movieTitle);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('movies')
                .select(`
                    id, title, english_title, director, cast_members, 
                    genre, release_year, runtime_minutes, country,
                    naver_rating, description, keywords
                `)
                .contains('keywords', [movieTitle])
                .order('naver_rating', { ascending: false })
                .limit(3);
            
            if (error) {
                console.error('[ERROR] 키워드 검색 오류:', error.message);
                return null;
            }
            
            if (data && data.length > 0) {
                const bestMatch = this.findBestMatch(movieTitle, data);
                console.log(`[SUCCESS] 키워드 검색 성공: "${bestMatch.title}"`);
                return bestMatch;
            }
            
            return null;
        } catch (error) {
            console.error('[ERROR] 키워드 검색 예외:', error.message);
            return null;
        }
    }
    
    // 영화 상세 정보 및 리뷰 수집
    async getMovieDetails(movieData) {
        console.log(`[INFO] 영화 상세 정보 수집: "${movieData.title}"`);
        
        try {
            // 영화 기본 정보
            const movieDetails = {
                id: movieData.id,
                title: movieData.title,
                englishTitle: movieData.english_title,
                director: movieData.director,
                cast: Array.isArray(movieData.cast_members) ? movieData.cast_members : [],
                genre: movieData.genre,
                releaseYear: movieData.release_year,
                runtime: movieData.runtime_minutes,
                country: movieData.country,
                rating: movieData.naver_rating,
                description: movieData.description,
                keywords: movieData.keywords || []
            };
            
            // 평론가 리뷰 수집
            movieDetails.criticReviews = await this.getCriticReviews(movieData.id);
            
            // 종합 평점 계산
            movieDetails.overallRating = this.calculateOverallRating(movieDetails);
            
            return movieDetails;
            
        } catch (error) {
            console.error('[ERROR] 상세 정보 수집 오류:', error.message);
            return movieData;
        }
    }
    
    // 평론가 리뷰 수집
    async getCriticReviews(movieId) {
        if (!this.supabase || !movieId) {
            return [];
        }
        
        try {
            const { data, error } = await this.supabase
                .from('critic_reviews')
                .select('critic_name, review_text, score')
                .eq('movie_id', movieId)
                .order('score', { ascending: false })
                .limit(5);
            
            if (error) {
                console.error('[ERROR] 리뷰 수집 오류:', error.message);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('[ERROR] 리뷰 수집 예외:', error.message);
            return [];
        }
    }
    
    // 검색 변형 생성
    generateSearchVariants(movieTitle) {
        const variants = [movieTitle];
        
        // 공백 제거
        if (movieTitle.includes(' ')) {
            variants.push(movieTitle.replace(/\s+/g, ''));
        }
        
        // 콜론 처리
        if (movieTitle.includes(':')) {
            variants.push(movieTitle.replace(':', ''));
            variants.push(movieTitle.replace(':', ' '));
        }
        
        // 특수문자 제거
        const cleaned = movieTitle.replace(/[^\w\s가-힣]/g, '').trim();
        if (cleaned !== movieTitle) {
            variants.push(cleaned);
        }
        
        // 일반적인 변형들
        const commonVariations = {
            '더무비': ['더 무비', 'The Movie'],
            '더 무비': ['더무비', 'The Movie'],
            'F1': ['F1 더무비', 'F1 더 무비', 'Formula1'],
            '야당': ['야당: 익스텐디드 컷', '야당 익스텐디드 컷']
        };
        
        for (const [key, variations] of Object.entries(commonVariations)) {
            if (movieTitle.includes(key)) {
                variants.push(...variations);
            }
        }
        
        // 중복 제거
        return [...new Set(variants)];
    }
    
    // 최적 매치 찾기
    findBestMatch(searchTerm, candidates) {
        if (!candidates || candidates.length === 0) {
            return null;
        }
        
        if (candidates.length === 1) {
            return candidates[0];
        }
        
        // 유사도 점수 계산
        const scored = candidates.map(movie => ({
            ...movie,
            score: this.calculateSimilarityScore(searchTerm, movie)
        }));
        
        // 점수 순으로 정렬
        scored.sort((a, b) => b.score - a.score);
        
        console.log(`[TARGET] 최적 매치 선택: "${scored[0].title}" (점수: ${scored[0].score.toFixed(2)})`);
        return scored[0];
    }
    
    // 유사도 점수 계산
    calculateSimilarityScore(searchTerm, movie) {
        let score = 0;
        const searchLower = searchTerm.toLowerCase();
        const titleLower = movie.title.toLowerCase();
        const englishLower = (movie.english_title || '').toLowerCase();
        
        // 정확한 매칭
        if (titleLower === searchLower || englishLower === searchLower) {
            score += 100;
        }
        
        // 부분 매칭
        if (titleLower.includes(searchLower)) {
            score += 50;
        }
        if (englishLower.includes(searchLower)) {
            score += 40;
        }
        
        // 키워드 매칭
        if (movie.keywords && Array.isArray(movie.keywords)) {
            const keywordMatches = movie.keywords.filter(keyword => 
                keyword.toLowerCase().includes(searchLower)
            ).length;
            score += keywordMatches * 10;
        }
        
        // 평점 보너스 (높은 평점일수록 우선)
        if (movie.naver_rating) {
            score += parseFloat(movie.naver_rating) * 2;
        }
        
        return score;
    }
    
    // 종합 평점 계산
    calculateOverallRating(movieDetails) {
        let totalScore = 0;
        let count = 0;
        
        // 네이버 평점
        if (movieDetails.rating) {
            totalScore += parseFloat(movieDetails.rating);
            count++;
        }
        
        // 평론가 평점
        if (movieDetails.criticReviews && movieDetails.criticReviews.length > 0) {
            const criticAvg = movieDetails.criticReviews.reduce(
                (sum, review) => sum + parseFloat(review.score), 0
            ) / movieDetails.criticReviews.length;
            totalScore += criticAvg;
            count++;
        }
        
        return count > 0 ? (totalScore / count).toFixed(1) : movieDetails.rating || '정보없음';
    }
    
    // 하드코딩 데이터에서 검색 (Supabase 연결 실패시 fallback)
    searchInHardcodedData(movieTitle) {
        console.log(`💾 하드코딩 데이터에서 검색: "${movieTitle}"`);
        
        const hardcodedMovies = [
            {
                id: 'hc_1',
                title: '야당: 익스텐디드 컷',
                english_title: null,
                director: '황병국',
                cast_members: ['강하늘', '유해진', '박해준', '류경수', '채원빈'],
                genre: '범죄, 액션',
                release_year: 2025,
                runtime_minutes: 136,
                country: '한국',
                naver_rating: 8.2,
                description: '범죄, 액션 영화. 황병국 감독 작품.',
                keywords: ['야당', '야당익스텐디드컷', '황병국', '강하늘', '유해진']
            },
            {
                id: 'hc_2',
                title: 'F1 더 무비',
                english_title: 'F1',
                director: '조제프 코신스키',
                cast_members: ['브래드 피트', '데미안 비칠', '케리 콘던'],
                genre: '액션, 스포츠',
                release_year: 2024,
                runtime_minutes: 150,
                country: '미국',
                naver_rating: 8.1,
                description: 'F1 레이싱을 배경으로 한 액션 스포츠 영화',
                keywords: ['f1', '더무비', '브래드피트', '조제프코신스키']
            }
        ];
        
        // 다양한 매칭 시도
        for (const movie of hardcodedMovies) {
            if (this.matchesMovie(movieTitle, movie)) {
                console.log(`[SUCCESS] 하드코딩 데이터에서 발견: "${movie.title}"`);
                return movie;
            }
        }
        
        return null;
    }
    
    // 영화 매칭 확인
    matchesMovie(searchTerm, movie) {
        const searchLower = searchTerm.toLowerCase();
        
        // 제목 매칭
        if (movie.title.toLowerCase().includes(searchLower)) return true;
        if (movie.english_title && movie.english_title.toLowerCase().includes(searchLower)) return true;
        
        // 키워드 매칭
        if (movie.keywords) {
            for (const keyword of movie.keywords) {
                if (keyword.toLowerCase().includes(searchLower)) return true;
            }
        }
        
        return false;
    }
    
    // 응답 시간 업데이트
    updateResponseTime(responseTime) {
        const current = this.searchStats.averageResponseTime;
        const total = this.searchStats.totalSearches;
        this.searchStats.averageResponseTime = 
            (current * (total - 1) + responseTime) / total;
    }
    
    // 통계 조회
    getStats() {
        const successRate = this.searchStats.totalSearches > 0 
            ? (this.searchStats.successfulSearches / this.searchStats.totalSearches * 100).toFixed(1)
            : 0;
            
        return {
            ...this.searchStats,
            successRate: `${successRate}%`,
            averageResponseTime: `${this.searchStats.averageResponseTime.toFixed(0)}ms`
        };
    }
}

module.exports = MovieSearchAgent;