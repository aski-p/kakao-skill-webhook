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
            
            // 맛집/레스토랑
            'RESTAURANT': {
                patterns: [
                    /.*맛집.*추천|.*맛집.*어디|.*식당.*좋은곳|.*카페.*추천/,
                    /[가-힣\s]*[구동시군읍면역]\s*(맛집|식당|카페|음식점)/,
                    /.*먹을곳.*추천|.*음식.*맛있는곳/,
                    /.*(식당|맛집|카페|음식점|치킨|피자|한식|중식|일식|양식).*추천/,
                    /.*(야식|점심|저녁|아침).*추천.*[구동시군읍면역]/,
                    /.*추천.*주변.*식당|.*식당.*추천/,
                    /.*[구동시군읍면역].*야식|.*야식.*[구동시군읍면역]/,
                    /.*[0-9]+동.*식당|.*식당.*[0-9]+동/,
                    /.*(만두|떡볶이|치킨|피자|햄버거|라면|국밥|찌개).*추천.*[구동시군읍면역]/
                ],
                weight: 0.9
            }
        };
        
        // 2단계: 패턴 매칭 및 점수 계산
        let bestMatch = { category: 'GENERAL_QUESTION', confidence: 0.3 };
        
        for (const [category, config] of Object.entries(explicitPatterns)) {
            let score = 0;
            let matchCount = 0;
            
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
                timeout: 4000
            });
            
            return response.data.content[0].text;
            
        } catch (error) {
            console.error('Claude AI 호출 오류:', error.message);
            
            // 간단한 폴백 응답
            if (prompt.includes('운동') || prompt.includes('헬스')) {
                return `가벼운 유산소 운동 추천\n\n1. **걷기** - 하루 30분, 빠른 걸음으로\n2. **계단 오르기** - 일상에서 쉽게 실천 가능\n3. **제자리 걷기** - 실내에서도 가능\n4. **스트레칭** - 관절 운동과 함께\n5. **자전거 타기** - 무릎에 부담 적음\n\n팁: 본인 체력에 맞춰 강도 조절하고, 꾸준히 하는 것이 가장 중요해요!`;
            }
            
            return `죄송합니다. 현재 일시적인 서비스 문제로 정확한 정보를 제공하기 어렵습니다.\n\n잠시 후 다시 질문해주시거나, 더 구체적인 키워드로 검색해보세요.`;
        }
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
            
            // 1단계: 네이버 지역검색 API로 실제 맛집 검색
            const searchQuery = this.buildSearchQuery(message, locationInfo);
            console.log(`🔍 네이버 지역검색 쿼리: "${searchQuery}"`);
            
            const restaurants = await this.getNaverLocalRestaurants(searchQuery);
            console.log(`📊 네이버 API 응답 결과: ${restaurants ? restaurants.length : 0}개`);
            
            if (restaurants && restaurants.length > 0) {
                console.log('✅ 네이버 API 결과 있음, 실제 맛집 데이터로 응답 생성');
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
                // 검색 결과가 없으면 Claude AI 폴백
                console.log('⚠️ 네이버 API 결과 없음, Claude AI 폴백 시도');
                const restaurantPrompt = this.buildRestaurantPrompt(message, locationInfo);
                const response = await this.callClaudeForRestaurant(restaurantPrompt);
                console.log(`📤 Claude AI 폴백 응답 길이: ${response.length}자`);
                
                return {
                    success: true,
                    data: {
                        message: response,
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
    
    // 레스토랑 추천을 위한 프롬프트 생성
    buildRestaurantPrompt(message, locationInfo) {
        const currentTime = new Date();
        const hour = currentTime.getHours();
        const timeOfDay = this.getTimeOfDay(hour);
        
        let locationText = "일반적인 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        const basePrompt = `당신은 한국의 맛집과 식당을 잘 아는 친근한 음식 전문가입니다. 사용자의 요청에 맞는 실용적인 음식점 추천을 해주세요.

사용자 요청: "${message}"
위치: ${locationText}
현재 시간: ${timeOfDay} (${hour}시)

답변 가이드라인:
- ${locationText}에서 실제로 찾을 수 있는 음식점 유형을 추천하세요
- 현재 시간대(${timeOfDay})에 적합한 메뉴를 제안하세요
- 3-4개의 구체적인 음식점 유형이나 메뉴를 추천하세요
- 각 추천마다 간단한 설명과 특징을 포함하세요
- 배달 앱이나 지도 검색 방법을 안내하세요
- 친근하고 도움이 되는 톤으로 작성하세요
- 답변은 400자 이내로 간결하게 작성하세요

예시 답변 형식:
"${locationText} 맛집 추천드릴게요! 🍽️

1. **한식당** - 집밥 같은 든든한 한식
2. **치킨집** - 바삭한 치킨과 맥주  
3. **분식집** - 떡볶이, 순대 등 간단한 분식
4. **카페** - 음료와 간단한 디저트

🔍 **찾는 방법:**
- 네이버 지도에서 '${locationText} + 원하는 음식' 검색
- 배달 앱(배민, 요기요)에서 주변 음식점 확인

맛있는 식사 되세요! 😋"`;

        return basePrompt;
    }
    
    // 시간대 분석
    getTimeOfDay(hour) {
        if (hour >= 6 && hour < 10) return '아침';
        if (hour >= 10 && hour < 14) return '점심';
        if (hour >= 14 && hour < 18) return '오후';
        if (hour >= 18 && hour < 22) return '저녁';
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
        
        const currentTime = new Date();
        const hour = currentTime.getHours();
        const timeOfDay = this.getTimeOfDay(hour);
        
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
    
    // === 네이버 API 연동 함수들 ===
    
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
        
        // 메시지에서 음식 키워드 추출
        const foodKeywords = ['야식', '만두', '치킨', '피자', '한식', '중식', '일식', '양식', '카페', '분식', '맛집'];
        let foodType = '맛집';
        
        for (const keyword of foodKeywords) {
            if (message.includes(keyword)) {
                foodType = keyword;
                break;
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
                timeout: 4000
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
        const currentTime = new Date();
        const hour = currentTime.getHours();
        const timeOfDay = this.getTimeOfDay(hour);
        
        let locationText = "해당 지역";
        if (locationInfo.hasLocation) {
            if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.area) {
                locationText = locationInfo.area;
            }
        }
        
        let response = `🍽️ ${locationText} 맛집 추천 (${timeOfDay} 시간대)\n\n`;
        
        restaurants.slice(0, 4).forEach((restaurant, index) => {
            response += `${index + 1}. **${restaurant.title}**\n`;
            response += `   📍 ${restaurant.address}\n`;
            if (restaurant.category) {
                response += `   🏷️ ${restaurant.category}\n`;
            }
            if (restaurant.telephone && restaurant.telephone !== '전화번호 없음') {
                response += `   📞 ${restaurant.telephone}\n`;
            }
            response += `\n`;
        });
        
        response += `💡 **더 많은 정보:**\n`;
        response += `• 네이버 지도에서 "${locationText} 맛집" 검색\n`;
        response += `• 배달앱으로 주변 맛집 확인\n\n`;
        response += `맛있는 식사 되세요! 😋`;
        
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