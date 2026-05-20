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
            '인덕원': '안양날씨', // 인덕원은 안양시
            '제주': '제주날씨',
            '제주도': '제주날씨',
            '제주시': '제주날씨',
            '서귀포': '서귀포날씨',
            '서귀포시': '서귀포날씨',
            '경기': '경기도날씨',
            '경기도': '경기도날씨',
            '강원': '강원도날씨',
            '강원도': '강원도날씨',
            '충북': '충청북도날씨',
            '충청북도': '충청북도날씨',
            '충남': '충청남도날씨',
            '충청남도': '충청남도날씨',
            '전북': '전라북도날씨',
            '전라북도': '전라북도날씨',
            '전남': '전라남도날씨',
            '전라남도': '전라남도날씨',
            '경북': '경상북도날씨',
            '경상북도': '경상북도날씨',
            '경남': '경상남도날씨',
            '경상남도': '경상남도날씨'
        };
        
        return cityMapping[cityKorean] || `${cityKorean}날씨`;
    }

    async getWeatherInfo(cityKorean = '서울') {
        try {
            const query = this.formatCityQuery(cityKorean);
            console.log(`[WEATHER] 네이버 날씨 크롤링 시작: ${query}`);
            
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
                precipitationProbability: '',
                feels_like: '',
                lowest: '',
                highest: '',
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
                weatherData.condition = conditionElement.first().text().trim();
            }

            // 현재 상세 정보: 체감, 강수, 습도, 바람
            $('.summary_list').first().find('.sort').each((index, element) => {
                const text = $(element).text().replace(/\s+/g, ' ').trim();
                const desc = $(element).find('.desc').text().trim();
                if (text.includes('체감')) {
                    weatherData.feels_like = desc || text.replace('체감', '').trim();
                } else if (text.includes('강수확률')) {
                    weatherData.precipitationProbability = desc || text.replace('강수확률', '').trim();
                } else if (text.includes('강수')) {
                    weatherData.rainfall = desc || text.replace('강수', '').trim();
                } else if (text.includes('습도')) {
                    weatherData.humidity = desc || text.replace('습도', '').trim();
                } else if (/풍|바람|m\/s/.test(text)) {
                    weatherData.wind = desc || text;
                }
            });

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

            // 오늘 최저/최고 및 강수확률
            const todayElement = $('.week_list .week_item').first();
            if (todayElement.length > 0) {
                const todayText = todayElement.text().replace(/\s+/g, ' ').trim();
                weatherData.lowest = todayText.match(/최저기온\s*([0-9.-]+°?)/)?.[1] || '';
                weatherData.highest = todayText.match(/최고기온\s*([0-9.-]+°?)/)?.[1] || '';
                if (!weatherData.precipitationProbability) {
                    weatherData.precipitationProbability = todayText.match(/(\d+%)/)?.[1] || '';
                }
            }

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
            console.error('[ERROR] 네이버 날씨 크롤링 오류:', error.message);
            
            // 크롤링 실패 시 기본 응답 반환
            return {
                temperature: '정보 없음',
                condition: '날씨 정보를 가져올 수 없습니다',
                humidity: '',
                fineDust: '',
                ultraFineDust: '',
                recommendation: `${cityKorean} 날씨 정보를 일시적으로 확인할 수 없습니다. 잠시 후 다시 시도해주세요.`
            };
        }
    }

    formatWeatherResponse(city, data) {
        // 카카오톡 스킬용 응답 포맷으로 수정
        const weatherInfo = {
            temperature: data.temperature || '정보 없음',
            condition: data.condition || '날씨 정보 없음',
            humidity: data.humidity || '',
            fineDust: data.fineDust || '',
            ultraFineDust: data.ultraFineDust || '',
            feels_like: data.feels_like || '',
            wind: data.wind || '',
            rainfall: data.rainfall || '',
            precipitationProbability: data.precipitationProbability || '',
            lowest: data.lowest || '',
            highest: data.highest || '',
            tomorrow: data.tomorrow || {},
            recommendation: ''
        };
        
        // 추천 메시지 생성
        if (data.temperature && data.temperature !== '정보 없음') {
            const temp = parseFloat(data.temperature.replace(/[^0-9.-]/g, ''));
            if (!isNaN(temp)) {
                if (temp < 5) {
                    weatherInfo.recommendation = '매우 추워요. 따뜻하게 입으세요!';
                } else if (temp < 15) {
                    weatherInfo.recommendation = '쌀쌀해요. 겉옷을 챙기세요!';
                } else if (/비|소나기/.test(data.condition || '')) {
                    weatherInfo.recommendation = '비가 잡혀 있으니 우산 챙기는 게 좋아요!';
                } else if (/흐림|흐린|구름|안개|황사/.test(data.condition || '')) {
                    weatherInfo.recommendation = '하늘이 흐린 편이라 외출 전 최신 예보 한 번 더 보면 좋아요.';
                } else if (temp < 25) {
                    weatherInfo.recommendation = '날씨가 좋네요. 야외활동하기 좋아요!';
                } else {
                    weatherInfo.recommendation = '더워요. 시원하게 지내세요!';
                }
            }
        }
        
        return weatherInfo;
    }
}

module.exports = NaverWeatherCrawler;
