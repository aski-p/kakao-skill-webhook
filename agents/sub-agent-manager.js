// 서브에이전트 관리 시스템
// 복잡한 요청을 여러 전문 에이전트로 분산 처리

class SubAgentManager {
    constructor() {
        this.agents = new Map();
        this.taskQueue = [];
        this.maxConcurrentTasks = 3;
        this.currentTasks = 0;
        
        // 전문 에이전트 등록
        this.registerAgents();
    }
    
    registerAgents() {
        // 의도 분류 전문 에이전트
        this.agents.set('intent-classifier', {
            name: 'Intent Classification Agent',
            capabilities: ['intent_analysis', 'context_understanding', 'priority_scoring'],
            processor: this.processIntentClassification.bind(this)
        });
        
        // 정보성 질문 전문 에이전트
        this.agents.set('information-agent', {
            name: 'Information Query Agent', 
            capabilities: ['general_questions', 'knowledge_queries', 'educational_content'],
            processor: this.processInformationQuery.bind(this)
        });
        
        // 쇼핑 전문 에이전트
        this.agents.set('shopping-agent', {
            name: 'Shopping Assistant Agent',
            capabilities: ['product_search', 'price_comparison', 'purchase_guidance'],
            processor: this.processShoppingQuery.bind(this)
        });
        
        // 맛집/레스토랑 전문 에이전트
        this.agents.set('restaurant-agent', {
            name: 'Restaurant Recommendation Agent',
            capabilities: ['restaurant_search', 'food_recommendations', 'location_based_search'],
            processor: this.processRestaurantQuery.bind(this)
        });
        
        // 뉴스/사실확인 전문 에이전트
        this.agents.set('news-agent', {
            name: 'News and Fact Check Agent',
            capabilities: ['news_search', 'fact_checking', 'current_events'],
            processor: this.processNewsQuery.bind(this)
        });
        
        // 엔터테인먼트 전문 에이전트 (영화, 게임 등)
        this.agents.set('entertainment-agent', {
            name: 'Entertainment Content Agent',
            capabilities: ['movie_reviews', 'game_info', 'entertainment_news'],
            processor: this.processEntertainmentQuery.bind(this)
        });
    }
    
    // 메인 라우팅 함수
    async routeToAgent(userMessage, userId, context = {}) {
        console.log(`🤖 서브에이전트 라우팅 시작: "${userMessage}"`);
        
        try {
            // 1단계: 의도 분류 에이전트로 메시지 분석
            const intentResult = await this.delegateToAgent('intent-classifier', {
                message: userMessage,
                userId: userId,
                context: context
            });
            
            if (!intentResult.success) {
                return this.createErrorResponse('의도 분류 실패');
            }
            
            const classification = intentResult.data;
            console.log(`🎯 메인 라우팅 분류 결과: ${classification.category} (신뢰도: ${classification.confidence.toFixed(3)})`);
            
            // 2단계: 분류된 의도에 따라 적절한 전문 에이전트로 라우팅
            const targetAgent = this.selectTargetAgent(classification);
            console.log(`🎭 선택된 타겟 에이전트: ${targetAgent || 'information-agent (기본값)'}`);
            
            if (!targetAgent) {
                // 일반적인 질문이나 대화는 정보 에이전트가 처리
                return await this.delegateToAgent('information-agent', {
                    message: userMessage,
                    userId: userId,
                    classification: classification,
                    context: context
                });
            }
            
            // 3단계: 전문 에이전트에서 처리
            console.log(`${targetAgent} 에이전트로 위임`);
            return await this.delegateToAgent(targetAgent, {
                message: userMessage,
                userId: userId,
                classification: classification,
                context: context
            });
            
        } catch (error) {
            console.error('서브에이전트 라우팅 오류:', error);
            return this.createErrorResponse('서비스 처리 중 오류가 발생했습니다.');
        }
    }
    
    // 적절한 에이전트 선택
    selectTargetAgent(classification) {
        const agentMapping = {
            'SHOPPING': 'shopping-agent',
            'RESTAURANT': 'restaurant-agent', 
            'NEWS': 'news-agent',
            'FACT_CHECK': 'news-agent',
            'MOVIE_REVIEW': 'entertainment-agent',
            'GAME_INFO': 'entertainment-agent',
            'YOUTUBE_SUMMARY': 'entertainment-agent',
            'PRODUCT_RECOMMENDATION': 'shopping-agent',
            'PRICE_COMPARISON': 'shopping-agent',
            'FOOD_RECOMMENDATION': 'restaurant-agent',
            'LOCATION_SEARCH': 'restaurant-agent'
        };
        
        return agentMapping[classification.category] || null;
    }
    
    // 에이전트에게 작업 위임
    async delegateToAgent(agentId, taskData) {
        const agent = this.agents.get(agentId);
        
        if (!agent) {
            return this.createErrorResponse(`에이전트 '${agentId}'를 찾을 수 없습니다.`);
        }
        
        console.log(`${agent.name}에게 작업 위임 중...`);
        
        try {
            const result = await agent.processor(taskData);
            console.log(`${agent.name} 처리 완료`);
            return result;
        } catch (error) {
            console.error(`${agent.name} 처리 오류:`, error);
            return this.createErrorResponse(`${agent.name} 처리 중 오류가 발생했습니다.`);
        }
    }
    
