// 메시지 분류 및 데이터 추출 시스템
// 하드코딩된 키워드 대신 체계적인 분류 알고리즘 사용

class MessageClassifier {
    constructor() {
        // 카테고리별 의도 분석 패턴
        this.categories = {
            MOVIE_REVIEW: {
                priority: 1,
                patterns: {
                    content: /영화|드라마|시리즈|애니|다큐|무비|movie|film/i,
                    action: /평점|평가|리뷰|후기|별점|재밌|볼만|어때|추천|관람평/,
                    context: /f1|더무비|러쉬|액션|스릴러|로맨스|공포|코미디/i,
                    movieKeywords: /관람평|영화평|평좀/,
                    // 명시적인 영화 질문만 (일반적인 "말해줘"는 제외)
                    explicit: /영화.*평점|영화.*평가|영화.*리뷰|영화.*어때|영화.*재밌|영화.*볼만|영화.*추천/
                },
                extractors: {
                    title: this.extractMovieTitle.bind(this),
                    reviewType: this.extractReviewType.bind(this)
                }
            },
            
            WEATHER: {
                priority: 8, // 우선순위를 대폭 낮춤 (일상 대화와 혼동 방지)
                patterns: {
                    content: /날씨|기온|온도|기상|비|눈|바람|습도|미세먼지|맑음|흐림|구름|폭염|태풍|장마/,
                    action: /알려줘|어때|어떻게|확인|궁금/,
                    weatherSpecific: /날씨.*알려줘|기온.*어때|온도.*궁금|날씨.*어때|오늘.*날씨|내일.*날씨/,
                    location: /([가-힣]{2,}(?:시|구|군|동|역|읍|면))/,
                    time: /내일|모레|이번주|다음주|주말/ // "오늘" 제거하여 일상 대화와 구분
                },
                extractors: {
                    location: this.extractLocation.bind(this),
                    timeframe: this.extractTimeframe.bind(this)
                }
            },
            
            RESTAURANT: {
                priority: 3,
                patterns: {
                    content: /맛집|음식점|식당|카페|레스토랑|먹을곳|밥집/,
                    food: /한식|중식|일식|양식|분식|치킨|피자|파스타|커피|디저트/,
                    location: /([가-힣]{2,}(?:시|구|군|동|역|읍|면))/,
                    action: /추천|찾아|어디|맛있는|유명한/
                },
                extractors: {
                    location: this.extractLocation.bind(this),
                    foodType: this.extractFoodType.bind(this),
                    preference: this.extractPreference.bind(this)
                }
            },
            
            SHOPPING: {
                priority: 4,
                patterns: {
                    content: /상품|제품|쇼핑|구매|판매/,
                    product: /노트북|휴대폰|스마트폰|아이폰|갤럭시|화장품|의류|신발/,
                    action: /가격|할인|세일|최저가|어디서|싸게|저렴/,
                    comparison: /vs|비교|차이|어떤게|뭐가/
                },
                extractors: {
                    productName: this.extractProductName.bind(this),
                    priceRange: this.extractPriceRange.bind(this),
                    comparison: this.extractComparison.bind(this)
                }
            },
            
            NEWS: {
                priority: 10, // 우선순위를 대폭 낮춤 (일반 질문과 구분)
                patterns: {
                    content: /뉴스.*검색|뉴스.*찾아|뉴스.*보여줘|최신.*뉴스|속보.*검색|기사.*검색/,
                    action: /검색|찾아|보여줘/,
                    time: /어제|이번주|최근|방금/, // "오늘" 제거 (일반 질문과 중복)
                    topic: /([가-힣]+(?:사건|사고|뉴스|이슈))/,
                    explicit: /뉴스.*알려줘|최신.*뉴스.*알려줘/ // 명시적인 뉴스 요청만
                },
                extractors: {
                    topic: this.extractNewsTopic.bind(this),
                    timeframe: this.extractTimeframe.bind(this)
                }
            },
            
            YOUTUBE_SUMMARY: {
                priority: 1,
                patterns: {
                    content: /youtu\.be|youtube\.com|유튜브/,
                    action: /요약|정리|내용|설명|어떤|뭐라고|무슨/
                },
                extractors: {
                    url: this.extractYouTubeUrl.bind(this),
                    summaryType: this.extractSummaryType.bind(this)
                }
            },
            
            FACT_CHECK: {
                priority: 2,
                patterns: {
                    content: /사실|진실|확인|맞는지|사실인지|진짜|가짜/,
                    events: /사망|죽음|결혼|이혼|사고|화재|발표|출시/
                },
                extractors: {
                    claim: this.extractClaim.bind(this),
                    source: this.extractSource.bind(this)
                }
            },
            
            CASUAL_CONVERSATION: {
                priority: 2, // 높은 우선순위 (일반 대화 우선)
                patterns: {
                    greeting: /안녕|좋은아침|좋은밤|잘자|굿모닝|굿나잇/,
                    daily: /오늘.*뭐.*할|뭐.*하고.*있|심심해|재미없어|지루해|할게없어/,
                    emotion: /행복해|기뻐|슬퍼|우울해|화나|짜증나|피곤해|졸려/,
                    casual: /뭐해|뭐하고|어디가|어디있어|집에있어|회사에있어/,
                    simple: /^(네|응|아니|그래|맞아|ㅇㅇ|ㄱㅅ|ㄳ|감사|고마워)$/,
                    chat: /대화하자|얘기하자|심심하니|재밌는.*있어|추천.*해줘/,
                    // 음식 관련 일상 대화 추가 (가장 높은 가중치)
                    food_casual: /뭐.*먹지|먹을.*뭐|저녁.*뭐|아침.*뭐|점심.*뭐|간식.*뭐|뭐.*마실|마실.*뭐|배고파|출출해|요리.*뭐|음식.*뭐/,
                    food_suggestions: /음식.*추천|먹을.*것.*추천|뭐.*먹을까|뭐.*드실래|식사.*뭐|메뉴.*추천/,
                    // 일반적인 질문들 추가 (뉴스/데이터 검색이 아닌)
                    general: /오늘.*날짜|몇월.*몇일|무슨.*요일|지금.*시간|현재.*시간|몇시|언제|어떤.*날/,
                    time: /시간.*알려줘|날짜.*알려줘|요일.*알려줘|지금.*몇시/,
                    info: /^(오늘|지금|현재).*알려줘$/ // 단순한 정보 요청
                },
                extractors: {
                    conversationType: this.extractConversationType.bind(this),
                    topic: this.extractCasualTopic.bind(this)
                }
            },

            GENERAL_QUESTION: {
                priority: 9, // 우선순위 더 낮춤 (일상 대화 이후)
                patterns: {
                    question: /\?|어떻게|어떤|어디|언제|왜|누구|뭐|몇|얼마/,
                    request: /알려줘|검색|찾아|추천|비교|말해줘|설명해/,
                    exclude: /^(안녕|뭐해|뭐하고|오늘.*뭐.*할)/ // 일상 대화 제외
                },
                extractors: {
                    topic: this.extractGeneralTopic.bind(this),
                    questionType: this.extractQuestionType.bind(this)
                }
            }
        };
    }

