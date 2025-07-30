// KOBIS (Korean Box Office Information System) API Client
const axios = require('axios');

class KobisAPI {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.KOBIS_API_KEY;
        this.baseUrl = 'http://kobis.or.kr/kobisopenapi/webservice/rest';
        this.timeout = 5000;
    }

    // 일별 박스오피스 조회
    async getDailyBoxOffice(date) {
        try {
            // KOBIS는 YYYYMMDD 형식 필요
            const targetDt = date ? date.replace(/-/g, '') : this.getYesterdayDate();
            
            const response = await axios.get(`${this.baseUrl}/boxoffice/searchDailyBoxOfficeList.json`, {
                params: {
                    key: this.apiKey,
                    targetDt: targetDt
                },
                timeout: this.timeout
            });

            if (response.data.boxOfficeResult) {
                return {
                    success: true,
                    data: response.data.boxOfficeResult
                };
            }

            return {
                success: false,
                error: 'No data found'
            };

        } catch (error) {
            console.error('[ERROR] KOBIS 일별 박스오피스 조회 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 주간/주말 박스오피스 조회
    async getWeeklyBoxOffice(date, weekGb = '0') {
        try {
            // weekGb: 0-주간, 1-주말, 2-주중
            const targetDt = date ? date.replace(/-/g, '') : this.getYesterdayDate();
            
            const response = await axios.get(`${this.baseUrl}/boxoffice/searchWeeklyBoxOfficeList.json`, {
                params: {
                    key: this.apiKey,
                    targetDt: targetDt,
                    weekGb: weekGb
                },
                timeout: this.timeout
            });

            if (response.data.boxOfficeResult) {
                return {
                    success: true,
                    data: response.data.boxOfficeResult
                };
            }

            return {
                success: false,
                error: 'No data found'
            };

        } catch (error) {
            console.error('[ERROR] KOBIS 주간 박스오피스 조회 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 영화 상세정보 조회
    async getMovieInfo(movieCd) {
        try {
            const response = await axios.get(`${this.baseUrl}/movie/searchMovieInfo.json`, {
                params: {
                    key: this.apiKey,
                    movieCd: movieCd
                },
                timeout: this.timeout
            });

            if (response.data.movieInfoResult) {
                return {
                    success: true,
                    data: response.data.movieInfoResult.movieInfo
                };
            }

            return {
                success: false,
                error: 'No movie info found'
            };

        } catch (error) {
            console.error('[ERROR] KOBIS 영화 상세정보 조회 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 영화 목록 조회 (검색)
    async searchMovies(movieNm, options = {}) {
        try {
            const params = {
                key: this.apiKey,
                movieNm: movieNm,
                curPage: options.curPage || 1,
                itemPerPage: options.itemPerPage || 10
            };

            // 추가 옵션들
            if (options.directorNm) params.directorNm = options.directorNm;
            if (options.openStartDt) params.openStartDt = options.openStartDt;
            if (options.openEndDt) params.openEndDt = options.openEndDt;
            if (options.prdtStartYear) params.prdtStartYear = options.prdtStartYear;
            if (options.prdtEndYear) params.prdtEndYear = options.prdtEndYear;

            const response = await axios.get(`${this.baseUrl}/movie/searchMovieList.json`, {
                params: params,
                timeout: this.timeout
            });

            if (response.data.movieListResult) {
                return {
                    success: true,
                    data: response.data.movieListResult
                };
            }

            return {
                success: false,
                error: 'No movies found'
            };

        } catch (error) {
            console.error('[ERROR] KOBIS 영화 검색 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 영화인 정보 조회
    async searchPeople(peopleNm) {
        try {
            const response = await axios.get(`${this.baseUrl}/people/searchPeopleList.json`, {
                params: {
                    key: this.apiKey,
                    peopleNm: peopleNm,
                    itemPerPage: 10
                },
                timeout: this.timeout
            });

            if (response.data.peopleListResult) {
                return {
                    success: true,
                    data: response.data.peopleListResult
                };
            }

            return {
                success: false,
                error: 'No people found'
            };

        } catch (error) {
            console.error('[ERROR] KOBIS 영화인 검색 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 영화사 정보 조회
    async searchCompanies(companyNm) {
        try {
            const response = await axios.get(`${this.baseUrl}/company/searchCompanyList.json`, {
                params: {
                    key: this.apiKey,
                    companyNm: companyNm,
                    itemPerPage: 10
                },
                timeout: this.timeout
            });

            if (response.data.companyListResult) {
                return {
                    success: true,
                    data: response.data.companyListResult
                };
            }

            return {
                success: false,
                error: 'No companies found'
            };

        } catch (error) {
            console.error('[ERROR] KOBIS 영화사 검색 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 헬퍼 함수: 어제 날짜 구하기 (YYYYMMDD 형식)
    getYesterdayDate() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        
        return `${year}${month}${day}`;
    }

    // 헬퍼 함수: 날짜 포맷팅 (YYYY-MM-DD를 YYYYMMDD로)
    formatDate(dateString) {
        if (!dateString) return this.getYesterdayDate();
        return dateString.replace(/-/g, '');
    }

    // 박스오피스 순위 포맷팅
    formatBoxOfficeRanking(boxOfficeList, type = 'daily') {
        if (!boxOfficeList || boxOfficeList.length === 0) {
            return '박스오피스 정보를 찾을 수 없습니다.';
        }

        const typeText = type === 'daily' ? '일별' : '주간';
        let message = `[MOVIE] ${typeText} 박스오피스 TOP 10\n\n`;

        boxOfficeList.slice(0, 10).forEach(movie => {
            const rank = movie.rank;
            const rankInten = parseInt(movie.rankInten);
            let rankChange = '';
            
            if (rankInten > 0) {
                rankChange = `(▲${rankInten})`;
            } else if (rankInten < 0) {
                rankChange = `(▼${Math.abs(rankInten)})`;
            } else if (movie.rankOldAndNew === 'NEW') {
                rankChange = '(NEW)';
            } else {
                rankChange = '(-)';
            }

            const audiCnt = parseInt(movie.audiCnt).toLocaleString();
            const audiAcc = parseInt(movie.audiAcc).toLocaleString();
            
            message += `${rank}위 ${rankChange} ${movie.movieNm}\n`;
            message += `   일일 관객: ${audiCnt}명 | 누적: ${audiAcc}명\n`;
            if (movie.openDt) {
                message += `   개봉일: ${movie.openDt}\n`;
            }
            message += '\n';
        });

        return message.trim();
    }

    // 영화 상세정보 포맷팅
    formatMovieInfo(movieInfo) {
        if (!movieInfo) {
            return '영화 정보를 찾을 수 없습니다.';
        }

        let message = `[MOVIE] ${movieInfo.movieNm}`;
        
        if (movieInfo.movieNmEn) {
            message += ` (${movieInfo.movieNmEn})`;
        }
        message += '\n\n';

        // 기본 정보
        if (movieInfo.openDt) {
            message += `[TOMORROW] 개봉일: ${this.formatDateDisplay(movieInfo.openDt)}\n`;
        }
        if (movieInfo.showTm) {
            message += `⏱️ 상영시간: ${movieInfo.showTm}분\n`;
        }
        if (movieInfo.genres && movieInfo.genres.length > 0) {
            const genres = movieInfo.genres.map(g => g.genreNm).join(', ');
            message += `[DRAMA] 장르: ${genres}\n`;
        }
        if (movieInfo.watchGradeNm) {
            message += `[UNDERAGE] 관람등급: ${movieInfo.watchGradeNm}\n`;
        }

        // 제작진 정보
        if (movieInfo.directors && movieInfo.directors.length > 0) {
            const directors = movieInfo.directors.map(d => d.peopleNm).join(', ');
            message += `[MOVIE] 감독: ${directors}\n`;
        }
        if (movieInfo.actors && movieInfo.actors.length > 0) {
            const actors = movieInfo.actors.slice(0, 5).map(a => a.peopleNm).join(', ');
            message += `[BUSTSINSILHOUETTE] 주연: ${actors}\n`;
        }

        // 제작 정보
        if (movieInfo.companys && movieInfo.companys.length > 0) {
            const prodCompanies = movieInfo.companys
                .filter(c => c.companyPartNm === '제작사')
                .map(c => c.companyNm)
                .join(', ');
            if (prodCompanies) {
                message += `[OFFICE] 제작사: ${prodCompanies}\n`;
            }
        }

        return message.trim();
    }

    // 날짜 표시 포맷팅 (YYYYMMDD를 YYYY-MM-DD로)
    formatDateDisplay(dateString) {
        if (!dateString || dateString.length !== 8) return dateString;
        return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
    }
}

module.exports = KobisAPI;