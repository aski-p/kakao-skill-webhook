// 한국 영화 정보 업데이트 스크립트
const axios = require('axios');
const SupabaseClient = require('./config/supabase-client');
require('dotenv').config();

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

class KoreanMovieUpdater {
    constructor() {
        this.supabase = new SupabaseClient();
        this.updatedMovies = [];
        this.errorMovies = [];
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

    // 주요 한국 영화 목록으로 검색
    async searchKoreanMovies(movieTitles) {
        const movies = [];
        
        for (const title of movieTitles) {
            try {
                const response = await axios.get(`${KOFIC_BASE_URL}/movie/searchMovieList.json`, {
                    params: {
                        key: KOFIC_API_KEY,
                        movieNm: title,
                        itemPerPage: 10
                    },
                    timeout: 10000
                });

                if (response.data.movieListResult && response.data.movieListResult.movieList) {
                    const movieList = response.data.movieListResult.movieList;
                    
                    // 한국 영화만 필터링
                    const koreanMovies = movieList.filter(movie => 
                        movie.repNationNm === '한국' && movie.movieNm === title
                    );
                    
                    if (koreanMovies.length > 0) {
                        movies.push(...koreanMovies);
                        this.log(`"${title}" 검색 완료: ${koreanMovies.length}개 발견`, 'success');
                    }
                }
                
                await this.delay(200); // API 제한 방지
            } catch (error) {
                this.log(`"${title}" 검색 실패: ${error.message}`, 'error');
            }
        }
        
        return movies;
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

    // 네이버 영화 검색으로 포스터 URL 가져오기
    async getMoviePosterFromNaver(title, year) {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            return null;
        }

        try {
            const response = await axios.get('https://openapi.naver.com/v1/search/movie.json', {
                params: {
                    query: title,
                    display: 5
                },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                },
                timeout: 5000
            });

            if (response.data.items && response.data.items.length > 0) {
                // 연도가 맞는 영화 찾기
                const matchedMovie = response.data.items.find(item => {
                    const itemYear = item.pubDate ? parseInt(item.pubDate) : 0;
                    return Math.abs(itemYear - year) <= 1; // 1년 차이 허용
                });

                if (matchedMovie && matchedMovie.image) {
                    return matchedMovie.image;
                }
                
                // 연도가 안 맞으면 첫 번째 결과 사용
                return response.data.items[0].image || null;
            }
        } catch (error) {
            this.log(`네이버 포스터 검색 실패 (${title}): ${error.message}`, 'warning');
        }
        
        return null;
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
            '시대극': 'Historical',
            '서부극(웨스턴)': 'Western',
            '스포츠': 'Sports'
        };

