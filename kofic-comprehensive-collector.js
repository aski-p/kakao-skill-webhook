// KOFIC API로부터 대량의 한국 영화 데이터 수집 스크립트
const fs = require('fs');

class KoficComprehensiveCollector {
    constructor() {
        this.apiKey = '504ec8ff56d6c888399e9b9c1f719f03';
        this.baseUrl = 'http://kobis.or.kr/kobisopenapi/webservice/rest';
        this.allMovies = [];
        this.processedMovies = 0;
        this.rateLimitDelay = 300; // 300ms 딜레이
    }

    // 날짜 포맷 변환 (YYYY-MM-DD → YYYYMMDD)
    formatDate(dateStr) {
        return dateStr.replace(/-/g, '');
    }

    // API 호출 딜레이
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 일별 박스오피스 조회
    async getDailyBoxOffice(date) {
        const url = `${this.baseUrl}/boxoffice/searchDailyBoxOfficeList.json?key=${this.apiKey}&targetDt=${date}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.boxOfficeResult && data.boxOfficeResult.dailyBoxOfficeList) {
                return data.boxOfficeResult.dailyBoxOfficeList;
            }
            return [];
        } catch (error) {
            console.error(`❌ ${date} 박스오피스 조회 오류:`, error.message);
            return [];
        }
    }

    // 영화 상세 정보 조회
    async getMovieDetail(movieCd) {
        const url = `${this.baseUrl}/movie/searchMovieInfo.json?key=${this.apiKey}&movieCd=${movieCd}`;
        
        try {
            await this.delay(this.rateLimitDelay);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.movieInfoResult && data.movieInfoResult.movieInfo) {
                return data.movieInfoResult.movieInfo;
            }
            return null;
        } catch (error) {
            console.error(`❌ 영화 ${movieCd} 상세정보 조회 오류:`, error.message);
            return null;
        }
    }

    // 장르 매핑
    mapGenre(genres) {
        if (!genres || genres.length === 0) return 'Unknown';
        
        const genreMap = {
            '드라마': 'Drama',
            '코미디': 'Comedy', 
            '액션': 'Action',
            '스릴러': 'Thriller',
            '로맨스': 'Romance',
            '범죄': 'Crime',
            '전쟁': 'War',
            '다큐멘터리': 'Documentary',
            '애니메이션': 'Animation',
            '가족': 'Family',
            '판타지': 'Fantasy',
            '공포': 'Horror',
            'SF': 'Science Fiction',
            '뮤지컬': 'Musical',
            '모험': 'Adventure',
            '미스터리': 'Mystery'
        };
        
        const primaryGenre = genres[0].genreNm;
        return genreMap[primaryGenre] || primaryGenre;
    }

    // 여러 기간의 박스오피스 수집
    async collectMultiplePeriods() {
        console.log('🎬 KOFIC API 대량 한국 영화 데이터 수집 시작...\n');
        
        const movieCodes = new Set(); // 중복 제거용
        
        // 최근 2년간의 데이터 수집 (주요 기간들)
        const dates = [
            // 2024년 주요 기간들
            '2024-12-31', '2024-12-15', '2024-11-30', '2024-11-15', '2024-10-31', '2024-10-15',
            '2024-09-30', '2024-09-15', '2024-08-31', '2024-08-15', '2024-07-31', '2024-07-15',
            '2024-06-30', '2024-06-15', '2024-05-31', '2024-05-15', '2024-04-30', '2024-04-15',
            '2024-03-31', '2024-03-15', '2024-02-29', '2024-02-15', '2024-01-31', '2024-01-15',
            
            // 2023년 주요 기간들
            '2023-12-31', '2023-12-15', '2023-11-30', '2023-11-15', '2023-10-31', '2023-10-15',
            '2023-09-30', '2023-09-15', '2023-08-31', '2023-08-15', '2023-07-31', '2023-07-15',
            '2023-06-30', '2023-06-15', '2023-05-31', '2023-05-15', '2023-04-30', '2023-04-15',
            '2023-03-31', '2023-03-15', '2023-02-28', '2023-02-15', '2023-01-31', '2023-01-15',
            
            // 2022년 주요 기간들  
            '2022-12-31', '2022-11-30', '2022-10-31', '2022-09-30', '2022-08-31', '2022-07-31',
            '2022-06-30', '2022-05-31', '2022-04-30', '2022-03-31', '2022-02-28', '2022-01-31'
        ];
        
        console.log(`📅 ${dates.length}개 기간의 박스오피스 데이터 수집 중...`);
        
        // 각 날짜별 박스오피스 수집
        for (let i = 0; i < dates.length; i++) {
            const date = this.formatDate(dates[i]);
            console.log(`📊 ${i + 1}/${dates.length}: ${dates[i]} 박스오피스 조회 중...`);
            
            const boxOfficeList = await this.getDailyBoxOffice(date);
            
            // 한국 영화만 필터링
            const koreanMovies = boxOfficeList.filter(movie => 
                movie.repNationNm === '한국' || movie.nationAlt === '한국'
            );
            
            console.log(`   🇰🇷 한국 영화 ${koreanMovies.length}개 발견`);
            
            // 영화 코드 수집 (중복 제거)
            koreanMovies.forEach(movie => {
                movieCodes.add(movie.movieCd);
            });
            
            // API 호출 제한 준수
            await this.delay(200);
        }
        
        console.log(`\n🎯 총 ${movieCodes.size}개의 고유한 한국 영화 코드 수집 완료`);
        
        // 상세 정보 수집
        console.log('\n🔍 영화 상세 정보 수집 중...');
        const movieCodesArray = Array.from(movieCodes);
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < movieCodesArray.length; i++) {
            const movieCd = movieCodesArray[i];
            console.log(`📽️ ${i + 1}/${movieCodesArray.length}: ${movieCd} 상세정보 조회 중...`);
            
            try {
                const movieDetail = await this.getMovieDetail(movieCd);
                
                if (movieDetail) {
                    // 데이터 정규화
                    const normalizedMovie = {
                        kofic_movie_cd: movieDetail.movieCd,
                        title: movieDetail.movieNm || '',
                        title_eng: movieDetail.movieNmEn || '',
                        director: movieDetail.directors && movieDetail.directors.length > 0 
                            ? movieDetail.directors.map(d => d.peopleNm).join(', ') : '',
                        cast_members: movieDetail.actors && movieDetail.actors.length > 0 
                            ? movieDetail.actors.slice(0, 10).map(a => a.peopleNm).join(', ') : '',
                        genre: this.mapGenre(movieDetail.genres),
                        release_year: movieDetail.prdtYear ? parseInt(movieDetail.prdtYear) : null,
                        runtime_minutes: movieDetail.showTm ? parseInt(movieDetail.showTm) : null,
                        country: movieDetail.nations && movieDetail.nations.length > 0
                            ? movieDetail.nations.map(n => n.nationNm).join(', ') : '한국',
                        production_status: movieDetail.prdtStatNm || '',
                        type: movieDetail.typeNm || '',
                        open_date: movieDetail.openDt || ''
                    };
                    
                    this.allMovies.push(normalizedMovie);
                    successCount++;
                } else {
                    failCount++;
                }
                
                // 진행 상황 표시
                if ((i + 1) % 10 === 0) {
                    console.log(`   📊 진행 상황: ${i + 1}/${movieCodesArray.length} (성공: ${successCount}, 실패: ${failCount})`);
                }
                
            } catch (error) {
                console.error(`❌ ${movieCd} 처리 중 오류:`, error.message);
                failCount++;
            }
        }
        
        console.log(`\n✅ 데이터 수집 완료!`);
        console.log(`📊 총 수집: ${this.allMovies.length}개`);
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);
        
        // 결과 저장
        const filename = `kofic_comprehensive_movies_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
        fs.writeFileSync(filename, JSON.stringify({
            collection_date: new Date().toISOString(),
            total_movies: this.allMovies.length,
            success_count: successCount,
            fail_count: failCount,
            movies: this.allMovies
        }, null, 2));
        
        console.log(`💾 데이터 저장: ${filename}`);
        
        return {
            total: this.allMovies.length,
            success: successCount,
            fail: failCount,
            filename: filename
        };
    }
}

// 실행
async function main() {
    const collector = new KoficComprehensiveCollector();
    await collector.collectMultiplePeriods();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = KoficComprehensiveCollector;