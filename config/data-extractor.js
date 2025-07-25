// 카테고리별 데이터 추출 및 검색 엔진
const axios = require('axios');

class DataExtractor {
    constructor(naverConfig) {
        this.naverConfig = naverConfig;
        this.timeout = 3000;
    }

    // 메인 데이터 추출 함수
    async extractData(classification) {
        const { category, data } = classification;
        
        console.log(`🔧 데이터 추출 시작: ${category}`, data);
        
        try {
            switch (category) {
                case 'MOVIE_REVIEW':
                    return await this.extractMovieData(data);
                
                case 'WEATHER':
                    return await this.extractWeatherData(data);
                
                case 'RESTAURANT':
                    return await this.extractRestaurantData(data);
                
                case 'SHOPPING':
                    return await this.extractShoppingData(data);
                
                case 'NEWS':
                    return await this.extractNewsData(data);
                
                case 'YOUTUBE_SUMMARY':
                    return await this.extractYouTubeData(data);
                
                case 'FACT_CHECK':
                    return await this.extractFactCheckData(data);
                
                case 'GENERAL_QUESTION':
                    return await this.extractGeneralData(data);
                
                default:
                    return this.createErrorResponse(`알 수 없는 카테고리: ${category}`);
            }
        } catch (error) {
            console.error(`❌ 데이터 추출 실패 (${category}):`, error);
            return this.createErrorResponse('데이터 추출 중 오류가 발생했습니다.');
        }
    }

    // === 카테고리별 데이터 추출 구현 ===

    async extractMovieData(data) {
        const { title, reviewType } = data;
        
        if (!title) {
            return this.createErrorResponse('영화 제목을 찾을 수 없습니다.');
        }

        console.log(`🎬 영화 검색: "${title}" (리뷰 타입: ${reviewType})`);

        try {
            // 1. 네이버 영화 API 검색 시도
            const movieApiUrl = `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(title)}&display=1`;
            
            const movieResponse = await axios.get(movieApiUrl, {
                headers: {
                    'X-Naver-Client-Id': this.naverConfig.clientId,
                    'X-Naver-Client-Secret': this.naverConfig.clientSecret
                },
                timeout: this.timeout
            });

            if (movieResponse.data.items && movieResponse.data.items.length > 0) {
                const movie = movieResponse.data.items[0];
                return this.formatMovieResponse(movie, title, reviewType);
            }

            // 2. 영화 API에서 찾지 못한 경우 뉴스 검색으로 폴백
            return await this.searchMovieReviewsInNews(title, reviewType);

        } catch (error) {
            console.error('❌ 영화 검색 실패:', error);
            return await this.searchMovieReviewsInNews(title, reviewType);
        }
    }

    async searchMovieReviewsInNews(title, reviewType) {
        const searchQueries = this.generateMovieSearchQueries(title, reviewType);
        
        for (const query of searchQueries) {
            try {
                const response = await this.searchNaver('news', query, 3);
                if (response.items && response.items.length > 0) {
                    return this.formatMovieNewsResponse(response.items, title, query);
                }
            } catch (error) {
                console.log(`⚠️ 영화 뉴스 검색 실패: ${query}`);
            }
        }

        return this.createErrorResponse(`🎬 "${title}" 영화 정보를 찾을 수 없습니다.`);
    }

    generateMovieSearchQueries(title, reviewType) {
        const baseQueries = [
            `"${title}" 영화 평점`,
            `"${title}" 영화 리뷰`,
            `"${title}" 영화 평가`
        ];

        if (reviewType === 'critic') {
            baseQueries.unshift(`"${title}" 영화 평론`, `"${title}" 전문가 평가`);
        } else if (reviewType === 'audience') {
            baseQueries.unshift(`"${title}" 관객 평점`, `"${title}" 사용자 평가`);
        }

        // F1 영화 특별 처리
        if (title.toLowerCase().includes('f1') || title.includes('더무비')) {
            baseQueries.unshift(
                `"F1 더무비" 평점`,
                `"F1 더무비" 리뷰`,
                `"포뮬러1 영화" 평점`
            );
        }

        return baseQueries;
    }

