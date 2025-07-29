// 대량 한국 영화 데이터 업데이트 스크립트
const axios = require('axios');
const fs = require('fs');

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const KOFIC_BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

class BulkKoreanMovieUpdater {
    constructor() {
        this.movies = [];
        this.processedMovies = new Set();
        this.totalProcessed = 0;
    }

    // 로그 출력
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📌',
            success: '✅',
            error: '❌',
            warning: '⚠️'
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

    // 기간별 박스오피스 조회 (주간)
    async getWeeklyBoxOfficeByPeriod(startDate, endDate) {
        const movies = [];
        const startYear = parseInt(startDate.substring(0, 4));
        const endYear = parseInt(endDate.substring(0, 4));

        for (let year = startYear; year <= endYear; year++) {
            // 각 년도의 주요 시점들 체크 (분기별)
            const checkDates = [
                `${year}0315`, // 3월 중순
                `${year}0615`, // 6월 중순  
                `${year}0915`, // 9월 중순
                `${year}1215`  // 12월 중순
            ];

            for (const targetDate of checkDates) {
                try {
                    const response = await axios.get(`${KOFIC_BASE_URL}/boxoffice/searchWeeklyBoxOfficeList.json`, {
                        params: {
                            key: KOFIC_API_KEY,
                            targetDt: targetDate,
                            weekGb: '0'
                        },
                        timeout: 10000
                    });

                    if (response.data.boxOfficeResult && response.data.boxOfficeResult.weeklyBoxOfficeList) {
                        const weeklyMovies = response.data.boxOfficeResult.weeklyBoxOfficeList;
                        
                        // 한국 영화만 필터링
                        const koreanMovies = weeklyMovies.filter(movie => 
                            movie.movieNm && !this.isInternationalMovie(movie.movieNm)
                        );

                        movies.push(...koreanMovies);
                        this.log(`${year}년 ${targetDate} 박스오피스: ${koreanMovies.length}개 한국 영화 발견`);
                    }

                    await this.delay(200);
                } catch (error) {
                    this.log(`박스오피스 조회 실패 (${targetDate}): ${error.message}`, 'error');
                }
            }
        }

        return movies;
    }

    // 외국 영화 판별 (간단한 휴리스틱)
    isInternationalMovie(title) {
        const internationalKeywords = [
            '어벤져스', '스파이더맨', '배트맨', '슈퍼맨', '트랜스포머', '쥬라기',
            '해리포터', '반지의 제왕', '스타워즈', '미션임파서블', '분노의 질주',
            '토이스토리', '겨울왕국', '라이온킹', '인크레더블', '니모', '몬스터',
            '마블', 'DC', '디즈니', '픽사', '엑스맨', '데드풀', '토르', '아이언맨',
            '인디아나존스', '매트릭스', '터미네이터', '에일리언', '프레데터'
        ];

        return internationalKeywords.some(keyword => title.includes(keyword));
    }

