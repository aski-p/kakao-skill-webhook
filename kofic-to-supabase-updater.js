// KOFIC API에서 한국 영화 정보를 가져와 Supabase에 업데이트하는 스크립트
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// API 키 및 설정
const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

class KoficToSupabaseUpdater {
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

    // KOFIC에서 한국 영화 목록 가져오기
    async getKoreanMovies(year, page = 1) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieList.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    nationCd: '22041011', // 한국
                    prdtStartYear: year,
                    prdtEndYear: year,
                    curPage: page,
                    itemPerPage: 100
                }
            });

            if (response.data.movieListResult) {
                return response.data.movieListResult;
            }
            return null;
        } catch (error) {
            console.error(`[ERROR] 영화 목록 조회 실패 (${year}년, 페이지 ${page}):`, error.message);
            return null;
        }
    }

    // KOFIC에서 영화 상세 정보 가져오기
    async getMovieDetail(movieCd) {
        try {
            const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieInfo.json`, {
                params: {
                    key: KOFIC_API_KEY,
                    movieCd: movieCd
                }
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

    // 장르 매핑 (KOFIC 장르를 영어로 변환)
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
        
        // 감독 이름 추출
        const director = movieDetail.directors && movieDetail.directors.length > 0 
            ? movieDetail.directors[0].peopleNm 
            : null;
        
        // 배우 이름 배열 생성 (최대 10명)
        const castMembers = movieDetail.actors 
            ? movieDetail.actors.slice(0, 10).map(actor => actor.peopleNm)
            : [];

        // 런타임 변환
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
        
        // 영화 제목
        keywords.push(movieDetail.movieNm);
        
        // 영문 제목
        if (movieDetail.movieNmEn) {
            keywords.push(movieDetail.movieNmEn);
        }
        
        // 감독
        if (movieDetail.directors) {
            movieDetail.directors.forEach(d => keywords.push(d.peopleNm));
        }
        
        // 주요 배우
        if (movieDetail.actors) {
            movieDetail.actors.slice(0, 5).forEach(a => keywords.push(a.peopleNm));
        }
        
        // 장르
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

            if (selectError && selectError.code !== 'PGRST116') { // PGRST116: 결과 없음
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

    // 특정 연도의 영화 처리
    async processYear(year) {
        console.log(`\n[TOMORROW] ${year}년 한국 영화 처리 시작...`);
        let currentPage = 1;
        let totalPages = 1;

        do {
            const movieList = await this.getKoreanMovies(year, currentPage);
            if (!movieList) break;

            totalPages = Math.ceil(movieList.totCnt / 100);
            console.log(`📄 페이지 ${currentPage}/${totalPages} 처리 중...`);

            for (const movie of movieList.movieList) {
                this.processedCount++;
                
                // 영화 상세 정보 가져오기
                const movieDetail = await this.getMovieDetail(movie.movieCd);
                if (!movieDetail) continue;

                // 개봉 영화만 처리 (개봉일이 있는 경우)
                if (!movieDetail.openDt || movieDetail.openDt === '') {
                    console.log(`⏭️ 미개봉 영화 스킵: ${movieDetail.movieNm}`);
                    continue;
                }

                // 데이터 변환 및 저장
                const movieData = this.formatMovieData(movieDetail);
                await this.upsertMovie(movieData);

                // API 호출 제한을 위한 딜레이
                await this.delay(100);
            }

            currentPage++;
        } while (currentPage <= totalPages);

        console.log(`[SUCCESS] ${year}년 처리 완료`);
    }

    // 딜레이 함수
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 메인 실행 함수
    async run() {
        console.log('[MOVIE] KOFIC → Supabase 영화 데이터 업데이트 시작\n');
        console.log(`[PIN] 대상: 한국 영화 (2020년 ~ 2025년)`);
        console.log(`[KEY] KOFIC API 키: ${KOFIC_API_KEY.substring(0, 8)}...`);
        console.log(`🗄️ Supabase URL: ${SUPABASE_URL}\n`);

        const startTime = Date.now();

        try {
            // 2020년부터 2025년까지의 영화 처리
            for (let year = 2020; year <= 2025; year++) {
                await this.processYear(year);
            }

            const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

            console.log('\n[INFO] 처리 결과:');
            console.log(`[SUCCESS] 총 처리: ${this.processedCount}개`);
            console.log(`[INBOX] 신규 추가: ${this.insertedCount}개`);
            console.log(`[LOADING] 업데이트: ${this.updatedCount}개`);
            console.log(`[ERROR] 오류: ${this.errorCount}개`);
            console.log(`⏱️ 소요 시간: ${elapsedTime}분`);

        } catch (error) {
            console.error('\n[ERROR] 치명적 오류 발생:', error.message);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const updater = new KoficToSupabaseUpdater();
    updater.run();
}

module.exports = KoficToSupabaseUpdater;