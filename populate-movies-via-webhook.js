// 웹훅을 통한 영화 데이터 직접 삽입
const axios = require('axios');

const RAILWAY_URL = 'https://kakao-skill-webhook-production.up.railway.app';

// 인기 영화들을 카카오톡 웹훅으로 직접 검색하여 DB에 저장
const popularMovies = [
    '기생충 영화평',
    '어벤져스 평점', 
    '탑건 매버릭 영화평',
    '인터스텔라 평점',
    '라라랜드 영화평',
    '조커 평점',
    '겨울왕국 영화평',
    '타이타닉 평점',
    '아바타 영화평',
    '스파이더맨 평점',
    '아이언맨 영화평',
    '캡틴 아메리카 평점',
    '토르 영화평',
    '블랙팬서 평점',
    '미션 임파서블 영화평',
    '분노의 질주 평점',
    '쥬라기 공원 영화평',
    '해리포터 평점',
    '스타워즈 영화평',
    '배트맨 평점',
    '범죄도시 영화평',
    '극한직업 평점',
    '명량 영화평',
    '신과함께 평점',
    '택시운전사 영화평',
    '부산행 평점',
    '미나리 영화평',
    '모가디슈 평점',
    '국제시장 영화평',
    '베테랑 평점'
];

async function populateMoviesViaWebhook() {
    console.log('🎬 웹훅을 통한 영화 데이터베이스 구축 시작\n');
    console.log(`📊 대상 영화: ${popularMovies.length}개`);
    console.log('⏰ 예상 소요 시간: 5-10분 (각 요청당 5초 제한)\n');
    
    const results = {
        totalRequests: 0,
        successfulResponses: 0,
        movieReviewsGenerated: 0,
        errors: []
    };
    
    for (const movieQuery of popularMovies) {
        try {
            console.log(`🔍 "${movieQuery}" 요청 중...`);
            
            // 카카오톡 웹훅 형태로 요청
            const kakaoRequest = {
                intent: {
                    id: "movie_request",
                    name: "영화평 요청"
                },
                userRequest: {
                    utterance: movieQuery,
                    user: {
                        id: "test_user",
                        type: "botUserKey"
                    }
                },
                bot: {
                    id: "movie_bot",
                    name: "영화평 봇"
                },
                action: {
                    id: "movie_action",
                    name: "영화평 제공"
                }
            };
            
            const response = await axios.post(`${RAILWAY_URL}/kakao-skill-webhook`, kakaoRequest, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            results.totalRequests++;
            
            if (response.status === 200 && response.data.template) {
                const responseText = response.data.template.outputs[0]?.simpleText?.text || '';
                
                if (responseText.includes('영화평 종합') || responseText.includes('평점')) {
                    console.log(`✅ "${movieQuery}" - 영화평 생성 성공`);
                    results.movieReviewsGenerated++;
                    
                    // 데이터 소스 확인
                    if (responseText.includes('Supabase')) {
                        console.log('   📊 데이터 소스: Supabase DB');
                    } else if (responseText.includes('공개 영화 데이터베이스')) {
                        console.log('   📊 데이터 소스: 로컬 공개 DB');
                    } else if (responseText.includes('네이버')) {
                        console.log('   📊 데이터 소스: 네이버 API (자동 DB 저장)');
                    }
                } else {
                    console.log(`⚠️ "${movieQuery}" - 영화평 외 응답`);
                }
                
                results.successfulResponses++;
            } else {
                console.log(`❌ "${movieQuery}" - 응답 형식 오류`);
                results.errors.push(`${movieQuery}: 응답 형식 오류`);
            }
            
            // 각 요청 사이에 2초 대기 (서버 부하 방지)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`❌ "${movieQuery}" 요청 오류:`, error.message);
            results.errors.push(`${movieQuery}: ${error.message}`);
            
            // 오류 발생시 더 긴 대기
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    console.log('\n🎉 웹훅을 통한 영화 데이터베이스 구축 완료!');
    console.log('='.repeat(50));
    console.log(`📊 총 요청 수: ${results.totalRequests}개`);
    console.log(`✅ 성공적인 응답: ${results.successfulResponses}개`);
    console.log(`🎬 영화평 생성: ${results.movieReviewsGenerated}개`);
    console.log(`❌ 오류 발생: ${results.errors.length}개`);
    
    if (results.errors.length > 0) {
        console.log('\n⚠️ 발생한 오류들:');
        results.errors.slice(0, 5).forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
        if (results.errors.length > 5) {
            console.log(`  ... 그 외 ${results.errors.length - 5}건`);
        }
    }
    
    console.log('\n💡 효과:');
    console.log('- 네이버 API로 검색된 영화들이 자동으로 Supabase에 저장됨');
    console.log('- 다음 검색부터는 Supabase DB에서 빠르게 조회');
    console.log('- 영화평 품질 향상 (감독, 출연진, 평점 등 상세 정보)');
    
    return results;
}

async function testMovieQueries() {
    console.log('\n🧪 저장된 영화 데이터 테스트');
    console.log('='.repeat(30));
    
    const testQueries = [
        '기생충 영화평',
        '어벤져스 평점',
        '탑건 매버릭 리뷰'
    ];
    
    for (const query of testQueries) {
        try {
            console.log(`\n🔍 "${query}" 테스트...`);
            
            const kakaoRequest = {
                userRequest: {
                    utterance: query,
                    user: { id: "test_user" }
                }
            };
            
            const response = await axios.post(`${RAILWAY_URL}/kakao-skill-webhook`, kakaoRequest, {
                timeout: 15000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.template?.outputs?.[0]?.simpleText?.text) {
                const text = response.data.template.outputs[0].simpleText.text;
                console.log('✅ 응답 받음');
                
                // 데이터 소스 확인
                if (text.includes('Supabase')) {
                    console.log('   📊 데이터 소스: ✅ Supabase DB (목표 달성!)');
                } else if (text.includes('공개 영화 데이터베이스')) {
                    console.log('   📊 데이터 소스: 로컬 공개 DB');
                } else {
                    console.log('   📊 데이터 소스: 네이버 API');
                }
                
                // 정보 완성도 확인
                const hasDirector = text.includes('감독:');
                const hasCast = text.includes('출연:');
                const hasRating = text.includes('★') || text.includes('평점');
                
                console.log(`   ℹ️ 정보: 감독(${hasDirector ? '✅' : '❌'}) 출연진(${hasCast ? '✅' : '❌'}) 평점(${hasRating ? '✅' : '❌'})`);
            }
            
        } catch (error) {
            console.log(`❌ "${query}" 테스트 오류:`, error.message);
        }
    }
}

// 메인 실행
async function main() {
    console.log('🚀 웹훅을 통한 Supabase 영화 데이터베이스 구축');
    console.log('Railway 환경에서 자동 데이터 수집');
    console.log('='.repeat(60));
    
    // 1. 웹훅을 통한 대량 영화 데이터 수집
    const results = await populateMoviesViaWebhook();
    
    // 2. 결과 테스트
    await testMovieQueries();
    
    console.log('\n🎯 최종 결과:');
    console.log('- Supabase movies 테이블에 영화 데이터 자동 저장됨');
    console.log('- 향후 영화 검색이 DB 기반으로 빠르고 정확하게 동작');
    console.log('- 카카오톡에서 "영화제목 + 영화평/평점" 형태로 테스트 가능');
}

// 실행
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 실행 오류:', error.message);
        process.exit(1);
    });
}

module.exports = { populateMoviesViaWebhook, testMovieQueries };