// KOFIC API 테스트 및 한국 영화 업데이트 스크립트
const axios = require('axios');
const fs = require('fs');

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

class KoficTestUpdater {
    constructor() {
        this.movies = [];
    }

    // 로그 출력
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '[PIN]',
            success: '[SUCCESS]',
            error: '[ERROR]',
            warning: '[WARN]'
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

    // 최근 주간 박스오피스 조회
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

            if (response.data.boxOfficeResult) {
                return response.data.boxOfficeResult.weeklyBoxOfficeList;
            }
            return [];
        } catch (error) {
            this.log(`주간 박스오피스 조회 실패: ${error.message}`, 'error');
            return [];
        }
    }

    // 영화 검색
    async searchMovies(movieTitle) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    movieNm: movieTitle,
                    itemPerPage: 10
                },
                timeout: 10000
            });

            if (response.data.movieListResult) {
                return response.data.movieListResult.movieList;
            }
            return [];
        } catch (error) {
            this.log(`영화 검색 실패 (${movieTitle}): ${error.message}`, 'error');
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

    // 특정 한국 영화들 검색 및 업데이트
    async updateSpecificKoreanMovies() {
        this.log('KOFIC API를 통한 한국 영화 업데이트 시작');

        // 최근 인기 한국 영화들
        const targetMovies = [
            '발레리나', '야당', '서울의 봄', '파묘', 
            '범죄도시3', '12.12: 더 플랜', '콘크리트 유토피아',
            '더 문', '밀수', '탈출', '노량', '웅남이',
            '천박사 퇴마 연구소', '보호자', '30일', '화란',
            '귀공자', '악마들', '리바운드', '킬링 로맨스',
            '소울메이트', '비공식작전', '댓글부대', '하이재킹',
            '탈주'
        ];

        const results = [];

        for (const movieTitle of targetMovies) {
            try {
                this.log(`"${movieTitle}" 검색 중...`);
                
                // 영화 검색
                const searchResults = await this.searchMovies(movieTitle);
                
                if (searchResults.length === 0) {
                    this.log(`"${movieTitle}" 검색 결과 없음`, 'warning');
                    continue;
                }

                // 한국 영화 필터링
                const koreanMovies = searchResults.filter(movie => 
                    movie.repNationNm === '한국' && 
                    movie.movieNm.includes(movieTitle.split(' ')[0])
                );

                if (koreanMovies.length === 0) {
                    this.log(`"${movieTitle}" 한국 영화 없음`, 'warning');
                    continue;
                }

                // 첫 번째 매치 상세 정보 조회
                const movieDetail = await this.getMovieDetail(koreanMovies[0].movieCd);
                
                if (movieDetail) {
                    const movieData = this.formatMovieData(movieDetail);
                    results.push(movieData);
                    this.log(`"${movieTitle}" 정보 수집 완료`, 'success');
                } else {
                    this.log(`"${movieTitle}" 상세 정보 조회 실패`, 'warning');
                }

                // API 제한 방지
                await this.delay(300);

            } catch (error) {
                this.log(`"${movieTitle}" 처리 중 오류: ${error.message}`, 'error');
            }
        }

        // 결과 저장
        if (results.length > 0) {
            const filename = `korean_movies_update_${this.formatDate(new Date())}.json`;
            const data = {
                update_date: new Date().toISOString(),
                total_movies: results.length,
                movies: results
            };

            fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
            this.log(`${results.length}개 영화 정보를 ${filename}에 저장`, 'success');

            // SQL 형태로도 저장
            this.generateSQLInserts(results, `korean_movies_insert_${this.formatDate(new Date())}.sql`);
        }

        this.log(`업데이트 완료 - 총 ${results.length}개 영화 처리`);
        return results;
    }

    // 영화 데이터 포맷팅
    formatMovieData(movieDetail) {
        const releaseDate = movieDetail.openDt;
        const releaseYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : null;
        
        const directors = movieDetail.directors && movieDetail.directors.length > 0 
            ? movieDetail.directors.map(d => d.peopleNm).join(', ')
            : null;
        
        const castMembers = movieDetail.actors 
            ? movieDetail.actors.slice(0, 10).map(actor => actor.peopleNm)
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
        castMembers.forEach(actor => keywords.push(actor));
        if (genres) keywords.push(genres);

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
            production_companies: this.getProductionCompanies(movieDetail.companys)
        };
    }

    // 한국 장르를 영어로 매핑
    mapKoreanGenre(genres) {
        if (!genres || genres.length === 0) return 'Drama';
        
        const genreMap = {
            '드라마': 'Drama',
            '액션': 'Action',
            '코미디': 'Comedy',
            '멜로/로맨스': 'Romance',
            '로맨스': 'Romance',
            '스릴러': 'Thriller',
            '공포(호러)': 'Horror',
            '공포': 'Horror',
            '미스터리': 'Mystery',
            'SF': 'Sci-Fi',
            '판타지': 'Fantasy',
            '애니메이션': 'Animation',
            '다큐멘터리': 'Documentary',
            '범죄': 'Crime',
            '전쟁': 'War',
            '뮤지컬': 'Musical',
            '가족': 'Family',
            '어드벤처': 'Adventure',
            '모험': 'Adventure',
            '사극': 'Historical',
            '시대극': 'Historical'
        };

        return genreMap[genres[0].genreNm] || 'Drama';
    }

    // 제작사 정보 추출
    getProductionCompanies(companies) {
        if (!companies) return [];
        
        const prodCompanies = companies
            .filter(c => c.companyPartNm === '제작사')
            .map(c => c.companyNm);
        
        return prodCompanies;
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

    // 날짜 표시 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
    formatDisplayDate(dateString) {
        if (!dateString || dateString.length !== 8) return dateString;
        return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
    }

    // SQL INSERT 문 생성
    generateSQLInserts(movies, filename) {
        let sql = `-- 한국 영화 데이터 업데이트\n`;
        sql += `-- 생성일시: ${new Date().toISOString()}\n`;
        sql += `-- 총 영화 수: ${movies.length}개\n\n`;

        movies.forEach(movie => {
            const title = movie.title.replace(/'/g, "''");
            const englishTitle = movie.english_title ? `'${movie.english_title.replace(/'/g, "''")}'` : 'NULL';
            const director = movie.director ? `'${movie.director.replace(/'/g, "''")}'` : 'NULL';
            const castMembers = `'{${movie.cast_members.map(actor => `"${actor}"`).join(',')}}'`;
            const description = movie.description ? `'${movie.description.replace(/'/g, "''")}'` : 'NULL';
            const keywords = `'{${movie.keywords.map(kw => `"${kw}"`).join(',')}}'`;
            const watchGrade = movie.watch_grade ? `'${movie.watch_grade}'` : 'NULL';
            const genresKorean = movie.genres_korean ? `'${movie.genres_korean}'` : 'NULL';

            sql += `INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, description, keywords, kofic_movie_code, watch_grade, genres_korean) VALUES `;
            sql += `('${title}', ${englishTitle}, ${director}, '${castMembers}', '${movie.genre}', ${movie.release_year}, ${movie.runtime_minutes || 'NULL'}, '${movie.country}', ${description}, '${keywords}', '${movie.kofic_movie_code}', ${watchGrade}, ${genresKorean});\n`;
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
    const updater = new KoficTestUpdater();
    updater.updateSpecificKoreanMovies();
}

module.exports = KoficTestUpdater;