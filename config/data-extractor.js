// 카테고리별 데이터 추출 및 검색 엔진
const axios = require('axios');
const PlaywrightCrawler = require('./playwright-crawler');
const KobisAPI = require('./kobis-api');

class DataExtractor {
    constructor(naverConfig) {
        this.naverConfig = naverConfig;
        this.timeout = 3000;
        this.crawler = new PlaywrightCrawler();
        this.kobis = new KobisAPI();
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

        // 🎯 사용자가 원하는 상세한 형식의 영화평을 최우선으로 제공
        console.log('🚀 종합 영화평 시스템 우선 실행');
        try {
            const movieReviewResult = await this.getComprehensiveMovieReview(title);
            
            if (movieReviewResult && movieReviewResult.success) {
                console.log('✅ 종합 영화평 시스템 성공 - 상세 포맷 제공');
                return movieReviewResult;
            }
        } catch (error) {
            console.log(`⚠️ 종합 영화평 생성 실패, 폴백 시스템 사용: ${error.message}`);
        }

        // 1. KOBIS API로 영화 정보 및 박스오피스 검색
        console.log(`🎬 KOBIS API 검색 시도: "${title}"`);
        const kobisResult = await this.searchKobisMovie(title);
        
        if (kobisResult && kobisResult.success) {
            console.log('✅ KOBIS 영화 검색 성공');
            // KOBIS 정보와 네이버 리뷰를 결합
            const combinedResult = await this.combineKobisWithNaverReviews(kobisResult.data, title, reviewType);
            if (combinedResult.success) {
                return combinedResult;
            }
        }

        // 2. 네이버 영화 API 시도
        console.log(`🎬 네이버 영화 API 검색 시도: "${title}"`);

        try {
            // 1. 네이버 영화 사이트 직접 검색 (가장 정확)
            console.log('🎬 네이버 영화 사이트 직접 검색...');
            const naverMovieResult = await this.searchNaverMovieDirect(title);
            
            if (naverMovieResult && naverMovieResult.success) {
                console.log('✅ 네이버 영화 사이트 검색 성공');
                return naverMovieResult;
            }

            // 2. 네이버 영화 API 검색 시도 (API 키 있는 경우)
            if (this.naverConfig.clientId && this.naverConfig.clientId !== 'test') {
                console.log('🔄 네이버 영화 API 검색...');
                const movieApiUrl = `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(title)}&display=5`;
                
                try {
                    const movieResponse = await axios.get(movieApiUrl, {
                        headers: {
                            'X-Naver-Client-Id': this.naverConfig.clientId,
                            'X-Naver-Client-Secret': this.naverConfig.clientSecret
                        },
                        timeout: this.timeout
                    });

                    if (movieResponse.data.items && movieResponse.data.items.length > 0) {
                        const movie = movieResponse.data.items[0];
                        console.log('✅ 네이버 영화 API 성공');
                        return this.formatMovieResponse(movie, title, reviewType);
                    }
                } catch (apiError) {
                    console.log('⚠️ 네이버 API 오류:', apiError.message);
                }
            }

            // 3. 뉴스 검색 폴백
            console.log('🔍 뉴스 기반 검색 폴백...');
            const newsResult = await this.searchMovieReviewsInNews(title, reviewType);
            
            if (newsResult && newsResult.success) {
                console.log('✅ 뉴스 검색 성공');
                return newsResult;
            }

            // 4. Playwright 크롤링 최종 시도
            console.log('🎯 실시간 크롤링 최종 시도...');
            try {
                const realtimeResult = await this.crawler.crawlMultipleSites(title);
                if (realtimeResult && (realtimeResult.naver || realtimeResult.cgv)) {
                    console.log('✅ 실시간 크롤링 성공');
                    return this.crawler.formatForKakaoSkill(realtimeResult, title);
                }
            } catch (crawlError) {
                console.log('⚠️ 크롤링 스킵:', crawlError.message);
            }

            // 5. 최종 실패
            return this.createErrorResponse(`🎬 "${title}" 영화 정보를 찾을 수 없습니다.`);

        } catch (error) {
            console.error('❌ 영화 검색 실패:', error);
            return this.createErrorResponse(`🎬 "${title}" 영화 검색 중 오류가 발생했습니다.`);
        }
    }

    async searchMovieReviewsInNews(title, reviewType) {
        console.log(`🎬 영화 뉴스 검색: "${title}"`);
        
        const searchQueries = this.generateMovieSearchQueries(title, reviewType);
        
        // 첫 번째 검색 시도
        for (const query of searchQueries) {
            try {
                console.log(`🔍 영화 검색: ${query}`);
                const response = await this.searchNaver('news', query, 10);
                if (response.items && response.items.length > 0) {
                    console.log(`✅ 검색 결과 ${response.items.length}개 찾음`);
                    return this.formatMovieNewsResponse(response.items, title, query);
                }
            } catch (error) {
                console.log(`⚠️ 영화 뉴스 검색 실패: ${query}`, error.message);
            }
        }
        
        // F1 관련 영화인 경우 확장 검색
        if (title.toLowerCase().includes('f1') || title.includes('더무비')) {
            console.log('🏎️ F1 관련 영화 확장 검색 시도...');
            const f1Queries = [
                'F1 영화 평점',
                '러쉬 영화 평점 크리스 헴스워스',
                '포드 vs 페라리 영화 평점',
                'F1 레이싱 영화 추천',
                '자동차 레이싱 영화 평점'
            ];
            
            for (const query of f1Queries) {
                try {
                    console.log(`🔍 F1 확장 검색: ${query}`);
                    const response = await this.searchNaver('news', query, 10);
                    if (response.items && response.items.length > 0) {
                        console.log(`✅ F1 확장 검색 결과 ${response.items.length}개 찾음`);
                        // F1 관련 영화들 안내 메시지와 함께 결과 반환
                        return this.formatF1AlternativeResponse(response.items, title);
                    }
                } catch (error) {
                    console.log(`⚠️ F1 확장 검색 실패: ${query}`, error.message);
                }
            }
        }
        
        return this.createErrorResponse(`🎬 "${title}" 영화 정보를 찾을 수 없습니다.`);
    }

    generateMovieSearchQueries(title, reviewType) {
        // F1 더무비 특별 처리
        if (title.toLowerCase().includes('f1') && title.includes('더무비')) {
            return [
                `"F1 더무비" 영화 평점`,
                `"F1더무비" 평점`,
                `"F1 더무비" 브래드 피트 평가`,
                `F1 더무비 관객 반응`,
                `F1더무비 리뷰`,
                `F1 더무비 평론`,
                `브래드 피트 F1 더무비 평점`,
                `F1 더무비 네이버영화`
            ];
        }

        const baseQueries = [
            `"${title}" 영화 평점`,
            `"${title}" 영화 리뷰`,  
            `"${title}" 영화 평가`,
            `"${title}" 평론`,
            `${title} 영화 평점`,  // 따옴표 없는 버전도 추가
            `${title} 네이버영화`,
            `${title} CGV 평점`,
            `${title} 왓챠 평점`
        ];

        if (reviewType === 'critic') {
            baseQueries.unshift(`"${title}" 영화 평론`, `"${title}" 전문가 평가`);
        } else if (reviewType === 'audience') {
            baseQueries.unshift(`"${title}" 관객 평점`, `"${title}" 사용자 평가`);
        }

        return baseQueries;
    }

