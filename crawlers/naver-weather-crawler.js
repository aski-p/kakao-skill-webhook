// 네이버 날씨 크롤러
const axios = require('axios');
const cheerio = require('cheerio');

class NaverWeatherCrawler {
    constructor() {
        this.baseUrl = 'https://search.naver.com/search.naver';
    }

    // 도시명을 네이버 검색용으로 변환
    formatCityQuery(cityKorean) {
        const cityMapping = {
            '서울': '서울날씨',
            '부산': '부산날씨',
            '대구': '대구날씨',
            '인천': '인천날씨',
            '광주': '광주날씨',
            '대전': '대전날씨',
            '울산': '울산날씨',
            '세종': '세종날씨',
            '수원': '수원날씨',
            '용인': '용인날씨',
            '고양': '고양날씨',
            '창원': '창원날씨',
            '성남': '성남날씨',
            '청주': '청주날씨',
            '안산': '안산날씨',
            '전주': '전주날씨',
            '천안': '천안날씨',
            '안양': '안양날씨',
            '인덕원': '안양날씨' // 인덕원은 안양시
        };
        
        return cityMapping[cityKorean] || `${cityKorean}날씨`;
    }

    async getWeatherInfo(cityKorean = '서울') {
        try {
            const query = this.formatCityQuery(cityKorean);
            console.log(`🌤️ 네이버 날씨 크롤링 시작: ${query}`);
            
            const response = await axios.get(this.baseUrl, {
                params: { where: 'nexearch', sm: 'top_hty', ie: 'utf8', query: query },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 3000
            });

            const $ = cheerio.load(response.data);
            
            // 날씨 정보 추출
            const weatherData = {
                temperature: '',
                condition: '',
                fineDust: '',
                ultraFineDust: '',
                humidity: '',
                wind: '',
                rainfall: '',
                feels_like: '',
                tomorrow: {},
                weekly: []
            };

            // 현재 온도
            const tempElement = $('.temperature_text');
            if (tempElement.length > 0) {
                weatherData.temperature = tempElement.first().text().trim();
            }

            // 날씨 상태
            const conditionElement = $('.weather_main');
            if (conditionElement.length > 0) {
                weatherData.condition = conditionElement.text().trim();
            }

            // 체감온도
            const feelsLikeElement = $('.summary_list .sort:contains("체감")');
            if (feelsLikeElement.length > 0) {
                const feelsLikeText = feelsLikeElement.next('.desc').text().trim();
                weatherData.feels_like = feelsLikeText;
            }

            // 미세먼지
            const dustElements = $('.today_chart_list .item_today');
            dustElements.each((index, element) => {
                const title = $(element).find('.title').text().trim();
                const value = $(element).find('.txt').text().trim();
                
                if (title.includes('미세먼지')) {
                    weatherData.fineDust = value;
                } else if (title.includes('초미세')) {
                    weatherData.ultraFineDust = value;
                }
            });

            // 상세 정보 (습도, 바람 등)
            $('.report_card_list .report_card').each((index, element) => {
                const title = $(element).find('.title').text().trim();
                const value = $(element).find('.txt').text().trim();
                
                if (title.includes('습도')) {
                    weatherData.humidity = value;
                } else if (title.includes('바람')) {
                    weatherData.wind = value;
                } else if (title.includes('강수')) {
                    weatherData.rainfall = value;
                }
            });

            // 내일 날씨
            const tomorrowElement = $('.week_list .week_item').eq(1);
            if (tomorrowElement.length > 0) {
                weatherData.tomorrow = {
                    day: tomorrowElement.find('.day').text().trim(),
                    condition: tomorrowElement.find('.weather_inner span').text().trim(),
                    tempHigh: tomorrowElement.find('.temperature_inner .highest').text().trim(),
                    tempLow: tomorrowElement.find('.temperature_inner .lowest').text().trim()
                };
            }

            return this.formatWeatherResponse(cityKorean, weatherData);
            
        } catch (error) {
            console.error('❌ 네이버 날씨 크롤링 오류:', error.message);
            return null;
        }
    }

    formatWeatherResponse(city, data) {
        let response = `🌤️ ${city} 날씨 정보\n\n`;
        
        // 현재 날씨
        if (data.temperature) {
            response += `🌡️ 현재 기온: ${data.temperature}\n`;
            if (data.feels_like) {
                response += `🤒 체감 온도: ${data.feels_like}\n`;
            }
            if (data.condition) {
                response += `☁️ 날씨 상태: ${data.condition}\n`;
            }
            response += `\n`;
        }
        
        // 대기 정보
        if (data.fineDust || data.ultraFineDust) {
            response += `🌫️ 대기 정보\n`;
            if (data.fineDust) response += `• 미세먼지: ${data.fineDust}\n`;
            if (data.ultraFineDust) response += `• 초미세먼지: ${data.ultraFineDust}\n`;
            response += `\n`;
        }
        
        // 상세 정보
        if (data.humidity || data.wind || data.rainfall) {
            response += `📊 상세 정보\n`;
            if (data.humidity) response += `• 습도: ${data.humidity}\n`;
            if (data.wind) response += `• 바람: ${data.wind}\n`;
            if (data.rainfall) response += `• 강수: ${data.rainfall}\n`;
            response += `\n`;
        }
        
        // 내일 날씨
        if (data.tomorrow && data.tomorrow.day) {
            response += `📅 내일 날씨\n`;
            response += `• ${data.tomorrow.day}: ${data.tomorrow.condition}\n`;
            response += `• 최고/최저: ${data.tomorrow.tempHigh}/${data.tomorrow.tempLow}\n\n`;
        }
        
        // 안내 메시지
        const koreanTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        response += `🕐 조회 시간: ${koreanTime}\n`;
        response += `💡 자세한 정보: weather.naver.com`;
        
        return response;
    }
}

module.exports = NaverWeatherCrawler;