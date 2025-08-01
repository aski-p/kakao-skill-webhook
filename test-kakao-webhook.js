// 🎭 Playwright 기반 KakaoTalk 웹훅 테스트 스크립트
const axios = require('axios');

const WEBHOOK_URL = 'https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook';

// 테스트 시나리오들
const testScenarios = [
    {
        name: '라면 맛집 추천 (주요 이슈)',
        message: '라면이 땡기는데 번동 라면 맛집 추천좀',
        expectedPatterns: ['라면', '맛집', '번동'],
        maxResponseTime: 3000 // 3초 이내
    },
    {
        name: '야식 일반 질문',
        message: '야식 뭐먹지',
        expectedPatterns: ['야식'],
        maxResponseTime: 2000 // 2초 이내
    },
    {
        name: '치킨 질문',
        message: '치킨 먹고싶어',
        expectedPatterns: ['치킨'],
        maxResponseTime: 2000
    },
    {
        name: '날씨 질문',
        message: '오늘 서울 날씨 어때',
        expectedPatterns: ['날씨', '서울'],
        maxResponseTime: 3000
    },
    {
        name: '피자 질문',
        message: '피자 주문하고 싶어',
        expectedPatterns: ['피자'],
        maxResponseTime: 2000
    },
    {
        name: '인사말',
        message: '안녕하세요',
        expectedPatterns: ['안녕'],
        maxResponseTime: 2000
    },
    {
        name: '연속 대화 테스트 1',
        message: '배고파',
        expectedPatterns: ['음식', '먹'],
        maxResponseTime: 2000
    },
    {
        name: '연속 대화 테스트 2',
        message: '그럼 라면 맛집 알려줘',
        expectedPatterns: ['라면', '맛집'],
        maxResponseTime: 3000
    }
];

// 웹훅 테스트 함수
async function testWebhook(scenario) {
    const startTime = Date.now();
    
    try {
        console.log(`\n🧪 테스트: ${scenario.name}`);
        console.log(`📤 요청: "${scenario.message}"`);
        
        const response = await axios.post(WEBHOOK_URL, {
            userRequest: {
                utterance: scenario.message,
                user: {
                    id: `test-user-${Date.now()}`
                }
            }
        }, {
            timeout: scenario.maxResponseTime + 1000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const responseTime = Date.now() - startTime;
        const responseText = response.data?.template?.outputs?.[0]?.simpleText?.text;
        
        console.log(`📥 응답: "${responseText}"`);
        console.log(`⏱️  응답시간: ${responseTime}ms`);
        
        // 성공 조건 체크
        const checks = {
            statusOk: response.status === 200,
            hasResponse: !!responseText,
            notTimeoutError: !responseText?.includes('서버가 바쁜 것 같아요'),
            responseTimeOk: responseTime <= scenario.maxResponseTime,
            patternsMatch: scenario.expectedPatterns.some(pattern => 
                responseText?.toLowerCase().includes(pattern.toLowerCase())
            )
        };
        
        const allPassed = Object.values(checks).every(check => check);
        
        console.log(`✅ 상태 코드: ${checks.statusOk ? 'PASS' : 'FAIL'} (${response.status})`);
        console.log(`✅ 응답 존재: ${checks.hasResponse ? 'PASS' : 'FAIL'}`);
        console.log(`✅ 타임아웃 없음: ${checks.notTimeoutError ? 'PASS' : 'FAIL'}`);
        console.log(`✅ 응답 시간: ${checks.responseTimeOk ? 'PASS' : 'FAIL'} (${responseTime}ms <= ${scenario.maxResponseTime}ms)`);
        console.log(`✅ 패턴 매칭: ${checks.patternsMatch ? 'PASS' : 'FAIL'} (${scenario.expectedPatterns.join(', ')})`);
        
        console.log(`\n🎯 전체 결과: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
        
        return {
            scenario: scenario.name,
            success: allPassed,
            responseTime,
            responseText,
            checks
        };
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.log(`❌ 에러: ${error.message}`);
        console.log(`⏱️  실패 시간: ${responseTime}ms`);
        
        return {
            scenario: scenario.name,
            success: false,
            responseTime,
            error: error.message,
            checks: { error: true }
        };
    }
}

// 전체 테스트 실행
async function runAllTests() {
    console.log('🚀 카카오톡 웹훅 종합 테스트 시작');
    console.log(`🎯 테스트 대상: ${WEBHOOK_URL}`);
    console.log(`📊 총 테스트 수: ${testScenarios.length}개\n`);
    
    const results = [];
    
    for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        const result = await testWebhook(scenario);
        results.push(result);
        
        // 연속 테스트 간 1초 대기
        if (i < testScenarios.length - 1) {
            console.log('⏳ 1초 대기...\n');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // 최종 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('🏁 테스트 결과 요약');
    console.log('='.repeat(60));
    
    const passCount = results.filter(r => r.success).length;
    const failCount = results.length - passCount;
    const avgResponseTime = Math.round(
        results.filter(r => !r.error).reduce((sum, r) => sum + r.responseTime, 0) / 
        results.filter(r => !r.error).length
    );
    
    console.log(`✅ 성공: ${passCount}/${results.length}`);
    console.log(`❌ 실패: ${failCount}/${results.length}`);
    console.log(`⏱️  평균 응답시간: ${avgResponseTime}ms`);
    console.log(`🎯 성공률: ${Math.round(passCount / results.length * 100)}%`);
    
    console.log('\n📋 상세 결과:');
    results.forEach((result, index) => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
        console.log(`${index + 1}. ${result.scenario}: ${status} (${time})`);
        
        if (!result.success && result.error) {
            console.log(`   ⚠️  에러: ${result.error}`);
        }
    });
    
    // 핵심 테스트 확인
    const criticalTest = results.find(r => r.scenario.includes('라면 맛집 추천'));
    if (criticalTest && criticalTest.success) {
        console.log('\n🎉 핵심 이슈 해결: 라면 맛집 추천 테스트 통과!');
    } else {
        console.log('\n⚠️  핵심 이슈 미해결: 라면 맛집 추천 테스트 실패');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
        totalTests: results.length,
        passCount,
        failCount,
        successRate: Math.round(passCount / results.length * 100),
        avgResponseTime,
        results
    };
}

// 테스트 실행
if (require.main === module) {
    runAllTests()
        .then((summary) => {
            if (summary.successRate >= 90) {
                console.log('🎉 테스트 성공: 시스템이 안정적으로 작동합니다!');
                process.exit(0);
            } else {
                console.log('⚠️  테스트 실패: 추가 최적화가 필요합니다.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ 테스트 실행 실패:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, testWebhook };