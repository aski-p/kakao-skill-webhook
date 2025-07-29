// KOFIC API 정기 업데이트 스크립트 (기존 스케줄러와 통합)
const axios = require('axios');
const fs = require('fs');

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

class KoficDailyUpdater {
    constructor() {
        this.newMovies = [];
        this.logFile = 'kofic_daily_updates.log';
    }

    // 로그 기록
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(message);
        fs.appendFileSync(this.logFile, logMessage);
    }

    // 어제 날짜 구하기 (YYYYMMDD 형식)
    getYesterdayDate() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 일별 박스오피스 조회
    async getDailyBoxOffice(date) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/boxoffice/searchDailyBoxOfficeList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    targetDt: date
                },
                timeout: 10000
            });

            if (response.data.boxOfficeResult) {
                return response.data.boxOfficeResult.dailyBoxOfficeList;
            }
            return [];
        } catch (error) {
            this.log(`❌ 박스오피스 조회 실패 (${date}): ${error.message}`);
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
            this.log(`❌ 영화 상세 정보 조회 실패 (${movieCd}): ${error.message}`);
            return null;
        }
    }

    // 장르 매핑
    mapGenre(genres) {
        if (!genres || genres.length === 0) return 'Drama';
        
        const genreMap = {
            '드라마': 'Drama',
            '액션': 'Action',
            '코미디': 'Comedy',
            '멜로/로맨스': 'Romance',
            '스릴러': 'Thriller',
            '공포(호러)': 'Horror',
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
            '사극': 'Historical'
        };

        return genreMap[genres[0].genreNm] || 'Drama';
    }

    // 영화 데이터 포맷팅
    formatMovieData(movieDetail) {
        const releaseDate = movieDetail.openDt;
        const releaseYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : null;
        
        const director = movieDetail.directors && movieDetail.directors.length > 0 
            ? movieDetail.directors[0].peopleNm 
            : null;
        
        const castMembers = movieDetail.actors 
            ? movieDetail.actors.slice(0, 10).map(actor => actor.peopleNm)
            : [];

        const runtime = movieDetail.showTm ? parseInt(movieDetail.showTm) : null;

        return {
            title: movieDetail.movieNm,
            english_title: movieDetail.movieNmEn || null,
            director: director,
            cast_members: castMembers,
            genre: this.mapGenre(movieDetail.genres),
            release_year: releaseYear,
            runtime_minutes: runtime,
            country: '한국',
            description: this.generateDescription(movieDetail),
            keywords: this.generateKeywords(movieDetail),
            kofic_movie_code: movieDetail.movieCd
        };
    }

    // 영화 설명 생성
    generateDescription(movieDetail) {
        let description = '';
        
        if (movieDetail.genres && movieDetail.genres.length > 0) {
            const genres = movieDetail.genres.map(g => g.genreNm).join(', ');
            description += `${genres} 영화. `;
        }
        
        if (movieDetail.directors && movieDetail.directors.length > 0) {
            description += `${movieDetail.directors[0].peopleNm} 감독 작품. `;
        }
        
        if (movieDetail.actors && movieDetail.actors.length > 0) {
            const mainActors = movieDetail.actors.slice(0, 3).map(a => a.peopleNm).join(', ');
            description += `${mainActors} 주연.`;
        }
        
        return description || null;
    }

    // 키워드 생성
    generateKeywords(movieDetail) {
        const keywords = [];
        
        keywords.push(movieDetail.movieNm);
        
        if (movieDetail.movieNmEn) {
            keywords.push(movieDetail.movieNmEn);
        }
        
        if (movieDetail.directors) {
            movieDetail.directors.forEach(d => keywords.push(d.peopleNm));
        }
        
        if (movieDetail.actors) {
            movieDetail.actors.slice(0, 5).forEach(a => keywords.push(a.peopleNm));
        }
        
        if (movieDetail.genres) {
            movieDetail.genres.forEach(g => keywords.push(g.genreNm));
        }
        
        return keywords;
    }

    // 기존 영화 파일에서 중복 체크
    isMovieExists(newMovie) {
        // 간단한 중복 체크 로직
        // 실제로는 데이터베이스와 연동하여 체크해야 함
        return false; // 임시로 false 반환
    }

    // 딜레이 함수
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 메인 업데이트 로직
    async updateMovies() {
        const targetDate = this.getYesterdayDate();
        this.log(`🎬 KOFIC 일일 업데이트 시작 - ${targetDate}`);

        try {
            // 어제의 박스오피스 조회
            const boxOfficeMovies = await this.getDailyBoxOffice(targetDate);
            this.log(`📊 박스오피스 영화 ${boxOfficeMovies.length}개 조회`);

            let newKoreanMovies = 0;

            for (const movie of boxOfficeMovies) {
                // 영화 상세 정보 조회
                const movieDetail = await this.getMovieDetail(movie.movieCd);
                if (!movieDetail) continue;

                // 한국 영화만 처리
                const isKorean = movieDetail.nations && 
                               movieDetail.nations.some(nation => nation.nationNm === '한국');

                if (!isKorean) {
                    this.log(`⏭️ 외국 영화 스킵: ${movieDetail.movieNm}`);
                    continue;
                }

                // 개봉 영화만 처리
                if (!movieDetail.openDt || movieDetail.openDt === '') {
                    this.log(`⏭️ 미개봉 영화 스킵: ${movieDetail.movieNm}`);
                    continue;
                }

                // 중복 체크 (실제로는 데이터베이스와 연동)
                const movieData = this.formatMovieData(movieDetail);
                if (this.isMovieExists(movieData)) {
                    this.log(`⏭️ 이미 존재: ${movieData.title}`);
                    continue;
                }

                this.newMovies.push(movieData);
                newKoreanMovies++;
                this.log(`✅ 신규 한국 영화: ${movieData.title} (${movieData.release_year})`);

                // API 호출 제한
                await this.delay(200);
            }

            // 결과 저장
            if (this.newMovies.length > 0) {
                const filename = `daily_update_${targetDate}.json`;
                const data = {
                    update_date: new Date().toISOString(),
                    target_date: targetDate,
                    total_new_movies: this.newMovies.length,
                    movies: this.newMovies
                };

                fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
                this.log(`💾 ${this.newMovies.length}개 신규 영화 저장: ${filename}`);
            } else {
                this.log(`💡 신규 한국 영화 없음`);
            }

            this.log(`🎉 일일 업데이트 완료 - 신규 한국 영화: ${newKoreanMovies}개`);

        } catch (error) {
            this.log(`❌ 업데이트 실패: ${error.message}`);
        }
    }

    // 스케줄러와 통합 (기존 movie-update-scheduler.js와 연동)
    static integrationCode() {
        return `
// 기존 스케줄러에 추가할 코드
const KoficDailyUpdater = require('./kofic-daily-updater');

// 매일 오전 9시에 KOFIC 데이터 업데이트
const koficUpdater = new KoficDailyUpdater();
cron.schedule('0 9 * * *', async () => {
    console.log('🕘 KOFIC 일일 업데이트 시작');
    await koficUpdater.updateMovies();
}, {
    timezone: "Asia/Seoul"
});
`;
    }
}

// 스크립트 실행 (테스트용)
if (require.main === module) {
    const updater = new KoficDailyUpdater();
    updater.updateMovies();
}

module.exports = KoficDailyUpdater;