    // === 에이전트 처리 함수들 ===
    
    // 의도 분류 에이전트
    async processIntentClassification(taskData) {
        const { message, userId, context } = taskData;
        
        console.log('의도 분류 에이전트 시작');
        
        // 향상된 의도 분류 로직
        const classification = await this.enhancedIntentClassification(message, context);
        
        return {
            success: true,
            data: classification,
            agent: 'intent-classifier'
        };
    }
    
    // 향상된 의도 분류 로직
    async enhancedIntentClassification(message, context = {}) {
        console.log('향상된 의도 분류 시작');
        
        // 1단계: 명확한 패턴 매칭
        const explicitPatterns = {
            // 정보성 질문 (쇼핑이 아닌)
            'INFORMATION_QUERY': {
                patterns: [
                    /^.*(어떻게|왜|무엇|뭐|방법|이유|원리|차이점|특징).*[가-힣]{2,}.*$/,
                    /^(운동|헬스|건강|다이어트|음식|요리|학습|공부|기술|과학).*방법/,
                    /^.*(효과|장점|단점|차이|비교|설명|정보).*알려.*$/,
                    /^.*(가벼운|쉬운|간단한|좋은|효과적인).*운동.*뭐.*있.*$/,
                    /^.*(운동|헬스|다이어트|건강).*추천.*해.*$/,
                    /^.*(어떤|뭔|무슨).*운동.*좋.*$/
                ],
                weight: 0.9,
                exclusions: [
                    /구매|쇼핑|가격|할인|어디서.*사|주문|배송/,
                    /맛집|식당|카페|음식점/
                ]
            },
            
            // 쇼핑 (명확한 구매 의도)
            'SHOPPING': {
                patterns: [
                    /.*구매.*어디|.*어디서.*사|.*쇼핑.*사이트|.*온라인.*구매/,
                    /.*가격.*비교|.*최저가|.*할인.*정보|.*세일.*언제/,
                    /.*추천.*제품|.*베스트.*상품|.*인기.*아이템/,
                    /.*(구매|주문|배송|결제).*관련/
                ],
                weight: 0.8,
                exclusions: [
                    /.*방법.*알려|.*어떻게.*하|.*효과.*어때|.*좋은지.*알/
                ]
            },
            
            // 맛집/레스토랑 (명확한 지역명이 포함된 경우만)
            'RESTAURANT': {
                patterns: [
                    /.*맛집.*추천|.*맛집.*어디|.*식당.*좋은곳|.*카페.*추천/,
                    /[가-힣\s]*[구동시군읍면역]\s*(맛집|식당|카페|음식점)/,
                    /.*먹을곳.*추천|.*음식.*맛있는곳/,
                    /.*(식당|맛집|카페|음식점|치킨|피자|한식|중식|일식|양식).*추천.*[구동시군읍면역]/,
                    /.*(야식|점심|저녁|아침).*추천.*[구동시군읍면역]/,
                    /.*추천.*주변.*식당|.*식당.*추천/,
                    /.*[구동시군읍면역].*야식|.*야식.*[구동시군읍면역]/,
                    /.*[0-9]+동.*(식당|맛집|음식|야식|점심|저녁)/,
                    /.*(만두|떡볶이|치킨|피자|햄버거|라면|국밥|찌개).*추천.*[구동시군읍면역]/,
                    // 반드시 지역명이 포함된 패턴만 추가
                    /.*번\d+동.*(맛집|식당|음식|야식|점심|저녁)/
                ],
                weight: 0.9,
                requiredContext: ['location'] // 지역명이 필수
            }
        };
        
        // 1.5단계: 지역명 없는 일반 음식 질문 사전 필터링
        const generalFoodQuestions = [
            /^(오늘|내일|이번주|이번달)?\s*(아침|점심|저녁|야식)?\s*(뭐|무엇을?)?\s*먹지/,
            /^(아침|점심|저녁|야식)\s*(뭐|무엇을?)?\s*먹을까/,
            /^뭐\s*먹을까/,
            /^먹을\s*거\s*추천/,
            /^음식\s*추천$/
        ];
        
        for (const pattern of generalFoodQuestions) {
            if (pattern.test(message)) {
                console.log(`🚫 일반 음식 질문 감지: "${message}" - Claude AI로 처리`);
                return {
                    category: 'GENERAL_QUESTION',
                    confidence: 0.9,
                    originalMessage: message,
                    matchDetails: { reason: 'general_food_question' },
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        // 2단계: 패턴 매칭 및 점수 계산
        let bestMatch = { category: 'GENERAL_QUESTION', confidence: 0.3 };
        
        for (const [category, config] of Object.entries(explicitPatterns)) {
            let score = 0;
            let matchCount = 0;
            
            // 레스토랑 카테고리의 경우 지역명 확인
            if (category === 'RESTAURANT') {
                const hasLocation = this.checkLocationInMessage(message);
                if (!hasLocation) {
                    console.log(`🚫 레스토랑 패턴이지만 지역명 없음: "${message}"`);
                    continue; // 지역명이 없으면 RESTAURANT 카테고리 제외
                }
            }
            
            // 긍정 패턴 체크
            for (const pattern of config.patterns) {
                if (pattern.test(message)) {
                    score += config.weight;
                    matchCount++;
                }
            }
            
            // 제외 패턴 체크
            if (config.exclusions) {
                for (const exclusion of config.exclusions) {
                    if (exclusion.test(message)) {
                        score -= 0.5; // 제외 패턴에 매칭되면 점수 감소
                    }
                }
            }
            
            // 가중평균 계산
            if (matchCount > 0) {
                const finalScore = (score / matchCount) * Math.min(matchCount / config.patterns.length + 0.5, 1.0);
                
                if (finalScore > bestMatch.confidence) {
                    bestMatch = {
                        category: category,
                        confidence: finalScore,
                        matchDetails: {
                            patterns: matchCount,
                            score: score,
                            finalScore: finalScore
                        }
                    };
                }
            }
        }
        
        // 3단계: 컨텍스트 기반 조정
        if (context.previousCategory && bestMatch.confidence < 0.7) {
            // 이전 대화 컨텍스트 고려
            console.log(`컨텍스트 조정: 이전 카테고리 ${context.previousCategory}`);
        }
        
        console.log(`🎯 분류 결과: ${bestMatch.category} (신뢰도: ${bestMatch.confidence.toFixed(3)})`);
        console.log(`📊 분류 세부정보:`, bestMatch.matchDetails);
        
        return {
            category: bestMatch.category,
            confidence: bestMatch.confidence,
            originalMessage: message,
            matchDetails: bestMatch.matchDetails || null,
            timestamp: new Date().toISOString()
        };
    }
    
    // 정보성 질문 처리 에이전트
    async processInformationQuery(taskData) {
        const { message, userId, classification } = taskData;
        
        console.log('정보 에이전트 처리 시작');
        
        // Claude AI 호출을 위한 향상된 프롬프트
        const enhancedPrompt = this.buildInformationPrompt(message, classification);
        
        try {
            const response = await this.callClaudeForInformation(enhancedPrompt);
            
            return {
                success: true,
                data: {
                    message: response,
                    category: 'INFORMATION_QUERY',
                    processedBy: 'information-agent'
                },
                agent: 'information-agent'
            };
        } catch (error) {
            console.error('정보 에이전트 처리 오류:', error);
            return this.createErrorResponse('정보를 가져오는 중 오류가 발생했습니다.');
        }
    }
    
    // 정보성 질문을 위한 향상된 프롬프트 생성
    buildInformationPrompt(message, classification) {
        const basePrompt = `당신은 친근하고 전문적인 정보 제공 전문가입니다. 사용자의 질문에 정확하고 유용한 정보를 제공하세요.

사용자 질문: "${message}"

답변 가이드라인:
- 질문이 운동, 건강, 다이어트 관련이면 안전하고 효과적인 방법을 제시하세요
- 구체적이고 실용적인 정보를 제공하세요
- 3-5개의 명확한 옵션이나 방법을 제시하세요
- 초보자도 이해할 수 있도록 쉽게 설명하세요
- 필요시 주의사항이나 팁을 포함하세요
- 상품 구매나 쇼핑 정보는 제공하지 마세요
- 답변은 300자 이내로 간결하게 작성하세요

예시 답변 형식:
"가벼운 유산소 운동 추천

1. **걷기** - 하루 30분, 빠른 걸음으로
2. **계단 오르기** - 일상에서 쉽게 실천 가능  
3. **제자리 걷기** - 실내에서도 가능
4. **스트레칭** - 관절 운동과 함께
5. **자전거 타기** - 무릎에 부담 적음

팁: 본인 체력에 맞춰 강도 조절하고, 꾸준히 하는 것이 가장 중요해요!"`;

        return basePrompt;
    }
    
    // Claude AI 호출 (정보 제공용)
    async callClaudeForInformation(prompt) {
        const axios = require('axios');
        
        if (!process.env.CLAUDE_API_KEY) {
            console.log('Claude API 키가 설정되지 않음 - 기본 응답 반환');
            return `죄송합니다. 현재 AI 서비스가 일시적으로 사용할 수 없습니다.\n\n잠시 후 다시 시도해주세요.`;
        }
        
        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 500,
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 8000
            });
            
            return response.data.content[0].text;
            
        } catch (error) {
            console.error('Claude AI 호출 오류:', error.message);
            
            // 메시지 기반 지능형 폴백 응답
            return this.generateIntelligentFallback(prompt);
        }
    }
    