    // 메인 분류 함수
    classifyMessage(message) {
        console.log('[SEARCH] 메시지 분류 시작:', message);
        
        const results = [];
        
        // 각 카테고리별로 점수 계산
        for (const [categoryName, category] of Object.entries(this.categories)) {
            const score = this.calculateCategoryScore(message, category);
            if (score > 0) {
                results.push({
                    category: categoryName,
                    score: score,
                    priority: category.priority,
                    data: this.extractCategoryData(message, category)
                });
            }
        }
        
        // 점수와 우선순위로 정렬 (점수 높음 → 우선순위 낮음)
        results.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return a.priority - b.priority;
        });
        
        console.log('[INFO] 분류 결과:', results);
        
        return results.length > 0 ? results[0] : {
            category: 'UNKNOWN',
            score: 0,
            priority: 999,
            data: { originalMessage: message }
        };
    }

    // 카테고리 점수 계산
    calculateCategoryScore(message, category) {
        let score = 0;
        const patterns = category.patterns;
        
        // 각 패턴별로 가중치 적용
        for (const [patternType, pattern] of Object.entries(patterns)) {
            if (pattern.test && pattern.test(message)) {
                switch (patternType) {
                    case 'content': score += 3; break;
                    case 'action': score += 2; break;
                    case 'movieKeywords': score += 4; break; // 영화 키워드 높은 가중치
                    case 'weatherSpecific': score += 4; break; // 날씨 특정 키워드 높은 가중치
                    case 'daily': score += 5; break; // 일상 대화 키워드 최고 가중치
                    case 'food_casual': score += 6; break; // 음식 관련 일상 대화 최고 가중치
                    case 'food_suggestions': score += 5; break; // 음식 추천 요청 높은 가중치
                    case 'greeting': score += 4; break; // 인사 키워드 높은 가중치
                    case 'casual': score += 4; break; // 캐주얼 대화 키워드 높은 가중치
                    case 'emotion': score += 3; break; // 감정 표현 키워드
                    case 'simple': score += 3; break; // 간단한 응답 키워드
                    case 'chat': score += 3; break; // 대화 요청 키워드
                    case 'context': score += 1; break;
                    case 'location': score += 1; break;
                    case 'time': score += 1; break;
                    default: score += 1; break;
                }
            }
        }
        
        return score;
    }

    // 카테고리별 데이터 추출
    extractCategoryData(message, category) {
        const data = {};
        
        if (category.extractors) {
            for (const [key, extractor] of Object.entries(category.extractors)) {
                try {
                    data[key] = extractor(message);
                } catch (error) {
                    console.error(`[ERROR] 데이터 추출 실패 (${key}):`, error);
                    data[key] = null;
                }
            }
        }
        
        return data;
    }

    // === 데이터 추출 함수들 ===

    extractMovieTitle(message) {
        console.log(`[MOVIE] 영화 제목 추출 시작: "${message}"`);
        
        // 특별한 패턴으로 영화 제목 먼저 추출
        const moviePatterns = [
            // "영화명 + 키워드" 패턴
            /^([가-힣a-zA-Z0-9\s:·]{2,}?)\s+(영화평|평점|평가|리뷰|별점|어때)$/,
            /^([가-힣a-zA-Z0-9\s:·]{2,}?)\s+영화\s+(평점|평가|리뷰)$/,
            // 따옴표 패턴
            /"([^"]+)"/,
            /'([^']+)'/
        ];
        
        // 패턴 매칭으로 영화 제목 추출
        for (const pattern of moviePatterns) {
            const match = message.match(pattern);
            if (match) {
                const extracted = match[1].trim();
                console.log(`[SUCCESS] 패턴 매칭 성공: "${extracted}"`);
                return this.cleanMovieTitle(extracted);
            }
        }
        
        // F1 관련 특별 처리
        if (message.toLowerCase().includes('f1') || message.includes('더무비')) {
            let f1Title = message
                .replace(/f1\s*더무비?/i, 'F1 더무비')
                .replace(/더무비\s*f1/i, 'F1 더무비')
                .replace(/네이버/g, '')  // 네이버 제거
                .replace(/\b(영화평|평점|평가|리뷰|별점|어때|영화)\b/g, '')
                .replace(/\s+/g, ' ')  // 여러 공백을 하나로
                .trim();
            
            console.log(`[RACECAR] F1 영화 특별 처리: "${f1Title}"`);
            return f1Title;
        }
        
        // 일반적인 키워드 제거
        let cleanMessage = message
            .replace(/\b(영화평|평점|평가|리뷰|별점|평좀|어때|어떤지|볼만해|재밌어|봤어|본|생각|의견)\b/g, '')
            .replace(/\b(해줘|좀|말해줘|알려줘|보여줘)\b/g, '')
            .replace(/\b영화\s*/g, '') // "영화" 단어도 제거
            .replace(/\s+/g, ' ') // 여러 공백을 하나로
            .trim();
        
        // 빈 문자열이면 원본에서 다시 시도
        if (!cleanMessage) {
            cleanMessage = message.replace(/\b(평점|평가|리뷰|별점|어때)\b.*$/, '').trim();
        }
        
        const result = this.cleanMovieTitle(cleanMessage || message);
        console.log(`[TARGET] 최종 영화 제목: "${result}"`);
        return result;
    }
    
    // 영화 제목 정리 헬퍼 함수
    cleanMovieTitle(title) {
        return title
            .replace(/\b(영화평|평점|평가|리뷰|별점|어때|영화|네이버)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    extractReviewType(message) {
        if (/평점|별점|점수/.test(message)) return 'rating';
        if (/평론|전문가|비평/.test(message)) return 'critic';
        if (/관객|사용자|일반/.test(message)) return 'audience';
        return 'general';
    }

    extractLocation(message) {
        // 한국 지역명 추출
        const locationPatterns = [
            /([가-힣]{2,}(?:시|구|군|동|역|읍|면))/,
            /(서울|부산|대구|인천|광주|대전|울산|세종)/,
            /(강남|홍대|신촌|명동|종로|을지로|성수|건대)/
        ];
        
        for (const pattern of locationPatterns) {
            const match = message.match(pattern);
            if (match) return match[1];
        }
        
        return '서울'; // 기본값
    }

    extractTimeframe(message) {
        if (/오늘|현재|지금/.test(message)) return 'today';
        if (/내일|다음날/.test(message)) return 'tomorrow';
        if (/어제|어저께/.test(message)) return 'yesterday';
        if (/이번주|주간/.test(message)) return 'this_week';
        return 'current';
    }

    extractFoodType(message) {
        const foodTypes = {
            '한식': /한식|김치|불고기|비빔밥|삼겹살|갈비|냉면|된장찌개/,
            '중식': /중식|짜장면|탕수육|마파두부|동파육|딤섬/,
            '일식': /일식|초밥|라멘|돈카츠|우동|사시미|규동/,
            '양식': /양식|파스타|스테이크|샐러드|피자|리조또/,
            '분식': /분식|떡볶이|순대|김밥|라면|튀김/,
            '카페': /카페|커피|디저트|케이크|빵|브런치/
        };
        
        for (const [type, pattern] of Object.entries(foodTypes)) {
            if (pattern.test(message)) return type;
        }
        
        return 'general';
    }

    extractPreference(message) {
        const preferences = [];
        if (/맛있는|유명한|인기/.test(message)) preferences.push('popular');
        if (/저렴한|싼|가성비/.test(message)) preferences.push('affordable');
        if (/고급|프리미엄/.test(message)) preferences.push('premium');
        if (/가까운|근처/.test(message)) preferences.push('nearby');
        
        return preferences;
    }

    extractProductName(message) {
        // 상품명 추출 (쇼핑 관련 키워드 제거)
        const cleanMessage = message
            .replace(/상품|제품|쇼핑|구매|판매|가격|할인|세일|최저가|어디서|싸게|저렴|추천|어때/g, '')
            .trim();
        
        return cleanMessage || message;
    }

    extractPriceRange(message) {
        const priceMatch = message.match(/(\d+(?:만원|원|달러|\$))/);
        if (priceMatch) return priceMatch[1];
        
        if (/저렴|싼|가성비/.test(message)) return 'low';
        if (/고급|비싼|프리미엄/.test(message)) return 'high';
        return 'any';
    }

    extractComparison(message) {
        const vsMatch = message.match(/([가-힣a-zA-Z0-9\s]+)\s*(?:vs|비교|차이)\s*([가-힣a-zA-Z0-9\s]+)/);
        if (vsMatch) {
            return {
                items: [vsMatch[1].trim(), vsMatch[2].trim()],
                type: 'comparison'
            };
        }
        return null;
    }

    extractYouTubeUrl(message) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return {
                    url: `https://www.youtube.com/watch?v=${match[1]}`,
                    videoId: match[1]
                };
            }
        }
        return null;
    }

    extractSummaryType(message) {
        if (/짧게|간단|요약/.test(message)) return 'brief';
        if (/자세히|상세|길게/.test(message)) return 'detailed';
        return 'standard';
    }

    extractNewsTopic(message) {
        // 뉴스 주제 추출
        const topicMatch = message.match(/([가-힣]+(?:사건|사고|뉴스|이슈))/);
        if (topicMatch) return topicMatch[1];
        
        // 일반 주제어 추출
        const generalMatch = message.replace(/뉴스|최신|속보|알려줘|검색/g, '').trim();
        return generalMatch || '일반';
    }

    extractClaim(message) {
        // 사실 확인 대상 추출
        return message.replace(/사실|진실|확인|맞는지|사실인지|진짜|가짜/g, '').trim();
    }

    extractSource(message) {
        // 출처 정보 추출 (향후 확장)
        return null;
    }

    extractGeneralTopic(message) {
        // 일반 질문 주제 추출
        return message.replace(/알려줘|검색|찾아|추천|비교|말해줘|설명해|\?/g, '').trim();
    }

    extractQuestionType(message) {
        if (/어떻게/.test(message)) return 'how';
        if (/어떤|뭐|무엇/.test(message)) return 'what';
        if (/어디/.test(message)) return 'where';
        if (/언제/.test(message)) return 'when';
        if (/왜|이유/.test(message)) return 'why';
        if (/누구/.test(message)) return 'who';
        return 'general';
    }

    // 일상 대화 관련 추출 함수들
    extractConversationType(message) {
        if (/안녕|좋은아침|좋은밤|잘자|굿모닝|굿나잇/.test(message)) return 'greeting';
        if (/뭐.*먹지|먹을.*뭐|저녁.*뭐|아침.*뭐|점심.*뭐|간식.*뭐|뭐.*마실|마실.*뭐|배고파|출출해/.test(message)) return 'food_casual';
        if (/음식.*추천|먹을.*것.*추천|뭐.*먹을까|뭐.*드실래|식사.*뭐|메뉴.*추천/.test(message)) return 'food_suggestions';
        if (/오늘.*뭐.*할|뭐.*하고.*있|심심해|재미없어|지루해/.test(message)) return 'daily_chat';
        if (/행복해|기뻐|슬퍼|우울해|화나|짜증나|피곤해|졸려/.test(message)) return 'emotion';
        if (/뭐해|뭐하고|어디가|어디있어/.test(message)) return 'casual_ask';
        if (/^(네|응|아니|그래|맞아|ㅇㅇ|ㄱㅅ|ㄳ|감사|고마워)$/.test(message)) return 'response';
        if (/대화하자|얘기하자|심심하니/.test(message)) return 'chat_request';
        return 'general_casual';
    }

    extractCasualTopic(message) {
        // 일상 대화 주제 추출
        return message.replace(/뭐해|뭐하고|어떻게|어때|오늘|내일/g, '').trim() || message;
    }
}

module.exports = MessageClassifier;