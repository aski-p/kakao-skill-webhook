// KOFIC API 직접 테스트
const axios = require('axios');

const KOFIC_API_KEY = '504ec8ff56d6c888399e9b9c1f719f03';
const BASE_URL = 'http://kobis.or.kr/kobisopenapi/webservice/rest';

async function testKoficAPI() {
    console.log('[MOVIE] KOFIC API 테스트 시작\n');

    try {
        // 1. 일별 박스오피스 테스트
        console.log('[INFO] 일별 박스오피스 조회...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const targetDt = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        
        const boxOfficeResponse = await axios.get(`${BASE_URL}/boxoffice/searchDailyBoxOfficeList.json`, {
            params: {
                key: KOFIC_API_KEY,
                targetDt: targetDt
            }
        });

        if (boxOfficeResponse.data.boxOfficeResult) {
            const result = boxOfficeResponse.data.boxOfficeResult;
            console.log(`[SUCCESS] 박스오피스 조회 성공 - ${result.showRange}`);
            console.log('Top 3 영화:');
            result.dailyBoxOfficeList.slice(0, 3).forEach(movie => {
                console.log(`  ${movie.rank}위: ${movie.movieNm} (${parseInt(movie.audiCnt).toLocaleString()}명)`);
            });
        }

        // 2. 한국 영화 목록 조회 (최근 영화)
        console.log('\n[SEARCH] 한국 영화 목록 조회...');
        const currentYear = new Date().getFullYear();
        const movieListResponse = await axios.get(`${BASE_URL}/movie/searchMovieList.json`, {
            params: {
                key: KOFIC_API_KEY,
                nationCd: '22041011', // 한국
                prdtStartYear: currentYear - 1,
                prdtEndYear: currentYear,
                itemPerPage: 10
            }
        });

        if (movieListResponse.data.movieListResult) {
            const movies = movieListResponse.data.movieListResult.movieList;
            console.log(`[SUCCESS] 한국 영화 ${movies.length}개 조회 성공`);
            
            // 첫 번째 영화의 상세 정보 조회
            if (movies.length > 0) {
                const firstMovie = movies[0];
                console.log(`\n[PROJECTOR] "${firstMovie.movieNm}" 상세 정보 조회...`);
                
                const movieInfoResponse = await axios.get(`${BASE_URL}/movie/searchMovieInfo.json`, {
                    params: {
                        key: KOFIC_API_KEY,
                        movieCd: firstMovie.movieCd
                    }
                });

                if (movieInfoResponse.data.movieInfoResult) {
                    const movieInfo = movieInfoResponse.data.movieInfoResult.movieInfo;
                    console.log('\n영화 상세 정보:');
                    console.log(`- 제목: ${movieInfo.movieNm} (${movieInfo.movieNmEn || 'N/A'})`);
                    console.log(`- 개봉일: ${movieInfo.openDt || '미정'}`);
                    console.log(`- 장르: ${movieInfo.genres.map(g => g.genreNm).join(', ')}`);
                    console.log(`- 감독: ${movieInfo.directors.map(d => d.peopleNm).join(', ')}`);
                    console.log(`- 배우: ${movieInfo.actors.slice(0, 5).map(a => a.peopleNm).join(', ')}`);
                }
            }
        }

        // 3. 영화인 검색 테스트
        console.log('\n[BUSTSINSILHOUETTE] 영화인 검색 테스트 (봉준호)...');
        const peopleResponse = await axios.get(`${BASE_URL}/people/searchPeopleList.json`, {
            params: {
                key: KOFIC_API_KEY,
                peopleNm: '봉준호'
            }
        });

        if (peopleResponse.data.peopleListResult) {
            const people = peopleResponse.data.peopleListResult.peopleList;
            console.log(`[SUCCESS] ${people.length}명 검색됨`);
            people.forEach(person => {
                console.log(`- ${person.peopleNm} (${person.repRoleNm})`);
            });
        }

    } catch (error) {
        console.error('[ERROR] API 테스트 실패:', error.message);
        if (error.response) {
            console.error('응답 데이터:', error.response.data);
        }
    }
}

// 테스트 실행
testKoficAPI();