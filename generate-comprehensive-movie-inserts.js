// 10년간 모든 영화 데이터 크롤링 및 INSERT문 생성
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ComprehensiveMovieInsertsGenerator {
    constructor() {
        this.koficApiKey = process.env.KOFIC_API_KEY || '504ec8ff56d6c888399e9b9c1f719f03';
        this.naverClientId = process.env.NAVER_CLIENT_ID;
        this.naverClientSecret = process.env.NAVER_CLIENT_SECRET;
        
        this.koficBaseUrl = 'http://www.kobis.or.kr/kobisopenapi/webservice/rest';
        this.naverSearchUrl = 'https://openapi.naver.com/v1/search/movie.json';
        
        this.movies = [];
        this.processedMovies = new Set(); // 중복 방지
        this.sqlInserts = [];
        
        this.results = {
            totalProcessed: 0,
            koficMovies: 0,
            naverEnriched: 0,
            successCount: 0,
            errorCount: 0,
            errors: []
        };
    }

    async generateComprehensiveInserts() {
        console.log('🎬 10년간 모든 영화 데이터 크롤링 및 INSERT문 생성 시작\n');
        const startTime = Date.now();

        try {
            // 1. KOFIC API로 박스오피스 영화 수집
            await this.crawlKoficMovies();
            
            // 2. 네이버 API로 상세 정보 보완
            if (this.naverClientId && this.naverClientSecret) {
                await this.enrichWithNaverData();
            } else {
                console.log('⚠️ 네이버 API 키가 없어서 기본 데이터로 진행');
            }

            // 3. SQL INSERT문 생성
            await this.generateSQLInserts();

            const duration = Math.round((Date.now() - startTime) / 1000);
            
            console.log('\n🎉 영화 데이터 수집 및 INSERT문 생성 완료!');
            console.log(`📊 총 처리: ${this.results.totalProcessed}개`);
            console.log(`📽️ KOFIC 영화: ${this.results.koficMovies}개`);
            console.log(`🔍 네이버 보완: ${this.results.naverEnriched}개`);
            console.log(`✅ 성공: ${this.results.successCount}개`);
            console.log(`❌ 실패: ${this.results.errorCount}개`);
            console.log(`⏱️ 소요시간: ${duration}초`);

            return {
                success: true,
                totalInserts: this.sqlInserts.length,
                results: this.results
            };

        } catch (error) {
            console.error('❌ 전체 프로세스 오류:', error);
            return {
                success: false,
                error: error.message,
                results: this.results
            };
        }
    }

    // KOFIC API로 10년간 박스오피스 데이터 수집
    async crawlKoficMovies() {
        console.log('📊 KOFIC API 박스오피스 데이터 수집 시작');
        
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 10;
        
        console.log(`📅 ${startYear}년 ~ ${currentYear}년 박스오피스 데이터 수집`);

        for (let year = startYear; year <= currentYear; year++) {
            console.log(`\n🗓️ ${year}년 데이터 수집 중...`);
            
            try {
                await this.crawlYearlyMovies(year);
                await this.sleep(1000); // 연도 간 대기
            } catch (error) {
                console.error(`❌ ${year}년 데이터 수집 오류:`, error.message);
                this.results.errors.push(`${year}년: ${error.message}`);
            }
        }

        console.log(`\n📽️ KOFIC에서 총 ${this.results.koficMovies}개 영화 수집 완료`);
    }

    // 연간 영화 데이터 수집
    async crawlYearlyMovies(year) {
        // 월별 박스오피스 수집
        for (let month = 1; month <= 12; month++) {
            try {
                const weeklyMovies = await this.getMonthlyBoxOffice(year, month);
                
                for (const movie of weeklyMovies) {
                    await this.processKoficMovie(movie);
                    await this.sleep(200); // API 호출 간격
                }

            } catch (error) {
                console.error(`❌ ${year}년 ${month}월 오류:`, error.message);
            }
        }
        
        // 연간 박스오피스도 수집
        try {
            const yearlyMovies = await this.getYearlyBoxOffice(year);
            for (const movie of yearlyMovies) {
                await this.processKoficMovie(movie);
                await this.sleep(200);
            }
        } catch (error) {
            console.error(`❌ ${year}년 연간 박스오피스 오류:`, error.message);
        }
    }

    // 월간 박스오피스 데이터 가져오기
    async getMonthlyBoxOffice(year, month) {
        const movies = [];
        
        // 해당 월의 주간 박스오피스 수집
        for (let week = 1; week <= 4; week++) {
            try {
                const targetDate = `${year}${month.toString().padStart(2, '0')}${(week * 7).toString().padStart(2, '0')}`;
                
                const response = await axios.get(`${this.koficBaseUrl}/boxoffice/searchWeeklyBoxOfficeList.json`, {
                    params: {
                        key: this.koficApiKey,
                        targetDt: targetDate,
                        weekGb: '0'
                    },
                    timeout: 10000
                });

                if (response.data?.boxOfficeResult?.weeklyBoxOfficeList) {
                    movies.push(...response.data.boxOfficeResult.weeklyBoxOfficeList);
                }

                await this.sleep(300);

            } catch (error) {
                // 주간 데이터 오류는 조용히 처리
            }
        }

        return movies;
    }

    // 연간 박스오피스 데이터 가져오기
    async getYearlyBoxOffice(year) {
        try {
            const response = await axios.get(`${this.koficBaseUrl}/boxoffice/searchYearlyBoxOfficeList.json`, {
                params: {
                    key: this.koficApiKey,
                    targetYear: year,
                    repNationCd: 'K' // 한국영화
                },
                timeout: 10000
            });

            if (response.data?.boxOfficeResult?.yearlyBoxOfficeList) {
                return response.data.boxOfficeResult.yearlyBoxOfficeList;
            }

            return [];

        } catch (error) {
            console.error(`❌ ${year}년 연간 박스오피스 오류:`, error.message);
            return [];
        }
    }

    // KOFIC 영화 처리
    async processKoficMovie(boxOfficeMovie) {
        try {
            const movieKey = `${boxOfficeMovie.movieNm}_${boxOfficeMovie.movieCd}`;
            
            if (this.processedMovies.has(movieKey)) {
                return; // 중복 처리 방지
            }

            this.processedMovies.add(movieKey);
            this.results.totalProcessed++;

            // 영화 상세 정보 가져오기
            const movieDetail = await this.getKoficMovieDetail(boxOfficeMovie.movieCd);
            
            if (!movieDetail) {
                console.log(`⚠️ 상세 정보 없음: ${boxOfficeMovie.movieNm}`);
                return;
            }

            // 영화 정보 구성
            const movieInfo = this.buildMovieInfo(movieDetail, boxOfficeMovie);
            this.movies.push(movieInfo);
            this.results.koficMovies++;

            if (this.results.koficMovies % 50 === 0) {
                console.log(`📊 진행 상황: ${this.results.koficMovies}개 영화 수집됨`);
            }

        } catch (error) {
            this.results.errorCount++;
            this.results.errors.push(`${boxOfficeMovie?.movieNm}: ${error.message}`);
        }
    }

    // KOFIC 영화 상세 정보 조회
    async getKoficMovieDetail(movieCd) {
        try {
            const response = await axios.get(`${this.koficBaseUrl}/movie/searchMovieInfo.json`, {
                params: {
                    key: this.koficApiKey,
                    movieCd: movieCd
                },
                timeout: 10000
            });

            if (response.data?.movieInfoResult?.movieInfo) {
                return response.data.movieInfoResult.movieInfo;
            }

            return null;

        } catch (error) {
            console.error(`❌ KOFIC 상세 정보 오류 (${movieCd}):`, error.message);
            return null;
        }
    }

    // 영화 정보 구성
    buildMovieInfo(movieDetail, boxOfficeData) {
        // 감독 정보
        const directors = movieDetail.directors?.map(d => d.peopleNm).join(', ') || '';
        
        // 출연진 정보 (상위 5명)
        const actors = movieDetail.actors?.slice(0, 5).map(a => a.peopleNm) || [];
        
        // 장르 정보
        const genres = movieDetail.genres?.map(g => g.genreNm).join(', ') || '';
        
        // 국가 정보
        const countries = movieDetail.nations?.map(n => n.nationNm).join(', ') || '한국';

        return {
            title: movieDetail.movieNm,
            english_title: movieDetail.movieNmEn || null,
            director: directors,
            cast_members: actors,
            genre: genres,
            release_year: parseInt(movieDetail.prdtYear) || null,
            runtime_minutes: parseInt(movieDetail.showTm) || null,
            country: countries,
            naver_rating: null, // 네이버에서 보완
            description: this.generateDescription(movieDetail, genres),
            keywords: this.generateKeywords(movieDetail),
            poster_url: null, // 네이버에서 보완
            naver_movie_id: null, // 네이버에서 보완
            kofic_movie_code: movieDetail.movieCd,
            data_source: 'kofic_api',
            box_office_rank: parseInt(boxOfficeData?.rank) || null
        };
    }

    // 영화 설명 생성
    generateDescription(movieDetail, genres) {
        let description = `${movieDetail.movieNm} (${movieDetail.prdtYear})`;
        
        if (genres) {
            description += ` - ${genres}`;
        }
        
        if (movieDetail.directors?.length > 0) {
            description += `, 감독: ${movieDetail.directors[0].peopleNm}`;
        }

        if (movieDetail.actors?.length > 0) {
            const mainActors = movieDetail.actors.slice(0, 3).map(a => a.peopleNm).join(', ');
            description += `, 출연: ${mainActors}`;
        }

        return description;
    }

    // 검색 키워드 생성
    generateKeywords(movieDetail) {
        const keywords = [];
        
        // 영화 제목
        keywords.push(movieDetail.movieNm);
        if (movieDetail.movieNmEn) {
            keywords.push(movieDetail.movieNmEn.toLowerCase());
        }
        
        // 감독
        movieDetail.directors?.forEach(director => {
            keywords.push(director.peopleNm);
        });
        
        // 주연 배우 (상위 3명)
        movieDetail.actors?.slice(0, 3).forEach(actor => {
            keywords.push(actor.peopleNm);
        });
        
        // 장르
        movieDetail.genres?.forEach(genre => {
            keywords.push(genre.genreNm);
        });

        return keywords;
    }

    // 네이버 API로 상세 정보 보완
    async enrichWithNaverData() {
        console.log('\n🔍 네이버 API로 상세 정보 보완 시작');
        console.log(`📊 보완 대상: ${this.movies.length}개 영화`);

        for (let i = 0; i < this.movies.length; i++) {
            const movie = this.movies[i];
            
            try {
                console.log(`🔍 ${i + 1}/${this.movies.length}: "${movie.title}" 보완 중...`);
                
                const naverData = await this.searchNaverMovie(movie.title);
                
                if (naverData) {
                    // 네이버 데이터로 보완
                    movie.naver_rating = naverData.userRating ? parseFloat(naverData.userRating) : null;
                    movie.poster_url = naverData.image || null;
                    movie.naver_movie_id = this.extractNaverMovieId(naverData.link);
                    
                    // 설명 보완
                    if (naverData.actor && !movie.cast_members.length) {
                        movie.cast_members = naverData.actor.split('|').slice(0, 5);
                    }
                    
                    this.results.naverEnriched++;
                    
                    if (this.results.naverEnriched % 20 === 0) {
                        console.log(`📊 네이버 보완 진행: ${this.results.naverEnriched}개 완료`);
                    }
                }

                await this.sleep(150); // API 호출 제한 준수

            } catch (error) {
                console.error(`❌ 네이버 보완 오류 (${movie.title}):`, error.message);
            }
        }

        console.log(`✅ 네이버 데이터 보완 완료: ${this.results.naverEnriched}개`);
    }

    // 네이버 영화 검색
    async searchNaverMovie(title) {
        try {
            const response = await axios.get(this.naverSearchUrl, {
                params: {
                    query: title,
                    display: 1,
                    start: 1
                },
                headers: {
                    'X-Naver-Client-Id': this.naverClientId,
                    'X-Naver-Client-Secret': this.naverClientSecret
                },
                timeout: 10000
            });

            if (response.data.items && response.data.items.length > 0) {
                return response.data.items[0];
            }

            return null;

        } catch (error) {
            console.error(`네이버 검색 오류 (${title}):`, error.message);
            return null;
        }
    }

    // 네이버 영화 ID 추출
    extractNaverMovieId(naverLink) {
        if (!naverLink) return null;
        
        const match = naverLink.match(/code=(\d+)/);
        return match ? match[1] : null;
    }

    // SQL INSERT문 생성
    async generateSQLInserts() {
        console.log('\n📝 SQL INSERT문 생성 시작');
        
        // 기존 movies 테이블 구조에 맞춰 INSERT문 생성
        this.movies.forEach((movie, index) => {
            try {
                const insertSQL = this.generateSingleInsert(movie);
                this.sqlInserts.push(insertSQL);
                this.results.successCount++;
                
            } catch (error) {
                console.error(`❌ INSERT문 생성 오류 (${movie.title}):`, error.message);
                this.results.errorCount++;
            }
        });

        // SQL 파일 저장
        await this.saveSQLFile();
        
        console.log(`✅ SQL INSERT문 생성 완료: ${this.sqlInserts.length}개`);
    }

    // 단일 INSERT문 생성 (기존 테이블 구조에 맞게)
    generateSingleInsert(movie) {
        // SQL 안전한 문자열 이스케이프
        const escapeSQL = (str) => {
            if (str === null || str === undefined) return 'NULL';
            return `'${str.toString().replace(/'/g, "''")}'`;
        };

        // 배열을 PostgreSQL 배열 형식으로 변환
        const arrayToSQL = (arr) => {
            if (!arr || !Array.isArray(arr) || arr.length === 0) return 'NULL';
            const escapedItems = arr.map(item => `"${item.replace(/"/g, '\\"')}"`);
            return `'{${escapedItems.join(',')}}'`;
        };

        const values = [
            escapeSQL(movie.title),
            escapeSQL(movie.english_title),
            escapeSQL(movie.director),
            arrayToSQL(movie.cast_members),
            escapeSQL(movie.genre),
            movie.release_year || 'NULL',
            movie.runtime_minutes || 'NULL',
            escapeSQL(movie.country),
            movie.naver_rating || 'NULL',
            escapeSQL(movie.description),
            arrayToSQL(movie.keywords),
            escapeSQL(movie.poster_url),
            escapeSQL(movie.naver_movie_id)
        ];

        return `INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES (${values.join(', ')});`;
    }

    // SQL 파일 저장
    async saveSQLFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `comprehensive_movies_10years_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);

        let sqlContent = `-- 10년간 모든 영화 데이터 INSERT 문\n`;
        sqlContent += `-- 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
        sqlContent += `-- 총 영화 수: ${this.sqlInserts.length}개\n`;
        sqlContent += `-- 데이터 소스: KOFIC API + 네이버 영화 API\n`;
        sqlContent += `-- 수집 기간: ${new Date().getFullYear() - 10}년 ~ ${new Date().getFullYear()}년\n\n`;
        
        sqlContent += `-- 기존 테이블 구조 확인 (참고용)\n`;
        sqlContent += `/*\n`;
        sqlContent += `CREATE TABLE movies (\n`;
        sqlContent += `    id SERIAL PRIMARY KEY,\n`;
        sqlContent += `    title VARCHAR(255) NOT NULL,\n`;
        sqlContent += `    english_title VARCHAR(255),\n`;
        sqlContent += `    director VARCHAR(255),\n`;
        sqlContent += `    cast_members TEXT[],\n`;
        sqlContent += `    genre VARCHAR(255),\n`;
        sqlContent += `    release_year INTEGER,\n`;
        sqlContent += `    runtime_minutes INTEGER,\n`;
        sqlContent += `    country VARCHAR(100),\n`;
        sqlContent += `    naver_rating DECIMAL(3,1),\n`;
        sqlContent += `    description TEXT,\n`;
        sqlContent += `    keywords TEXT[],\n`;
        sqlContent += `    poster_url TEXT,\n`;
        sqlContent += `    naver_movie_id VARCHAR(50),\n`;
        sqlContent += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
        sqlContent += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
        sqlContent += `);\n`;
        sqlContent += `*/\n\n`;
        
        sqlContent += `-- 영화 데이터 INSERT\n`;
        sqlContent += `BEGIN;\n\n`;
        
        this.sqlInserts.forEach((insert, index) => {
            sqlContent += `-- ${index + 1}. 영화 데이터\n`;
            sqlContent += insert + '\n\n';
        });
        
        sqlContent += `COMMIT;\n\n`;
        sqlContent += `-- INSERT 완료. 총 ${this.sqlInserts.length}개 영화 추가됨\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- 📊 수집 통계:\n`;
        sqlContent += `-- - KOFIC 영화: ${this.results.koficMovies}개\n`;
        sqlContent += `-- - 네이버 보완: ${this.results.naverEnriched}개\n`;
        sqlContent += `-- - 성공: ${this.results.successCount}개\n`;
        sqlContent += `-- - 실패: ${this.results.errorCount}개\n`;

        // 파일 저장
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        
        console.log(`\n📄 SQL 파일 생성 완료: ${filename}`);
        console.log(`📍 파일 위치: ${filepath}`);
        console.log(`📊 총 INSERT문: ${this.sqlInserts.length}개`);
        
        return { filename, filepath, insertCount: this.sqlInserts.length };
    }

    // 지연 함수
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 실행 함수
async function main() {
    console.log('🎬 10년간 모든 영화 데이터 수집 및 INSERT문 생성기');
    console.log('='.repeat(60));
    
    const generator = new ComprehensiveMovieInsertsGenerator();
    
    try {
        const result = await generator.generateComprehensiveInserts();
        
        if (result.success) {
            console.log('\n🎉 전체 프로세스 완료!');
            console.log('📋 사용 방법:');
            console.log('1. 생성된 .sql 파일을 Supabase SQL 에디터에 복사');
            console.log('2. Run 버튼으로 실행');
            console.log('3. 수천 개의 영화 데이터가 movies 테이블에 저장됨');
            console.log('4. 카카오 스킬에서 풍부한 영화 정보 제공 가능');
        }
        
    } catch (error) {
        console.error('❌ 실행 오류:', error);
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = ComprehensiveMovieInsertsGenerator;