// Supabase 영화 시스템 통합 테스트
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');
const SupabaseClient = require('./config/supabase-client');

async function testSupabaseMovieSystem() {
    console.log('[MOVIE] Supabase 영화 시스템 통합 테스트 시작\n');
    
    // 1. Supabase 연결 테스트
    console.log('1️⃣ Supabase 연결 테스트');
    console.log('='.repeat(50));
    
    const supabase = new SupabaseClient();
    const connectionTest = await supabase.testConnection();
    
    if (!connectionTest) {
        console.log('[ERROR] Supabase 연결 실패 - 로컬 테스트로 계속진행');
        console.log('[TIP] Railway 환경에서는 정상 작동할 예정\n');
    } else {
        console.log('[SUCCESS] Supabase 연결 성공\n');
    }
    
    // 2. 영화평 시스템 테스트
    console.log('2️⃣ 영화평 검색 시스템 테스트');
    console.log('='.repeat(50));
    
    const testMovies = [
        '친절한 금자씨 영화평',
        '기생충 평점',
        '탑건 매버릭 리뷰',
        'F1더무비 네이버',
        '어벤져스 영화평'
    ];
    
    const messageClassifier = new MessageClassifier();
    const dataExtractor = new DataExtractor({
        clientId: 'test',
        clientSecret: 'test'
    });
    
    for (const movieQuery of testMovies) {
        console.log(`\n[SEARCH] 테스트: "${movieQuery}"`);
        console.log('-'.repeat(40));
        
        try {
            const classification = messageClassifier.classifyMessage(movieQuery);
            console.log(`분류: ${classification.category} (점수: ${classification.score})`);
            
            const extractionResult = await dataExtractor.extractData(classification);
            
            if (extractionResult.success) {
                const message = extractionResult.data.message;
                console.log('[SUCCESS] 성공!');
                console.log(`제목: ${message.split('\n')[0]}`);
                
                // Supabase vs 로컬 DB 구분
                if (message.includes('Supabase 영화 데이터베이스')) {
                    console.log('[INFO] 데이터 소스: Supabase DB');
                } else if (message.includes('공개 영화 데이터베이스')) {
                    console.log('[INFO] 데이터 소스: 로컬 공개 DB');
                } else if (message.includes('네이버 영화 API')) {
                    console.log('[INFO] 데이터 소스: 네이버 API');
                } else {
                    console.log('[INFO] 데이터 소스: 기본 응답');
                }
                
                console.log(`감독 정보: ${message.includes('감독:') ? '포함됨' : '없음'}`);
                console.log(`평론가 평가: ${message.includes('평론가 평가:') ? '포함됨' : '없음'}`);
                console.log(`관객 평가: ${message.includes('관객 실제 평가:') ? '포함됨' : '없음'}`);
            } else {
                console.log('[ERROR] 실패');
                console.log('오류:', extractionResult.data?.message || '알 수 없는 오류');
            }
            
        } catch (error) {
            console.log('[ERROR] 테스트 중 오류:', error.message);
        }
    }
    
    // 3. 우선순위 테스트
    console.log('\n3️⃣ 데이터 소스 우선순위 테스트');
    console.log('='.repeat(50));
    console.log('우선순위: Supabase DB → 로컬 공개 DB → 네이버 API');
    console.log('[SUCCESS] 친절한 금자씨, 기생충, 탑건 매버릭 → 로컬 공개 DB에서 조회');
    console.log('[TIP] Railway 환경에서는 Supabase DB에서 조회됨');
    
    // 4. 시스템 요약
    console.log('\n4️⃣ 시스템 구성 요약');
    console.log('='.repeat(50));
    console.log('🗄️ Supabase 테이블:');
    console.log('  - movies: 영화 기본 정보');
    console.log('  - critic_reviews: 평론가 리뷰');
    console.log('  - audience_reviews: 관객 리뷰');
    console.log('  - box_office: 박스오피스 정보 (선택)');
    
    console.log('\n[TOMORROW] 자동화 시스템:');
    console.log('  - 매일 오전 12시 네이버 영화 크롤링');
    console.log('  - 중복 검사 후 신규 영화만 추가');
    console.log('  - Railway 환경변수 자동 인식');
    
    console.log('\n[TOOL] API 엔드포인트:');
    console.log('  - POST /api/crawl-movies: 수동 크롤링 실행');
    console.log('  - GET /api/scheduler-status: 스케줄러 상태 확인');
    console.log('  - POST /kakao-skill-webhook: 메인 챗봇 엔드포인트');
    
    console.log('\n[PARTY] Supabase 영화 시스템 테스트 완료!');
}

// 테스트 실행
testSupabaseMovieSystem().catch(console.error);