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

        // F1 영화나 특별한 케이스는 바로 뉴스 검색으로 처리
        if (title.toLowerCase().includes('f1') || title.includes('더무비') || title.includes('무비')) {
            console.log('🏎️ F1/특별 영화 → 뉴스 검색으로 직접 처리');
            return await this.searchMovieReviewsInNews(title, reviewType);
        }

        try {
            // 1. 네이버 영화 API 검색 시도 (일반 영화만)
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

        // F1 관련 특별 에러 메시지
        if (title.toLowerCase().includes('f1') || title.includes('더무비')) {
            return this.createErrorResponse(
                `🎬 "${title}" 영화를 찾을 수 없습니다.\n\n🏎️ F1 관련 실제 영화들:\n• "러쉬" (2013) - 제임스 헌트 vs 니키 라우다\n• "아일톤 세나" (2010) - 전설의 F1 드라이버 다큐\n• "그랑프리" (1966) - 클래식 F1 영화\n\n💡 정확한 영화 제목으로 다시 검색해보세요!`
            );
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
            console.log(`🏎️ F1 영화 특별 검색 로직 적용: "${title}"`);
            
            // F1 관련 전문가 평론과 관객 평점을 구분해서 검색
            baseQueries.unshift(
                // 전문가 평론
                `"F1 더무비" 영화 평론`,
                `"F1 더무비" 리뷰`, 
                `"F1 더무비" 평가`,
                `"러쉬" 영화 평론`, // 실제 F1 영화
                `"러쉬" F1 영화 리뷰`,
                `"아일톤 세나" 다큐 평론`,
                `"그랑프리" 영화 리뷰`,
                
                // 관객 평점 전용
                `"F1 더무비" 관객 평점`,
                `"F1 더무비" 별점`,
                `"F1 더무비" 네티즌 평점`,
                `"F1 더무비" 사용자 평가`,
                `"러쉬" 관객 평점`,
                `"아일톤 세나" 관객 평점`,
                
                // 일반 검색
                `"포뮬러1" 영화 평점`,
                `F1 영화 추천`,
                `포뮬러원 영화 리뷰`
            );
        }

        return baseQueries;
    }

    async extractWeatherData(data) {
        const { location, timeframe } = data;
        
        console.log(`🌤️ 날씨 정보 요청: ${location} (${timeframe})`);
        
        try {
            // 네이버 검색 API로 날씨 정보 검색
            const weatherQuery = `${location} 날씨 기온 미세먼지`;
            const response = await this.searchNaver('news', weatherQuery, 3);
            
            if (response.items && response.items.length > 0) {
                return this.formatWeatherResponse(response.items, location, timeframe);
            }
            
            // 검색 결과가 없으면 기본 메시지
            return this.createWeatherPlaceholder(location);
            
        } catch (error) {
            console.error('❌ 날씨 정보 검색 실패:', error);
            return this.createWeatherPlaceholder(location);
        }
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
        if (!items || items.length === 0) {
            return this.createErrorResponse(`🎬 "${title}" 영화 평가 정보를 찾을 수 없습니다.`);
        }

        // 전문가 평론과 관객 평을 구분
        const expertReviews = items.filter(review => 
            review.title.includes('평론') || review.title.includes('리뷰') || 
            review.title.includes('평가') || review.title.includes('감상') ||
            review.title.includes('비평') || review.title.includes('평론가')
        );
        
        const audienceReviews = items.filter(review => 
            (review.title.includes('관객') && (review.title.includes('평점') || review.title.includes('별점'))) ||
            (review.title.includes('사용자') && (review.title.includes('평점') || review.title.includes('별점'))) ||
            (review.title.includes('네티즌') && (review.title.includes('평점') || review.title.includes('별점'))) ||
            (review.title.includes('별점') && review.title.includes(title)) ||
            (review.title.includes('평점') && review.title.includes('관객')) ||
            review.title.includes('★') || review.title.includes('⭐')
        );

        let reviewText = `🎬 "${title}" 영화 평점/평론 모음\n\n`;
        
        // 전문가 평론 섹션
        if (expertReviews.length > 0) {
            reviewText += `👨‍🎓 전문가 평론:\n\n`;
            expertReviews.slice(0, 3).forEach((review, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(review.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(review.description).substring(0, 120);
                reviewText += `${index + 1}. ${cleanTitle}\n   "${cleanDescription}..."\n\n`;
            });
        }
        
        // 관객 평가 섹션 (별점/평점 중심)
        if (audienceReviews.length > 0) {
            reviewText += `⭐ 관객 평점:\n\n`;
            audienceReviews.slice(0, 3).forEach((review, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(review.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(review.description).substring(0, 120);
                
                // 별점이나 평점 추출 시도
                const ratingMatch = cleanDescription.match(/(\d+\.?\d*)\s*(?:점|\/10|★|⭐)/);
                const starMatch = cleanDescription.match(/(★+|⭐+)/);
                
                let ratingInfo = '';
                if (ratingMatch) {
                    ratingInfo = ` [${ratingMatch[1]}점]`;
                } else if (starMatch) {
                    ratingInfo = ` [${starMatch[1]}]`;
                }
                
                reviewText += `${index + 1}. ${cleanTitle}${ratingInfo}\n   "${cleanDescription}..."\n\n`;
            });
        }
        
        // 둘 다 없으면 일반 리뷰들
        if (expertReviews.length === 0 && audienceReviews.length === 0) {
            reviewText += `📝 영화 관련 정보:\n\n`;
            items.slice(0, 5).forEach((review, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(review.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(review.description).substring(0, 120);
                reviewText += `${index + 1}. ${cleanTitle}\n   "${cleanDescription}..."\n\n`;
            });
        }

        return {
            success: true,
            type: 'movie_news',
            data: {
                title: title,
                query: query,
                message: reviewText.trim()
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

    // HTML 태그 및 특수문자 정리 함수
    cleanHtmlAndSpecialChars(text) {
        if (!text) return '';
        
        return text
            // HTML 태그 제거
            .replace(/<\/?[^>]+(>|$)/g, '')
            // HTML 엔티티 디코딩
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            // 특수문자 정리
            .replace(/[^\w\s가-힣.,!?():'"★⭐-]/g, ' ')
            // 여러 공백을 하나로
            .replace(/\s+/g, ' ')
            .trim();
    }

    // 날씨 응답 포맷팅
    formatWeatherResponse(items, location, timeframe) {
        if (!items || items.length === 0) {
            return this.createWeatherPlaceholder(location);
        }

        const weatherInfo = items.slice(0, 3).map((item, index) => {
            const cleanTitle = this.cleanHtmlAndSpecialChars(item.title);
            const cleanDescription = this.cleanHtmlAndSpecialChars(item.description).substring(0, 100);
            const pubDate = new Date(item.pubDate).toLocaleDateString('ko-KR');
            return `${index + 1}. ${cleanTitle}\n   ${cleanDescription}...\n   📅 ${pubDate}`;
        }).join('\n\n');

        return {
            success: true,
            type: 'weather',
            data: {
                location: location,
                timeframe: timeframe,
                message: `🌤️ "${location}" 날씨 관련 최신 정보\n\n${weatherInfo}\n\n💡 더 정확한 실시간 날씨는 기상청이나 날씨앱을 확인해주세요!`
            }
        };
    }

    // 날씨 기본 응답
    createWeatherPlaceholder(location) {
        return {
            success: true,
            type: 'weather',
            data: {
                location: location,
                message: `🌤️ "${location}" 날씨 정보\n\n⚠️ 현재 날씨 정보를 찾을 수 없습니다.\n\n💡 정확한 날씨 정보는:\n• 네이버 날씨 검색\n• 기상청 날씨누리\n• 스마트폰 날씨 앱\n\n에서 확인해주세요!`
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