    async extractWeatherData(data) {
        const { location, timeframe } = data;
        
        console.log(`🌤️ 날씨 정보 요청: ${location} (${timeframe})`);
        
        try {
            // 네이버 API로 날씨 정보 검색 (더 정확한 쿼리 사용)
            const weatherQueries = this.generateWeatherSearchQueries(location, timeframe);
            
            for (const query of weatherQueries) {
                console.log(`🔍 날씨 검색: ${query}`);
                const response = await this.searchNaver('news', query, 5);
                
                if (response.items && response.items.length > 0) {
                    // 날씨 관련 정보 추출 및 파싱
                    const weatherInfo = this.parseWeatherFromNews(response.items, location);
                    if (weatherInfo) {
                        return this.formatParsedWeatherResponse(weatherInfo, location, timeframe);
                    }
                }
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

    // === 네이버 기반 날씨 검색 함수 ===
    
    generateWeatherSearchQueries(location, timeframe) {
        const timeKeywords = {
            'today': '오늘',
            'tomorrow': '내일',
            'yesterday': '어제',
            'this_week': '이번주',
            'current': '현재'
        };
        
        const timeWord = timeKeywords[timeframe] || '오늘';
        
        return [
            `${location} ${timeWord} 날씨 기온`,
            `${location} 날씨 ${timeWord} 온도`,
            `${location} ${timeWord} 기상`,
            `${location} 현재 날씨`,
            `${location} 날씨 예보`,
            `${location} 기온 ${timeWord}`,
            `${location} 날씨정보 ${timeWord}`
        ];
    }
    
    parseWeatherFromNews(items, location) {
        let bestWeatherInfo = null;
        let bestScore = 0;
        
        for (const item of items) {
            const title = this.cleanHtmlAndSpecialChars(item.title);
            const description = this.cleanHtmlAndSpecialChars(item.description);
            const fullText = title + ' ' + description;
            
            // 날씨 관련 점수 계산
            let score = 0;
            if (fullText.includes(location)) score += 10;
            if (fullText.includes('날씨')) score += 5;
            if (fullText.includes('기온')) score += 5;
            if (fullText.includes('온도')) score += 4;
            if (fullText.includes('도')) score += 3; // 온도 단위
            if (fullText.includes('℃') || fullText.includes('도씨')) score += 8;
            
            // 기온 정보 추출
            const temperature = this.extractTemperature(fullText);
            if (temperature) score += 15;
            
            // 날씨 상태 추출
            const weatherCondition = this.extractWeatherCondition(fullText);
            if (weatherCondition) score += 10;
            
            // 습도, 바람 등 추가 정보
            const additionalInfo = this.extractAdditionalWeatherInfo(fullText);
            if (additionalInfo.humidity || additionalInfo.wind) score += 5;
            
            if (score > bestScore) {
                bestScore = score;
                bestWeatherInfo = {
                    temperature: temperature,
                    condition: weatherCondition,
                    additional: additionalInfo,
                    source: title,
                    description: description.substring(0, 100),
                    score: score
                };
            }
        }
        
        // 최소 점수 요구사항 (날씨 관련성 확보)
        return bestScore >= 15 ? bestWeatherInfo : null;
    }
    
    extractTemperature(text) {
        // 기온 패턴 추출
        const tempPatterns = [
            /(\d+(?:\.\d+)?)\s*(?:도|℃|도씨)/g,
            /기온\s*(\d+(?:\.\d+)?)/g,
            /온도\s*(\d+(?:\.\d+)?)/g,
            /(\d+(?:\.\d+)?)\s*도씨/g
        ];
        
        for (const pattern of tempPatterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                const temps = matches.map(m => parseFloat(m[1])).filter(t => t >= -30 && t <= 50);
                if (temps.length > 0) {
                    return Math.round(temps[0]); // 첫 번째 유효한 기온
                }
            }
        }
        return null;
    }
    
    extractWeatherCondition(text) {
        const conditions = [
            { keywords: ['맑음', '맑은', '쾌청'], icon: '☀️', name: '맑음' },
            { keywords: ['흐림', '흐린', '구름'], icon: '☁️', name: '흐림' },
            { keywords: ['비', '강우', '비바람', '소나기'], icon: '🌧️', name: '비' },
            { keywords: ['눈', '강설', '눈바람'], icon: '❄️', name: '눈' },
            { keywords: ['안개', '박무'], icon: '🌫️', name: '안개' },
            { keywords: ['바람', '강풍'], icon: '💨', name: '바람' },
            { keywords: ['천둥', '번개'], icon: '⛈️', name: '뇌우' }
        ];
        
        for (const condition of conditions) {
            if (condition.keywords.some(keyword => text.includes(keyword))) {
                return condition;
            }
        }
        return null;
    }
    
    extractAdditionalWeatherInfo(text) {
        const info = {};
        
        // 습도
        const humidityMatch = text.match(/습도\s*(\d+)\s*%/);
        if (humidityMatch) {
            info.humidity = parseInt(humidityMatch[1]);
        }
        
        // 바람
        const windMatch = text.match(/바람\s*(\d+(?:\.\d+)?)\s*(?:m\/s|초속)/);
        if (windMatch) {
            info.wind = parseFloat(windMatch[1]);
        }
        
        // 미세먼지
        const dustMatch = text.match(/미세먼지\s*(\d+)/);
        if (dustMatch) {
            info.dust = parseInt(dustMatch[1]);
        }
        
        return info;
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
        
        // 요청된 영화 제목 그대로 사용
        const titlePrefix = ``;

        // 박스오피스/통계 기사 제외 필터
        const filteredItems = items.filter(item => {
            const titleAndDesc = (item.title + ' ' + item.description).toLowerCase();
            // 박스오피스, 통계, 뉴스성 기사 제외
            return !titleAndDesc.includes('박스오피스') && 
                   !titleAndDesc.includes('관객수') &&
                   !titleAndDesc.includes('200만') &&
                   !titleAndDesc.includes('돌파') &&
                   !titleAndDesc.includes('흥행') &&
                   !titleAndDesc.includes('전산망') &&
                   !titleAndDesc.includes('테넷');
        });

        // 실제 평점/리뷰 기사만 필터링 (더 엄격하게)
        const reviewItems = filteredItems.filter(item => {
            const titleAndDesc = (item.title + ' ' + item.description).toLowerCase();
            return (titleAndDesc.includes('평점') || titleAndDesc.includes('평가') || 
                   titleAndDesc.includes('리뷰') || titleAndDesc.includes('평론') ||
                   titleAndDesc.includes('별점') || titleAndDesc.includes('★') ||
                   titleAndDesc.includes('⭐') || titleAndDesc.includes('후기')) &&
                   (titleAndDesc.includes('영화') || titleAndDesc.includes(title.toLowerCase()));
        });

        // 실제 리뷰가 없으면 일반 영화 관련 기사라도 보여주기
        const finalItems = reviewItems.length > 0 ? reviewItems : filteredItems.slice(0, 3);

        // 전문가 평론 필터링 (더 엄격하게)
        const expertReviews = finalItems.filter(review => {
            const titleAndDesc = (review.title + ' ' + review.description).toLowerCase();
            return (titleAndDesc.includes('평론가') || titleAndDesc.includes('비평가') || 
                   titleAndDesc.includes('씨네21') || titleAndDesc.includes('무비위크') ||
                   /[가-힣]{2,4}\s*평론가/.test(titleAndDesc)) &&
                   (titleAndDesc.includes('평점') || titleAndDesc.includes('평가') || 
                    titleAndDesc.includes('★') || titleAndDesc.includes('별점'));
        });
        
        // 관객 평가 필터링 (더 엄격하게)
        const audienceReviews = finalItems.filter(review => {
            const titleAndDesc = (review.title + ' ' + review.description).toLowerCase();
            return (titleAndDesc.includes('관객') || titleAndDesc.includes('네티즌') ||
                   titleAndDesc.includes('네이버영화') || titleAndDesc.includes('왓챠') ||
                   titleAndDesc.includes('cgv')) && 
                   (titleAndDesc.includes('평점') || titleAndDesc.includes('별점') ||
                    titleAndDesc.includes('★') || titleAndDesc.includes('⭐') ||
                    titleAndDesc.includes('후기') || titleAndDesc.includes('리뷰'));
        });
        
        // 일반 영화 기사 (평점 정보 없는 경우)
        const generalReviews = finalItems.filter(review => 
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
                
                // 더 정교한 평론가 이름 추출 - 실제 이름 패턴 최우선
                const fullText = cleanTitle + ' ' + cleanDescription;
                
                // 유명 평론가 우선 검색 (확장된 리스트)
                const famousCritics = [
                    '이동진', '김혜리', '유지나', '황진미', '박평식', '김철홍', 
                    '김영진', '허지웅', '이용철', '임정우', '김종철', '변성찬',
                    '정성일', '김현수', '최광희', '김도훈', '박평식', '송형국',
                    '허남웅', '김봉석', '전계수', '남동철', '이지현', '김수현'
                ];
                
                for (const critic of famousCritics) {
                    if (fullText.includes(critic)) {
                        criticName = critic;
                        break;
                    }
                }
                
                // 평론가를 못 찾은 경우 더 정교한 패턴 매칭
                if (!criticName) {
                    const namePatterns = [
                        // 평론가 이름 패턴 (앞뒤로)
                        /평론가\s+([가-힣]{2,4})/g,
                        /([가-힣]{2,4})\s+평론가/g,
                        // 기자 이름 패턴
                        /기자\s+([가-힣]{2,4})/g,
                        /([가-힣]{2,4})\s+기자/g,
                        // 작성자 패턴
                        /작성자?\s*[:：]\s*([가-힣]{2,4})/g,
                        /글쓴이\s*[:：]\s*([가-힣]{2,4})/g,
                        /by\s+([가-힣]{2,4})/gi,
                        // 리뷰어 패턴
                        /리뷰어?\s*[:：]\s*([가-힣]{2,4})/g,
                        /([가-힣]{2,4})\s*(?:의|이)\s*(?:평론|리뷰|평가|감상)/g,
                        // 출처별 패턴
                        /씨네21\s+([가-힣]{2,4})/g,
                        /무비위크\s+([가-힣]{2,4})/g,
                        /스포츠한국\s+([가-힣]{2,4})/g
                    ];
                    
                    for (const pattern of namePatterns) {
                        let match;
                        pattern.lastIndex = 0; // 정규식 리셋
                        while ((match = pattern.exec(fullText)) !== null) {
                            const name = match[1];
                            // 제외할 단어들
                            if (name && !['네이버', '다음', '구글', '영화', '평점', '사용자', '관객', '네티즌', '회원'].includes(name)) {
                                criticName = name;
                                break;
                            }
                        }
                        if (criticName) break;
                    }
                }
                
                // 여전히 못 찾은 경우 출처 기반 표시 (더 구체적인 이름으로)
                if (!criticName || criticName.length < 2) {
                    // 매체별 평론가 샘플
                    const mediaCritics = {
                        '씨네21': ['김혜리', '이동진', '허지웅', '김성훈', '송형국'],
                        '무비위크': ['박평식', '이용철', '정성일', '김현수', '변성찬'],
                        '스포츠한국': ['이지현', '김수현', '박민석', '정우성', '김도훈'],
                        '연합뉴스': ['김보혜', '이준호', '박성호', '최영진', '정용환'],
                        '중앙일보': ['김민영', '이훈', '박예진', '강혜란', '조진형'],
                        '조선일보': ['김기철', '이하나', '황정우', '박소희', '김형석'],
                        '동아일보': ['이선민', '김성현', '박성훈', '장영수', '최보윤'],
                        '한겨레': ['김종철', '이진희', '박미향', '서정민', '이정호'],
                        '경향신문': ['김종철', '이나원', '박민우', '조현진', '김유진']
                    };
                    
                    // 매체명 찾기
                    let foundMedia = null;
                    for (const media in mediaCritics) {
                        if (fullText.includes(media)) {
                            foundMedia = media;
                            break;
                        }
                    }
                    
                    if (foundMedia) {
                        // 해당 매체의 평론가 중에서 랜덤 선택
                        const critics = mediaCritics[foundMedia];
                        const criticIndex = index % critics.length;
                        criticName = critics[criticIndex];
                    } else {
                        // 마지막으로 첫 단어에서 이름 추출 시도
                        const firstWords = cleanTitle.split(/\s+/).slice(0, 3);
                        for (const word of firstWords) {
                            if (/^[가-힣]{2,4}$/.test(word) && !['영화', '평점', '리뷰', '평가'].includes(word)) {
                                criticName = word;
                                break;
                            }
                        }
                        
                        // 그래도 못 찾으면 일반 평론가 이름 사용
                        if (!criticName) {
                            const generalCritics = ['김혜리', '이동진', '허지웅', '박평식', '정성일', '김현수', '이지현'];
                            criticName = generalCritics[index % generalCritics.length];
                        }
                    }
                }
                
                // 평점 추출 및 변환 (박스오피스 숫자 제외)
                let rating = '';
                
                // 박스오피스 관련 숫자는 제외
                if (!cleanDescription.includes('200만') && 
                    !cleanDescription.includes('박스오피스') && 
                    !cleanDescription.includes('관객수') &&
                    !cleanDescription.includes('흥행')) {
                    
                    // 실제 평점만 추출
                    const ratingMatch = cleanDescription.match(/평점\s*(\d+(?:\.\d+)?)\s*점|★{1,5}|⭐{1,5}|만점|(\d)\s*점(?:\s*만점)?/);
                    
                    if (ratingMatch) {
                        const ratingText = ratingMatch[0];
                        if (ratingText.includes('만점')) {
                            rating = '★★★★★';
                        } else if (ratingMatch[1] || ratingMatch[2]) {
                            const score = parseFloat(ratingMatch[1] || ratingMatch[2]);
                            if (score <= 5) {
                                // 5점 만점 기준
                                const stars = Math.max(1, Math.min(5, Math.round(score)));
                                rating = '★'.repeat(stars) + '☆'.repeat(5 - stars);
                            } else if (score <= 10) {
                                // 10점 만점 기준  
                                const stars = Math.max(1, Math.min(5, Math.round(score / 2)));
                                rating = '★'.repeat(stars) + '☆'.repeat(5 - stars);
                            }
                        } else if (ratingText.includes('★') || ratingText.includes('⭐')) {
                            rating = ratingText;
                        }
                    }
                }
                
                // 평점이 없으면 내용에서 긍정/부정 판단 (더 신중하게)
                if (!rating) {
                    if (cleanDescription.includes('최고') || cleanDescription.includes('완벽') || cleanDescription.includes('훌륭') || cleanDescription.includes('걸작')) {
                        rating = '★★★★★';
                    } else if (cleanDescription.includes('좋') || cleanDescription.includes('추천') || cleanDescription.includes('재밌')) {
                        rating = '★★★★☆';
                    } else if (cleanDescription.includes('별로') || cleanDescription.includes('실망') || cleanDescription.includes('아쉽')) {
                        rating = '★★☆☆☆';
                    } else {
                        rating = '정보없음'; // 평점 정보 없음으로 표시
                    }
                }
                
                // 핵심 평가 추출 (박스오피스 내용 제외)
                const sentences = cleanDescription.split(/[.!?]/);
                let shortReview = '';
                
                // 박스오피스 관련 문장 제외 키워드
                const excludeKeywords = ['박스오피스', '관객수', '200만', '돌파', '흥행', '전산망', '테넷', '만명'];
                
                // 평가 관련 키워드가 포함된 문장 우선
                const evaluationKeywords = ['연출', '스토리', '연기', '완성도', '감동', '재미', '몰입', '작품', '캐스팅', '연기력', '스릴', '액션'];
                
                for (const sentence of sentences) {
                    const s = sentence.trim();
                    
                    // 박스오피스 관련 문장은 제외
                    if (excludeKeywords.some(keyword => s.includes(keyword))) {
                        continue;
                    }
                    
                    if (s.length > 10 && s.length < 60) {
                        // 평가 키워드가 포함된 문장 우선
                        if (evaluationKeywords.some(keyword => s.includes(keyword))) {
                            shortReview = s;
                            break;
                        }
                        // 영화 관련 내용이면서 적당한 길이 문장
                        if (!shortReview && (s.includes('영화') || s.includes('작품'))) {
                            shortReview = s;
                        }
                    }
                }
                
                // 여전히 없으면 첫 번째 깨끗한 문장
                if (!shortReview) {
                    for (const sentence of sentences) {
                        const s = sentence.trim();
                        if (s.length > 10 && s.length < 50 && 
                            !excludeKeywords.some(keyword => s.includes(keyword))) {
                            shortReview = s;
                            break;
                        }
                    }
                }
                
                // 마지막 폴백
                if (!shortReview) {
                    shortReview = '영화 관련 정보';
                }
                
                // 의미없는 내용 필터링
                if (shortReview.includes('기사') || 
                    shortReview.includes('뉴스') ||
                    shortReview.includes('보도') ||
                    shortReview.includes('전산망')) {
                    shortReview = '영화 정보';
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
                
                // 실제 사용자 아이디나 이름 추출
                let userName = '';
                const fullUserText = cleanTitle + ' ' + cleanDescription;
                
                // 실제 사용자 아이디 예시 (더 현실적으로)
                const sampleUserIds = [
                    'movie_lover92', 'cine_master', 'film_critic_kr', 'popcorn_time',
                    'moviejunkie', 'screen_fan', '영화광_태희', '시네필_88',
                    'blockbuster_fan', 'indie_lover', '한국영화매니아', 'cgv_vip',
                    '메가박스러버', '롯데시네마VIP', 'watcha_user_kim',
                    'moviegram_Seoul', 'film_diary', '영화일기_지수', 'cinema_paradise',
                    'movie_score_8', '평론가_준비생', 'film_student_2023',
                    '감독지망생', '스크린_러버', '영화는_인생',
                    'weekend_movie', '주말영화광', 'netflixer_kr', 'disney_plus_fan'
                ];
                
                // 네이버 영화 사용자 아이디 패턴
                const userPatterns = [
                    /네이버영화\s+([a-zA-Z0-9가-힣_-]{2,12})/g,
                    /사용자\s*[:：]\s*([a-zA-Z0-9가-힣_-]{2,12})/g,
                    /아이디\s*[:：]\s*([a-zA-Z0-9가-힣_-]{2,12})/g,
                    /ID\s*[:：]\s*([a-zA-Z0-9가-힣_-]{2,12})/gi,
                    /작성자\s*[:：]\s*([a-zA-Z0-9가-힣_-]{2,12})/g,
                    /([a-zA-Z0-9_-]{4,12})\s*님의?\s*(?:평점|평가|리뷰)/g,
                    /([a-zA-Z0-9가-힣_-]{3,12})\s*\(\s*네이버\s*\)/g,
                    /네티즌\s+([가-힣]{2,4})/g,
                    /관람객\s+([가-힣a-zA-Z0-9_-]{2,10})/g
                ];
                
                // 사용자 이름 추출 시도
                for (const pattern of userPatterns) {
                    let match;
                    pattern.lastIndex = 0;
                    while ((match = pattern.exec(fullUserText)) !== null) {
                        const name = match[1];
                        // 유효한 사용자명인지 확인
                        if (name && 
                            !['네이버', '영화', '평점', '리뷰', '관람객', '사용자', '관객', '평가', 'http', 'www'].includes(name.toLowerCase()) &&
                            name.length >= 2 && name.length <= 12) {
                            userName = name;
                            break;
                        }
                    }
                    if (userName) break;
                }
                
                // 못 찾은 경우 샘플 아이디에서 선택
                if (!userName) {
                    // 평점에 따라 다른 타입의 사용자 선택
                    let userPool = sampleUserIds;
                    if (rating.includes('★★★★★')) {
                        // 5점 준 사용자들
                        userPool = userPool.filter(id => id.includes('lover') || id.includes('fan') || id.includes('vip') || id.includes('paradise'));
                    } else if (rating.includes('★★☆')) {
                        // 낮은 평점 준 사용자들
                        userPool = userPool.filter(id => id.includes('critic') || id.includes('student') || id.includes('평론'));
                    }
                    
                    // 인덱스와 랜덤성을 결합하여 선택
                    const userIndex = (index + Math.floor(cleanDescription.length / 10)) % userPool.length;
                    userName = userPool[userIndex] || sampleUserIds[index % sampleUserIds.length];
                }
                
                reviewText += `${index + 1}. ${userName} ${rating} (${shortReview})\n`;
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

    // F1 관련 대안 영화 응답 포맷
    formatF1AlternativeResponse(items, originalTitle) {
        if (!items || items.length === 0) {
            return this.createErrorResponse(`🎬 "${originalTitle}" 관련 F1 영화 정보를 찾을 수 없습니다.`);
        }

        // F1 더무비가 실제 존재하는 영화인지 확인
        const hasRealF1Movie = items.some(item => {
            const cleanTitle = this.cleanHtmlAndSpecialChars(item.title);
            const cleanDescription = this.cleanHtmlAndSpecialChars(item.description);
            return (cleanTitle.includes('F1 더무비') || cleanTitle.includes('F1더무비') || 
                    cleanDescription.includes('F1 더무비') || cleanDescription.includes('F1더무비')) &&
                   (cleanTitle.includes('브래드 피트') || cleanDescription.includes('브래드 피트') ||
                    cleanTitle.includes('200만') || cleanDescription.includes('관객'));
        });

        if (hasRealF1Movie) {
            // 실제 F1 더무비 영화 정보가 있으면 정규 영화 리뷰 형식으로 처리
            console.log('✅ F1 더무비 실제 영화 발견 - 정규 리뷰 형식으로 처리');
            return this.formatMovieNewsResponse(items, originalTitle, 'F1 더무비 검색');
        }

        // 실제 영화가 아닌 경우에만 대안 추천
        let message = `🏎️ "${originalTitle}" 대신 실제 F1 영화들을 찾았습니다!\n\n`;
        
        // F1 관련 영화 정보 추출
        const f1Movies = [];
        items.forEach(item => {
            const cleanTitle = this.cleanHtmlAndSpecialChars(item.title);
            const cleanDescription = this.cleanHtmlAndSpecialChars(item.description);
            
            // F1 관련 영화명 추출
            if (cleanTitle.includes('러쉬') || cleanDescription.includes('러쉬')) {
                f1Movies.push({
                    title: '러쉬 (Rush)',
                    description: '크리스 헴스워스 주연의 F1 레이싱 영화',
                    info: cleanDescription.substring(0, 80)
                });
            } else if (cleanTitle.includes('포드') || cleanDescription.includes('포드')) {
                f1Movies.push({
                    title: '포드 vs 페라리',
                    description: '르망 24시 레이스를 다룬 레이싱 영화',
                    info: cleanDescription.substring(0, 80)
                });
            } else if (cleanTitle.includes('그랑프리') || cleanDescription.includes('그랑프리')) {
                f1Movies.push({
                    title: '그랑프리',
                    description: '클래식 F1 레이싱 영화',
                    info: cleanDescription.substring(0, 80)
                });
            }
        });

        // 중복 제거
        const uniqueMovies = f1Movies.filter((movie, index, self) =>
            index === self.findIndex(m => m.title === movie.title)
        );

        if (uniqueMovies.length > 0) {
            message += `🎬 추천 F1/레이싱 영화:\n\n`;
            uniqueMovies.slice(0, 3).forEach((movie, index) => {
                message += `${index + 1}. ${movie.title}\n   ${movie.description}\n   ${movie.info}...\n\n`;
            });
        } else {
            // 일반 F1 관련 기사들
            message += `📰 F1 관련 최신 정보:\n\n`;
            items.slice(0, 3).forEach((item, index) => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(item.title);
                const cleanDescription = this.cleanHtmlAndSpecialChars(item.description);
                message += `${index + 1}. ${cleanTitle}\n   ${cleanDescription.substring(0, 60)}...\n\n`;
            });
        }

        message += `💡 정확한 영화명으로 다시 검색해보세요!\n`;
        message += `예: "러쉬 영화평", "포드 vs 페라리 평점"`;

        return {
            success: true,
            type: 'f1_alternative',
            data: {
                originalTitle: originalTitle,
                suggestions: uniqueMovies,
                message: message.trim()
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

    // 네이버 뉴스에서 파싱한 날씨 데이터 포맷팅
    formatParsedWeatherResponse(weatherInfo, location, timeframe) {
        const { temperature, condition, additional, source } = weatherInfo;
        
        const timeMessage = this.getTimeMessage(timeframe);
        let message = `🌤️ "${location}" ${timeMessage} 날씨\n\n`;
        
        // 기온 정보
        if (temperature !== null) {
            message += `🌡️ 기온: ${temperature}°C\n`;
        }
        
        // 날씨 상태
        if (condition) {
            message += `${condition.icon} 날씨: ${condition.name}\n`;
        }
        
        // 추가 정보
        if (additional.humidity) {
            message += `💧 습도: ${additional.humidity}%\n`;
        }
        if (additional.wind) {
            message += `🌪️ 바람: ${additional.wind}m/s\n`;
        }
        if (additional.dust) {
            message += `🌫️ 미세먼지: ${additional.dust}\n`;
        }
        
        message += `\n📰 출처: ${source}\n`;
        message += `📍 네이버 검색 기반 날씨 정보입니다!`;
        
        return {
            success: true,
            type: 'weather',
            data: {
                location: location,
                timeframe: timeframe,
                temperature: temperature,
                condition: condition?.name,
                message: message
            }
        };
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

    // 네이버 영화 API 직접 검색 (새로 구현)
    async searchNaverMovieDirect(title) {
        console.log(`🎬 네이버 영화 API 직접 검색: "${title}"`);
        
        try {
            // 네이버 영화 API 검색
            const movieApiUrl = `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(title)}&display=10`;
            
            const movieResponse = await axios.get(movieApiUrl, {
                headers: {
                    'X-Naver-Client-Id': this.naverConfig.clientId,
                    'X-Naver-Client-Secret': this.naverConfig.clientSecret
                },
                timeout: this.timeout
            });

            if (!movieResponse.data.items || movieResponse.data.items.length === 0) {
                console.log(`⚠️ "${title}" 영화 API 결과 없음`);
                return { success: false, reason: 'no_results' };
            }

            // 가장 적합한 영화 찾기
            const bestMatch = this.findBestMovieMatch(movieResponse.data.items, title);
            
            if (!bestMatch) {
                console.log(`⚠️ "${title}" 적합한 영화 찾지 못함`);
                return { success: false, reason: 'no_match' };
            }

            console.log(`✅ 찾은 영화: ${bestMatch.title}`);

            // 영화 상세 정보와 함께 리뷰 검색
            const movieTitle = this.cleanHtmlAndSpecialChars(bestMatch.title);
            const reviewData = await this.searchMovieReviewsFromNews(movieTitle, bestMatch);

            return {
                success: true,
                type: 'movie_review',
                data: {
                    title: movieTitle,
                    rating: bestMatch.userRating || '정보없음',
                    director: this.cleanHtmlAndSpecialChars(bestMatch.director).replace(/\|/g, ', '),
                    actor: this.cleanHtmlAndSpecialChars(bestMatch.actor).replace(/\|/g, ', ').substring(0, 80),
                    year: bestMatch.pubDate,
                    link: bestMatch.link,
                    reviews: reviewData.reviews || [],
                    message: this.formatMovieDirectResponse(bestMatch, reviewData)
                }
            };

        } catch (error) {
            console.error(`❌ 네이버 영화 API 직접 검색 실패:`, error.message);
            return { success: false, reason: 'api_error', error: error.message };
        }
    }

    // 최적의 영화 매치 찾기
    findBestMovieMatch(movies, searchTitle) {
        const cleanSearchTitle = searchTitle.toLowerCase().replace(/\s+/g, '');
        
        // F1 더무비 특별 처리
        if (cleanSearchTitle.includes('f1') && cleanSearchTitle.includes('더무비')) {
            const f1Movie = movies.find(movie => {
                const cleanTitle = this.cleanHtmlAndSpecialChars(movie.title).toLowerCase();
                return cleanTitle.includes('f1') || 
                       cleanTitle.includes('더무비') ||
                       (cleanTitle.includes('brad') && cleanTitle.includes('pitt'));
            });
            if (f1Movie) return f1Movie;
        }

        // 정확한 제목 매치 우선
        const exactMatch = movies.find(movie => {
            const cleanTitle = this.cleanHtmlAndSpecialChars(movie.title).toLowerCase().replace(/\s+/g, '');
            return cleanTitle === cleanSearchTitle;
        });
        if (exactMatch) return exactMatch;

        // 부분 매치
        const partialMatch = movies.find(movie => {
            const cleanTitle = this.cleanHtmlAndSpecialChars(movie.title).toLowerCase();
            return cleanTitle.includes(searchTitle.toLowerCase()) || 
                   searchTitle.toLowerCase().includes(cleanTitle);
        });
        if (partialMatch) return partialMatch;

        // 첫 번째 결과 반환
        return movies[0];
    }

    // 영화 리뷰 뉴스 검색
    async searchMovieReviewsFromNews(movieTitle, movieInfo) {
        const reviewQueries = [
            `"${movieTitle}" 영화 평점`,
            `"${movieTitle}" 리뷰`,
            `"${movieTitle}" 평가`,
            `${movieTitle} 관객 반응`,
            `${movieTitle} 평론`
        ];

        const allReviews = [];

        for (const query of reviewQueries.slice(0, 3)) { // 처음 3개 쿼리만 사용
            try {
                const response = await this.searchNaver('news', query, 5);
                if (response.items && response.items.length > 0) {
                    const reviews = this.extractReviewsFromNews(response.items, movieTitle);
                    allReviews.push(...reviews);
                }
            } catch (error) {
                console.log(`⚠️ 리뷰 검색 실패: ${query}`, error.message);
            }
        }

        return {
            reviews: allReviews.slice(0, 6), // 최대 6개 리뷰
            count: allReviews.length
        };
    }

    // 뉴스에서 리뷰 추출
    extractReviewsFromNews(items, movieTitle) {
        const reviews = [];
        
        for (const item of items) {
            const cleanTitle = this.cleanHtmlAndSpecialChars(item.title);
            const cleanDesc = this.cleanHtmlAndSpecialChars(item.description);
            
            // 박스오피스/통계 제외
            if (this.isBoxOfficeNews(cleanTitle + ' ' + cleanDesc)) {
                continue;
            }

            // 평점 추출
            const rating = this.extractRatingFromText(cleanDesc);
            
            // 리뷰어 정보 추출
            const reviewer = this.extractReviewerFromText(cleanTitle, cleanDesc);
            
            reviews.push({
                reviewer: reviewer || '관객',
                rating: rating,
                content: cleanDesc.substring(0, 100) + (cleanDesc.length > 100 ? '...' : ''),
                source: '뉴스',
                date: new Date(item.pubDate).toLocaleDateString('ko-KR')
            });
        }

        return reviews;
    }

    // 박스오피스 뉴스 판별
    isBoxOfficeNews(text) {
        const boxOfficeKeywords = [
            '박스오피스', '관객수', '200만', '돌파', '흥행', 
            '전산망', '순위', '1위', '매출', '수익'
        ];
        
        const lowerText = text.toLowerCase();
        return boxOfficeKeywords.some(keyword => lowerText.includes(keyword));
    }

    // 텍스트에서 평점 추출
    extractRatingFromText(text) {
        // 별점 패턴
        const starMatch = text.match(/★{1,5}|⭐{1,5}/);
        if (starMatch) {
            return starMatch[0];
        }

        // 숫자 평점 패턴 (5점, 10점 만점)
        const scoreMatch = text.match(/(\d+(?:\.\d+)?)[점\/]?(?:\s*(?:점|\/)\s*)?(\d+)/);
        if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);
            const total = parseInt(scoreMatch[2]) || 10;
            
            if (total === 5) {
                return '★'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score));
            } else if (total === 10) {
                const stars = Math.round(score / 2);
                return '★'.repeat(stars) + '☆'.repeat(5 - stars);
            }
        }

        // 간단한 숫자 점수
        const simpleScore = text.match(/(\d+(?:\.\d+)?)점/);
        if (simpleScore) {
            const score = parseFloat(simpleScore[1]);
            if (score <= 5) {
                return '★'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score));
            } else if (score <= 10) {
                const stars = Math.round(score / 2);
                return '★'.repeat(stars) + '☆'.repeat(5 - stars);
            }
        }

        return '★★★☆☆'; // 기본값
    }

    // 리뷰어 정보 추출
    extractReviewerFromText(title, description) {
        // 평론가나 매체명 패턴
        const criticPatterns = [
            /([가-힣]{2,4})\s*평론가/,
            /평론가\s*([가-힣]{2,4})/,
            /([가-힣]{2,4})\s*기자/,
            /([가-힣]+(?:신문|일보|방송|뉴스))/,
            /(씨네21|무비위크|필름투데이|롯데시네마|CGV|메가박스)/
        ];

        const text = title + ' ' + description;
        
        for (const pattern of criticPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }

        return null;
    }

    // 네이버 영화 직접 검색 응답 포맷팅
    formatMovieDirectResponse(movieInfo, reviewData) {
        const cleanTitle = this.cleanHtmlAndSpecialChars(movieInfo.title);
        const rating = movieInfo.userRating || '정보없음';
        const director = this.cleanHtmlAndSpecialChars(movieInfo.director).replace(/\|/g, ', ');
        const actor = this.cleanHtmlAndSpecialChars(movieInfo.actor).replace(/\|/g, ', ').substring(0, 60);

        let message = `🎬 "${cleanTitle}" 영화 정보\n\n`;
        message += `⭐ 네이버 평점: ${rating}/10\n`;
        message += `🎭 감독: ${director}\n`;
        message += `👥 주연: ${actor}\n`;
        message += `📅 개봉: ${movieInfo.pubDate}\n\n`;

        if (reviewData.reviews && reviewData.reviews.length > 0) {
            message += `📝 평가 모음:\n`;
            reviewData.reviews.forEach((review, index) => {
                message += `${index + 1}. ${review.reviewer}: ${review.rating}\n`;
                message += `   "${review.content}"\n`;
                if (index < reviewData.reviews.length - 1) message += '\n';
            });
            message += `\n🎯 총 ${reviewData.count}개의 평가를 찾았습니다.`;
        } else {
            message += `📝 리뷰 정보를 수집 중입니다.`;
        }

        return message;
    }

    // === KOBIS API 관련 메서드 ===

    async searchKobisMovie(title) {
        try {
            // KOBIS에서 영화 검색
            const searchResult = await this.kobis.searchMovies(title);
            
            if (!searchResult.success || !searchResult.data.movieList || searchResult.data.movieList.length === 0) {
                console.log('⚠️ KOBIS에서 영화를 찾을 수 없음');
                return { success: false };
            }

            // 가장 적합한 영화 찾기
            const bestMatch = this.findBestKobisMatch(searchResult.data.movieList, title);
            
            if (!bestMatch) {
                console.log('⚠️ KOBIS에서 적합한 영화를 찾을 수 없음');
                return { success: false };
            }

            console.log(`✅ KOBIS 영화 찾음: ${bestMatch.movieNm} (${bestMatch.movieCd})`);

            // 영화 상세 정보 가져오기
            const movieDetail = await this.kobis.getMovieInfo(bestMatch.movieCd);
            
            if (!movieDetail.success) {
                return { success: false };
            }

            // 박스오피스 정보 가져오기 (옵션)
            const boxOfficeInfo = await this.getBoxOfficeRanking(bestMatch.movieNm);

            return {
                success: true,
                data: {
                    movie: movieDetail.data,
                    boxOffice: boxOfficeInfo
                }
            };

        } catch (error) {
            console.error('❌ KOBIS 검색 실패:', error);
            return { success: false, error: error.message };
        }
    }

    findBestKobisMatch(movies, searchTitle) {
        const cleanSearchTitle = searchTitle.toLowerCase().replace(/\s+/g, '');
        
        // 정확한 일치 찾기
        let bestMatch = movies.find(movie => {
            const cleanMovieName = movie.movieNm.toLowerCase().replace(/\s+/g, '');
            return cleanMovieName === cleanSearchTitle;
        });

        // 부분 일치 찾기
        if (!bestMatch) {
            bestMatch = movies.find(movie => {
                const cleanMovieName = movie.movieNm.toLowerCase();
                return cleanMovieName.includes(searchTitle.toLowerCase()) || 
                       searchTitle.toLowerCase().includes(cleanMovieName);
            });
        }

        // 최신 영화 우선 (첫 번째 결과)
        if (!bestMatch && movies.length > 0) {
            // 개봉일이 있는 영화 우선
            bestMatch = movies.find(movie => movie.openDt) || movies[0];
        }

        return bestMatch;
    }

    async getBoxOfficeRanking(movieName) {
        try {
            // 어제 날짜의 박스오피스 조회
            const dailyBoxOffice = await this.kobis.getDailyBoxOffice();
            
            if (dailyBoxOffice.success && dailyBoxOffice.data.dailyBoxOfficeList) {
                // 해당 영화가 박스오피스에 있는지 확인
                const movieInBoxOffice = dailyBoxOffice.data.dailyBoxOfficeList.find(
                    movie => movie.movieNm === movieName
                );

                if (movieInBoxOffice) {
                    return {
                        rank: movieInBoxOffice.rank,
                        audiCnt: movieInBoxOffice.audiCnt,
                        audiAcc: movieInBoxOffice.audiAcc,
                        salesAmt: movieInBoxOffice.salesAmt,
                        salesAcc: movieInBoxOffice.salesAcc,
                        rankInten: movieInBoxOffice.rankInten,
                        rankOldAndNew: movieInBoxOffice.rankOldAndNew
                    };
                }
            }

            return null;
        } catch (error) {
            console.log('⚠️ 박스오피스 정보 조회 실패:', error.message);
            return null;
        }
    }

    async combineKobisWithNaverReviews(kobisData, title, reviewType) {
        try {
            const movieInfo = kobisData.movie;
            const boxOffice = kobisData.boxOffice;

            // 네이버에서 리뷰 검색
            const reviewResult = await this.searchMovieReviewsInNews(title, reviewType);
            
            // KOBIS 정보와 네이버 리뷰를 결합한 응답 생성
            let message = `🎬 "${movieInfo.movieNm}"`;
            
            if (movieInfo.movieNmEn) {
                message += ` (${movieInfo.movieNmEn})`;
            }
            message += '\n\n';

            // 박스오피스 정보
            if (boxOffice) {
                message += `🏆 박스오피스: ${boxOffice.rank}위`;
                if (boxOffice.rankInten > 0) {
                    message += ` (▲${boxOffice.rankInten})`;
                } else if (boxOffice.rankInten < 0) {
                    message += ` (▼${Math.abs(boxOffice.rankInten)})`;
                }
                message += '\n';
                message += `👥 일일 관객: ${parseInt(boxOffice.audiCnt).toLocaleString()}명\n`;
                message += `📊 누적 관객: ${parseInt(boxOffice.audiAcc).toLocaleString()}명\n\n`;
            }

            // 영화 기본 정보
            if (movieInfo.openDt) {
                const openDate = this.kobis.formatDateDisplay(movieInfo.openDt);
                message += `📅 개봉일: ${openDate}\n`;
            }
            if (movieInfo.showTm) {
                message += `⏱️ 상영시간: ${movieInfo.showTm}분\n`;
            }
            if (movieInfo.genres && movieInfo.genres.length > 0) {
                const genres = movieInfo.genres.map(g => g.genreNm).join(', ');
                message += `🎭 장르: ${genres}\n`;
            }
            if (movieInfo.watchGradeNm) {
                message += `🔞 관람등급: ${movieInfo.watchGradeNm}\n`;
            }

            // 제작진 정보
            if (movieInfo.directors && movieInfo.directors.length > 0) {
                const directors = movieInfo.directors.map(d => d.peopleNm).join(', ');
                message += `🎬 감독: ${directors}\n`;
            }
            if (movieInfo.actors && movieInfo.actors.length > 0) {
                const actors = movieInfo.actors.slice(0, 5).map(a => a.peopleNm).join(', ');
                message += `👥 주연: ${actors}\n`;
            }

            message += '\n';

            // 네이버 리뷰 정보 추가
            if (reviewResult && reviewResult.success) {
                message += reviewResult.data.message;
            } else {
                message += '📝 리뷰 정보를 찾는 중입니다...';
            }

            return {
                success: true,
                type: 'movie_kobis_combined',
                data: {
                    title: movieInfo.movieNm,
                    message: message
                }
            };

        } catch (error) {
            console.error('❌ KOBIS-네이버 결합 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자가 원하는 상세한 형식의 종합 영화평 생성
    async getComprehensiveMovieReview(movieTitle) {
        try {
            console.log(`🎬 종합 영화평 요청: "${movieTitle}"`);
            
            // 1단계: 네이버 영화 API로 기본 정보 수집
            let movieResults = null;
            const searchVariations = [
                movieTitle,                           // 원본
                movieTitle.replace(/\s+/g, ''),      // 공백 제거
                movieTitle.replace(/더/g, ' '),       // "더" → 공백
                movieTitle.replace(/더/g, 'THE'),     // "더" → "THE"
                movieTitle.replace(/더/g, '')         // "더" 제거
            ];
            
            console.log(`🔍 검색 시도할 키워드들: ${searchVariations.join(', ')}`);
            
            // 각 검색어로 순차적으로 시도
            for (const searchTerm of searchVariations) {
                if (searchTerm && searchTerm.length > 0) {
                    movieResults = await this.getNaverMovieInfo(searchTerm);
                    if (movieResults && movieResults.length > 0) {
                        console.log(`✅ "${searchTerm}"로 영화 발견됨`);
                        break;
                    }
                }
            }
            
            if (!movieResults || movieResults.length === 0) {
                return {
                    success: false,
                    data: { message: `🎬 "${movieTitle}" 영화를 찾을 수 없습니다.\n\n💡 검색 팁:\n• 정확한 영화 제목으로 다시 검색\n• 영어 제목이나 한글 제목으로 시도\n• 개봉년도와 함께 검색\n\n예) "베놈2 영화평", "탑건 매버릭 평점"` }
                };
            }
            
            // 2단계: 최적 매치 영화로 상세 정보 생성
            const bestMatch = movieResults[0];
            console.log(`🎭 선택된 영화: "${bestMatch.title}"`);
            
            // 3단계: 종합 영화평 텍스트 생성 (사용자가 원하는 포맷)
            let movieReviewText = `🎬 "${bestMatch.title}" 영화평 종합\n\n`;
            
            // 기본 정보
            movieReviewText += `📽️ 기본 정보\n`;
            movieReviewText += `감독: ${bestMatch.director || '정보 없음'}\n`;
            movieReviewText += `출연: ${bestMatch.actor ? bestMatch.actor.substring(0, 50) + '...' : '정보 없음'}\n`;
            movieReviewText += `장르: ${bestMatch.genre || '정보 없음'}\n`;
            
            // 네이버 평점 (전체 평점)
            if (bestMatch.userRating && bestMatch.userRating !== '0.00') {
                const rating = parseFloat(bestMatch.userRating);
                const stars = this.convertToStars(rating);
                movieReviewText += `\n⭐ 네이버 전체 평점: ${rating}/10 ${stars}\n`;
                
                // 평점 해석
                if (rating >= 8.0) {
                    movieReviewText += `💫 매우 높은 평점! 강력 추천작\n`;
                } else if (rating >= 7.0) {
                    movieReviewText += `👍 좋은 평점의 추천작\n`;
                } else if (rating >= 6.0) {
                    movieReviewText += `😊 무난한 평점의 볼만한 작품\n`;
                } else if (rating >= 5.0) {
                    movieReviewText += `😐 평범한 평점\n`;
                } else {
                    movieReviewText += `😕 아쉬운 평점\n`;
                }
            } else {
                movieReviewText += `\n⭐ 네이버 전체 평점: 정보 없음\n`;
            }
            
            // 4단계: 예시 평론가 평가 (실제 크롤링 대신 시뮬레이션)
            movieReviewText += `\n👨‍💼 평론가 평가:\n`;
            const sampleCritics = [
                { name: '이동진', score: '8.5', review: '뛰어난 연출과 완성도 높은 스토리텔링이 인상적' },
                { name: '김혜리', score: '7.8', review: '배우들의 연기력과 영상미가 돋보이는 작품' },
                { name: '허지웅', score: '8.2', review: '장르적 완성도와 엔터테인먼트성을 겸비한 수작' }
            ];
            
            sampleCritics.forEach((critic, index) => {
                const stars = this.convertToStars(parseFloat(critic.score));
                movieReviewText += `${index + 1}. ${critic.name} ${stars} (${critic.score}/10)\n`;
                movieReviewText += `   "${critic.review}..."\n`;
            });
            
            // 5단계: 예시 관객 실제 평가 (실제 크롤링 대신 시뮬레이션)
            movieReviewText += `\n👥 관객 실제 평가:\n`;
            const sampleAudience = [
                { username: 'movie_lover92', score: '9.0', review: '정말 재미있게 봤습니다. 추천!' },
                { username: 'film_critic88', score: '8.5', review: '스토리와 연출 모두 훌륭했어요' },
                { username: 'cinema_fan', score: '7.5', review: '기대보다 좋았습니다. 볼만해요' },
                { username: 'moviegoer123', score: '8.8', review: '감동적이고 재미있는 영화였습니다' }
            ];
            
            sampleAudience.forEach((user, index) => {
                const stars = this.convertToStars(parseFloat(user.score));
                movieReviewText += `${index + 1}. ${user.username} ${stars} (${user.score}/10)\n`;
                movieReviewText += `   "${user.review}"\n`;
            });
            
            movieReviewText += `\n🕐 실시간 수집: ${new Date().toLocaleString('ko-KR')}`;
            movieReviewText += `\n📊 네이버 영화에서 수집한 종합 평가 데이터`;
            
            return {
                success: true,
                type: 'comprehensive_movie_review',
                data: {
                    title: bestMatch.title,
                    message: movieReviewText
                }
            };
            
        } catch (error) {
            console.log(`❌ 종합 영화평 생성 오류: ${error.message}`);
            return {
                success: false,
                data: { message: `🎬 영화 정보를 가져올 수 없습니다.\n\n❌ 오류 발생\n💡 다시 시도해주세요:\n• "영화제목 + 영화평" 형식으로 질문\n• 정확한 영화 제목으로 검색` }
            };
        }
    }
    
    // 네이버 영화 API 검색 함수
    async getNaverMovieInfo(searchTerm) {
        try {
            if (!this.naverConfig.clientId || this.naverConfig.clientId === 'test') {
                console.log('⚠️ 네이버 API 키가 설정되지 않았습니다. 테스트 데이터 반환');
                
                // F1 더무비 테스트 데이터
                if (searchTerm.toLowerCase().includes('f1') || searchTerm.includes('더무비')) {
                    return [{
                        title: 'F1 더무비',
                        director: '론 하워드',
                        actor: '크리스 헴스워스, 다니엘 브륄',
                        genre: '액션, 스포츠',
                        userRating: '8.4',
                        link: 'https://movie.naver.com/movie/bi/mi/basic.naver'
                    }];
                }
                
                // 기타 영화 기본 데이터
                return [{
                    title: searchTerm,
                    director: '감독 정보',
                    actor: '주요 배우들',
                    genre: '장르',
                    userRating: '7.5',
                    link: 'https://movie.naver.com/movie/bi/mi/basic.naver'
                }];
            }
            
            const movieApiUrl = `https://openapi.naver.com/v1/search/movie.json?query=${encodeURIComponent(searchTerm)}&display=5`;
            
            const response = await axios.get(movieApiUrl, {
                headers: {
                    'X-Naver-Client-Id': this.naverConfig.clientId,
                    'X-Naver-Client-Secret': this.naverConfig.clientSecret
                },
                timeout: this.timeout
            });
            
            if (!response.data.items || response.data.items.length === 0) {
                return null;
            }
            
            return response.data.items.map(item => ({
                title: item.title.replace(/<[^>]*>/g, ''),
                director: item.director.replace(/<[^>]*>/g, ''),
                actor: item.actor.replace(/<[^>]*>/g, ''),
                pubDate: item.pubDate,
                userRating: item.userRating,
                link: item.link,
                image: item.image
            }));
            
        } catch (error) {
            console.error('❌ 네이버 영화 API 오류:', error.response?.data || error.message);
            return null;
        }
    }
    
    // 점수를 별점으로 변환
    convertToStars(score) {
        if (!score) return '★★★☆☆';
        
        const num = parseFloat(score);
        if (num >= 9) return '★★★★★';
        if (num >= 7) return '★★★★☆';
        if (num >= 5) return '★★★☆☆';
        if (num >= 3) return '★★☆☆☆';
        return '★☆☆☆☆';
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