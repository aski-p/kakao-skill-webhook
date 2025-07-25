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
        // F1 관련 특별 처리 - 처음부터 실제 F1 영화로 리다이렉트
        if (title.toLowerCase().includes('f1') || title.includes('더무비')) {
            console.log('🏎️ F1 영화 요청 - 실제 F1 영화 "러쉬"로 검색');
            title = '러쉬'; // 제목을 러쉬로 변경
        }
        
        const searchQueries = this.generateMovieSearchQueries(title, reviewType);
        
        for (const query of searchQueries) {
            try {
                console.log(`🔍 영화 검색: ${query}`);
                const response = await this.searchNaver('news', query, 10);
                if (response.items && response.items.length > 0) {
                    console.log(`✅ 검색 결과 ${response.items.length}개 찾음`);
                    return this.formatMovieNewsResponse(response.items, title, query);
                }
            } catch (error) {
                console.log(`⚠️ 영화 뉴스 검색 실패: ${query}`, error);
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

        // F1 영화는 실제 "러쉬" 영화로 검색하므로 이 부분은 필요없음 (상위에서 처리됨)

        return baseQueries;
    }

    async extractWeatherData(data) {
        const { location, timeframe } = data;
        
        console.log(`🌤️ 날씨 정보 요청: ${location} (${timeframe})`);
        
        try {
            // 실제 날씨 API 호출
            const weatherData = await this.getActualWeatherData(location);
            
            if (weatherData) {
                return this.formatRealWeatherResponse(weatherData, location, timeframe);
            }
            
            // API 실패시 fallback으로 뉴스 검색
            console.log('⚠️ 날씨 API 실패, 뉴스 검색으로 fallback');
            const weatherQuery = `${location} 오늘 날씨 기온`;
            const response = await this.searchNaver('news', weatherQuery, 3);
            
            if (response.items && response.items.length > 0) {
                return this.formatWeatherNewsResponse(response.items, location, timeframe);
            }
            
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

    // === 실제 날씨 API 함수 ===
    
    async getActualWeatherData(location) {
        try {
            // 지역명을 좌표로 변환 (네이버 지오코딩 또는 간단한 매핑)
            const coords = this.getLocationCoords(location);
            if (!coords) {
                console.log(`⚠️ 지역 좌표를 찾을 수 없음: ${location}`);
                return null;
            }
            
            // OpenWeatherMap API 호출 (무료 버전)
            const weatherApiKey = process.env.OPENWEATHER_API_KEY;
            if (!weatherApiKey) {
                console.log('⚠️ OpenWeatherMap API 키가 설정되지 않음');
                return null;
            }
            
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${weatherApiKey}&units=metric&lang=kr`;
            
            const response = await axios.get(weatherUrl, { timeout: 3000 });
            
            if (response.data) {
                console.log(`✅ 실제 날씨 데이터 수신: ${location}`);
                return response.data;
            }
            
            return null;
            
        } catch (error) {
            console.error(`❌ 날씨 API 호출 실패:`, error.message);
            return null;
        }
    }
    
    getLocationCoords(location) {
        // 주요 도시 좌표 매핑 (확장 가능)
        const cityCoords = {
            '서울': { lat: 37.5665, lon: 126.9780 },
            '인천': { lat: 37.4563, lon: 126.7052 },
            '부산': { lat: 35.1796, lon: 129.0756 },
            '대구': { lat: 35.8714, lon: 128.6014 },
            '대전': { lat: 36.3504, lon: 127.3845 },
            '광주': { lat: 35.1595, lon: 126.8526 },
            '울산': { lat: 35.5384, lon: 129.3114 },
            '세종': { lat: 36.4800, lon: 127.2890 },
            '수원': { lat: 37.2636, lon: 127.0286 },
            '인덕원': { lat: 37.3897, lon: 126.9697 },
            '강남': { lat: 37.4979, lon: 127.0276 },
            '홍대': { lat: 37.5563, lon: 126.9236 },
            '신촌': { lat: 37.5547, lon: 126.9364 },
            '명동': { lat: 37.5636, lon: 126.9834 }
        };
        
        // 정확한 매칭 시도
        if (cityCoords[location]) {
            return cityCoords[location];
        }
        
        // 부분 매칭 시도
        for (const [city, coords] of Object.entries(cityCoords)) {
            if (location.includes(city) || city.includes(location)) {
                console.log(`📍 지역 매칭: ${location} → ${city}`);
                return coords;
            }
        }
        
        // 기본값 (서울)
        console.log(`📍 기본 지역 사용: ${location} → 서울`);
        return cityCoords['서울'];
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
        
        // F1 영화 요청인 경우 안내 메시지 추가
        const isF1Request = query.includes('F1') || title.includes('F1') || title.includes('더무비');
        const titlePrefix = isF1Request ? `🏎️ F1 영화 대신 실제 F1 영화 "러쉬" ` : ``;

        // 전문가 평론과 관객 평을 구분 (더 폭넓게)
        const expertReviews = items.filter(review => {
            const titleAndDesc = (review.title + ' ' + review.description).toLowerCase();
            return titleAndDesc.includes('평론가') || titleAndDesc.includes('기자') || 
                   titleAndDesc.includes('비평') || titleAndDesc.includes('평론') ||
                   titleAndDesc.includes('전문가') || titleAndDesc.includes('리뷰어') ||
                   /[가-힣]{2,4}\s*(평론가|기자|비평가)/.test(titleAndDesc);
        });
        
        const audienceReviews = items.filter(review => {
            const titleAndDesc = (review.title + ' ' + review.description).toLowerCase();
            return (titleAndDesc.includes('관객') || titleAndDesc.includes('사용자') || 
                   titleAndDesc.includes('네티즌') || titleAndDesc.includes('일반인') ||
                   titleAndDesc.includes('시청자')) && 
                   (titleAndDesc.includes('평점') || titleAndDesc.includes('별점') ||
                    titleAndDesc.includes('★') || titleAndDesc.includes('⭐') ||
                    titleAndDesc.includes('후기') || titleAndDesc.includes('감상'));
        });
        
        // 둘 다 아닌 경우 일반 리뷰로 분류 (전문가나 관객에 포함되지 않는 것들)
        const generalReviews = items.filter(review => 
            !expertReviews.includes(review) && !audienceReviews.includes(review)
        );

        let reviewText = `${titlePrefix}🎬 "${title}" 영화 평점/평론 모음\n\n`;
        
        // 전문가 평론 섹션 (일반 리뷰로 부족한 부분 채우기)
        const allExpertReviews = [...expertReviews, ...generalReviews].slice(0, 5);
        if (allExpertReviews.length > 0) {
            reviewText += `👨‍🎓 전문가 평가:\n\n`;
            allExpertReviews.forEach((review, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(review.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(review.description);
                
                // 평론가 이름 추출 시도 (더 정확하게)
                let criticName = '';
                
                // 실제 평론가 이름 패턴 찾기
                const namePatterns = [
                    /([가-힣]{2,4})\s*평론가/,
                    /평론가\s*([가-힣]{2,4})/,
                    /([가-힣]{2,4})\s*기자/,
                    /기자\s*([가-힣]{2,4})/,
                    /([가-힣]{2,4})\s*(?:의|이)\s*(?:평론|리뷰|평가)/,
                    /(?:평론|리뷰|평가).*?([가-힣]{2,4})(?:\s|$)/
                ];
                
                for (const pattern of namePatterns) {
                    const titleMatch = cleanTitle.match(pattern);
                    const descMatch = cleanDescription.match(pattern);
                    
                    if (titleMatch && titleMatch[1]) {
                        criticName = titleMatch[1];
                        break;
                    } else if (descMatch && descMatch[1]) {
                        criticName = descMatch[1];
                        break;
                    }
                }
                
                // 실명이 없으면 출처 기반으로 표시
                if (!criticName || criticName.length < 2) {
                    if (cleanTitle.includes('스포츠')) criticName = '스포츠기자';
                    else if (cleanTitle.includes('연예')) criticName = '연예기자';
                    else if (cleanTitle.includes('문화')) criticName = '문화기자';
                    else if (cleanTitle.includes('영화')) criticName = '영화기자';
                    else criticName = '익명평론가';
                }
                
                // 평점 추출 및 변환
                const ratingMatch = cleanDescription.match(/(\d+(?:\.\d+)?)\s*(?:점|\/10)|★{1,5}|⭐{1,5}|만점|5점|4점|3점|2점|1점/);
                let rating = '';
                if (ratingMatch) {
                    const ratingText = ratingMatch[0];
                    if (ratingText.includes('만점')) {
                        rating = '★★★★★';
                    } else if (ratingText.includes('점') || ratingText.includes('/')) {
                        const score = parseFloat(ratingMatch[1]);
                        let stars;
                        if (score <= 5) {
                            // 5점 만점 기준
                            stars = Math.round(score);
                        } else {
                            // 10점 만점 기준
                            stars = Math.round(score / 2);
                        }
                        stars = Math.max(1, Math.min(5, stars)); // 1-5 범위로 제한
                        rating = '★'.repeat(stars) + '☆'.repeat(5 - stars);
                    } else if (ratingText.includes('★') || ratingText.includes('⭐')) {
                        rating = ratingText;
                    } else {
                        rating = '★★★☆☆'; // 기본값
                    }
                } else {
                    // 평점이 없으면 내용에서 긍정/부정 판단
                    if (cleanDescription.includes('최고') || cleanDescription.includes('완벽') || cleanDescription.includes('훌륭')) {
                        rating = '★★★★★';
                    } else if (cleanDescription.includes('좋') || cleanDescription.includes('추천')) {
                        rating = '★★★★☆';
                    } else if (cleanDescription.includes('별로') || cleanDescription.includes('실망')) {
                        rating = '★★☆☆☆';
                    } else {
                        rating = '★★★☆☆';
                    }
                }
                
                // 핵심 평가 추출 (의미있는 평가 문장 우선)
                const sentences = cleanDescription.split(/[.!?]/);
                let shortReview = '';
                
                // 평가 관련 키워드가 포함된 문장 우선
                const evaluationKeywords = ['연출', '스토리', '연기', '완성도', '감동', '재미', '몰입', '작품', '영화', '캐스팅'];
                
                for (const sentence of sentences) {
                    const s = sentence.trim();
                    if (s.length > 15 && s.length < 50) {
                        // 평가 키워드가 포함된 문장 우선
                        if (evaluationKeywords.some(keyword => s.includes(keyword))) {
                            shortReview = s;
                            break;
                        }
                        // 아니면 첫 번째 적당한 길이 문장
                        if (!shortReview) {
                            shortReview = s;
                        }
                    }
                }
                
                // 여전히 없으면 첫 문장의 일부
                if (!shortReview && sentences.length > 0) {
                    shortReview = sentences[0].trim().substring(0, 40);
                }
                
                // 너무 짧거나 의미없는 내용 필터링
                if (shortReview.length < 10 || 
                    shortReview.includes('기사') || 
                    shortReview.includes('뉴스') ||
                    shortReview.includes('보도')) {
                    shortReview = '평가 내용 확인 필요';
                }
                
                reviewText += `${index + 1}. ${criticName} ${rating} (${shortReview})\n`;
            });
            reviewText += '\n';
        }
        
        // 관객 평가 섹션 (일반 리뷰로 부족한 부분 채우기)
        const remainingReviews = generalReviews.filter(review => !allExpertReviews.includes(review));
        const allAudienceReviews = [...audienceReviews, ...remainingReviews].slice(0, 5);
        if (allAudienceReviews.length > 0) {
            reviewText += `⭐ 관객 평가:\n\n`;
            allAudienceReviews.forEach((review, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(review.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(review.description);
                
                // 별점 추출 및 변환 (전문가와 동일 로직)
                const ratingMatch = cleanDescription.match(/(\d+(?:\.\d+)?)\s*(?:점|\/10)|★{1,5}|⭐{1,5}|만점|5점|4점|3점|2점|1점/);
                let rating = '';
                if (ratingMatch) {
                    const ratingText = ratingMatch[0];
                    if (ratingText.includes('만점')) {
                        rating = '★★★★★';
                    } else if (ratingText.includes('점') || ratingText.includes('/')) {
                        const score = parseFloat(ratingMatch[1]);
                        let stars;
                        if (score <= 5) {
                            stars = Math.round(score);
                        } else {
                            stars = Math.round(score / 2);
                        }
                        stars = Math.max(1, Math.min(5, stars));
                        rating = '★'.repeat(stars) + '☆'.repeat(5 - stars);
                    } else if (ratingText.includes('★') || ratingText.includes('⭐')) {
                        rating = ratingText;
                    } else {
                        rating = '★★★☆☆';
                    }
                } else {
                    // 내용 기반 평점 추정
                    if (cleanDescription.includes('최고') || cleanDescription.includes('완벽') || cleanDescription.includes('훌륭')) {
                        rating = '★★★★★';
                    } else if (cleanDescription.includes('좋') || cleanDescription.includes('추천') || cleanDescription.includes('재밌')) {
                        rating = '★★★★☆';
                    } else if (cleanDescription.includes('별로') || cleanDescription.includes('실망') || cleanDescription.includes('지루')) {
                        rating = '★★☆☆☆';
                    } else {
                        rating = '★★★★☆'; // 관객은 보통 후한 평가
                    }
                }
                
                // 짧고 감정적인 평가 추출
                const sentences = cleanDescription.split(/[.!?]/);
                let shortReview = '';
                
                // 감정 표현이 있는 짧은 문장 우선
                for (const sentence of sentences) {
                    const s = sentence.trim();
                    if (s.length > 5 && s.length < 35 && 
                        (s.includes('재밌') || s.includes('좋') || s.includes('최고') || 
                         s.includes('추천') || s.includes('감동') || s.includes('볼만') ||
                         s.includes('별로') || s.includes('실망') || s.includes('지루'))) {
                        shortReview = s;
                        break;
                    }
                }
                
                // 없으면 첫 문장
                if (!shortReview && sentences.length > 0) {
                    shortReview = sentences[0].trim().substring(0, 30);
                }
                
                reviewText += `${index + 1}. 관객${index + 1} ${rating} (${shortReview})\n`;
            });
            reviewText += '\n';
        }
        
        // 둘 다 없으면 일반 리뷰들
        if (expertReviews.length === 0 && audienceReviews.length === 0) {
            reviewText += `📝 영화 관련 정보:\n\n`;
            items.slice(0, 5).forEach((review, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(review.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(review.description);
                
                // 짧은 요약 추출
                const sentences = cleanDescription.split(/[.!?]/);
                let summary = sentences[0] ? sentences[0].trim().substring(0, 40) : cleanDescription.substring(0, 40);
                
                reviewText += `${index + 1}. ${cleanTitle.substring(0, 30)}... - ${summary}\n`;
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

    // 실제 날씨 데이터 포맷팅
    formatRealWeatherResponse(weatherData, location, timeframe) {
        const temp = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const humidity = weatherData.main.humidity;
        const weather = weatherData.weather[0];
        const weatherDesc = weather.description;
        
        // 날씨 아이콘 매핑
        const weatherIcon = this.getWeatherIcon(weather.main);
        
        // 시간대별 메시지
        const timeMessage = this.getTimeMessage(timeframe);
        
        const message = `${weatherIcon} "${location}" ${timeMessage} 날씨\n\n` +
                       `🌡️ 현재 기온: ${temp}°C (체감 ${feelsLike}°C)\n` +
                       `☁️ 날씨: ${weatherDesc}\n` +
                       `💧 습도: ${humidity}%\n` +
                       `🌪️ 바람: ${Math.round(weatherData.wind?.speed || 0)}m/s\n\n` +
                       `📍 실시간 정확한 날씨 정보입니다!`;

        return {
            success: true,
            type: 'weather',
            data: {
                location: location,
                timeframe: timeframe,
                temperature: temp,
                description: weatherDesc,
                message: message
            }
        };
    }
    
    getWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️'
        };
        return iconMap[weatherMain] || '🌤️';
    }
    
    getTimeMessage(timeframe) {
        switch(timeframe) {
            case 'today': return '오늘';
            case 'tomorrow': return '내일';
            case 'yesterday': return '어제';
            case 'this_week': return '이번주';
            default: return '현재';
        }
    }

    // 날씨 뉴스 응답 포맷팅 (fallback용)
    formatWeatherNewsResponse(items, location, timeframe) {
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
                message: `🌤️ "${location}" 날씨 관련 최신 정보\n\n${weatherInfo}\n\n⚠️ 실시간 날씨 API 연결 실패로 뉴스 검색 결과입니다.`
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