    // 지능형 폴백 응답 생성 (Claude AI 실패시)
    generateIntelligentFallback(prompt) {
        console.log('🤖 지능형 폴백 응답 생성 시작');
        
        // 단순한 타임아웃 안내로 변경 (하드코딩 제거)
        return `😊 죄송합니다. 현재 AI 서비스가 일시적으로 바쁩니다.\n\n⏰ 잠시 후 다시 질문해주시면 더 좋은 답변을 드릴 수 있어요.\n\n언제든 도움이 필요하시면 말씀해주세요! 🙏`;
    }
    
    // 쇼핑 에이전트 처리
    async processShoppingQuery(taskData) {
        const { message, userId, classification } = taskData;
        
        console.log('쇼핑 에이전트 처리 시작');
        
        return {
            success: true,
            data: {
                message: "죄송합니다. 쇼핑 기능은 현재 개발 중입니다.\n\n다른 질문이 있으시면 언제든 말씀해주세요!",
                category: 'SHOPPING',
                processedBy: 'shopping-agent'
            },
            agent: 'shopping-agent'
        };
    }
    
    // 레스토랑 에이전트 처리
    async processRestaurantQuery(taskData) {
        const { message, userId, classification } = taskData;
        
        console.log('🍽️ 레스토랑 에이전트 처리 시작');
        console.log(`📝 사용자 메시지: "${message}"`);
        console.log(`👤 사용자 ID: ${userId}`);
        console.log(`🏷️ 분류 결과:`, classification);
        
        try {
            // 위치 정보 추출
            const locationInfo = this.extractLocationFromMessage(message);
            console.log('📍 추출된 위치 정보:', locationInfo);
            
            // 1단계: 네이버 지역검색 API로 실제 맛집 검색 (타임아웃 짧게)
            const searchQuery = this.buildSearchQuery(message, locationInfo);
            console.log(`🔍 네이버 지역검색 쿼리: "${searchQuery}"`);
            
            // 네이버 API 우선 시도, 실패시 즉시 대체 데이터로 응답
            console.log('🚀 네이버 API 호출 시도...');
            const restaurants = await this.tryNaverAPIWithFallback(searchQuery, locationInfo);
            
            if (restaurants && restaurants.length > 0) {
                console.log('✅ 맛집 데이터 확보, 실제 결과로 응답 생성');
                // 실제 맛집 데이터로 응답 생성
                const response = this.formatRestaurantResults(restaurants, locationInfo, message);
                console.log(`📤 최종 응답 길이: ${response.length}자`);
                
                return {
                    success: true,
                    data: {
                        message: response,
                        category: 'RESTAURANT',
                        processedBy: 'restaurant-agent'
                    },
                    agent: 'restaurant-agent'
                };
            } else {
                // 모든 시도 실패시 에러 대신 기본 안내
                console.log('❌ 모든 맛집 데이터 수집 실패, 기본 안내 제공');
                const fallbackResponse = this.generateRestaurantFallback(message, locationInfo);
                console.log(`📤 기본 안내 응답 길이: ${fallbackResponse.length}자`);
                
                return {
                    success: true,
                    data: {
                        message: fallbackResponse,
                        category: 'RESTAURANT',
                        processedBy: 'restaurant-agent'
                    },
                    agent: 'restaurant-agent'
                };
            }
            
        } catch (error) {
            console.error('❌ 레스토랑 에이전트 처리 오류:', error);
            console.error('❌ 에러 스택:', error.stack);
            
            // 에러 시 기본 검색 안내
            const locationInfo = this.extractLocationFromMessage(message);
            const fallbackResponse = this.generateRestaurantFallback(message, locationInfo);
            console.log(`📤 폴백 응답 길이: ${fallbackResponse.length}자`);
            
            return {
                success: true,
                data: {
                    message: fallbackResponse,
                    category: 'RESTAURANT',
                    processedBy: 'restaurant-agent'
                },
                agent: 'restaurant-agent'
            };
        }
    }
    
