// 1000개+ 한국 영화 대량 수집 스크립트
const axios = require('axios');
const fs = require('fs');

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

class MassiveKoreanMoviesCollector {
    constructor() {
        this.movies = new Map(); // 중복 제거를 위해 Map 사용 (movieCd 기반)
        this.processedCodes = new Set();
        this.totalProcessed = 0;
        this.targetCount = 1000;
        this.batchSize = 20;
    }

    // 로그 출력
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '[PIN]',
            success: '[SUCCESS]',
            error: '[ERROR]',
            warning: '[WARN]',
            progress: '[LOADING]'
        };
        console.log(`[${timestamp}] ${prefix[type]} ${message}`);
    }

    // 날짜 포맷 (YYYYMMDD)
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 날짜 범위 생성 (매주 토요일)
    generateDateRange(startYear, endYear) {
        const dates = [];
        
        for (let year = startYear; year <= endYear; year++) {
            // 매월 1일, 8일, 15일, 22일에 박스오피스 체크
            for (let month = 1; month <= 12; month++) {
                const checkDays = [1, 8, 15, 22];
                
                for (const day of checkDays) {
                    const date = new Date(year, month - 1, day);
                    // 유효한 날짜인지 확인
                    if (date.getMonth() === month - 1) {
                        dates.push(this.formatDate(date));
                    }
                }
            }
        }
        
        return dates.sort().reverse(); // 최신순으로 정렬
    }

    // 주간 박스오피스 조회
    async getWeeklyBoxOffice(targetDate) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/boxoffice/searchWeeklyBoxOfficeList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    targetDt: targetDate,
                    weekGb: '0' // 주간
                },
                timeout: 10000
            });

            if (response.data.boxOfficeResult && response.data.boxOfficeResult.weeklyBoxOfficeList) {
                return response.data.boxOfficeResult.weeklyBoxOfficeList;
            }
            return [];
        } catch (error) {
            this.log(`박스오피스 조회 실패 (${targetDate}): ${error.message}`, 'error');
            return [];
        }
    }

    // 일간 박스오피스 조회
    async getDailyBoxOffice(targetDate) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/boxoffice/searchDailyBoxOfficeList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    targetDt: targetDate
                },
                timeout: 10000
            });

            if (response.data.boxOfficeResult && response.data.boxOfficeResult.dailyBoxOfficeList) {
                return response.data.boxOfficeResult.dailyBoxOfficeList;
            }
            return [];
        } catch (error) {
            this.log(`일간 박스오피스 조회 실패 (${targetDate}): ${error.message}`, 'error');
            return [];
        }
    }

    // 영화 검색 (키워드 기반)
    async searchMoviesByKeyword(keyword, startYear = 2015, endYear = 2025) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    movieNm: keyword,
                    prdtStartYear: startYear,
                    prdtEndYear: endYear,
                    itemPerPage: 50
                },
                timeout: 10000
            });

            if (response.data.movieListResult && response.data.movieListResult.movieList) {
                return response.data.movieListResult.movieList;
            }
            return [];
        } catch (error) {
            this.log(`영화 검색 실패 (${keyword}): ${error.message}`, 'error');
            return [];
        }
    }

    // 영화 상세 정보 조회
    async getMovieDetail(movieCd) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieInfo.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    movieCd: movieCd
                },
                timeout: 10000
            });

            if (response.data.movieInfoResult) {
                return response.data.movieInfoResult.movieInfo;
            }
            return null;
        } catch (error) {
            this.log(`영화 상세 정보 조회 실패 (${movieCd}): ${error.message}`, 'error');
            return null;
        }
    }

    // 한국 영화 판별
    isKoreanMovie(movie, movieDetail = null) {
        // 기본 국가 정보 확인
        if (movie.repNationNm && movie.repNationNm === '한국') {
            return true;
        }

        // 상세 정보가 있다면 더 정확한 판별
        if (movieDetail && movieDetail.nations) {
            return movieDetail.nations.some(nation => nation.nationNm === '한국');
        }

        // 제목 기반 휴리스틱 (외국 영화 제외)
        const foreignKeywords = [
            'avengers', 'spider', 'batman', 'superman', 'transformer', 'jurassic',
            'harry potter', 'lord of rings', 'star wars', 'mission impossible',
            'fast furious', 'toy story', 'frozen', 'lion king', 'incredible',
            'marvel', 'disney', 'pixar', 'x-men', 'deadpool', 'thor', 'iron man'
        ];

        const title = movie.movieNm.toLowerCase();
        return !foreignKeywords.some(keyword => title.includes(keyword));
    }

    // 영화 데이터 포맷팅
    formatMovieData(movie, movieDetail) {
        const releaseDate = movieDetail.openDt;
        const releaseYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : 
                           (movie.prdtYear ? parseInt(movie.prdtYear) : null);
        
        const directors = movieDetail.directors && movieDetail.directors.length > 0 
            ? movieDetail.directors.map(d => d.peopleNm).join(', ')
            : null;
        
        const castMembers = movieDetail.actors 
            ? movieDetail.actors.slice(0, 15).map(actor => actor.peopleNm)
            : [];

        const runtime = movieDetail.showTm ? parseInt(movieDetail.showTm) : null;

        const genres = movieDetail.genres && movieDetail.genres.length > 0
            ? movieDetail.genres.map(g => g.genreNm).join(', ')
            : null;

        const watchGrade = movieDetail.audits && movieDetail.audits.length > 0
            ? movieDetail.audits[0].watchGradeNm 
            : null;

        // 키워드 생성
        const keywords = [];
        keywords.push(movieDetail.movieNm.toLowerCase());
        if (movieDetail.movieNmEn) keywords.push(movieDetail.movieNmEn.toLowerCase());
        if (directors) keywords.push(directors);
        castMembers.slice(0, 10).forEach(actor => keywords.push(actor));
        if (genres) keywords.push(genres);

        // 제작사 정보
        const productionCompanies = movieDetail.companys 
            ? movieDetail.companys
                .filter(c => c.companyPartNm === '제작사')
                .map(c => c.companyNm)
            : [];

        return {
            title: movieDetail.movieNm,
            english_title: movieDetail.movieNmEn || null,
            director: directors,
            cast_members: castMembers,
            genre: this.mapKoreanGenre(movieDetail.genres),
            release_year: releaseYear,
            release_date: releaseDate ? this.formatDisplayDate(releaseDate) : null,
            runtime_minutes: runtime,
            country: '한국',
            watch_grade: watchGrade,
            description: this.generateDescription(movieDetail),
            keywords: keywords,
            kofic_movie_code: movieDetail.movieCd,
            genres_korean: genres,
            production_companies: productionCompanies,
            // 추가 메타데이터
            crawl_date: new Date().toISOString(),
            data_source: 'KOFIC_API'
        };
    }

    // 장르 매핑
    mapKoreanGenre(genres) {
        if (!genres || genres.length === 0) return 'Drama';
        
        const genreMap = {
            '드라마': 'Drama', '액션': 'Action', '코미디': 'Comedy',
            '멜로/로맨스': 'Romance', '로맨스': 'Romance', '스릴러': 'Thriller',
            '공포(호러)': 'Horror', '공포': 'Horror', '미스터리': 'Mystery',
            'SF': 'Sci-Fi', '판타지': 'Fantasy', '애니메이션': 'Animation',
            '다큐멘터리': 'Documentary', '범죄': 'Crime', '전쟁': 'War',
            '뮤지컬': 'Musical', '가족': 'Family', '어드벤처': 'Adventure',
            '모험': 'Adventure', '사극': 'Historical', '시대극': 'Historical',
            '기타': 'Drama'
        };

        return genreMap[genres[0].genreNm] || 'Drama';
    }

    // 설명 생성
    generateDescription(movieDetail) {
        let description = '';
        
        if (movieDetail.genres && movieDetail.genres.length > 0) {
            const genres = movieDetail.genres.map(g => g.genreNm).join(', ');
            description += `${genres} 영화. `;
        }
        
        if (movieDetail.directors && movieDetail.directors.length > 0) {
            const directors = movieDetail.directors.map(d => d.peopleNm).join(', ');
            description += `${directors} 감독 작품. `;
        }
        
        if (movieDetail.actors && movieDetail.actors.length > 0) {
            const mainActors = movieDetail.actors.slice(0, 3).map(a => a.peopleNm).join(', ');
            description += `${mainActors} 주연. `;
        }

        if (movieDetail.openDt) {
            description += `${this.formatDisplayDate(movieDetail.openDt)} 개봉.`;
        }
        
        return description.trim() || null;
    }

    // 날짜 표시 형식 변환
    formatDisplayDate(dateString) {
        if (!dateString || dateString.length !== 8) return dateString;
        return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
    }

    // 배치 처리로 영화 상세 정보 수집
    async processMovieBatch(movieCodes) {
        const results = [];
        
        for (let i = 0; i < movieCodes.length; i += this.batchSize) {
            const batch = movieCodes.slice(i, i + this.batchSize);
            
            this.log(`배치 ${Math.floor(i/this.batchSize) + 1} 처리 중 (${batch.length}개 영화)...`, 'progress');
            
            const batchPromises = batch.map(async (movieCd) => {
                if (this.processedCodes.has(movieCd)) {
                    return null; // 이미 처리된 영화
                }

                try {
                    const movieDetail = await this.getMovieDetail(movieCd);
                    if (movieDetail) {
                        this.processedCodes.add(movieCd);
                        return { movieCd, movieDetail };
                    }
                } catch (error) {
                    this.log(`영화 처리 실패 (${movieCd}): ${error.message}`, 'warning');
                }
                return null;
            });

            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                }
            });

            // API 제한 방지
            await this.delay(1000);
            
            this.log(`배치 완료: ${results.length}/${this.totalProcessed} 처리됨`);
        }

        return results;
    }

    // 박스오피스 기반 대량 수집
    async collectFromBoxOffice() {
        this.log('박스오피스 기반 영화 수집 시작...');
        
        const dateRange = this.generateDateRange(2015, 2025);
        const movieCodes = new Set();
        
        this.log(`${dateRange.length}개 날짜 범위에서 박스오피스 수집 예정`);

        // 1단계: 박스오피스에서 영화 코드 수집
        for (let i = 0; i < dateRange.length && movieCodes.size < this.targetCount * 2; i++) {
            const targetDate = dateRange[i];
            
            try {
                // 주간 박스오피스
                const weeklyMovies = await this.getWeeklyBoxOffice(targetDate);
                weeklyMovies.forEach(movie => {
                    if (this.isKoreanMovie(movie)) {
                        movieCodes.add(movie.movieCd);
                    }
                });

                // 일간 박스오피스 (더 많은 데이터를 위해)
                if (i % 3 === 0) { // 3번에 1번씩만 체크
                    const dailyMovies = await this.getDailyBoxOffice(targetDate);
                    dailyMovies.forEach(movie => {
                        if (this.isKoreanMovie(movie)) {
                            movieCodes.add(movie.movieCd);
                        }
                    });
                }

                if (i % 20 === 0) {
                    this.log(`진행상황: ${i}/${dateRange.length} 날짜 처리, ${movieCodes.size}개 영화 발견`);
                }

                await this.delay(200);
            } catch (error) {
                this.log(`날짜 ${targetDate} 처리 중 오류: ${error.message}`, 'warning');
            }
        }

        this.log(`총 ${movieCodes.size}개 고유 영화 코드 수집 완료`);
        return Array.from(movieCodes);
    }

    // 키워드 기반 추가 수집
    async collectByKeywords() {
        this.log('키워드 기반 추가 영화 수집...');
        
        const keywords = [
            // 일반적인 한국어 키워드
            '사랑', '인생', '가족', '친구', '꿈', '희망', '이별', '만남', '추억',
            '청춘', '로맨스', '액션', '코미디', '드라마', '스릴러', '미스터리',
            '범죄', '전쟁', '사극', '현대', '서울', '부산', '경찰', '검사',
            '의사', '선생님', '학생', '직장', '회사', '결혼', '이혼',
            
            // 한국 영화 제목에 자주 나오는 단어들
            '왕', '공주', '대왕', '선생', '아저씨', '아가씨', '형님', '누나',
            '엄마', '아빠', '아들', '딸', '할머니', '할아버지', '집', '방',
            '길', '바다', '산', '강', '도시', '마을', '학교', '병원',
            
            // 감정/상황 키워드
            '행복', '슬픔', '분노', '복수', '용서', '희생', '성공', '실패',
            '시작', '끝', '변화', '성장', '위기', '기회', '선택', '운명'
        ];

        const movieCodes = new Set();
        
        for (const keyword of keywords) {
            if (movieCodes.size >= this.targetCount) break;
            
            try {
                const movies = await this.searchMoviesByKeyword(keyword);
                movies.forEach(movie => {
                    if (this.isKoreanMovie(movie)) {
                        movieCodes.add(movie.movieCd);
                    }
                });

                await this.delay(300);
            } catch (error) {
                this.log(`키워드 "${keyword}" 검색 실패: ${error.message}`, 'warning');
            }
        }

        this.log(`키워드 검색으로 ${movieCodes.size}개 추가 영화 발견`);
        return Array.from(movieCodes);
    }

    // 메인 수집 프로세스
    async collectMassiveMovies() {
        this.log(`한국 영화 ${this.targetCount}개 대량 수집 시작!`);

        // 1단계: 박스오피스 기반 수집
        const boxOfficeMovies = await this.collectFromBoxOffice();
        
        // 2단계: 키워드 기반 추가 수집
        const keywordMovies = await this.collectByKeywords();
        
        // 3단계: 영화 코드 통합 및 중복 제거
        const allMovieCodes = [...new Set([...boxOfficeMovies, ...keywordMovies])];
        this.log(`총 ${allMovieCodes.length}개 고유 영화 코드 수집 완료`);

        // 4단계: 배치 처리로 상세 정보 수집
        this.log('영화 상세 정보 수집 시작...');
        const movieDetails = await this.processMovieBatch(allMovieCodes.slice(0, this.targetCount));

        // 5단계: 한국 영화 필터링 및 포맷팅
        let successCount = 0;
        for (const { movieCd, movieDetail } of movieDetails) {
            if (this.isKoreanMovie({ movieCd }, movieDetail)) {
                try {
                    const formattedMovie = this.formatMovieData({ movieCd }, movieDetail);
                    this.movies.set(movieCd, formattedMovie);
                    successCount++;
                    
                    if (successCount % 50 === 0) {
                        this.log(`진행상황: ${successCount}개 한국 영화 처리 완료`);
                    }
                } catch (error) {
                    this.log(`영화 포맷팅 실패 (${movieDetail.movieNm}): ${error.message}`, 'warning');
                }
            }
        }

        // 6단계: 결과 저장
        await this.saveResults();
        
        this.log(`\n========== 수집 완료 ==========`);
        this.log(`목표: ${this.targetCount}개`);
        this.log(`수집 완료: ${this.movies.size}개`);
        this.log(`성공률: ${((this.movies.size / this.targetCount) * 100).toFixed(1)}%`);
    }

    // 결과 저장
    async saveResults() {
        const timestamp = this.formatDate(new Date());
        const movies = Array.from(this.movies.values());
        
        // JSON 파일 저장
        const jsonFilename = `massive_korean_movies_${timestamp}.json`;
        const jsonData = {
            collection_date: new Date().toISOString(),
            target_count: this.targetCount,
            actual_count: movies.length,
            data_source: 'KOFIC_API',
            collection_method: 'BoxOffice + Keywords + Batch Processing',
            movies: movies
        };

        fs.writeFileSync(jsonFilename, JSON.stringify(jsonData, null, 2), 'utf8');
        this.log(`${movies.length}개 영화 데이터를 ${jsonFilename}에 저장`, 'success');

        // SQL 파일 저장
        const sqlFilename = `massive_korean_movies_insert_${timestamp}.sql`;
        this.generateSQLInserts(movies, sqlFilename);
    }

    // SQL 생성
    generateSQLInserts(movies, filename) {
        let sql = `-- 대량 한국 영화 데이터베이스 업데이트\n`;
        sql += `-- 생성일시: ${new Date().toISOString()}\n`;
        sql += `-- 총 영화 수: ${movies.length}개\n`;
        sql += `-- 데이터 소스: KOFIC API\n\n`;

        movies.forEach(movie => {
            try {
                const title = movie.title.replace(/'/g, "''");
                const englishTitle = movie.english_title ? `'${movie.english_title.replace(/'/g, "''")}'` : 'NULL';
                const director = movie.director ? `'${movie.director.replace(/'/g, "''")}'` : 'NULL';
                const castMembers = `'{${movie.cast_members.map(actor => `"${actor.replace(/"/g, '\\"')}"`).join(',')}}'`;
                const description = movie.description ? `'${movie.description.replace(/'/g, "''")}'` : 'NULL';
                const keywords = `'{${movie.keywords.map(kw => `"${kw.replace(/"/g, '\\"')}"`).join(',')}}'`;
                const watchGrade = movie.watch_grade ? `'${movie.watch_grade}'` : 'NULL';
                const genresKorean = movie.genres_korean ? `'${movie.genres_korean}'` : 'NULL';

                sql += `INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, description, keywords, kofic_movie_code, watch_grade, genres_korean) VALUES `;
                sql += `('${title}', ${englishTitle}, ${director}, '${castMembers}', '${movie.genre}', ${movie.release_year}, ${movie.runtime_minutes || 'NULL'}, '${movie.country}', ${description}, '${keywords}', '${movie.kofic_movie_code}', ${watchGrade}, ${genresKorean});\n`;
            } catch (error) {
                this.log(`SQL 생성 실패 (${movie.title}): ${error.message}`, 'warning');
            }
        });

        fs.writeFileSync(filename, sql, 'utf8');
        this.log(`SQL 파일 생성: ${filename}`, 'success');
    }

    // 딜레이
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 스크립트 실행
if (require.main === module) {
    const collector = new MassiveKoreanMoviesCollector();
    collector.collectMassiveMovies();
}

module.exports = MassiveKoreanMoviesCollector;