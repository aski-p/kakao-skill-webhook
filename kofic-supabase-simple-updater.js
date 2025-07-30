// KOFIC API에서 한국 영화 정보를 가져와 Supabase에 업데이트하는 스크립트 (간소화 버전)
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// API 키 및 설정
const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

// Supabase 설정
const SUPABASE_URL = 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

class KoficSimpleUpdater {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { 
                autoRefreshToken: false, 
                persistSession: false 
            }
        });
        this.processedCount = 0;
        this.updatedCount = 0;
        this.insertedCount = 0;
        this.errorCount = 0;
    }

    // 박스오피스에서 인기 영화 가져오기 (더 신뢰할 수 있는 데이터)
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

    // KOFIC 데이터를 Supabase 형식으로 변환
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
            keywords: this.generateKeywords(movieDetail)
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

    // Supabase에 영화 데이터 업데이트 또는 삽입
    async upsertMovie(movieData) {
        try {
            // 먼저 해당 영화가 이미 존재하는지 확인
            const { data: existingMovie, error: selectError } = await this.supabase
                .from('movies')
                .select('id')
                .eq('title', movieData.title)
                .eq('release_year', movieData.release_year)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }

            if (existingMovie) {
                // 업데이트
                const { error: updateError } = await this.supabase
                    .from('movies')
                    .update({
                        ...movieData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingMovie.id);

                if (updateError) throw updateError;
                
                console.log(`[SUCCESS] 업데이트: ${movieData.title} (${movieData.release_year})`);
                this.updatedCount++;
            } else {
                // 삽입
                const { error: insertError } = await this.supabase
                    .from('movies')
                    .insert([movieData]);

                if (insertError) throw insertError;
                
                console.log(`[SUCCESS] 신규 추가: ${movieData.title} (${movieData.release_year})`);
                this.insertedCount++;
            }

            return true;
        } catch (error) {
            console.error(`[ERROR] DB 저장 실패 (${movieData.title}):`, error.message);
            this.errorCount++;
            return false;
        }
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

    // 메인 실행 함수
    async run() {
        console.log('[MOVIE] KOFIC → Supabase 영화 데이터 업데이트 시작 (박스오피스 기반)\n');
        console.log(`[KEY] KOFIC API 키: ${KOFIC_API_KEY.substring(0, 8)}...`);
        console.log(`🗄️ Supabase URL: ${SUPABASE_URL}\n`);

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
                    if (!movieDetail) continue;
                    
                    // 한국 영화만 처리
                    const isKorean = movieDetail.nations && 
                                   movieDetail.nations.some(nation => nation.nationNm === '한국');
                    
                    if (!isKorean) {
                        console.log(`⏭️ 외국 영화 스킵: ${movieDetail.movieNm}`);
                        continue;
                    }
                    
                    // 데이터 변환 및 저장
                    const movieData = this.formatMovieData(movieDetail);
                    await this.upsertMovie(movieData);
                    
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
                '오펜하이머', '듄: 파트2', '아바타: 물의 길', '탑건: 매버릭'
            ];
            
            for (const movieTitle of popularMovies) {
                const searchResults = await this.searchMovie(movieTitle);
                if (searchResults.length > 0) {
                    const movie = searchResults[0];
                    const movieDetail = await this.getMovieDetail(movie.movieCd);
                    if (movieDetail) {
                        const movieData = this.formatMovieData(movieDetail);
                        await this.upsertMovie(movieData);
                    }
                }
                await this.delay(200);
            }

            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('\n[INFO] 처리 결과:');
            console.log(`[SUCCESS] 총 처리: ${this.processedCount}개`);
            console.log(`[INBOX] 신규 추가: ${this.insertedCount}개`);
            console.log(`[LOADING] 업데이트: ${this.updatedCount}개`);
            console.log(`[ERROR] 오류: ${this.errorCount}개`);
            console.log(`⏱️ 소요 시간: ${elapsedTime}초`);

        } catch (error) {
            console.error('\n[ERROR] 치명적 오류 발생:', error.message);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const updater = new KoficSimpleUpdater();
    updater.run();
}

module.exports = KoficSimpleUpdater;