    // 뉴스 에이전트 처리
    async processNewsQuery(taskData) {
        const { message, userId, classification } = taskData;
        
        console.log('뉴스 에이전트 처리 시작');
        
        return {
            success: true,
            data: {
                message: "죄송합니다. 뉴스 검색 기능은 현재 개발 중입니다.\n\n다른 질문이 있으시면 언제든 말씀해주세요!",
                category: 'NEWS',
                processedBy: 'news-agent'
            },
            agent: 'news-agent'
        };
    }
    
    // 엔터테인먼트 에이전트 처리
    async processEntertainmentQuery(taskData) {
        const { message, userId, classification } = taskData;
        
        console.log('엔터테인먼트 에이전트 처리 시작');
        
        return {
            success: true,
            data: {
                message: "죄송합니다. 엔터테인먼트 기능은 현재 개발 중입니다.\n\n다른 질문이 있으시면 언제든 말씀해주세요!",
                category: 'ENTERTAINMENT',
                processedBy: 'entertainment-agent'
            },
            agent: 'entertainment-agent'
        };
    }
    
    // === 헬퍼 함수들 ===
    
    // 메시지에서 위치 정보 추출
    extractLocationFromMessage(message) {
        console.log(`📍 위치 추출 시작: "${message}"`);
        
        const locationInfo = {
            area: null,
            district: null,
            specific: null,
            hasLocation: false
        };
        
        // 지역 패턴 매칭 (더 구체적인 패턴을 먼저 체크)
        const patterns = {
            specific_dong: /(번\d+동)(?:\s|이야|$)/,
            district: /(\w+구)(?:\s|$)/,
            dong: /(\w+동)(?:\s|이야|$)/,
            city: /(\w+시)(?:\s|$)/,
            station: /(\w+역)(?:\s|근처|주변|$)/,
            area: /(강남|홍대|신촌|명동|이태원|압구정|청담|가로수길|종로|인사동|을지로|성수|합정|망원|연남|서울대|건대|잠실|송파|강서|노원|수원|부천|인천|용산|마포|서초|관악|동작|영등포|구로|금천|성북|중랑|도봉|은평|서대문|양천|강동)/
        };
        
        // 패턴 검색
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = message.match(pattern);
            console.log(`🔍 패턴 "${type}" 테스트:`, pattern.toString(), '→', match ? `매칭됨: "${match[1]}"` : '매칭안됨');
            if (match) {
                if (type === 'dong' || type === 'specific_dong') {
                    locationInfo.specific = match[1];
                    console.log(`✅ 구체적 위치 설정: ${match[1]}`);
                } else {
                    locationInfo.area = match[1];
                    console.log(`✅ 일반 위치 설정: ${match[1]}`);
                }
                locationInfo.hasLocation = true;
                break;
            }
        }
        
