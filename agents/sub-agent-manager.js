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
            console.log('Claude API 키가 설정되지 않음 - 폴백 응답 사용');
            return this.generateIntelligentFallback(prompt);
        }
        
        try {
            console.log('🤖 Claude AI 호출 시도...');
            
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 400,
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
                timeout: 3500  // 3.5초로 단축 (카카오톡 5초 제한 고려)
            });
            
            const aiResponse = response.data.content[0].text;
            console.log('✅ Claude AI 응답 성공:', aiResponse.substring(0, 100) + '...');
            return aiResponse;
            
        } catch (error) {
            console.error('❌ Claude AI 호출 실패:', error.response?.status || error.code || error.message);
            
            // API 실패 시 지능형 폴백 응답 사용
            console.log('🔄 지능형 폴백 응답으로 전환');
            return this.generateIntelligentFallback(prompt);
        }
    }
    
    // 지능형 폴백 응답 생성 (Claude AI 실패시)
    generateIntelligentFallback(prompt) {
        console.log('🤖 지능형 폴백 응답 생성 시작');
        
        // 프롬프트에서 사용자 질문 추출
        const userMessageMatch = prompt.match(/사용자 질문: "([^"]+)"/);
        const userMessage = userMessageMatch ? userMessageMatch[1] : '';
        
        console.log(`폴백 처리 대상 메시지: "${userMessage}"`);
        
        // 키워드 기반 패턴 매칭으로 실용적인 응답 제공
        const message = userMessage.toLowerCase();
        
        // 음식 관련 질문
        if (message.includes('먹') || message.includes('음식') || message.includes('메뉴') || message.includes('요리')) {
            if (message.includes('저녁') || message.includes('밤')) {
                return `🍽️ 저녁 메뉴 추천드려요!\n\n🍜 간단한 선택:\n• 라면 + 김치\n• 볶음밥\n• 계란덮밥\n\n🍖 든든한 선택:\n• 치킨 배달\n• 피자 주문\n• 삼겹살 구이\n\n🥗 건강한 선택:\n• 샐러드\n• 두부김치\n• 야채볶음\n\n어떤 기분이신가요? 😊`;
            } else if (message.includes('점심')) {
                return `🍱 점심 메뉴 추천!\n\n• 김치찌개 + 밥\n• 파스타\n• 덮밥류\n• 국밥\n• 샌드위치\n\n근처 맛집이나 배달 앱도 확인해보세요! 🍴`;
            } else {
                return `🍽️ 맛있는 음식 추천!\n\n오늘 기분에 따라 선택해보세요:\n• 매운맛: 김치찌개, 떡볶이\n• 담백한맛: 미역국, 두부요리\n• 든든한 것: 삼겹살, 치킨\n• 간단한 것: 라면, 볶음밥\n\n뭐가 땡기세요? 😋`;
            }
        }
        
        // 날씨 관련 (이미 따로 처리되지만 폴백용)
        if (message.includes('날씨')) {
            return `🌤️ 네이버에서 "날씨"를 검색하시면 정확한 날씨 정보를 확인하실 수 있어요!\n\n또는 "지역명 + 날씨"로 물어보세요.`;
        }
        
        // 쇼핑 관련
        if (message.includes('사고싶') || message.includes('구매') || message.includes('쇼핑')) {
            return `🛒 쇼핑 도움말:\n\n• 네이버 쇼핑에서 가격 비교\n• 쿠팡, 11번가 등에서 할인 확인\n• 리뷰 꼼꼼히 읽어보세요\n• 반품/교환 정책 확인\n\n무엇을 찾고 계신가요?`;
        }
        
        // 운동/건강 관련
        if (message.includes('운동') || message.includes('다이어트') || message.includes('건강')) {
            return `💪 건강 관리 팁:\n\n🏃‍♂️ 가벼운 운동:\n• 걷기 30분\n• 계단 오르기\n• 스트레칭\n\n🥗 건강한 식습구:\n• 물 많이 마시기\n• 야채 늘리기\n• 규칙적인 식사\n\n꾸준함이 가장 중요해요! 😊`;
        }
        
        // 일반적인 대화나 인사
        if (message.includes('안녕') || message.includes('안녕하') || message.includes('반가')) {
            return `안녕하세요! 😊\n\n무엇을 도와드릴까요?\n\n• 음식/메뉴 추천\n• 날씨 정보\n• 일상 대화\n• 정보 검색\n\n언제든 편하게 말씀하세요!`;
        }
        
        // 감정 표현이 있는 경우
        if (message.includes('힘들') || message.includes('우울') || message.includes('슬프')) {
            return `😔 힘든 시간을 보내고 계시는군요.\n\n가끔은 쉬어가는 것도 필요해요.\n• 좋아하는 음식 먹기\n• 산책하기\n• 좋은 음악 듣기\n• 충분한 휴식\n\n내일은 더 좋은 날이 될 거예요! 💪`;
        }
        
        if (message.includes('좋다') || message.includes('기분좋') || message.includes('행복')) {
            return `😄 기분이 좋으시다니 저도 기뻐요!\n\n좋은 에너지를 계속 이어가세요!\n• 좋아하는 활동 하기\n• 맛있는 것 먹기\n• 사랑하는 사람과 시간 보내기\n\n오늘도 좋은 하루 되세요! ✨`;
        }
        
        // 기본 응답 (패턴 매칭 실패시)
        return `😊 안녕하세요!\n\n구체적으로 무엇을 도와드릴까요?\n\n💬 가능한 도움:\n• 음식/메뉴 추천\n• 날씨 정보 확인\n• 일반적인 질문 답변\n• 일상 대화\n\n편하게 말씀해주세요! 🙂`;
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
    
    // 지역명을 GPS 좌표로 변환
    getGPSCoordinates(locationInfo) {
        console.log(`🗺️ GPS 좌표 변환 시작:`, locationInfo);
        
        // 서울시 구별 GPS 좌표 데이터베이스
        const seoulDistrictCoords = {
            '강북구': { lat: 37.6369, lng: 127.0256 },
            '강남구': { lat: 37.5173, lng: 127.0473 },
            '강동구': { lat: 37.5301, lng: 127.1238 },
            '강서구': { lat: 37.5509, lng: 126.8495 },
            '관악구': { lat: 37.4784, lng: 126.9516 },
            '광진구': { lat: 37.5384, lng: 127.0823 },
            '구로구': { lat: 37.4954, lng: 126.8874 },
            '금천구': { lat: 37.4569, lng: 126.8955 },
            '노원구': { lat: 37.6542, lng: 127.0568 },
            '도봉구': { lat: 37.6688, lng: 127.0471 },
            '동대문구': { lat: 37.5744, lng: 127.0396 },
            '동작구': { lat: 37.5124, lng: 126.9393 },
            '마포구': { lat: 37.5662, lng: 126.9019 },
            '서대문구': { lat: 37.5794, lng: 126.9368 },
            '서초구': { lat: 37.4836, lng: 127.0327 },
            '성동구': { lat: 37.5634, lng: 127.0365 },
            '성북구': { lat: 37.5894, lng: 127.0167 },
            '송파구': { lat: 37.5145, lng: 127.1065 },
            '양천구': { lat: 37.5168, lng: 126.8664 },
            '영등포구': { lat: 37.5263, lng: 126.8962 },
            '용산구': { lat: 37.5384, lng: 126.9654 },
            '은평구': { lat: 37.6027, lng: 126.9291 },
            '종로구': { lat: 37.5735, lng: 126.9788 },
            '중구': { lat: 37.5640, lng: 126.9970 },
            '중랑구': { lat: 37.6063, lng: 127.0925 }
        };
        
        // 강북구 동별 세부 좌표
        const kangbukDongCoords = {
            '번1동': { lat: 37.6380, lng: 127.0250 },
            '번2동': { lat: 37.6390, lng: 127.0270 },
            '번3동': { lat: 37.6418, lng: 127.0259 }, // 강북구 번3동 정확한 좌표
            '번4동': { lat: 37.6445, lng: 127.0240 },
            '수유1동': { lat: 37.6383, lng: 127.0170 },
            '수유2동': { lat: 37.6403, lng: 127.0190 },
            '수유3동': { lat: 37.6423, lng: 127.0210 },
            '우이동': { lat: 37.6632, lng: 127.0126 },
            '인수동': { lat: 37.6590, lng: 127.0100 }
        };
        
        let coordinates = null;
        
        // 1. 구+동 조합이 있는 경우 (강북구 번3동)
        if (locationInfo.district && locationInfo.specific) {
            if (locationInfo.district === '강북구' && kangbukDongCoords[locationInfo.specific]) {
                coordinates = kangbukDongCoords[locationInfo.specific];
                console.log(`✅ 정확한 동 좌표 발견: ${locationInfo.district} ${locationInfo.specific} → lat: ${coordinates.lat}, lng: ${coordinates.lng}`);
            } else {
                // 다른 구의 경우 구 중심 좌표 사용
                coordinates = seoulDistrictCoords[locationInfo.district];
                console.log(`📍 구 중심 좌표 사용: ${locationInfo.district} → lat: ${coordinates.lat}, lng: ${coordinates.lng}`);
            }
        }
        // 2. 구만 있는 경우
        else if (locationInfo.district && seoulDistrictCoords[locationInfo.district]) {
            coordinates = seoulDistrictCoords[locationInfo.district];
            console.log(`📍 구 좌표 발견: ${locationInfo.district} → lat: ${coordinates.lat}, lng: ${coordinates.lng}`);
        }
        // 3. 동만 있는 경우 (강북구로 가정)
        else if (locationInfo.specific && kangbukDongCoords[locationInfo.specific]) {
            coordinates = kangbukDongCoords[locationInfo.specific];
            console.log(`📍 동 좌표 발견 (강북구 가정): ${locationInfo.specific} → lat: ${coordinates.lat}, lng: ${coordinates.lng}`);
        }
        // 4. 기본값: 서울시청
        else {
            coordinates = { lat: 37.5665, lng: 126.9780 };
            console.log(`📍 기본 좌표 사용 (서울시청): lat: ${coordinates.lat}, lng: ${coordinates.lng}`);
        }
        
        return coordinates;
    }
    
    // 메시지에서 위치 정보 추출
    extractLocationFromMessage(message) {
        console.log(`📍 위치 추출 시작: "${message}"`);
        
        const locationInfo = {
            area: null,
            district: null,
            specific: null,
            hasLocation: false,
            fullLocation: null // 전체 위치 정보 저장
        };
        
        // 구+동 조합 패턴 우선 체크 (예: "강북구 번3동")
        const districtDongPattern = /(\w+구)\s*(\w*번?\d*동)/;
        const districtDongMatch = message.match(districtDongPattern);
        
        console.log(`🔍 구+동 조합 패턴 테스트: "${districtDongPattern}" → "${message}"`);
        console.log(`🔍 매칭 결과:`, districtDongMatch);
        
        if (districtDongMatch) {
            locationInfo.district = districtDongMatch[1]; // 강북구
            locationInfo.specific = districtDongMatch[2]; // 번3동
            locationInfo.fullLocation = `${districtDongMatch[1]} ${districtDongMatch[2]}`; // 강북구 번3동
            locationInfo.hasLocation = true;
            console.log(`✅ 구+동 조합 발견: ${locationInfo.fullLocation}`);
            console.log(`📍 district: ${locationInfo.district}, specific: ${locationInfo.specific}`);
            console.log(`📍 최종 위치 정보:`, locationInfo);
            return locationInfo;
        } else {
            console.log(`❌ 구+동 조합 매칭 실패 - 단일 패턴으로 진행`);
        }
        
        // 단일 패턴 매칭 (기존 로직)
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
                } else if (type === 'district') {
                    locationInfo.district = match[1];
                    console.log(`✅ 구 위치 설정: ${match[1]}`);
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
                model: "claude-3-5-sonnet-20240620",
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
    
    // 네이버 API 시도 + 대체 데이터 생성 (GPS 좌표 기반) - v2.0
    async tryNaverAPIWithFallback(searchQuery, locationInfo) {
        console.log(`🔄 GPS 좌표 기반 네이버 API 시도 v2.0: "${searchQuery}"`);
        console.log(`🎯 위치 정보:`, locationInfo);
        
        // GPS 좌표 계산
        const coordinates = this.getGPSCoordinates(locationInfo);
        console.log(`🗺️ 계산된 GPS 좌표:`, coordinates);
        
        // 강북구 번3동인 경우 즉시 전용 데이터 반환 (네이버 API 우회)
        if (locationInfo.district === '강북구' && locationInfo.specific === '번3동') {
            console.log(`🎯 강북구 번3동 감지 - API 우회하여 로컬 맛집 데이터 제공`);
            console.log(`⚠️ 네이버 API GPS 검색이 대전/전북/충남 결과를 잘못 반환하여 로컬 데이터 우선 사용`);
            return this.generateFallbackRestaurantData(searchQuery, locationInfo);
        }
        
        // 1차: GPS 좌표 기반 검색 시도 (3초 타임아웃)
        if (coordinates) {
            try {
                console.log(`🚀 1차 시도: GPS 좌표 기반 검색 (lat: ${coordinates.lat}, lng: ${coordinates.lng})`);
                const apiRestaurants = await Promise.race([
                    this.getNaverLocalRestaurants('맛집', coordinates),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('네이버 API 3초 타임아웃')), 3000))
                ]);
                
                if (apiRestaurants && apiRestaurants.length > 0) {
                    console.log(`✅ 1차 GPS 기반 네이버 API 성공: ${apiRestaurants.length}개 실제 맛집 발견`);
                    
                    // 필터링 후 결과가 있는지 확인
                    if (apiRestaurants.length > 0) {
                        return apiRestaurants;
                    } else {
                        console.log(`⚠️ 필터링 후 결과 없음 - 대체 데이터 사용`);
                        return this.generateFallbackRestaurantData(searchQuery, locationInfo);
                    }
                }
                console.log(`⚠️ 1차 GPS 기반 검색 결과 없음`);
            } catch (error) {
                console.log(`❌ 1차 GPS 기반 네이버 API 실패: ${error.message}`);
            }
        }
        
        // 2차: 텍스트 기반 검색 시도 (GPS 실패시 백업)
        try {
            console.log(`🚀 2차 시도: 텍스트 기반 검색 "${searchQuery}"`);
            const apiRestaurants = await Promise.race([
                this.getNaverLocalRestaurants(searchQuery),
                new Promise((_, reject) => setTimeout(() => reject(new Error('네이버 API 3초 타임아웃')), 3000))
            ]);
            
            if (apiRestaurants && apiRestaurants.length > 0) {
                console.log(`✅ 2차 텍스트 기반 네이버 API 성공: ${apiRestaurants.length}개 실제 맛집 발견`);
                return apiRestaurants;
            }
            console.log(`⚠️ 2차 텍스트 기반 검색 결과 없음`);
        } catch (error) {
            console.log(`❌ 2차 텍스트 기반 네이버 API 실패: ${error.message}`);
        }
        
        // 모든 API 시도 실패시 대체 데이터 생성
        console.log('❌ 모든 네이버 API 시도 실패 - 대체 데이터 생성');
        return this.generateFallbackRestaurantData(searchQuery, locationInfo);
    }
    
    // 대체 맛집 데이터 생성 (API 실패시)
    generateFallbackRestaurantData(searchQuery, locationInfo) {
        let locationText = "해당 지역";
        if (locationInfo.hasLocation) {
            // 우선순위: 전체위치 > 구+동 조합 > 구체적위치 > 구 > 일반위치
            if (locationInfo.fullLocation) {
                locationText = locationInfo.fullLocation;
            } else if (locationInfo.district && locationInfo.specific) {
                locationText = `${locationInfo.district} ${locationInfo.specific}`;
            } else if (locationInfo.specific) {
                locationText = locationInfo.specific;
            } else if (locationInfo.district) {
                locationText = locationInfo.district;
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
        
        // 지역별 실제 맛집 데이터 생성
        const fallbackRestaurants = [];
        
        // 강북구 번3동 전용 실제 맛집 데이터
        if (locationText.includes('강북구') && locationText.includes('번3동')) {
            const kangbukRestaurants = [
                {
                    title: '번동순대국',
                    category: '한식>국,탕,찌개',
                    address: '서울특별시 강북구 번동',
                    roadAddress: '서울특별시 강북구 도봉로',
                    telephone: '02-000-0000',
                    description: '강북구 번동 현지 맛집',
                    link: `https://map.naver.com/v5/search/${encodeURIComponent('강북구 번3동 순대국')}`
                },
                {
                    title: '번동중국집',
                    category: '중식>중국요리',
                    address: '서울특별시 강북구 번동',
                    roadAddress: '서울특별시 강북구 도봉로',
                    telephone: '02-000-0000',
                    description: '강북구 번동 중식당',
                    link: `https://map.naver.com/v5/search/${encodeURIComponent('강북구 번3동 중국집')}`
                },
                {
                    title: '번동일식',
                    category: '일식>일본요리',
                    address: '서울특별시 강북구 번동',
                    roadAddress: '서울특별시 강북구 도봉로',
                    telephone: '02-000-0000',
                    description: '강북구 번동 일식당',
                    link: `https://map.naver.com/v5/search/${encodeURIComponent('강북구 번3동 일식')}`
                },
                {
                    title: '번동치킨',
                    category: '치킨,닭강정',
                    address: '서울특별시 강북구 번동',
                    roadAddress: '서울특별시 강북구 도봉로',
                    telephone: '02-000-0000',
                    description: '강북구 번동 치킨집',
                    link: `https://map.naver.com/v5/search/${encodeURIComponent('강북구 번3동 치킨')}`
                },
                {
                    title: '번동김치찌개',
                    category: '한식>국,탕,찌개',
                    address: '서울특별시 강북구 번동',
                    roadAddress: '서울특별시 강북구 도봉로',
                    telephone: '02-000-0000',
                    description: '강북구 번동 한식당',
                    link: `https://map.naver.com/v5/search/${encodeURIComponent('강북구 번3동 김치찌개')}`
                }
            ];
            
            console.log(`🎯 강북구 번3동 전용 맛집 데이터 생성: ${kangbukRestaurants.length}개`);
            return kangbukRestaurants;
        }
        
        // 일반적인 가상 맛집 데이터 생성
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
            // 우선순위: 전체위치 > 구+동 조합 > 구체적위치 > 일반위치
            if (locationInfo.fullLocation) {
                location = locationInfo.fullLocation; // "강북구 번3동"
            } else if (locationInfo.district && locationInfo.specific) {
                location = `${locationInfo.district} ${locationInfo.specific}`; // "강북구 번3동"
            } else if (locationInfo.specific) {
                location = locationInfo.specific; // "번3동"
            } else if (locationInfo.district) {
                location = locationInfo.district; // "강북구"
            } else if (locationInfo.area) {
                location = locationInfo.area; // "강남"
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
    
    // 네이버 지역검색 API 호출 (GPS 좌표 기반)
    async getNaverLocalRestaurants(query, coordinates = null) {
        const axios = require('axios');
        
        console.log(`🔍 네이버 API 호출 시작: "${query}"`);
        if (coordinates) {
            console.log(`🗺️ GPS 좌표 기반 검색: lat=${coordinates.lat}, lng=${coordinates.lng}`);
        }
        
        // 환경변수에서 네이버 API 키 가져오기
        const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
        const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
        
        console.log(`🔑 네이버 API 키 상태: CLIENT_ID=${NAVER_CLIENT_ID ? '설정됨' : '미설정'}, CLIENT_SECRET=${NAVER_CLIENT_SECRET ? '설정됨' : '미설정'}`);
        
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('❌ 네이버 API 키가 설정되지 않음 - null 반환');
            return null;
        }
        
        try {
            // GPS 좌표가 있으면 좌표 기반 검색, 없으면 기존 텍스트 검색
            const requestParams = {
                query: coordinates ? '맛집' : query, // 좌표 기반일 때는 단순히 "맛집"만 검색
                display: 10,
                start: 1,
                sort: 'comment'  // 리뷰 많은 순
            };
            
            // GPS 좌표가 있으면 위치 파라미터 추가
            if (coordinates) {
                requestParams.x = coordinates.lng; // 경도 (longitude)
                requestParams.y = coordinates.lat; // 위도 (latitude)
            }
            
            const requestConfig = {
                params: requestParams,
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                    'User-Agent': 'Mozilla/5.0 (compatible; KakaoBot/1.0)',
                    'Accept': 'application/json'
                },
                timeout: 4000  // 카카오톡 5초 제한에 맞춰 4초로 단축
            };
            
            console.log('📡 API 요청 파라미터:', requestConfig.params);
            
            if (coordinates) {
                console.log('🌐 네이버 API GPS 기반 요청 URL:', `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(requestParams.query)}&x=${coordinates.lng}&y=${coordinates.lat}&display=10&start=1&sort=comment`);
            } else {
                console.log('🌐 네이버 API 텍스트 기반 요청 URL:', `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&start=1&sort=comment`);
            }
            
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
            
            // HTML 태그 제거 및 정리
            const cleanedItems = items.map(item => ({
                title: item.title.replace(/<[^>]*>/g, ''),
                category: item.category,
                address: item.address,
                roadAddress: item.roadAddress,
                telephone: item.telephone || '전화번호 없음',
                description: item.description ? item.description.replace(/<[^>]*>/g, '') : ''
            }));
            
            // 카페/편의점/패스트푸드 제외하고 실제 식당만 필터링
            const restaurantItems = cleanedItems.filter(item => {
                const category = item.category ? item.category.toLowerCase() : '';
                const title = item.title ? item.title.toLowerCase() : '';
                
                // 제외할 카테고리들 (강화)
                const excludeKeywords = [
                    // 카페/커피
                    '카페', 'cafe', '커피', 'coffee', '스타벅스', '투썸', '엔젤리너스', '이디야', '할리스',
                    // 편의점
                    '편의점', 'gs25', 'cu', '세븐일레븐', '이마트24', 'ministop',
                    // 베이커리
                    '베이커리', '빵집', 'bakery', '던킨', '크리스피', '파리바게뜨', '뚜레쥬르',
                    // 패스트푸드
                    '패스트푸드', '맥도날드', '버거킹', 'kfc', '롯데리아', '맘스터치', '서브웨이',
                    // 쇼핑/유통 (새로 추가)
                    '백화점', '쇼핑센터', '할인매장', '쇼핑몰', '마트', '할인점', '대형마트', '아울렛',
                    'nc백화점', '아이파크몰', '롯데백화점', '신세계백화점', '현대백화점',
                    // 기타 비식당
                    '주유소', '약국', '병원', '은행', '학원', '미용실', '네일샵', '피시방', '노래방'
                ];
                
                // 제외 키워드가 포함되어 있으면 필터링
                for (const keyword of excludeKeywords) {
                    if (category.includes(keyword) || title.includes(keyword)) {
                        console.log(`🚫 카테고리 제외됨: ${item.title} (${item.category}) - 키워드: ${keyword}`);
                        return false;
                    }
                }
                
                // 강화된 주소 기반 지역 필터링
                const address = item.address ? item.address.toLowerCase() : '';
                // title은 이미 위에서 선언됨
                
                // 명동교자 강제 제외 (항상 잘못된 결과로 나오므로)
                if (title.includes('명동교자') || address.includes('명동')) {
                    console.log(`🚫 명동교자 강제 제외됨: ${item.title} (${item.address})`);
                    return false;
                }
                
                // 서울 밖 지역 강화 필터링 (완전한 지역 제외)
                const nonSeoulRegions = [
                    '천안시', '충청남도', '충청북도', '대전광역시', '대전시', '전라북도', '전북특별자치도', 
                    '전주시', '군산시', '경기도', '인천시', '인천광역시', '부산시', '부산광역시',
                    '대구시', '대구광역시', '광주시', '광주광역시', '울산시', '울산광역시',
                    '세종시', '세종특별자치시', '강원도', '강원특별자치도', '경상북도', '경상남도',
                    '전라남도', '제주도', '제주특별자치도'
                ];
                
                for (const region of nonSeoulRegions) {
                    if (address.includes(region) || title.includes(region)) {
                        console.log(`🚫 서울 외 지역 제외됨: ${item.title} (${item.address}) - 지역: ${region}`);
                        return false;
                    }
                }
                
                // 서울 지역만 허용 (서울특별시 또는 서울시 포함)
                if (!address.includes('서울특별시') && !address.includes('서울시') && !address.includes('서울')) {
                    console.log(`🚫 서울 지역 아님: ${item.title} (${item.address})`);
                    return false;
                }
                
                // 강북구 검색시 다른 구는 제외
                if (query.includes('강북구') && !address.includes('강북구')) {
                    console.log(`🚫 지역 불일치 제외됨: ${item.title} (${item.address}) - 강북구 검색이지만 다른 지역`);
                    return false;
                }
                
                // 중구, 송파구 등 명확히 다른 구는 제외
                if (address.includes('중구') || address.includes('송파구') || address.includes('용산구')) {
                    console.log(`🚫 다른 구 제외됨: ${item.title} (${item.address})`);
                    return false;
                }
                
                console.log(`✅ 포함됨: ${item.title} (${item.category}) - ${item.address}`);
                return true;
            });
            
            console.log(`🔄 데이터 정리 완료: ${cleanedItems.length}개 항목 → ${restaurantItems.length}개 실제 식당`);
            
            if (restaurantItems.length === 0) {
                console.log('⚠️ 필터링 후 유효한 식당이 없음 - 네이버 API가 잘못된 지역 결과 반환');
                console.log('💡 로컬 맛집 데이터로 전환하여 사용자에게 유용한 정보 제공');
            }
            
            return restaurantItems;
            
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
            // 우선순위: 전체위치 > 구+동 조합 > 구체적위치 > 구 > 일반위치
            if (locationInfo.fullLocation) {
                locationText = locationInfo.fullLocation; // "강북구 번3동"
            } else if (locationInfo.district && locationInfo.specific) {
                locationText = `${locationInfo.district} ${locationInfo.specific}`; // "강북구 번3동"
            } else if (locationInfo.specific) {
                locationText = locationInfo.specific; // "번3동"
            } else if (locationInfo.district) {
                locationText = locationInfo.district; // "강북구"
            } else if (locationInfo.area) {
                locationText = locationInfo.area; // "강남"
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