    async extractWeatherData(data) {
        const { location, timeframe } = data;
        
        console.log(`🌤️ 날씨 정보 요청: ${location} (${timeframe})`);
        
        // 현재는 placeholder 응답 (향후 날씨 API 연동)
        return {
            success: true,
            type: 'weather',
            data: {
                location: location,
                timeframe: timeframe,
                message: `🌤️ "${location}" 날씨 정보\n\n⚠️ 실시간 날씨 API 연동이 아직 준비 중입니다.\n\n💡 정확한 날씨 정보는:\n• 네이버 날씨 검색\n• 기상청 날씨누리\n• 스마트폰 날씨 앱\n\n에서 확인해주세요!\n\n🔧 곧 실시간 날씨 정보 제공 예정입니다.`
            }
        };
    }

    async extractRestaurantData(data) {
        const { location, foodType, preference } = data;
        
        console.log(`🍽️ 맛집 검색: ${location} ${foodType} (선호도: ${preference})`);
        
        const query = this.buildRestaurantQuery(location, foodType, preference);
        
        try {
            const response = await this.searchNaver('local', query, 5);
            return this.formatRestaurantResponse(response.items, location, foodType);
        } catch (error) {
            return this.createErrorResponse('맛집 정보를 가져오는 중 오류가 발생했습니다.');
        }
    }

    buildRestaurantQuery(location, foodType, preferences) {
        let query = location;
        
        if (foodType && foodType !== 'general') {
            query += ` ${foodType}`;
        }
        
        if (preferences && preferences.includes('popular')) {
            query += ' 맛집';
        }
        
        return query;
    }

    async extractShoppingData(data) {
        const { productName, priceRange, comparison } = data;
        
        console.log(`🛒 쇼핑 검색: ${productName} (가격대: ${priceRange})`);
        
        if (comparison) {
            return await this.extractComparisonData(comparison);
        }
        
        try {
            const response = await this.searchNaver('shop', productName, 5);
            return this.formatShoppingResponse(response.items, productName, priceRange);
        } catch (error) {
            return this.createErrorResponse('상품 정보를 가져오는 중 오류가 발생했습니다.');
        }
    }

    async extractComparisonData(comparison) {
        // 상품 비교 로직 (향후 구현)
        return this.createErrorResponse('상품 비교 기능은 준비 중입니다.');
    }

    async extractNewsData(data) {
        const { topic, timeframe } = data;
        
        console.log(`📰 뉴스 검색: ${topic} (시간: ${timeframe})`);
        
        try {
            const response = await this.searchNaver('news', topic, 5);
            return this.formatNewsResponse(response.items, topic);
        } catch (error) {
            return this.createErrorResponse('뉴스 정보를 가져오는 중 오류가 발생했습니다.');
        }
    }

    async extractYouTubeData(data) {
        const { url, summaryType } = data;
        
        if (!url) {
            return this.createErrorResponse('유튜브 URL을 찾을 수 없습니다.');
        }
        
        console.log(`📺 유튜브 요약: ${url.videoId} (타입: ${summaryType})`);
        
        // 유튜브 요약 기능은 Claude AI 연동 필요
        return this.createErrorResponse('유튜브 요약 기능은 준비 중입니다.');
    }

    async extractFactCheckData(data) {
        const { claim } = data;
        
        console.log(`🔍 사실 확인: ${claim}`);
        
        try {
            const response = await this.searchNaver('news', `"${claim}" 사실`, 3);
            return this.formatFactCheckResponse(response.items, claim);
        } catch (error) {
            return this.createErrorResponse('사실 확인 정보를 가져오는 중 오류가 발생했습니다.');
        }
    }

    async extractGeneralData(data) {
        const { topic, questionType } = data;
        
        console.log(`❓ 일반 질문: ${topic} (타입: ${questionType})`);
        
        // 일반 질문은 Claude AI로 위임
        return {
            success: true,
            type: 'general_question',
            needsAI: true,
            data: { topic, questionType }
        };
    }

    // === 네이버 검색 공통 함수 ===

    async searchNaver(type, query, display = 5) {
        const apiUrls = {
            'news': 'https://openapi.naver.com/v1/search/news.json',
            'shop': 'https://openapi.naver.com/v1/search/shop.json',
            'local': 'https://openapi.naver.com/v1/search/local.json'
        };

        const response = await axios.get(apiUrls[type], {
            params: { query, display, sort: 'sim' },
            headers: {
                'X-Naver-Client-Id': this.naverConfig.clientId,
                'X-Naver-Client-Secret': this.naverConfig.clientSecret
            },
            timeout: this.timeout
        });

        return response.data;
    }

    // === 응답 포맷팅 함수들 ===