    // 대량 한국 영화 제목 목록
    getExtensiveKoreanMovieList() {
        return [
            // 2024년 주요 한국 영화
            '발레리나', '파묘', '서울의 봄', '범죄도시4', '베테랑2', '위키드', 
            '듄: 파트 투', '콰이어트 플레이스: 첫째 날', '인사이드 아웃 2',
            '데드풀과 울버린', '에일리언: 로물루스', '베놈: 라스트 댄스',
            
            // 2023년 한국 영화
            '범죄도시3', '서울의 봄', '콘크리트 유토피아', '밀수', '노량: 죽음의 바다',
            '웅남이', '천박사 퇴마 연구소', '보호자', '30일', '귀공자', '악마들',
            '리바운드', '킬링 로맨스', '소울메이트', '비공식작전', '댓글부대',
            '하이재킹', '탈주', '화란', '스즈메의 문단속', '더 퍼스트 슬램덩크',
            
            // 2022년 한국 영화  
            '탑건: 매버릭', '토르: 러브 앤 썬더', '닥터 스트레인지: 대혼돈의 멀티버스',
            '미니언즈2', '쥬라기 월드: 도미니언', '범죄도시2', '헤어질 결심',
            '한산: 용의 출현', '헌트', '자백', '외계+인 1부', '브로커', '결백',
            '인생은 아름다워', '6/45', '정직한 후보2', '추락의 해부학',
            
            // 2021년 한국 영화
            '스파이더맨: 노 웨이 홈', '어벤져스: 엔드게임', '겨울왕국 2', 
            '라이온 킹', '토이 스토리 4', '캡틴 마블', '알라딘', '어벤져스: 인피니티 워',
            '기생충', '극한직업', '엑시트', '걸캅스', '사바하', '말모이', '82년생 김지영',
            '배심원들', '증인', '미쓰백', '성난황소', '천군', '윤희', '김복남 살인사건의 전말',
            
            // 2020년 한국 영화
            '기생충', '남산의 부장들', '사냥의 시간', '온워드', '소울', '원더 우먼 1984',
            '매드맥스: 분노의 도로', '인터스텔라', '다크 나이트', '인셉션',
            '살인의 추억', '올드보이', '박쥐', '아가씨', '곡성', '마더', '추격자',
            '황해', '신세계', '베를린', '암살', '밀정', '덕혜옹주', '동주',
            
            // 클래식 한국 영화
            '왕의 남자', '태극기 휘날리며', '쉬리', '접촉', 'JSA 공동경비구역',
            '친구', '실미도', '마라톤', '웰컴 투 동막골', '라디오 스타', '미녀는 괴로워',
            '과속스캔들', '해운대', '국가대표', '이끼', '추격자', '곡성', '부산행',
            '터널', '검찰게임', 'VIP', '특별시민', '남자가 사랑할 때', '건축학개론',
            '광해, 왕이 된 남자', '늑대소년', '도둑들', '베테랑', '인천상륙작전',
            '덕혜옹주', '밀정', '아수라', '터터링', '해적: 바다로 간 산적',
            '명량', '국제시장', '괴물', '설국열차', '옥자', '신과함께',
            
            // 최신 화제작들
            '야당', '12.12: 더 플랜', '더 문', '천박사 퇴마 연구소: 설경의 비밀',
            '스위트홈', '킹덤', '오징어 게임', '지옥', '마이네임', '갯마을 차차차',
            '사랑의 불시착', '이태원 클라쓰', '기생충', '미나리', '모가디슈',
            '자산어보', '뜨거운 피', '테넷', '소리도 없이', '다시 태어나도',
            '담보', '호텔 델루나', '그대, 고마워', '로망', '사이코지만 괜찮아',
            
            // 장르별 대표작들
            // 액션
            '범죄도시', '악인전', '마약왕', '협상', '공작', '1987', '더 킹', '신세계',
            '황해', '추격자', '아저씨', '베를린', '암살', '밀정', '공조', '베테랑',
            
            // 드라마
            '기생충', '버닝', '시', '마더', '하녀', '아가씨', '박쥐', '밀양', '시크릿 선샤인',
            '오아시스', '박하사탕', '페퍼민트 캔디', '초록물고기', '똥파리', '야생동물 보호구역',
            
            // 코미디
            '극한직업', '엑시트', '걸캅스', '미쓰백', '완벽한 타인', '리틀 포레스트',
            '써니', '7번방의 선물', '건축학개론', '늑대소년', '도둑들', '타짜',
            
            // 스릴러/미스터리
            '곡성', '부산행', '터널', '검은 사제들', '콜', '사바하', '미스터리', '랑종',
            '성난황소', '다만 악에서 구하소서', '삼진그룹 영어토익반', '정직한 후보',
            
            // 로맨스
            '건축학개론', '늑대소년', '내 머리 속의 지우개', '클래식', '엽기적인 그녀',
            '품행제로', '첫사랑 사수 궤도', '연애소설', '봄날은 간다', '접촉',
            
            // 사극
            '명량', '한산: 용의 출현', '노량: 죽음의 바다', '광해, 왕이 된 남자',
            '왕의 남자', '사도', '관상', '역린', '대립군', '안시성', '남한산성'
        ];
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

    // 대량 한국 영화 업데이트
    async bulkUpdateKoreanMovies() {
        this.log('대량 한국 영화 데이터 업데이트 시작');
        
        const movieTitles = this.getExtensiveKoreanMovieList();
        this.log(`총 ${movieTitles.length}개 영화 처리 예정`);

        const results = [];
        let processed = 0;
        let successful = 0;

        for (const movieTitle of movieTitles) {
            try {
                processed++;
                this.log(`[${processed}/${movieTitles.length}] "${movieTitle}" 검색 중...`);
                
                // 이미 처리된 영화는 스킵
                if (this.processedMovies.has(movieTitle)) {
                    this.log(`"${movieTitle}" 이미 처리됨 - 스킵`, 'warning');
                    continue;
                }

                // 영화 검색
                const searchResults = await this.searchMovies(movieTitle);
                
                if (searchResults.length === 0) {
                    this.log(`"${movieTitle}" 검색 결과 없음`, 'warning');
                    continue;
                }

                // 한국 영화 필터링 및 최적 매치 찾기
                let bestMatch = null;
                for (const movie of searchResults) {
                    // 한국 영화인지 확인
                    if (movie.repNationNm === '한국') {
                        // 제목이 정확히 일치하는지 확인
                        if (movie.movieNm === movieTitle || 
                            movie.movieNm.includes(movieTitle) ||
                            movieTitle.includes(movie.movieNm.split(':')[0].trim())) {
                            bestMatch = movie;
                            break;
                        }
                    }
                }

                if (!bestMatch) {
                    this.log(`"${movieTitle}" 한국 영화 매치 없음`, 'warning');
                    continue;
                }

                // 상세 정보 조회
                const movieDetail = await this.getMovieDetail(bestMatch.movieCd);
                
                if (movieDetail) {
                    const movieData = this.formatMovieData(movieDetail);
                    results.push(movieData);
                    this.processedMovies.add(movieTitle);
                    successful++;
                    
                    this.log(`"${movieTitle}" 정보 수집 완료 (${successful}/${processed})`, 'success');
                } else {
                    this.log(`"${movieTitle}" 상세 정보 조회 실패`, 'warning');
                }

                // API 제한 방지 (더 짧은 딜레이로 빠르게 처리)
                await this.delay(150);

            } catch (error) {
                this.log(`"${movieTitle}" 처리 중 오류: ${error.message}`, 'error');
            }

            // 진행상황 출력 (10개씩)
            if (processed % 10 === 0) {
                this.log(`진행상황: ${processed}/${movieTitles.length} 처리, ${successful}개 성공`, 'info');
            }
        }

        // 결과 저장
        if (results.length > 0) {
            const timestamp = this.formatDate(new Date());
            const jsonFilename = `bulk_korean_movies_${timestamp}.json`;
            const sqlFilename = `bulk_korean_movies_insert_${timestamp}.sql`;
            
            const data = {
                update_date: new Date().toISOString(),
                total_processed: processed,
                successful_updates: successful,
                total_movies: results.length,
                movies: results
            };

            fs.writeFileSync(jsonFilename, JSON.stringify(data, null, 2), 'utf8');
            this.log(`${results.length}개 영화 정보를 ${jsonFilename}에 저장`, 'success');

            // SQL 파일 생성
            this.generateSQLInserts(results, sqlFilename);
        }

        this.log(`\n========== 대량 업데이트 완료 ==========`);
        this.log(`총 처리: ${processed}개`);
        this.log(`성공: ${successful}개`);
        this.log(`수집된 영화 데이터: ${results.length}개`);
        this.log(`성공률: ${((successful/processed)*100).toFixed(1)}%`);

        return results;
    }

    // 영화 데이터 포맷팅 (이전과 동일)
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
            '시대극': 'Historical',
            '기타': 'Drama'
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
        let sql = `-- 대량 한국 영화 데이터 업데이트\n`;
        sql += `-- 생성일시: ${new Date().toISOString()}\n`;
        sql += `-- 총 영화 수: ${movies.length}개\n\n`;

        movies.forEach(movie => {
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
    const updater = new BulkKoreanMovieUpdater();
    updater.bulkUpdateKoreanMovies();
}

module.exports = BulkKoreanMovieUpdater;