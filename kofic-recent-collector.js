// KOFIC API로부터 최근 실제 한국 영화 데이터 수집 스크립트
const fs = require('fs');

class KoficRecentCollector {
    constructor() {
        this.apiKey = '504ec8ff56d6c888399e9b9c1f719f03';
        this.baseUrl = 'http://kobis.or.kr/kobisopenapi/webservice/rest';
        this.allMovies = [];
        this.rateLimitDelay = 300;
    }

    formatDate(dateStr) {
        return dateStr.replace(/-/g, '');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

    // 최근 실제 데이터가 있는 날짜들로 수집
    async collectRecentMovies() {
        console.log('🎬 KOFIC API 최근 한국 영화 데이터 수집 시작...\n');
        
        const movieCodes = new Set();
        
        // 최근 6개월간의 실제 날짜들 (2024년 1월부터 7월까지)
        const dates = [
            // 2024년 7월
            '2024-07-27', '2024-07-26', '2024-07-25', '2024-07-20', '2024-07-15', '2024-07-10', '2024-07-05', '2024-07-01',
            
            // 2024년 6월  
            '2024-06-30', '2024-06-25', '2024-06-20', '2024-06-15', '2024-06-10', '2024-06-05', '2024-06-01',
            
            // 2024년 5월
            '2024-05-31', '2024-05-25', '2024-05-20', '2024-05-15', '2024-05-10', '2024-05-05', '2024-05-01',
            
            // 2024년 4월
            '2024-04-30', '2024-04-25', '2024-04-20', '2024-04-15', '2024-04-10', '2024-04-05', '2024-04-01',
            
            // 2024년 3월
            '2024-03-31', '2024-03-25', '2024-03-20', '2024-03-15', '2024-03-10', '2024-03-05', '2024-03-01',
            
            // 2024년 2월
            '2024-02-29', '2024-02-25', '2024-02-20', '2024-02-15', '2024-02-10', '2024-02-05', '2024-02-01',
            
            // 2024년 1월
            '2024-01-31', '2024-01-25', '2024-01-20', '2024-01-15', '2024-01-10', '2024-01-05', '2024-01-01',
            
            // 2023년 하반기
            '2023-12-31', '2023-12-15', '2023-11-30', '2023-11-15', '2023-10-31', '2023-10-15',
            '2023-09-30', '2023-09-15', '2023-08-31', '2023-08-15', '2023-07-31', '2023-07-15'
        ];
        
        console.log(`📅 ${dates.length}개 기간의 박스오피스 데이터 수집 중...`);
        
        for (let i = 0; i < dates.length; i++) {
            const date = this.formatDate(dates[i]);
            console.log(`📊 ${i + 1}/${dates.length}: ${dates[i]} 박스오피스 조회 중...`);
            
            const boxOfficeList = await this.getDailyBoxOffice(date);
            
            if (boxOfficeList.length > 0) {
                // 한국 영화 필터링 (여러 조건으로 확인)
                const koreanMovies = boxOfficeList.filter(movie => {
                    const isKorean = movie.repNationNm === '한국' || 
                                   movie.nationAlt === '한국' ||
                                   (movie.repNationNm && movie.repNationNm.includes('한국')) ||
                                   (movie.nationAlt && movie.nationAlt.includes('한국'));
                    return isKorean;
                });
                
                console.log(`   🇰🇷 한국 영화 ${koreanMovies.length}개 발견`);
                
                koreanMovies.forEach(movie => {
                    movieCodes.add(movie.movieCd);
                    console.log(`      - ${movie.movieNm} (${movie.movieCd})`);
                });
            } else {
                console.log(`   📭 데이터 없음`);
            }
            
            await this.delay(200);
        }
        
        console.log(`\n🎯 총 ${movieCodes.size}개의 고유한 한국 영화 코드 수집 완료`);
        
        if (movieCodes.size === 0) {
            console.log('❌ 수집된 영화가 없습니다. 더 넓은 범위로 검색을 시도합니다...');
            return await this.collectAllMoviesFromBoxOffice();
        }
        
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
                    
                    console.log(`   ✅ "${normalizedMovie.title}" - 감독: ${normalizedMovie.director}`);
                } else {
                    failCount++;
                }
                
            } catch (error) {
                console.error(`❌ ${movieCd} 처리 중 오류:`, error.message);
                failCount++;
            }
        }
        
        return this.saveResults(successCount, failCount);
    }

    // 박스오피스 전체에서 모든 영화 수집 (한국 영화 여부와 관계없이)
    async collectAllMoviesFromBoxOffice() {
        console.log('🔍 모든 박스오피스 영화에서 한국 영화 찾기...');
        
        const movieCodes = new Set();
        const testDates = ['2024-07-27', '2024-07-26', '2024-07-25', '2024-07-20', '2024-07-15'];
        
        for (const dateStr of testDates) {
            const date = this.formatDate(dateStr);
            console.log(`📊 ${dateStr} 전체 박스오피스 조회 중...`);
            
            const boxOfficeList = await this.getDailyBoxOffice(date);
            
            if (boxOfficeList.length > 0) {
                console.log(`   📋 전체 영화 ${boxOfficeList.length}개 발견`);
                
                // 모든 영화의 상세정보를 확인해서 한국 영화 찾기
                for (const movie of boxOfficeList) {
                    console.log(`   🎬 "${movie.movieNm}" (${movie.movieCd}) 확인 중...`);
                    
                    const detail = await this.getMovieDetail(movie.movieCd);
                    if (detail && detail.nations) {
                        const isKorean = detail.nations.some(nation => 
                            nation.nationNm === '한국' || nation.nationNm.includes('한국')
                        );
                        
                        if (isKorean) {
                            movieCodes.add(movie.movieCd);
                            console.log(`      ✅ 한국 영화 발견: "${detail.movieNm}"`);
                        }
                    }
                }
            }
            
            await this.delay(500);
        }
        
        console.log(`\n🎯 한국 영화 ${movieCodes.size}개 발견`);
        
        // 상세 정보 재수집
        const movieCodesArray = Array.from(movieCodes);
        let successCount = 0;
        
        for (const movieCd of movieCodesArray) {
            const movieDetail = await this.getMovieDetail(movieCd);
            if (movieDetail) {
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
                    country: '한국',
                    production_status: movieDetail.prdtStatNm || '',
                    type: movieDetail.typeNm || '',
                    open_date: movieDetail.openDt || ''
                };
                
                this.allMovies.push(normalizedMovie);
                successCount++;
            }
        }
        
        return this.saveResults(successCount, 0);
    }

    saveResults(successCount, failCount) {
        console.log(`\n✅ 데이터 수집 완료!`);
        console.log(`📊 총 수집: ${this.allMovies.length}개`);
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);
        
        const filename = `kofic_recent_movies_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
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

async function main() {
    const collector = new KoficRecentCollector();
    await collector.collectRecentMovies();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = KoficRecentCollector;