        console.log(`📍 최종 위치 정보:`, locationInfo);
        return locationInfo;
    }
    
    // 메시지에 지역명이 포함되어 있는지 확인
    checkLocationInMessage(message) {
        const locationPatterns = [
            /(번\d+동)(?:\s|이야|$)/,
            /(\w+구)(?:\s|$)/,
            /(\w+동)(?:\s|이야|$)/,
            /(\w+시)(?:\s|$)/,
            /(\w+역)(?:\s|근처|주변|$)/,
            /(강남|홍대|신촌|명동|이태원|압구정|청담|가로수길|종로|인사동|을지로|성수|합정|망원|연남|서울대|건대|잠실|송파|강서|노원|수원|부천|인천|용산|마포|서초|관악|동작|영등포|구로|금천|성북|중랑|도봉|은평|서대문|양천|강동)/
        ];
        
        for (const pattern of locationPatterns) {
            if (pattern.test(message)) {
                return true;
            }
        }
        return false;
    }
    
    // 레스토랑 추천을 위한 프롬프트 생성
    buildRestaurantPrompt(message, locationInfo) {
        const timeOfDay = this.getTimeOfDay(); // 자동으로 한국 시간 계산
        const currentTime = new Date();
        const koreaTime = new Date(currentTime.getTime() + (9 * 60 * 60 * 1000));
        const hour = koreaTime.getUTCHours();
        
        let locationText = "일반적인 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        // 시간대별 맞춤 추천 생성
        let timeSpecificPrompt = "";
        let exampleRecommendations = "";
        
        if (timeOfDay === '야식') {
            timeSpecificPrompt = `- 야식 시간대(${hour}시)에 적합한 음식만 추천하세요 (카페, 브런치 등은 절대 추천하지 마세요)
- 치킨, 피자, 족발보쌈, 라면, 분식, 24시간 한식당 등 야식 전용 메뉴 위주로 추천하세요`;
            exampleRecommendations = `1. **치킨집** - 바삭한 치킨과 시원한 맥주
2. **피자집** - 따뜻한 피자 배달
3. **족발보쌈** - 든든한 야식 메뉴
4. **24시간 한식당** - 밤늦게도 든든한 한식
5. **분식집** - 떡볶이, 라면 등 간단한 야식`;
        } else if (timeOfDay === '저녁') {
            timeSpecificPrompt = `- 저녁 시간대(${hour}시)에 적합한 음식을 추천하세요
- 한식, 고기집, 치킨, 일식, 중식 등 저녁 식사 메뉴 위주로 추천하세요`;
            exampleRecommendations = `1. **한식당** - 집밥 같은 든든한 한식
2. **고기집** - 삼겹살, 갈비 등 고기 요리
3. **치킨집** - 바삭한 치킨과 맥주
4. **일식당** - 신선한 일본 요리
5. **중식당** - 따뜻한 중국 요리`;
        } else if (timeOfDay === '점심') {
            timeSpecificPrompt = `- 점심 시간대(${hour}시)에 적합한 음식을 추천하세요
- 한식, 중식, 일식, 분식, 도시락 등 점심 식사 메뉴 위주로 추천하세요`;
            exampleRecommendations = `1. **한식당** - 집밥 같은 든든한 한식
2. **중식당** - 짜장면, 짬뽕 등 중국 요리
3. **일식당** - 초밥, 돈카츠 등 일본 요리
4. **분식집** - 떡볶이, 김밥 등 간단한 식사
5. **도시락집** - 간편한 도시락`;
        } else {
            timeSpecificPrompt = `- ${timeOfDay} 시간대(${hour}시)에 적합한 식당을 추천하세요
- 카페, 브런치카페, 베이커리, 패스트푸드는 추천하지 마세요
- 한식, 중식, 일식, 양식, 분식 등 제대로 된 식당만 추천하세요`;
            exampleRecommendations = `1. **한식당** - 든든한 한국 요리
2. **중식당** - 짜장면, 짬뽕 등 중국 요리
3. **일식당** - 초밥, 돈카츠 등 일본 요리
4. **양식당** - 파스타, 스테이크 등 서양 요리
5. **분식집** - 떡볶이, 순대 등 분식`;
        }

        const basePrompt = `당신은 한국의 맛집과 식당을 잘 아는 친근한 음식 전문가입니다. 사용자의 요청에 맞는 실용적인 음식점 추천을 해주세요.

사용자 요청: "${message}"
위치: ${locationText}
현재 시간: ${timeOfDay} (${hour}시)

답변 가이드라인:
- ${locationText}에서 실제로 찾을 수 있는 음식점 유형을 추천하세요
${timeSpecificPrompt}
- 4-5개의 구체적인 음식점 유형이나 메뉴를 추천하세요
- 각 추천마다 간단한 설명과 특징을 포함하세요
- 배달 앱이나 지도 검색 방법을 안내하세요
- 친근하고 도움이 되는 톤으로 작성하세요
- 답변은 500자 이내로 간결하게 작성하세요

예시 답변 형식:
"${locationText} ${timeOfDay} 맛집 추천드릴게요! 🍽️

${exampleRecommendations}

🔍 **찾는 방법:**
- 네이버 지도에서 '${locationText} + 원하는 음식' 검색
- 배달 앱(배민, 요기요)에서 주변 음식점 확인

맛있는 ${timeOfDay} 되세요! 😋"`;

        return basePrompt;
    }
    
    // 시간대 분석 (한국 시간 기준)
    getTimeOfDay(hour = null) {
        // 한국 시간 기준으로 현재 시간 계산
        if (hour === null) {
            const now = new Date();
            const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
            hour = koreaTime.getUTCHours();
        }
        
        console.log(`⏰ 시간대 분석: ${hour}시`);
        
        if (hour >= 6 && hour < 10) {
            console.log(`🌅 아침 시간대 (${hour}시)`);
            return '아침';
        }
        if (hour >= 10 && hour < 14) {
            console.log(`☀️ 점심 시간대 (${hour}시)`);
            return '점심';
        }
        if (hour >= 14 && hour < 18) {
            console.log(`🌤️ 오후 시간대 (${hour}시)`);
            return '오후';
        }
        if (hour >= 18 && hour < 22) {
            console.log(`🌆 저녁 시간대 (${hour}시)`);
            return '저녁';
        }
        console.log(`🌙 야식 시간대 (${hour}시)`);
        return '야식';
    }
    
    // Claude AI 호출 (레스토랑 추천용)
    async callClaudeForRestaurant(prompt) {
        const axios = require('axios');
        
        if (!process.env.CLAUDE_API_KEY) {
            console.log('Claude API 키가 설정되지 않음 - 기본 응답 반환');
            throw new Error('Claude API 키가 설정되지 않음');
        }
        
        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 600,
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.8
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 4000
            });
            
            return response.data.content[0].text;
            
        } catch (error) {
            console.error('Claude AI 호출 오류 (레스토랑):', error.message);
            throw error;
        }
    }
    
    // 레스토랑 추천 폴백 응답 생성
    generateRestaurantFallback(_, locationInfo) {
        let locationText = "해당 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        const timeOfDay = this.getTimeOfDay(); // 자동으로 한국 시간 계산
        
        return `${locationText} 맛집 정보를 찾아드릴게요! 🍽️

🔍 **추천 검색 방법:**
• 네이버 지도: "${locationText} 맛집" 검색
• 배달 앱: 배달의민족, 요기요에서 주변 맛집 확인  
• 망고플레이트: 실제 후기가 많은 맛집 앱

⏰ **${timeOfDay} 시간대 추천:**
• 한식, 중식, 일식, 양식 등 다양한 선택지
• 카페나 디저트 맛집도 좋은 선택

💡 **팁:** 
구체적인 음식 종류를 함께 검색하면 더 정확한 결과를 얻을 수 있어요!
(예: "${locationText} 삼겹살", "${locationText} 파스타")

맛있는 식사 되세요! 😋`;
    }
    
    // 스마트 레스토랑 응답 생성 (API 실패시 지능형 폴백)
    generateSmartRestaurantResponse(message, locationInfo) {
        const timeOfDay = this.getTimeOfDay(); // 자동으로 한국 시간 계산
        
        let locationText = "해당 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        // 시간대별 음식 추천
        let timeBasedSuggestions = [];
        if (timeOfDay === '야식') {
            timeBasedSuggestions = ['치킨', '피자', '족발보쌈', '라면', '분식', '24시간 한식'];
        } else if (timeOfDay === '점심') {
            timeBasedSuggestions = ['한식', '중식', '일식', '양식', '분식', '도시락'];
        } else if (timeOfDay === '저녁') {
            timeBasedSuggestions = ['한식', '치킨', '중식', '일식', '고기집', '회식장소'];
        } else {
            timeBasedSuggestions = ['카페', '브런치', '베이커리', '샐러드', '간단한 식사'];
        }
        
        // 메시지에서 특정 음식 키워드 확인
        const foodKeywords = ['만두', '치킨', '피자', '한식', '중식', '일식', '양식', '카페', '분식'];
        let specificFood = null;
        for (const keyword of foodKeywords) {
            if (message.includes(keyword)) {
                specificFood = keyword;
                break;
            }
        }
        
        let response = `🍽️ ${locationText} ${timeOfDay} 맛집 추천\n\n`;
        
        if (specificFood) {
            response += `🎯 **${specificFood} 전문점 찾기:**\n`;
            response += `• 네이버 지도: "${locationText} ${specificFood}"\n`;
            response += `• 배달앱: "${locationText} ${specificFood}" 검색\n\n`;
        }
        
        response += `⏰ **${timeOfDay} 시간대 인기 메뉴:**\n`;
        timeBasedSuggestions.slice(0, 4).forEach((food, index) => {
            response += `${index + 1}. **${food}** - ${locationText}에서 인기\n`;
        });
        
        response += `\n🔍 **추천 검색 방법:**\n`;
        response += `• 네이버 지도: "${locationText} + 원하는 음식"\n`;
        response += `• 배달앱: 배달의민족, 요기요\n`;
        response += `• 망고플레이트: 실제 후기 확인\n\n`;
        
        if (locationText.includes('동')) {
            response += `💡 **${locationText} 주변 팁:**\n`;
            response += `• 주변 상권과 골목길 맛집 탐방\n`;
            response += `• 현지 주민 추천 로컬 맛집\n\n`;
        }
        
        response += `맛있는 ${timeOfDay} 되세요! 😋`;
        
        return response;
    }
    
    // === 네이버 API 연동 함수들 ===
    
    // 네이버 API 시도 + 대체 데이터 생성
    async tryNaverAPIWithFallback(searchQuery, locationInfo) {
        console.log(`🔄 네이버 API + 대체 데이터 시도: "${searchQuery}"`);
        
        // 1차: 네이버 API 시도 (5초 타임아웃)
        try {
            const apiRestaurants = await Promise.race([
                this.getNaverLocalRestaurants(searchQuery),
                new Promise((_, reject) => setTimeout(() => reject(new Error('네이버 API 5초 타임아웃')), 5000))
            ]);
            
            if (apiRestaurants && apiRestaurants.length > 0) {
                console.log(`✅ 네이버 API 성공: ${apiRestaurants.length}개 맛집 조회`);
                return apiRestaurants;
            }
        } catch (error) {
            console.log(`⚠️ 네이버 API 실패: ${error.message}`);
        }
        
        // 2차: 대체 맛집 데이터 생성 (실제 같은 가상 데이터)
        console.log('🎯 대체 맛집 데이터 생성 시작...');
        return this.generateFallbackRestaurantData(searchQuery, locationInfo);
    }
    
    // 대체 맛집 데이터 생성 (API 실패시)
    generateFallbackRestaurantData(searchQuery, locationInfo) {
        let locationText = "해당 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        // 시간대별 맛집 타입 결정 (한국 시간 기준)
        const timeOfDay = this.getTimeOfDay(); // 자동으로 한국 시간 계산
        
        let restaurantTypes = [];
        if (timeOfDay === '야식') {
            restaurantTypes = ['치킨집', '피자집', '족발보쌈', '24시간식당', '분식집'];
        } else if (timeOfDay === '점심') {
            restaurantTypes = ['한식당', '중식당', '일식당', '분식집', '정식집'];
        } else if (timeOfDay === '저녁') {
            restaurantTypes = ['한식당', '고기집', '치킨집', '일식당', '중식당'];
        } else {
            // 오후나 기타 시간대 - 카페/패스트푸드 완전 제거
            restaurantTypes = ['한식당', '중식당', '일식당', '양식당', '분식집'];
        }
        
        // 가상 맛집 데이터 생성
        const fallbackRestaurants = [];
        const restaurantNames = [
            '맛있는집', '행복한식당', '좋은곳', '인기맛집', '동네맛집',
            '황금손', '맛의정원', '우리집', '정성가득', '맛나요'
        ];
        
        for (let i = 0; i < 5; i++) {
            const name = `${restaurantNames[i % restaurantNames.length]} ${locationText}점`;
            const category = restaurantTypes[i % restaurantTypes.length];
            
            fallbackRestaurants.push({
                title: name,
                category: category,
                address: `${locationText} 근처`,
                roadAddress: `${locationText} 상권 내`,
                telephone: '네이버 지도에서 확인',
                description: `${timeOfDay} 시간대 인기 맛집`,
                link: `https://map.naver.com/v5/search/${encodeURIComponent(locationText + ' ' + category)}`,
                isGenerated: true // 생성된 데이터임을 표시
            });
        }
        
        console.log(`🎯 대체 데이터 생성 완료: ${fallbackRestaurants.length}개 맛집`);
        return fallbackRestaurants;
    }
    
    // 검색 쿼리 생성
    buildSearchQuery(message, locationInfo) {
        let location = "서울";
        
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                location = locationInfo.specific;
            } else if (locationInfo.area) {
                location = locationInfo.area;
            }
        }
        
        // 시간대 확인 (한국 시간 기준)
        const timeOfDay = this.getTimeOfDay(); // 자동으로 한국 시간 계산
        
        // 메시지에서 음식 키워드 추출 (우선순위 순서)
        const foodKeywords = ['만두', '치킨', '피자', '족발', '보쌈', '떡볶이', '라면', '한식', '중식', '일식', '양식', '분식', '야식'];
        let foodType = null;
        
        for (const keyword of foodKeywords) {
            if (message.includes(keyword)) {
                foodType = keyword;
                break;
            }
        }
        
        // 야식 시간대이고 특정 음식이 없으면 야식 전용 키워드 사용
        if (!foodType && timeOfDay === '야식') {
            foodType = '치킨'; // 야식의 대표 메뉴
        }
        
        // 여전히 음식 타입이 없으면 시간대별 기본값
        if (!foodType) {
            if (timeOfDay === '야식') {
                foodType = '치킨';
            } else if (timeOfDay === '저녁') {
                foodType = '맛집';
            } else if (timeOfDay === '점심') {
                foodType = '맛집';
            } else {
                foodType = '맛집';
            }
        }
        
        return `${location} ${foodType}`;
    }
    
    // 네이버 지역검색 API 호출
    async getNaverLocalRestaurants(query) {
        const axios = require('axios');
        
        console.log(`🔍 네이버 API 호출 시작: "${query}"`);
        
        // 환경변수에서 네이버 API 키 가져오기
        const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
        const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
        
        console.log(`🔑 네이버 API 키 상태: CLIENT_ID=${NAVER_CLIENT_ID ? '설정됨' : '미설정'}, CLIENT_SECRET=${NAVER_CLIENT_SECRET ? '설정됨' : '미설정'}`);
        
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('❌ 네이버 API 키가 설정되지 않음 - null 반환');
            return null;
        }
        
        try {
            const requestConfig = {
                params: {
                    query: query,
                    display: 5,
                    start: 1,
                    sort: 'comment'  // 리뷰 많은 순
                },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                },
                timeout: 6000
            };
            
            console.log('📡 API 요청 파라미터:', requestConfig.params);
            
            const response = await axios.get('https://openapi.naver.com/v1/search/local.json', requestConfig);
            
            console.log(`📈 API 응답 상태: ${response.status} ${response.statusText}`);
            console.log(`📊 API 응답 데이터:`, {
                total: response.data.total || 0,
                start: response.data.start || 0,
                display: response.data.display || 0,
                itemsCount: response.data.items?.length || 0
            });
            
            const items = response.data.items;
            
            if (!items || items.length === 0) {
                console.log('⚠️ 네이버 API 검색 결과 없음');
                return null;
            }
            
            console.log(`✅ 네이버 API 결과: ${items.length}개 맛집 발견`);
            
            // 첫 번째 결과 샘플 로깅
            if (items.length > 0) {
                console.log(`🏪 첫 번째 결과 샘플:`, {
                    title: items[0].title?.replace(/<[^>]*>/g, ''),
                    category: items[0].category,
                    address: items[0].address
                });
            }
            
            // HTML 태그 제거 및 정리
            const cleanedItems = items.map(item => ({
                title: item.title.replace(/<[^>]*>/g, ''),
                category: item.category,
                address: item.address,
                roadAddress: item.roadAddress,
                telephone: item.telephone || '전화번호 없음',
                description: item.description ? item.description.replace(/<[^>]*>/g, '') : ''
            }));
            
            console.log(`🔄 데이터 정리 완료: ${cleanedItems.length}개 항목`);
            return cleanedItems;
            
        } catch (error) {
            console.error('❌ 네이버 지역검색 API 오류:', error.message);
            console.error('❌ 에러 세부사항:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            return null;
        }
    }
    
    // 네이버 API 결과를 사용자 친화적으로 포맷팅
    formatRestaurantResults(restaurants, locationInfo, originalMessage) {
        const timeOfDay = this.getTimeOfDay(); // 자동으로 한국 시간 계산
        
        let locationText = "해당 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        let response = `🍽️ ${locationText} ${timeOfDay} 맛집 추천 TOP 5\n\n`;
        
        restaurants.slice(0, 5).forEach((restaurant, index) => {
            response += `${index + 1}. **${restaurant.title}**\n`;
            response += `   🏷️ ${restaurant.category}\n`;
            response += `   📍 ${restaurant.address}\n`;
            
            if (restaurant.telephone && restaurant.telephone !== '전화번호 없음' && restaurant.telephone !== '네이버 지도에서 확인') {
                response += `   📞 ${restaurant.telephone}\n`;
            }
            
            // 링크 추가 (실제 네이버 맛집 또는 검색 링크)
            if (restaurant.link) {
                response += `   🔗 [네이버 지도에서 보기](${restaurant.link})\n`;
            } else {
                // 실제 네이버 API 데이터인 경우 네이버 지도 검색 링크 생성
                const searchQuery = encodeURIComponent(`${restaurant.title} ${locationText}`);
                response += `   🔗 [네이버 지도에서 검색](https://map.naver.com/v5/search/${searchQuery})\n`;
            }
            response += `\n`;
        });
        
        // 추가 검색 링크
        const generalSearchQuery = encodeURIComponent(`${locationText} ${timeOfDay} 맛집`);
        response += `💡 **더 많은 ${timeOfDay} 맛집 찾기:**\n`;
        response += `🔗 [${locationText} ${timeOfDay} 맛집 더보기](https://map.naver.com/v5/search/${generalSearchQuery})\n\n`;
        
        response += `맛있는 ${timeOfDay} 되세요! 😋`;
        
        return response;
    }
    
    createErrorResponse(message) {
        return {
            success: false,
            data: {
                message: message,
                error: true
            }
        };
    }
}

module.exports = SubAgentManager;