    formatMovieResponse(movie, title, reviewType) {
        const rating = movie.userRating || '정보없음';
        const director = movie.director.replace(/\|/g, ', ');
        const actor = movie.actor.replace(/\|/g, ', ').substring(0, 50);
        
        return {
            success: true,
            type: 'movie_review',
            data: {
                title: movie.title.replace(/<\/?[^>]+(>|$)/g, ''),
                rating: rating,
                director: director,
                actor: actor,
                link: movie.link,
                message: `🎬 "${title}" 영화 정보\n\n⭐ 평점: ${rating}/10\n🎭 감독: ${director}\n👥 주연: ${actor}\n\n🔗 상세정보: 네이버 영화`
            }
        };
    }

    formatMovieNewsResponse(items, title, query) {
        const reviews = items.slice(0, 3).map((item, index) => {
            const cleanTitle = item.title.replace(/<\/?[^>]+(>|$)/g, '');
            const cleanDescription = item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 80);
            return `${index + 1}. ${cleanTitle}\n   ${cleanDescription}...`;
        }).join('\n\n');

        return {
            success: true,
            type: 'movie_news',
            data: {
                title: title,
                query: query,
                message: `🎬 "${title}" 영화 평가 정보\n\n${reviews}\n\n💡 더 자세한 정보는 검색 결과를 확인해주세요!`
            }
        };
    }

    formatRestaurantResponse(items, location, foodType) {
        if (!items || items.length === 0) {
            return this.createErrorResponse(`${location} ${foodType} 맛집 정보를 찾을 수 없습니다.`);
        }

        const restaurants = items.slice(0, 3).map((item, index) => {
            const name = item.title.replace(/<\/?[^>]+(>|$)/g, '');
            const address = item.address || '주소 정보 없음';
            const category = item.category || '';
            return `${index + 1}. ${name}\n   📍 ${address}\n   🏷️ ${category}`;
        }).join('\n\n');

        return {
            success: true,
            type: 'restaurant',
            data: {
                location: location,
                foodType: foodType,
                message: `🍽️ ${location} ${foodType} 맛집 추천\n\n${restaurants}`
            }
        };
    }

    formatShoppingResponse(items, productName, priceRange) {
        if (!items || items.length === 0) {
            return this.createErrorResponse(`"${productName}" 상품을 찾을 수 없습니다.`);
        }

        const products = items.slice(0, 3).map((item, index) => {
            const name = item.title.replace(/<\/?[^>]+(>|$)/g, '');
            const price = parseInt(item.lprice).toLocaleString();
            const mallName = item.mallName || '쇼핑몰';
            return `${index + 1}. ${name}\n   💰 ${price}원 (${mallName})`;
        }).join('\n\n');

        return {
            success: true,
            type: 'shopping',
            data: {
                productName: productName,
                message: `🛒 "${productName}" 상품 검색 결과\n\n${products}`
            }
        };
    }

    formatNewsResponse(items, topic) {
        if (!items || items.length === 0) {
            return this.createErrorResponse(`"${topic}" 관련 뉴스를 찾을 수 없습니다.`);
        }

        const news = items.slice(0, 3).map((item, index) => {
            const title = item.title.replace(/<\/?[^>]+(>|$)/g, '');
            const description = item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 60);
            const pubDate = new Date(item.pubDate).toLocaleDateString('ko-KR');
            return `${index + 1}. ${title}\n   ${description}...\n   📅 ${pubDate}`;
        }).join('\n\n');

        return {
            success: true,
            type: 'news',
            data: {
                topic: topic,
                message: `📰 "${topic}" 관련 최신 뉴스\n\n${news}`
            }
        };
    }

    formatFactCheckResponse(items, claim) {
        if (!items || items.length === 0) {
            return this.createErrorResponse(`"${claim}" 관련 확인 가능한 정보를 찾을 수 없습니다.`);
        }

        const facts = items.slice(0, 2).map((item, index) => {
            const title = item.title.replace(/<\/?[^>]+(>|$)/g, '');
            const description = item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 80);
            return `${index + 1}. ${title}\n   ${description}...`;
        }).join('\n\n');

        return {
            success: true,
            type: 'fact_check',
            data: {
                claim: claim,
                message: `🔍 "${claim}" 사실 확인 정보\n\n${facts}\n\n⚠️ 정확한 사실 확인은 공식 출처를 통해 검증해주세요.`
            }
        };
    }

    createErrorResponse(message) {
        return {
            success: false,
            type: 'error',
            data: { message }
        };
    }
}

module.exports = DataExtractor;