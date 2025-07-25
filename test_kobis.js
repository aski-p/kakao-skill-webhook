// KOBIS API 통합 테스트
require('dotenv').config();
const KobisAPI = require('./config/kobis-api');
const DataExtractor = require('./config/data-extractor');

async function testKobisIntegration() {
    console.log('🎬 KOBIS API 통합 테스트 시작\n');

    // KOBIS API 키 확인
    if (!process.env.KOBIS_API_KEY) {
        console.log('⚠️  KOBIS_API_KEY가 설정되지 않았습니다.');
        console.log('📝 .env 파일에 KOBIS_API_KEY=your_api_key_here 를 추가해주세요.\n');
        console.log('🔗 KOBIS API 키 발급: http://kobis.or.kr/kobisopenapi/homepg/main/main.do');
        return;
    }

    const kobis = new KobisAPI();
    
    try {
        // 1. 일별 박스오피스 테스트
        console.log('📊 일별 박스오피스 조회 테스트...');
        const boxOffice = await kobis.getDailyBoxOffice();
        
        if (boxOffice.success && boxOffice.data.dailyBoxOfficeList) {
            console.log('✅ 박스오피스 조회 성공');
            console.log(`📅 기준일: ${boxOffice.data.boxofficeType} ${boxOffice.data.showRange}`);
            
            const top3 = boxOffice.data.dailyBoxOfficeList.slice(0, 3);
            top3.forEach(movie => {
                const audiCnt = parseInt(movie.audiCnt).toLocaleString();
                console.log(`   ${movie.rank}위: ${movie.movieNm} (${audiCnt}명)`);
            });
            console.log();
        } else {
            console.log('❌ 박스오피스 조회 실패');
            console.log('💡 API 키가 유효한지 확인해주세요.\n');
        }

        // 2. 영화 검색 테스트
        console.log('🔍 영화 검색 테스트 (최신 박스오피스 1위 영화)...');
        if (boxOffice.success && boxOffice.data.dailyBoxOfficeList.length > 0) {
            const topMovie = boxOffice.data.dailyBoxOfficeList[0];
            console.log(`🎬 검색 대상: "${topMovie.movieNm}"`);
            
            const searchResult = await kobis.searchMovies(topMovie.movieNm);
            if (searchResult.success && searchResult.data.movieList.length > 0) {
                console.log('✅ 영화 검색 성공');
                const movie = searchResult.data.movieList[0];
                console.log(`   영화명: ${movie.movieNm}`);
                console.log(`   영화코드: ${movie.movieCd}`);
                console.log(`   개봉일: ${movie.openDt}`);
                
                // 3. 영화 상세정보 테스트
                console.log('\n📽️  영화 상세정보 조회 테스트...');
                const movieDetail = await kobis.getMovieInfo(movie.movieCd);
                if (movieDetail.success) {
                    console.log('✅ 상세정보 조회 성공');
                    const info = movieDetail.data;
                    console.log(`   장르: ${info.genres ? info.genres.map(g => g.genreNm).join(', ') : '정보없음'}`);
                    console.log(`   상영시간: ${info.showTm || '정보없음'}분`);
                    console.log(`   관람등급: ${info.watchGradeNm || '정보없음'}`);
                    if (info.directors && info.directors.length > 0) {
                        console.log(`   감독: ${info.directors.map(d => d.peopleNm).join(', ')}`);
                    }
                    if (info.actors && info.actors.length > 0) {
                        console.log(`   주연: ${info.actors.slice(0, 3).map(a => a.peopleNm).join(', ')}`);
                    }
                    console.log();
                } else {
                    console.log('❌ 상세정보 조회 실패\n');
                }
            } else {
                console.log('❌ 영화 검색 실패\n');
            }
        }

        // 4. 통합 DataExtractor 테스트 (간단 버전)
        console.log('🔗 DataExtractor 통합 테스트...');
        const naverConfig = {
            clientId: process.env.NAVER_CLIENT_ID || 'test',
            clientSecret: process.env.NAVER_CLIENT_SECRET || 'test'
        };
        
        const extractor = new DataExtractor(naverConfig);
        console.log('✅ DataExtractor with KOBIS 초기화 성공');
        console.log('💡 실제 영화 검색 테스트는 카카오 스킬 서버 실행 후 테스트하세요.\n');

        // 5. F1 더무비 테스트 시뮬레이션
        console.log('🏎️  F1 더무비 검색 시뮬레이션...');
        const f1Search = await kobis.searchMovies('F1');
        if (f1Search.success && f1Search.data.movieList.length > 0) {
            console.log('✅ F1 관련 영화 검색 결과:');
            f1Search.data.movieList.slice(0, 3).forEach(movie => {
                console.log(`   - ${movie.movieNm} (${movie.openDt})`);
            });
        } else {
            console.log('💡 F1 관련 영화는 현재 KOBIS에서 찾을 수 없습니다.');
            console.log('   실제 테스트는 존재하는 영화명으로 해보세요.');
        }

        console.log('\n🎉 KOBIS API 통합 테스트 완료!');
        console.log('🚀 이제 카카오 챗봇에서 "영화제목 영화평"으로 테스트해보세요.');

    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error.message);
        
        if (error.message.includes('Invalid API Key')) {
            console.log('\n💡 해결방법:');
            console.log('1. KOBIS API 키가 올바른지 확인');
            console.log('2. API 키 승인 상태 확인');
            console.log('3. .env 파일에 정확히 입력되었는지 확인');
        }
    }
}

// 테스트 실행
if (require.main === module) {
    testKobisIntegration();
}

module.exports = testKobisIntegration;