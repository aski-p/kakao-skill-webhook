// KOFIC API에서 한국 영화 정보를 수집하여 JSON 파일로 저장하는 스크립트
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

class KoficMovieCollector {
    constructor() {
        this.processedCount = 0;
        this.movies = [];
        this.errors = [];
    }

    // 박스오피스에서 인기 영화 가져오기
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
            console.error(`[ERROR] 박스오피스 조회 실패 (${date}):`, error.message);
            return [];
        }
    }

    // KOFIC에서 영화 상세 정보 가져오기
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
            console.error(`[ERROR] 영화 상세 정보 조회 실패 (${movieCd}):`, error.message);
            return null;
        }
    }

    // 영화 검색 (특정 제목)
    async searchMovie(movieNm) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    movieNm: movieNm,
                    nationCd: '22041011', // 한국
                    itemPerPage: 10
                },
                timeout: 10000
            });

            if (response.data.movieListResult) {
                return response.data.movieListResult.movieList;
            }
            return [];
        } catch (error) {
            console.error(`[ERROR] 영화 검색 실패 (${movieNm}):`, error.message);
            return [];
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

        const primaryGenre = genres[0].genreNm;
        return genreMap[primaryGenre] || 'Drama';
    }

    // KOFIC 데이터를 정규화
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
            kofic_movie_code: movieDetail.movieCd,
            collected_at: new Date().toISOString()
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

    // 검색 키워드 생성
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

    // 날짜 생성 함수
    getDateString(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 딜레이 함수
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // JSON 파일로 저장
    saveToJSON(filename) {
        const data = {
            collection_date: new Date().toISOString(),
            total_movies: this.movies.length,
            movies: this.movies,
            errors: this.errors
        };

        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`💾 데이터가 ${filename}에 저장되었습니다.`);
    }

    // 메인 실행 함수
    async run() {
        console.log('[MOVIE] KOFIC 한국 영화 데이터 수집 시작\n');
        console.log(`[KEY] KOFIC API 키: ${KOFIC_API_KEY.substring(0, 8)}...\n`);

        const startTime = Date.now();

        try {
            // 최근 30일간의 박스오피스 데이터 수집
            console.log('[INFO] 최근 30일간 박스오피스 영화 수집 중...\n');
            
            const processedMovies = new Set(); // 중복 처리 방지
            
            for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
                const targetDate = this.getDateString(daysAgo);
                console.log(`[TOMORROW] ${targetDate} 박스오피스 조회 중...`);
                
                const boxOfficeMovies = await this.getDailyBoxOffice(targetDate);
                
                for (const movie of boxOfficeMovies) {
                    const movieKey = `${movie.movieCd}`;
                    
                    if (processedMovies.has(movieKey)) {
                        console.log(`⏭️ 이미 처리됨: ${movie.movieNm}`);
                        continue;
                    }
                    
                    processedMovies.add(movieKey);
                    this.processedCount++;
                    
                    // 영화 상세 정보 가져오기
                    const movieDetail = await this.getMovieDetail(movie.movieCd);
                    if (!movieDetail) {
                        this.errors.push(`영화 상세 정보 조회 실패: ${movie.movieNm} (${movie.movieCd})`);
                        continue;
                    }
                    
                    // 한국 영화만 처리
                    const isKorean = movieDetail.nations && 
                                   movieDetail.nations.some(nation => nation.nationNm === '한국');
                    
                    if (!isKorean) {
                        console.log(`⏭️ 외국 영화 스킵: ${movieDetail.movieNm}`);
                        continue;
                    }
                    
                    // 데이터 변환 및 저장
                    const movieData = this.formatMovieData(movieDetail);
                    this.movies.push(movieData);
                    console.log(`[SUCCESS] 수집: ${movieData.title} (${movieData.release_year})`);
                    
                    // API 호출 제한을 위한 딜레이
                    await this.delay(200);
                }
                
                // 날짜별 딜레이
                await this.delay(500);
            }

            // 추가로 특정 인기 영화들 검색해서 추가
            console.log('\n[PIN] 추가 인기 한국 영화 검색 중...');
            const popularMovies = [
                '파묘', '범죄도시3', '서울의 봄', '콘크리트 유토피아', '잠', 
                '기생충', '미나리', '오징어 게임', '기적', '모가디슈'
            ];
            
            for (const movieTitle of popularMovies) {
                const searchResults = await this.searchMovie(movieTitle);
                if (searchResults.length > 0) {
                    const movie = searchResults[0];
                    
                    // 이미 처리된 영화인지 확인
                    if (processedMovies.has(movie.movieCd)) {
                        console.log(`⏭️ 이미 처리됨: ${movie.movieNm}`);
                        continue;
                    }
                    
                    const movieDetail = await this.getMovieDetail(movie.movieCd);
                    if (movieDetail) {
                        const movieData = this.formatMovieData(movieDetail);
                        this.movies.push(movieData);
                        console.log(`[SUCCESS] 추가 수집: ${movieData.title} (${movieData.release_year})`);
                    }
                }
                await this.delay(200);
            }

            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('\n[INFO] 수집 결과:');
            console.log(`[SUCCESS] 총 처리: ${this.processedCount}개`);
            console.log(`[INBOX] 수집된 한국 영화: ${this.movies.length}개`);
            console.log(`[ERROR] 오류: ${this.errors.length}개`);
            console.log(`⏱️ 소요 시간: ${elapsedTime}초`);

            // JSON 파일로 저장
            const filename = `korean_movies_kofic_${new Date().toISOString().slice(0, 10)}.json`;
            this.saveToJSON(filename);

            console.log('\n[PARTY] KOFIC 한국 영화 데이터 수집 완료!');
            console.log(`📄 다음 단계: ${filename} 파일을 확인하고 Supabase에 수동으로 업로드하세요.`);

        } catch (error) {
            console.error('\n[ERROR] 치명적 오류 발생:', error.message);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const collector = new KoficMovieCollector();
    collector.run();
}

module.exports = KoficMovieCollector;