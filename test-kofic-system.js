// 영화진흥위원회 API 통합 시스템 테스트
const KoficMovieCrawler = require('./crawlers/kofic-movie-crawler');
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');
const SupabaseClient = require('./config/supabase-client');

async function testKoficIntegratedSystem() {
    console.log('🎬 영화진흥위원회 API 통합 시스템 테스트 시작\n');
    
    // 1. 환경변수 및 연결 테스트
    console.log('1️⃣ 환경변수 및 연결 상태 확인');
    console.log('='.repeat(50));
    
    const koficApiKey = process.env.KOFIC_API_KEY;
    const supabase = new SupabaseClient();
    
    console.log(`🎬 영화진흥위원회 API 키: ${koficApiKey ? '설정됨 (' + koficApiKey.substring(0, 8) + '...)' : '❌ 미설정'}`);
    console.log(`🗄️ Supabase 연결: ${supabase.client ? '✅ 성공' : '❌ 실패'}`);
    console.log(`📡 네이버 API: ${process.env.NAVER_CLIENT_ID ? '✅ 설정됨' : '❌ 미설정'}`);
    
    if (!koficApiKey) {
        console.log('\n⚠️ Railway 환경변수에 KOFIC_API_KEY 추가 필요:');
        console.log('KOFIC_API_KEY=504ec8ff56d6c888399e9b9c1f719f03');
        console.log('\n🔄 로컬 테스트는 제한적으로 진행됩니다.\n');
    }
    
    // 2. 영화진흥위원회 크롤러 테스트
    console.log('2️⃣ 영화진흥위원회 크롤러 기능 테스트');
    console.log('='.repeat(50));
    
    const koficCrawler = new KoficMovieCrawler();
    
    if (koficApiKey) {
        try {
            console.log('🔍 박스오피스 API 테스트 중...');
            
            // 테스트용으로 최근 1개월 데이터만 수집
            const testResult = {
                totalProcessed: 0,
                newMoviesAdded: 0,
                existingMovies: 0,
                errors: []
            };
            
            // 현재 월의 첫 주 박스오피스 데이터 테스트
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            const targetDate = `${currentYear}${currentMonth.toString().padStart(2, '0')}01`;
            
            const monthlyMovies = await koficCrawler.getMonthlyBoxOffice(targetDate);
            
            console.log(`📊 ${currentYear}년 ${currentMonth}월 박스오피스 영화 수: ${monthlyMovies.length}개`);
            
            if (monthlyMovies.length > 0) {
                console.log('🎬 상위 5개 영화:');
                monthlyMovies.slice(0, 5).forEach((movie, index) => {
                    console.log(`  ${index + 1}. ${movie.movieNm} (${movie.openDt})`);
                });
                
                // 첫 번째 영화의 상세 정보 테스트
                const firstMovie = monthlyMovies[0];
                const movieDetail = await koficCrawler.getMovieDetail(firstMovie.movieCd);
                
                if (movieDetail) {
                    console.log(`\n🔍 "${movieDetail.movieNm}" 상세 정보:`);
                    console.log(`  - 감독: ${movieDetail.directors?.map(d => d.peopleNm).join(', ') || '정보 없음'}`);
                    console.log(`  - 출연: ${movieDetail.actors?.slice(0, 3).map(a => a.peopleNm).join(', ') || '정보 없음'}`);
                    console.log(`  - 장르: ${movieDetail.genres?.map(g => g.genreNm).join(', ') || '정보 없음'}`);
                    console.log(`  - 제작년도: ${movieDetail.prdtYear || '정보 없음'}`);
                    console.log(`  - 개봉일: ${movieDetail.openDt || '정보 없음'}`);
                }
            }
            
            console.log('✅ 영화진흥위원회 API 테스트 성공');
            
        } catch (error) {
            console.log('❌ 영화진흥위원회 API 테스트 실패:', error.message);
        }
    } else {
        console.log('⚠️ API 키 없음 - 크롤러 테스트 스킵');
    }
    
    // 3. 통합 영화 검색 시스템 테스트
    console.log('\n3️⃣ 통합 영화 검색 시스템 테스트');
    console.log('='.repeat(50));
    
    const testQueries = [
        '기생충 영화평',
        '어벤져스 평점',
        '탑건 매버릭 리뷰',
        '오징어게임 평가',
        '인터스텔라 영화평'
    ];
    
    const messageClassifier = new MessageClassifier();
    const dataExtractor = new DataExtractor({
        clientId: process.env.NAVER_CLIENT_ID || 'test',
        clientSecret: process.env.NAVER_CLIENT_SECRET || 'test'
    });
    
    for (const query of testQueries) {
        console.log(`\n🔍 테스트: "${query}"`);
        console.log('-'.repeat(30));
        
        try {
            const classification = messageClassifier.classifyMessage(query);
            console.log(`분류: ${classification.category} (신뢰도: ${classification.score})`);
            
            if (classification.category === 'MOVIE_REVIEW') {
                const extractionResult = await dataExtractor.extractData(classification);
                
                if (extractionResult.success) {
                    const message = extractionResult.data.message;
                    console.log('✅ 영화평 생성 성공');
                    
                    // 데이터 소스 확인
                    if (message.includes('Supabase 영화 데이터베이스')) {
                        console.log('📊 데이터 소스: Supabase (영화진흥위원회 + 네이버)');
                    } else if (message.includes('공개 영화 데이터베이스')) {
                        console.log('📊 데이터 소스: 로컬 공개 DB');
                    } else {
                        console.log('📊 데이터 소스: 네이버 API (실시간)');
                    }
                    
                    // 정보 포함 여부 확인
                    const hasDirector = message.includes('감독:');
                    const hasCast = message.includes('출연:');
                    const hasCriticReview = message.includes('평론가 평가:');
                    const hasAudienceReview = message.includes('관객 실제 평가:');
                    
                    console.log(`정보 완성도: 감독(${hasDirector ? '✅' : '❌'}) 출연진(${hasCast ? '✅' : '❌'}) 평론가(${hasCriticReview ? '✅' : '❌'}) 관객(${hasAudienceReview ? '✅' : '❌'})`);
                } else {
                    console.log('❌ 영화평 생성 실패');
                }
            }
            
        } catch (error) {
            console.log('❌ 테스트 오류:', error.message);
        }
    }
    
    // 4. 데이터베이스 상태 확인
    console.log('\n4️⃣ 데이터베이스 현재 상태');
    console.log('='.repeat(50));
    
    if (supabase.client) {
        try {
            // 총 영화 수
            const { count: totalMovies } = await supabase.client
                .from('movies')
                .select('*', { count: 'exact', head: true });
                
            console.log(`🎬 총 영화 수: ${totalMovies || 0}개`);
            
            // 데이터 소스별 분포
            const { data: sourceStats } = await supabase.client
                .from('movies')
                .select('data_source');
                
            if (sourceStats) {
                const sourceCounts = {};
                sourceStats.forEach(movie => {
                    const source = movie.data_source || 'unknown';
                    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                });
                
                console.log('📊 데이터 소스별 분포:');
                Object.entries(sourceCounts).forEach(([source, count]) => {
                    const sourceLabel = {
                        'kofic_api': '영화진흥위원회 API',
                        'naver_api': '네이버 영화 API',
                        'hardcoded_db': '공개 영화 DB',
                        'unknown': '출처 미상'
                    }[source] || source;
                    
                    console.log(`  - ${sourceLabel}: ${count}개`);
                });
            }
            
            // 최근 추가된 영화 5개
            const { data: recentMovies } = await supabase.client
                .from('movies')
                .select('title, director, release_year, data_source, created_at')
                .order('created_at', { ascending: false })
                .limit(5);
                
            if (recentMovies && recentMovies.length > 0) {
                console.log('\n🆕 최근 추가된 영화 (상위 5개):');
                recentMovies.forEach((movie, index) => {
                    const sourceLabel = {
                        'kofic_api': 'KOFIC',
                        'naver_api': 'NAVER',
                        'hardcoded_db': 'LOCAL'
                    }[movie.data_source] || movie.data_source;
                    
                    console.log(`  ${index + 1}. ${movie.title} (${movie.release_year}) [${sourceLabel}]`);
                    console.log(`     감독: ${movie.director || '정보 없음'}`);
                });
            }
            
        } catch (error) {
            console.log('❌ 데이터베이스 조회 오류:', error.message);
        }
    }
    
    // 5. 시스템 구성 요약
    console.log('\n5️⃣ 시스템 구성 요약');
    console.log('='.repeat(50));
    console.log('🎯 영화평 검색 우선순위:');
    console.log('  1. Supabase DB 조회 (영화진흥위원회 + 네이버 통합 데이터)');
    console.log('  2. 로컬 공개 DB (인기 영화 하드코딩 데이터)');
    console.log('  3. 네이버 API (실시간 검색)');
    
    console.log('\n📅 자동 크롤링 시스템:');
    console.log('  - 매일 오전 12시 (한국시간) 자동 실행');
    console.log('  - 영화진흥위원회: 박스오피스 기반 전체 영화 수집');
    console.log('  - 네이버 API: 최신 영화 정보 보완 (포스터, 평점 등)');
    console.log('  - 중복 방지: 제목 + 연도 기반 검사');
    
    console.log('\n🔧 새로운 API 엔드포인트:');
    console.log('  - POST /api/crawl-kofic-movies: 영화진흥위원회 수동 크롤링');
    console.log('  - GET /api/kofic-status: 영화진흥위원회 API 상태 확인');
    console.log('  - POST /api/crawl-movies: 통합 크롤링 (기존)');
    
    console.log('\n🎉 영화진흥위원회 API 통합 시스템 테스트 완료!');
    console.log('Railway 배포 후 KOFIC_API_KEY 환경변수 설정하면 전체 기능 활성화됩니다.');
}

// 테스트 실행
testKoficIntegratedSystem().catch(console.error);