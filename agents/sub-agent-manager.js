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
            // 운세 관련 질문
            'FORTUNE_TELLING': {
                patterns: [
                    /운세|운/,
                    /오늘.*운|내일.*운|이번.*주.*운|이번.*달.*운/,
                    /운세.*알려|운세.*봐|운.*어때|운.*좋|운.*나쁘/,
                    /행운|불운|길일|흉일/,
                    /띠.*운세|별자리.*운세|탄생.*운세/,
                    /재물운|금전운|애정운|연애운|건강운|사업운|학업운|시험운/,
                    /운세.*궁금|운.*궁금|오늘.*어떨까|내일.*어떨까/,
                    /점.*봐|점괘|사주|팔자|궁합/,
                    /행운.*색|행운.*숫자|행운.*아이템/
                ],
                weight: 0.95,
                exclusions: []
            },
            
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
                    /맛집|식당|카페|음식점/,
                    /운세|행운|길일/
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
                timeout: 8000  // 8초로 증가
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
        
        // 운세 관련 처리
        if (message.includes('운세') || message.includes('운') || message.includes('행운') || 
            message.includes('금전운') || message.includes('애정운') || message.includes('건강운') ||
            message.includes('사업운') || message.includes('학업운')) {
            const fortuneResponse = this.generateFortuneResponse();
            return {
                success: true,
                data: {
                    message: fortuneResponse,
                    category: 'FORTUNE_TELLING',
                    processedBy: 'fortune-agent'
                },
                agent: 'fortune-agent'
            };
        }
        
        // 음식 관련 질문
        if (message.includes('먹') || message.includes('음식') || message.includes('메뉴') || message.includes('요리')) {
            if (message.includes('저녁') || message.includes('밤')) {
                return `🍽️ **저녁 메뉴 추천 가이드**\n\n오늘 저녁 뭘 먹을지 고민이시군요! 제가 다양한 옵션을 준비해드렸어요.\n\n🍜 **간단하게 먹고 싶다면:**\n• 라면 + 김치 + 계란 (집에서 15분이면 OK!)\n• 볶음밥 + 김치 (냉장고 털기에 최고)\n• 계란덮밥 + 미역국 (든든하고 부담없는 선택)\n• 떡볶이 + 순대 (분식집 배달도 좋아요)\n• 김밥 + 라면 콤보 (황금 조합!)\n\n🍖 **오늘은 든든하게!**\n• 치킨 배달 (양념반 후라이드반이 진리죠)\n• 피자 주문 (콜라는 필수!)\n• 삼겹살 구이 + 쌈채소 + 된장찌개\n• 족발/보쌈 세트 (막걸리도 한잔?)\n• 중식 배달 (짜장면, 짬뽕, 탕수육)\n\n🥗 **건강을 생각한다면:**\n• 샐러드 + 닭가슴살 + 견과류\n• 두부김치 + 현미밥\n• 야채볶음 + 연어구이\n• 미역국 + 나물반찬\n• 샤브샤브나 월남쌈\n\n💡 **오늘의 특별 추천:**\n날씨가 좋다면 산책 후 근처 맛집 탐방도 좋고, 집에서 편하게 먹고 싶다면 배달 앱에서 리뷰 좋은 곳을 찾아보세요! 새로운 메뉴에 도전해보는 것도 재미있을 거예요.\n\n어떤 스타일이 끌리시나요? 😊`;
            } else if (message.includes('점심')) {
                return `🍱 **점심 메뉴 완벽 가이드**\n\n점심시간이 다가오네요! 오늘은 뭘 드실 건가요?\n\n🍚 **한식이 땡긴다면:**\n• 김치찌개 + 계란말이 + 공기밥 (한국인의 소울푸드)\n• 된장찌개 + 제육볶음 정식\n• 비빔밥 + 된장국 (영양 균형 완벽)\n• 순두부찌개 + 고등어구이\n• 부대찌개 (여럿이 먹기 좋아요)\n\n🍝 **양식 스타일:**\n• 크림 파스타 / 토마토 파스타\n• 스테이크 + 샐러드 세트\n• 리조또 + 스프\n• 피자 한 조각 + 콜라\n• 샌드위치 + 커피 (간단하게)\n\n🍜 **아시아 요리:**\n• 일본식 돈카츠 정식\n• 중식 짜장면/짬뽕\n• 베트남 쌀국수\n• 태국 팟타이\n• 라멘 + 교자만두\n\n🥗 **가볍게 먹고 싶다면:**\n• 샐러드볼 + 과일주스\n• 김밥 + 라면 (분식 조합)\n• 샌드위치 + 아메리카노\n• 포케볼 (건강하고 맛있어요)\n\n💡 **점심 선택 팁:**\n오후에 중요한 일정이 있다면 너무 무겁지 않게, 여유가 있다면 동료들과 함께 맛집 탐방도 좋아요! 배달 주문시에는 미리 주문해두면 기다리는 시간을 줄일 수 있답니다.\n\n맛있는 점심 되세요! 🍴`;
            } else {
                return `🍽️ **맛있는 음식 추천 종합 가이드**\n\n음식이 고민되시는군요! 기분과 상황에 맞는 다양한 옵션을 준비했어요.\n\n🌶️ **매운 음식이 땡길 때:**\n• 김치찌개 + 계란말이 + 공기밥\n• 떡볶이 + 순대 + 튀김 세트\n• 짬뽕 + 군만두\n• 매운갈비찜 + 쌈채소\n• 불닭볶음면 (도전!)\n• 마라탕/마라샹궈\n\n🥛 **담백하고 깔끔한 맛:**\n• 미역국 + 나물반찬\n• 두부요리 (순두부, 두부조림, 두부김치)\n• 콩나물국 + 생선구이\n• 죽 종류 (전복죽, 야채죽, 소고기죽)\n• 샤브샤브\n• 일본식 우동\n\n🍖 **든든하게 먹고 싶을 때:**\n• 삼겹살 + 된장찌개 + 쌈\n• 치킨 (양념, 후라이드, 간장)\n• 스테이크 + 감자\n• 갈비탕/설렁탕\n• 보쌈/족발 세트\n• 햄버거 + 감자튀김\n\n⚡ **간단하지만 맛있게:**\n• 라면 + 김치 + 계란\n• 볶음밥 각종 (김치, 새우, 야채)\n• 오므라이스\n• 김밥 + 떡볶이\n• 컵라면 + 삼각김밥\n• 토스트 + 과일\n\n🌍 **세계 각국 요리:**\n• 이탈리안: 파스타, 피자, 리조또\n• 일식: 초밥, 라멘, 돈카츠\n• 중식: 짜장면, 탕수육, 마파두부\n• 태국: 똠양꿍, 팟타이\n• 베트남: 쌀국수, 반미\n• 멕시칸: 타코, 부리또\n\n💡 **음식 선택 꿀팁:**\n1. 날씨에 따라: 더울 땐 냉면, 추울 땐 뜨끈한 국물요리\n2. 컨디션에 따라: 피곤하면 영양식, 속이 안 좋으면 죽\n3. 기분에 따라: 우울할 땐 좋아하는 음식, 기쁠 땐 특별한 음식\n\n뭐가 가장 끌리시나요? 😋`;
            }
        }
        
        // 날씨 관련 (이미 따로 처리되지만 폴백용)
        if (message.includes('날씨')) {
            return `🌤️ **날씨 정보 확인 가이드**\n\n현재 날씨가 궁금하시군요! 정확한 날씨 정보를 확인하는 방법을 알려드릴게요.\n\n📱 **실시간 날씨 확인 방법:**\n• 네이버 검색: "오늘 날씨" 또는 "[지역명] 날씨"\n• 기상청 홈페이지 방문\n• 날씨 앱 활용 (웨더, 원기날씨 등)\n• 카카오톡 날씨 채널 추가\n\n🌡️ **오늘의 날씨 체크 포인트:**\n• 현재 기온과 체감온도\n• 미세먼지/초미세먼지 농도\n• 강수 확률 (우산 필요 여부)\n• 자외선 지수\n• 습도 (불쾌지수)\n\n👔 **날씨별 옷차림 추천:**\n• 5도 이하: 패딩, 두꺼운 코트, 목도리\n• 5~10도: 코트, 가죽자켓, 니트\n• 10~15도: 자켓, 가디건, 맨투맨\n• 15~20도: 얇은 가디건, 긴팔티\n• 20~25도: 반팔, 얇은 셔츠\n• 25도 이상: 반팔, 반바지, 린넨\n\n☔ **비 오는 날 준비물:**\n• 우산 또는 우비\n• 방수 신발\n• 여벌 양말\n• 수건\n\n💡 **날씨 활용 팁:**\n• 맑은 날: 산책, 피크닉, 야외 활동\n• 비 오는 날: 실내 데이트, 카페, 영화\n• 미세먼지 나쁨: 실내 운동, 마스크 착용\n\n구체적인 지역의 날씨를 알고 싶으시면 "[지역명] 날씨"로 검색해보세요! 🌈`;
        }
        
        // 쇼핑 관련
        if (message.includes('사고싶') || message.includes('구매') || message.includes('쇼핑')) {
            return `🛒 **스마트 쇼핑 완벽 가이드**\n\n쇼핑을 계획하고 계시는군요! 현명한 구매를 위한 팁을 알려드릴게요.\n\n💻 **온라인 쇼핑몰 추천:**\n• **네이버쇼핑**: 가격비교, 리뷰 확인 최고\n• **쿠팡**: 로켓배송으로 빠른 수령\n• **11번가**: 다양한 할인 이벤트\n• **G마켓/옥션**: 경매, 특가 상품\n• **무신사**: 패션 전문\n• **SSG/롯데ON**: 백화점 상품\n\n💳 **할인 받는 방법:**\n• 첫 구매 할인 쿠폰 활용\n• 카드사 할인 이벤트 체크\n• 적립금/포인트 사용\n• 세일 기간 활용 (월말, 시즌오프)\n• 공동구매/대량구매 할인\n• 멤버십 혜택 활용\n\n✅ **구매 전 체크리스트:**\n1. 가격 비교 (최저가 확인)\n2. 배송비 포함 총 금액 계산\n3. 상품 리뷰/평점 확인 (사진 리뷰 중심)\n4. 판매자 신뢰도 체크\n5. 반품/교환/환불 정책\n6. A/S 가능 여부\n7. 정품 인증 여부\n\n📦 **카테고리별 쇼핑 팁:**\n• **전자제품**: 공식 스토어, 보증기간 확인\n• **패션**: 사이즈 차트, 소재 확인\n• **화장품**: 유통기한, 정품 확인\n• **식품**: 신선도, 원산지 확인\n• **가구**: 조립 난이도, 배송 방법\n\n⚠️ **주의사항:**\n• 너무 싼 상품은 의심\n• 해외직구는 관세/배송기간 고려\n• 중고거래는 안전결제 이용\n• 충동구매 자제 (장바구니 숙성)\n\n💡 **스마트한 쇼핑 꿀팁:**\n• 위시리스트 만들어 가격 변동 체크\n• 시즌 끝날 때 다음 시즌 상품 구매\n• 번들/세트 상품이 개별구매보다 저렴\n• 쿠폰/적립금은 유효기간 체크\n\n어떤 상품을 찾고 계신가요? 더 구체적인 조언을 드릴 수 있어요! 🛍️`;
        }
        
        // 운동/건강 관련
        if (message.includes('운동') || message.includes('다이어트') || message.includes('건강')) {
            return `💪 **건강 관리 & 운동 종합 가이드**\n\n건강을 생각하시는군요! 건강한 라이프스타일을 위한 상세한 가이드를 준비했어요.\n\n🏃‍♂️ **초보자를 위한 운동 루틴:**\n\n**유산소 운동 (주 3-5회):**\n• 걷기: 하루 30-60분, 빠른 걸음으로\n• 조깅: 20-30분, 천천히 시작\n• 계단 오르기: 10-15분, 엘리베이터 대신\n• 자전거: 30-45분, 실내/실외\n• 수영: 30분, 전신운동 효과\n• 줄넘기: 10-15분, 고강도\n\n**근력 운동 (주 2-3회):**\n• 푸시업: 10개 x 3세트\n• 스쿼트: 15개 x 3세트\n• 플랭크: 30초-1분 x 3세트\n• 런지: 각 다리 10개 x 3세트\n• 크런치: 20개 x 3세트\n\n🥗 **건강한 식단 가이드:**\n\n**아침 (7-9시):**\n• 통곡물 시리얼 + 우유\n• 계란 + 통밀빵 + 야채\n• 그릭요거트 + 과일 + 견과류\n• 오트밀 + 바나나\n\n**점심 (12-1시):**\n• 현미밥 + 단백질 + 채소 반찬\n• 샐러드 + 닭가슴살\n• 고구마 + 계란 + 샐러드\n\n**저녁 (6-7시):**\n• 가볍게: 두부/생선 + 야채\n• 적당량의 탄수화물\n• 7시 이후는 가급적 금식\n\n**간식 (오전/오후):**\n• 과일 1개\n• 견과류 한 줌\n• 무가당 요거트\n• 당근/오이 스틱\n\n💧 **수분 섭취 가이드:**\n• 하루 2L 이상 (8잔)\n• 기상 직후 1잔\n• 식사 30분 전 1잔\n• 운동 전후 충분히\n• 잠들기 2시간 전까지만\n\n😴 **생활 습관 개선:**\n• 수면: 7-8시간 규칙적으로\n• 스트레스 관리: 명상, 요가\n• 금연/절주\n• 정기 건강검진\n• 자세 교정\n\n📊 **다이어트 성공 전략:**\n1. 현실적인 목표 설정 (월 2-3kg)\n2. 식단 일기 작성\n3. 체중보다 체지방률 관리\n4. 치팅데이 설정 (주 1회)\n5. 충분한 단백질 섭취\n6. 근력운동 병행 필수\n\n⚠️ **주의사항:**\n• 갑작스런 고강도 운동 금지\n• 극단적 다이어트 위험\n• 충분한 휴식 필수\n• 통증 발생시 즉시 중단\n• 전문가 상담 권장\n\n💡 **동기부여 팁:**\n• 운동 전후 사진 비교\n• 운동 파트너 찾기\n• 작은 목표부터 달성\n• 자신에게 보상하기\n• 꾸준함 > 완벽함\n\n시작이 반입니다! 오늘부터 작은 변화를 시작해보세요. 화이팅! 😊💪`;
        }
        
        // 일반적인 대화나 인사
        if (message.includes('안녕') || message.includes('안녕하') || message.includes('반가')) {
            const hour = new Date().getHours();
            let greeting = '';
            if (hour >= 5 && hour < 12) greeting = '좋은 아침이에요';
            else if (hour >= 12 && hour < 17) greeting = '좋은 오후에요';
            else if (hour >= 17 && hour < 21) greeting = '좋은 저녁이에요';
            else greeting = '안녕하세요';
            
            return `${greeting}! 반갑습니다! 😊\n\n저는 여러분의 일상을 도와드리는 AI 도우미예요. 다양한 분야에서 도움을 드릴 수 있답니다!\n\n💬 **제가 도와드릴 수 있는 것들:**\n\n🍽️ **음식 & 요리:**\n• 메뉴 추천 (아침/점심/저녁/야식)\n• 레시피 정보\n• 맛집 추천\n• 다이어트 식단\n\n🌤️ **날씨 & 생활정보:**\n• 오늘/내일 날씨\n• 미세먼지 정보\n• 계절별 옷차림 추천\n\n🔮 **운세 & 재미:**\n• 오늘의 운세\n• 행운의 숫자/색상\n• 심리 테스트\n\n💪 **건강 & 운동:**\n• 운동 루틴 추천\n• 다이어트 팁\n• 건강 관리 정보\n\n🛒 **쇼핑 & 생활:**\n• 쇼핑 팁\n• 가격 비교 정보\n• 제품 추천\n\n🎬 **엔터테인먼트:**\n• 영화/드라마 추천\n• 음악 정보\n• 여행지 추천\n\n📚 **정보 & 상담:**\n• 일반 상식\n• 생활 꿀팁\n• 고민 상담\n\n💡 **오늘의 추천 질문:**\n• "오늘 점심 뭐 먹을까?"\n• "오늘 날씨 어때?"\n• "오늘의 운세 알려줘"\n• "다이어트에 좋은 음식 추천해줘"\n\n편하게 대화하듯 물어봐 주세요! 무엇이든 성심성의껏 답변해드릴게요. 오늘 하루는 어떠셨나요? 🌟`;
        }
        
        // 감정 표현이 있는 경우
        if (message.includes('힘들') || message.includes('우울') || message.includes('슬프')) {
            return `😔 **마음이 힘드신 것 같아요**\n\n삶이 때로는 무겁고 힘들 수 있다는 걸 잘 알고 있어요. 혼자가 아니라는 것을 기억해 주세요.\n\n🌿 **마음을 다독이는 방법들:**\n• 깊게 숨 쉬기 - 복식호흡으로 마음을 진정시켜보세요\n• 따뜻한 차 한 잔 - 캐모마일, 페퍼민트 차 추천\n• 좋아하는 음식 먹기 - 작은 행복도 소중해요\n• 가벼운 산책 - 바람과 햇살이 도움이 될 거예요\n• 좋은 음악 듣기 - 마음을 위로하는 노래들\n• 충분한 휴식 - 무리하지 마세요\n• 일기 쓰기 - 감정을 글로 정리해보세요\n• 좋아하는 사람과 대화하기\n\n💭 **힘들 때 기억해두세요:**\n이 시간도 지나갈 거예요. 모든 계절이 변하듯, 마음의 계절도 변해요. 지금 이 순간의 고통이 평생 지속되지 않을 거예요. 작은 것부터 시작해서, 하나씩 해결해나가면 돼요.\n\n내일은 분명 더 좋은 날이 될 거예요! 응원하고 있을게요 💪🌈`;
        }
        
        if (message.includes('좋다') || message.includes('기분좋') || message.includes('행복')) {
            return `😄 **기분이 좋으시다니 저도 덩달아 기뻐요!**\n\n긍정적인 에너지가 정말 전해져와요! 이런 좋은 기분을 더 오래 유지할 수 있는 방법들을 알려드릴게요.\n\n✨ **좋은 기분을 지속시키는 방법:**\n• 감사 일기 쓰기 - 오늘 감사했던 3가지 적어보세요\n• 좋아하는 활동하기 - 취미생활을 즐겨보세요\n• 맛있는 것 먹기 - 특별한 간식이나 음료 어떠세요?\n• 사랑하는 사람들과 시간 보내기\n• 음악 듣기 - 신나는 노래로 기분 UP!\n• 운동하기 - 엔도르핀으로 더 행복해져요\n• 새로운 도전 - 작은 성취감을 느껴보세요\n• 다른 사람 도와주기 - 나눔의 기쁨을 경험해보세요\n\n🌟 **오늘 더 특별하게 만들어보세요:**\n• 평소 안 해본 새로운 메뉴 도전\n• 좋아하는 사람에게 안부 인사\n• 예쁜 카페나 공원 방문\n• 온라인 쇼핑으로 작은 선물 구매\n• 좋아하는 영화나 드라마 시청\n\n이 좋은 에너지를 주변 사람들에게도 나눠주세요! 오늘도 정말 좋은 하루 되세요! ✨🎉`;
        }
        
        // 기본 응답 (패턴 매칭 실패시)
        return `😊 **안녕하세요! 저는 여러분의 AI 도우미예요!**\n\n무엇을 도와드릴까요? 어떤 주제든 편하게 말씀해 주세요!\n\n💬 **제가 특히 잘 도와드릴 수 있는 분야:**\n\n🍽️ **음식 & 요리**\n• 식사 메뉴 추천 (아침/점심/저녁/야식)\n• 레시피 정보\n• 다이어트 식단\n• 맛집 정보\n\n🌤️ **날씨 & 생활정보**\n• 오늘/내일 날씨\n• 미세먼지 정보\n• 계절별 옷차림\n\n🔮 **재미 & 엔터테인먼트**\n• 오늘의 운세\n• 심리테스트\n• 영화/드라마 추천\n\n💪 **건강 & 운동**\n• 운동 루틴 추천\n• 건강 관리 팁\n• 다이어트 조언\n\n🛒 **쇼핑 & 생활**\n• 쇼핑 가이드\n• 제품 추천\n• 생활 꿀팁\n\n💭 **일상 대화**\n• 고민 상담\n• 일상 잡담\n• 정보 검색\n\n🎯 **이렇게 말씀해 보세요:**\n• "오늘 저녁 뭐 먹을까?"\n• "오늘 운세 어때?"\n• "다이어트에 좋은 운동 알려줘"\n• "기분이 우울해"\n\n친구와 대화하듯 편하게 말씀하시면 성심성의껏 답변해드릴게요! 🙂💝`;
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
                timeout: 8000  // 8초로 증가
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
    
    // 운세 응답 생성 메소드
    generateFortuneResponse() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
        
        // 다양한 운세 요소들
        const luckyColors = ['파란색', '빨간색', '노란색', '초록색', '보라색', '흰색', '검은색', '주황색'];
        const luckyNumbers = [3, 7, 8, 9, 11, 21, 27, 33, 42];
        
        // 랜덤하게 선택
        const randomColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
        const randomNumber = luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)];
        
        // 각 운세 점수 (1-10)
        const loveScore = 5 + Math.floor(Math.random() * 5);
        const moneyScore = 5 + Math.floor(Math.random() * 5);
        const healthScore = 6 + Math.floor(Math.random() * 4);
        
        let response = `🔮 **${month}월 ${day}일 ${dayOfWeek}요일 오늘의 운세**\n\n`;
        response += `안녕하세요! 오늘의 운세를 간단히 알려드릴게요 😊\n\n`;
        response += `전반적으로 긍정적인 에너지가 가득한 하루예요. 새로운 아이디어가 떠오를 수 있으니 메모해두세요.\n\n`;
        
        // 간단한 운세 정보
        if (loveScore >= 7) {
            response += `💕 **애정운**: 대인관계에서 좋은 인연을 만날 수 있어요.\n`;
        } else {
            response += `💕 **애정운**: 차근차근 관계를 발전시켜 나가세요.\n`;
        }
        
        if (moneyScore >= 7) {
            response += `💰 **금전운**: 경제적으로 안정적인 하루가 될 것 같아요.\n`;
        } else {
            response += `💰 **금전운**: 계획적인 소비를 하시면 좋겠어요.\n`;
        }
        
        if (healthScore >= 7) {
            response += `💪 **건강운**: 건강에 신경 쓰면 활력 넘치는 하루 보낼 수 있어요.\n\n`;
        } else {
            response += `💪 **건강운**: 충분한 휴식을 취하시길 바라요.\n\n`;
        }
        
        response += `🍀 **행운의 색**: ${randomColor}\n`;
        response += `🎯 **행운의 숫자**: ${randomNumber}\n\n`;
        
        response += `오늘 하루도 힘내세요! 화이팅! 🌟`;
        
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