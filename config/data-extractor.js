// 카테고리별 데이터 추출 및 검색 엔진
const axios = require('axios');
const PlaywrightCrawler = require('./playwright-crawler');

class DataExtractor {
    constructor(naverConfig) {
        this.naverConfig = naverConfig;
        this.timeout = 3000;
        this.crawler = new PlaywrightCrawler();
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

        // 모든 영화는 먼저 네이버 영화 API 시도
        console.log(`🎬 영화 API 검색 시도: "${title}"`);

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
                
                // 여전히 못 찾은 경우 출처 기반 표시
                if (!criticName || criticName.length < 2) {
                    if (fullText.includes('씨네21')) criticName = '씨네21 평론가';
                    else if (fullText.includes('무비위크')) criticName = '무비위크 평론가';
                    else if (fullText.includes('스포츠한국')) criticName = '스포츠한국 기자';
                    else if (fullText.includes('연합뉴스')) criticName = '연합뉴스 기자';                    
                    else if (fullText.includes('중앙일보')) criticName = '중앙일보 기자';
                    else if (fullText.includes('조선일보')) criticName = '조선일보 기자';
                    else if (fullText.includes('동아일보')) criticName = '동아일보 기자';
                    else if (fullText.includes('한겨레')) criticName = '한겨레 기자';
                    else if (fullText.includes('경향신문')) criticName = '경향신문 기자';
                    else {
                        // 마지막으로 첫 단어에서 이름 추출 시도
                        const firstWords = cleanTitle.split(/\s+/).slice(0, 3);
                        for (const word of firstWords) {
                            if (/^[가-힣]{2,4}$/.test(word) && !['영화', '평점', '리뷰', '평가'].includes(word)) {
                                criticName = word;
                                break;
                            }
                        }
                        if (!criticName) criticName = '영화 전문가';
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
                let userName = `관람객${index + 1}`;
                const fullUserText = cleanTitle + ' ' + cleanDescription;
                
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
                    if (userName !== `관람객${index + 1}`) break;
                }
                
                // 못 찾은 경우 출처 기반 표시
                if (userName === `관람객${index + 1}`) {
                    if (fullUserText.includes('네이버영화')) userName = 'N영화 사용자';
                    else if (fullUserText.includes('왓챠')) userName = '왓챠 사용자';
                    else if (fullUserText.includes('CGV')) userName = 'CGV 사용자';
                    else if (fullUserText.includes('롯데시네마')) userName = '롯데 사용자';
                    else if (fullUserText.includes('메가박스')) userName = '메가박스 사용자';
                    else if (fullUserText.includes('네티즌')) userName = '네티즌';
                    else if (fullUserText.includes('관람객')) userName = '관람객';
                    else userName = `일반 관람객`;
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

    createErrorResponse(message) {
        return {
            success: false,
            type: 'error',
            data: { message }
        };
    }
}

module.exports = DataExtractor;