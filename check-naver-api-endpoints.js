// 네이버 검색 API 엔드포인트 확인
const axios = require('axios');

class NaverAPIEndpointChecker {
    constructor() {
        this.clientId = '99hDav0SfKtmPXLljc1U';
        this.clientSecret = '7ahplkzCS0';
    }

    async testEndpoint(endpoint, query) {
        try {
            console.log(`🔍 테스트 중: ${endpoint}`);
            console.log(`📡 쿼리: ${query}`);
            
            const response = await axios.get(endpoint, {
                headers: {
                    'X-Naver-Client-Id': this.clientId,
                    'X-Naver-Client-Secret': this.clientSecret,
                    'User-Agent': 'Mozilla/5.0 (compatible; MovieBot/1.0)'
                },
                timeout: 10000
            });

            console.log(`✅ 성공! 상태: ${response.status}`);
            console.log(`📊 결과 수: ${response.data.items?.length || 0}개`);
            
            if (response.data.items && response.data.items.length > 0) {
                const firstItem = response.data.items[0];
                console.log(`📝 첫 번째 결과: ${JSON.stringify(firstItem, null, 2)}`);
            }
            
            return { success: true, data: response.data };

        } catch (error) {
            console.log(`❌ 실패:`);
            console.log(`   상태 코드: ${error.response?.status}`);
            console.log(`   메시지: ${error.message}`);
            console.log(`   응답: ${JSON.stringify(error.response?.data, null, 2)}`);
            
            return { success: false, error: error.response?.data };
        }
    }

    async run() {
        console.log('🚀 네이버 검색 API 엔드포인트 확인 시작...\n');
        
        const query = encodeURIComponent('파묘');
        
        // 가능한 엔드포인트들 테스트
        const endpoints = [
            // 기존 시도
            `https://openapi.naver.com/v1/search/movie.json?query=${query}&display=10`,
            
            // 대안 엔드포인트들
            `https://openapi.naver.com/v1/search/movie?query=${query}&display=10`,
            `https://openapi.naver.com/v1/search/movies.json?query=${query}&display=10`,
            `https://openapi.naver.com/v1/search/film.json?query=${query}&display=10`,
            
            // 웹 검색으로 대체
            `https://openapi.naver.com/v1/search/webkr.json?query=${query}&display=10`,
            `https://openapi.naver.com/v1/search/news.json?query=${query}&display=10`,
            `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=10`
        ];

        for (let i = 0; i < endpoints.length; i++) {
            console.log(`\n=== 테스트 ${i + 1}/${endpoints.length} ===`);
            await this.testEndpoint(endpoints[i], query);
            
            // 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n💡 네이버 영화 검색 API가 더 이상 사용 불가능한 것 같습니다.');
        console.log('🔄 대안 방법을 시도해보겠습니다...');
    }
}

// 실행
const checker = new NaverAPIEndpointChecker();
checker.run().catch(console.error);