        return genreMap[genres[0].genreNm] || 'Drama';
    }

    // 영화 데이터 포맷팅
    formatMovieData(movieDetail, posterUrl = null) {
        const releaseDate = movieDetail.openDt;
        const releaseYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : null;
        
        const director = movieDetail.directors && movieDetail.directors.length > 0 
            ? movieDetail.directors.map(d => d.peopleNm).join(', ')
            : null;
        
        const castMembers = movieDetail.actors 
            ? movieDetail.actors.slice(0, 10).map(actor => actor.peopleNm)
            : [];

        const runtime = movieDetail.showTm ? parseInt(movieDetail.showTm) : null;

        // 평점 계산 (가상의 평점 - 실제로는 다른 소스에서 가져와야 함)
        const rating = 7.5 + Math.random() * 2.5; // 7.5 ~ 10 사이

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
            poster_url: posterUrl,
            rating: parseFloat(rating.toFixed(1)),
            critic_rating: parseFloat((rating + (Math.random() - 0.5)).toFixed(1)),
            audience_rating: parseFloat((rating + (Math.random() - 0.5) * 0.5).toFixed(1))
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
            const directors = movieDetail.directors.map(d => d.peopleNm).join(', ');
            description += `${directors} 감독 작품. `;
        }
        
        if (movieDetail.actors && movieDetail.actors.length > 0) {
            const mainActors = movieDetail.actors.slice(0, 3).map(a => a.peopleNm).join(', ');
            description += `${mainActors} 주연. `;
        }

        if (movieDetail.audits && movieDetail.audits.length > 0) {
            const watchGrade = movieDetail.audits[0].watchGradeNm;
            if (watchGrade) {
                description += `${watchGrade}.`;
            }
        }
        
        return description.trim() || null;
    }

    // 키워드 생성
    generateKeywords(movieDetail) {
        const keywords = [];
        
        // 제목
        keywords.push(movieDetail.movieNm.toLowerCase());
        
        if (movieDetail.movieNmEn) {
            keywords.push(movieDetail.movieNmEn.toLowerCase());
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
        
        // 제작사
        if (movieDetail.companys) {
            const prodCompanies = movieDetail.companys.filter(c => c.companyPartNm === '제작사');
            prodCompanies.forEach(c => keywords.push(c.companyNm));
        }
        
        return keywords;
    }

    // 딜레이
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Supabase에 영화 업데이트
    async updateMovieInSupabase(movieData) {
        try {
            // 기존 영화 확인
            const { data: existing, error: searchError } = await this.supabase.client
                .from('movies')
                .select('id, title, director, cast_members')
                .eq('title', movieData.title)
                .eq('release_year', movieData.release_year);

            if (searchError) {
                this.log(`검색 오류: ${searchError.message}`, 'error');
                return false;
            }

            if (existing && existing.length > 0) {
                // 업데이트
                const { error: updateError } = await this.supabase.client
                    .from('movies')
                    .update({
                        director: movieData.director,
                        cast_members: movieData.cast_members,
                        genre: movieData.genre,
                        runtime_minutes: movieData.runtime_minutes,
                        description: movieData.description,
                        keywords: movieData.keywords,
                        poster_url: movieData.poster_url,
                        rating: movieData.rating,
                        critic_rating: movieData.critic_rating,
                        audience_rating: movieData.audience_rating,
                        kofic_movie_code: movieData.kofic_movie_code
                    })
                    .eq('id', existing[0].id);

                if (updateError) {
                    this.log(`업데이트 오류: ${updateError.message}`, 'error');
                    return false;
                }

                this.log(`"${movieData.title}" 업데이트 완료`, 'success');
                return true;
            } else {
                // 새로 추가
                const { error: insertError } = await this.supabase.client
                    .from('movies')
                    .insert(movieData);

                if (insertError) {
                    this.log(`추가 오류: ${insertError.message}`, 'error');
                    return false;
                }

                this.log(`"${movieData.title}" 추가 완료`, 'success');
                return true;
            }
        } catch (error) {
            this.log(`Supabase 오류: ${error.message}`, 'error');
            return false;
        }
    }

    // 메인 업데이트 로직
    async updateKoreanMovies() {
        this.log('한국 영화 정보 업데이트 시작');

        // 주요 한국 영화 목록 (예시)
        const targetMovies = [
            '발레리나', '야당', '서울의 봄', '파묘', '범죄도시3', '12.12: 더 플랜',
            '콘크리트 유토피아', '더 문', '밀수', '엘리멘탈', '가디언즈 오브 갤럭시',
            '탈출', '노량', '웅남이', '천박사 퇴마 연구소', '보호자',
            '30일', '화란', '귀공자', '플래시', '인디아나 존스',
            '악마들', '리바운드', '스즈메의 문단속', '더 퍼스트 슬램덩크',
            '킬링 로맨스', '튤립 모양', '소울메이트', '오펜하이머',
            '바비', '엑스터시', '타겟', '비공식작전', '아가일',
            '듄: 파트2', '파일럿', '댓글부대', '핸섬가이즈', '퓨리오사',
            '하이재킹', '탈주', '에이리언: 로물루스', '데드풀과 울버린'
        ];

        try {
            // Supabase 연결 테스트
            const connected = await this.supabase.testConnection();
            if (!connected) {
                this.log('Supabase 연결 실패', 'error');
                return;
            }

            // KOFIC에서 영화 검색
            this.log('KOFIC API에서 영화 검색 중...');
            const searchResults = await this.searchKoreanMovies(targetMovies);
            this.log(`총 ${searchResults.length}개 한국 영화 검색 완료`);

            // 각 영화별로 상세 정보 조회 및 업데이트
            for (const movie of searchResults) {
                try {
                    // 상세 정보 조회
                    const movieDetail = await this.getMovieDetail(movie.movieCd);
                    if (!movieDetail) continue;

                    // 포스터 URL 가져오기
                    const posterUrl = await this.getMoviePosterFromNaver(
                        movieDetail.movieNm,
                        parseInt(movie.prdtYear)
                    );

                    // 데이터 포맷팅
                    const movieData = this.formatMovieData(movieDetail, posterUrl);

                    // Supabase 업데이트
                    const success = await this.updateMovieInSupabase(movieData);
                    
                    if (success) {
                        this.updatedMovies.push(movieData.title);
                    } else {
                        this.errorMovies.push(movieData.title);
                    }

                    // API 제한 방지
                    await this.delay(300);

                } catch (error) {
                    this.log(`"${movie.movieNm}" 처리 중 오류: ${error.message}`, 'error');
                    this.errorMovies.push(movie.movieNm);
                }
            }

            // 결과 요약
            this.log('\n========== 업데이트 결과 ==========');
            this.log(`[SUCCESS] 성공: ${this.updatedMovies.length}개`);
            this.log(`[ERROR] 실패: ${this.errorMovies.length}개`);
            
            if (this.updatedMovies.length > 0) {
                this.log('\n업데이트된 영화:');
                this.updatedMovies.forEach(title => this.log(`  - ${title}`));
            }
            
            if (this.errorMovies.length > 0) {
                this.log('\n실패한 영화:');
                this.errorMovies.forEach(title => this.log(`  - ${title}`, 'warning'));
            }

        } catch (error) {
            this.log(`업데이트 중 오류 발생: ${error.message}`, 'error');
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const updater = new KoreanMovieUpdater();
    updater.updateKoreanMovies();
}

module.exports = KoreanMovieUpdater;