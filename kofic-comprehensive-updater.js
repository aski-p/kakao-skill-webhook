// KOFIC API로 대량 한국 영화 데이터 수집 및 DB 업데이트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase 설정
const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class KoficComprehensiveUpdater {
    constructor() {
        this.apiKey = '504ec8ff56d6c888399e9b9c1f719f03';
        this.baseUrl = 'http://kobis.or.kr/kobisopenapi/webservice/rest';
        this.allMovies = [];
        this.rateLimitDelay = 300;
        this.corrections = [];
        this.newAdditions = [];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 영화 목록 조회 (searchMovieList API 사용)
    async getMovieList(movieNm = '', directorNm = '', prodYear = '', curPage = 1, itemPerPage = 100) {
        const url = `${this.baseUrl}/movie/searchMovieList.json?key=${this.apiKey}&movieNm=${encodeURIComponent(movieNm)}&directorNm=${encodeURIComponent(directorNm)}&prdtStartYear=${prodYear}&prdtEndYear=${prodYear}&curPage=${curPage}&itemPerPage=${itemPerPage}`;
        
        try {
            await this.delay(this.rateLimitDelay);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.movieListResult && data.movieListResult.movieList) {
                return {
                    movies: data.movieListResult.movieList,
                    totalCount: data.movieListResult.totCnt,
                    itemPerPage: data.movieListResult.itemPerPage
                };
            }
            
            return { movies: [], totalCount: 0, itemPerPage: 0 };
        } catch (error) {
            console.error(`❌ 영화 목록 조회 오류:`, error.message);
            return { movies: [], totalCount: 0, itemPerPage: 0 };
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

    // 대량 한국 영화 수집 (최근 10년)
    async collectKoreanMovies() {
        console.log('🎬 대량 한국 영화 데이터 수집 시작...\n');
        
        const movieCodes = new Set();
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 10; // 최근 10년
        
        // 연도별로 영화 목록 수집
        for (let year = startYear; year <= currentYear; year++) {
            console.log(`📅 ${year}년 한국 영화 수집 중...`);
            
            let page = 1;
            const itemsPerPage = 100;
            let hasMorePages = true;
            
            while (hasMorePages) {
                const result = await this.getMovieList('', '', year.toString(), page, itemsPerPage);
                
                if (result.movies.length === 0) {
                    hasMorePages = false;
                    break;
                }
                
                // 한국 영화만 필터링
                const koreanMovies = result.movies.filter(movie => {
                    const isKorean = movie.repNationNm === '한국' || 
                                   (movie.nationAlt && movie.nationAlt.includes('한국'));
                    return isKorean;
                });
                
                console.log(`   📖 페이지 ${page}: 전체 ${result.movies.length}개 중 한국 영화 ${koreanMovies.length}개`);
                
                koreanMovies.forEach(movie => {
                    movieCodes.add(movie.movieCd);
                });
                
                // 다음 페이지 체크
                if (result.movies.length < itemsPerPage) {
                    hasMorePages = false;
                } else {
                    page++;
                }
                
                // 너무 많은 페이지는 제한 (API 호출 제한 고려)
                if (page > 10) {
                    console.log('   ⚠️ 페이지 제한으로 다음 연도로 이동');
                    hasMorePages = false;
                }
            }
        }
        
        console.log(`\n🎯 총 ${movieCodes.size}개의 고유한 한국 영화 코드 수집 완료`);
        
        // 상세 정보 수집 (처음 200개만 - API 제한 고려)
        const movieCodesArray = Array.from(movieCodes).slice(0, 200);
        console.log(`🔍 상위 ${movieCodesArray.length}개 영화의 상세 정보 수집 중...\n`);
        
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
                        country: '한국',
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
                if ((i + 1) % 20 === 0) {
                    console.log(`   📊 진행 상황: ${i + 1}/${movieCodesArray.length} (성공: ${successCount}, 실패: ${failCount})`);
                }
                
            } catch (error) {
                console.error(`❌ ${movieCd} 처리 중 오류:`, error.message);
                failCount++;
            }
        }
        
        console.log(`\n✅ KOFIC 데이터 수집 완료!`);
        console.log(`📊 총 수집: ${this.allMovies.length}개`);
        
        // 결과 저장
        const filename = `kofic_comprehensive_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
        fs.writeFileSync(filename, JSON.stringify({
            collection_date: new Date().toISOString(),
            total_movies: this.allMovies.length,
            movies: this.allMovies
        }, null, 2));
        
        console.log(`💾 데이터 저장: ${filename}`);
        
        return filename;
    }

    // 제목 유사도 계산
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        
        if (s1 === s2) return 1;
        if (s1.includes(s2) || s2.includes(s1)) return 0.8;
        
        // 레벤슈타인 거리 기반
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // DB와 매칭 및 업데이트
    async matchAndUpdate() {
        console.log('\n🔍 데이터베이스와 매칭 및 업데이트 시작...\n');
        
        // DB에서 한국 영화 조회
        const { data: dbMovies, error } = await supabase
            .from('movies')
            .select('id, title, director, cast_members, country, release_year');
            
        if (error) {
            console.error('❌ DB 조회 오류:', error);
            return;
        }
        
        console.log(`📊 DB 영화: ${dbMovies.length}개`);
        console.log(`📊 KOFIC 영화: ${this.allMovies.length}개\n`);
        
        let matchCount = 0;
        let updateCount = 0;
        let newMovieCount = 0;
        
        // 각 KOFIC 영화에 대해 DB 매칭 시도
        for (let i = 0; i < this.allMovies.length; i++) {
            const koficMovie = this.allMovies[i];
            console.log(`🎬 ${i + 1}/${this.allMovies.length}: "${koficMovie.title}" 매칭 중...`);
            
            let bestMatch = null;
            let bestScore = 0;
            
            // DB에서 유사한 영화 찾기
            for (const dbMovie of dbMovies) {
                const titleSimilarity = this.calculateSimilarity(koficMovie.title, dbMovie.title);
                
                if (titleSimilarity > bestScore && titleSimilarity >= 0.7) {
                    // 연도 확인
                    const yearMatch = !dbMovie.release_year || 
                                    !koficMovie.release_year || 
                                    Math.abs(dbMovie.release_year - koficMovie.release_year) <= 1;
                    
                    if (yearMatch) {
                        bestMatch = dbMovie;
                        bestScore = titleSimilarity;
                    }
                }
            }
            
            if (bestMatch) {
                console.log(`   ✅ 매칭: "${bestMatch.title}" (유사도: ${(bestScore * 100).toFixed(1)}%)`);
                matchCount++;
                
                // 업데이트 필요성 확인
                const needsUpdate = this.checkNeedsUpdate(koficMovie, bestMatch);
                
                if (needsUpdate) {
                    try {
                        await this.updateMovie(bestMatch.id, koficMovie);
                        console.log(`   🔄 업데이트 완료`);
                        updateCount++;
                    } catch (error) {
                        console.error(`   ❌ 업데이트 실패:`, error.message);
                    }
                }
            } else {
                console.log(`   ➕ 새 영화로 추가 예정`);
                
                try {
                    await this.addNewMovie(koficMovie);
                    console.log(`   ✅ 새 영화 추가 완료`);
                    newMovieCount++;
                } catch (error) {
                    if (error.message.includes('duplicate key')) {
                        console.log(`   ⚠️ 이미 존재하는 영화`);
                    } else {
                        console.error(`   ❌ 추가 실패:`, error.message);
                    }
                }
            }
            
            // 진행 상황 표시
            if ((i + 1) % 20 === 0) {
                console.log(`\n📊 중간 결과: 매칭 ${matchCount}, 업데이트 ${updateCount}, 새 추가 ${newMovieCount}\n`);
            }
        }
        
        console.log('\n🎉 매칭 및 업데이트 완료!');
        console.log('='.repeat(60));
        console.log(`🔍 매칭된 영화: ${matchCount}개`);
        console.log(`🔄 업데이트된 영화: ${updateCount}개`);
        console.log(`➕ 새로 추가된 영화: ${newMovieCount}개`);
        
        return {
            matched: matchCount,
            updated: updateCount,
            added: newMovieCount
        };
    }

    // 업데이트 필요성 확인
    checkNeedsUpdate(koficMovie, dbMovie) {
        const dbCastString = Array.isArray(dbMovie.cast_members) 
            ? dbMovie.cast_members.join(', ') 
            : (dbMovie.cast_members || '');
            
        return koficMovie.director !== (dbMovie.director || '') ||
               koficMovie.cast_members !== dbCastString;
    }

    // 영화 정보 업데이트
    async updateMovie(movieId, koficMovie) {
        const updateData = {
            director: koficMovie.director,
            cast_members: koficMovie.cast_members.split(', '),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('movies')
            .update(updateData)
            .eq('id', movieId);
            
        if (error) throw error;
    }

    // 새 영화 추가
    async addNewMovie(koficMovie) {
        const newMovieData = {
            title: koficMovie.title,
            english_title: koficMovie.title_eng || null,
            director: koficMovie.director || '알 수 없음',
            cast_members: koficMovie.cast_members ? koficMovie.cast_members.split(', ') : [],
            genre: koficMovie.genre,
            release_year: koficMovie.release_year,
            runtime_minutes: koficMovie.runtime_minutes,
            country: '한국'
        };
        
        const { error } = await supabase
            .from('movies')
            .insert(newMovieData);
            
        if (error) throw error;
    }

    // 전체 프로세스 실행
    async runFullUpdate() {
        try {
            // 1단계: KOFIC 데이터 수집
            console.log('🚀 1단계: KOFIC 대량 영화 데이터 수집\n');
            await this.collectKoreanMovies();
            
            // 2단계: 매칭 및 업데이트
            console.log('\n🚀 2단계: 데이터베이스 매칭 및 업데이트\n');
            const result = await this.matchAndUpdate();
            
            return result;
            
        } catch (error) {
            console.error('❌ 전체 프로세스 실행 중 오류:', error);
            throw error;
        }
    }
}

// 실행
async function main() {
    const updater = new KoficComprehensiveUpdater();
    await updater.runFullUpdate();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = KoficComprehensiveUpdater;