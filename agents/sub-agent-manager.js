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
            console.log(`🎯 분류 결과: ${classification.category} (신뢰도: ${classification.confidence})`);
            
            // 2단계: 분류된 의도에 따라 적절한 전문 에이전트로 라우팅
            const targetAgent = this.selectTargetAgent(classification);
            
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
            console.log(`🚀 ${targetAgent} 에이전트로 위임`);
            return await this.delegateToAgent(targetAgent, {
                message: userMessage,
                userId: userId,
                classification: classification,
                context: context
            });
            
        } catch (error) {
            console.error('❌ 서브에이전트 라우팅 오류:', error);
            return this.createErrorResponse('서비스 처리 중 오류가 발생했습니다.');
        }
    }
    
    // 적절한 에이전트 선택
    selectTargetAgent(classification) {
        const agentMapping = {
            'CONVERSATIONAL': 'information-agent',  // 자연스러운 대화는 정보 에이전트가 처리
            'INFORMATION_QUERY': 'information-agent',
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
        
        return agentMapping[classification.category] || 'information-agent';  // 기본값을 information-agent로
    }
    
    // 에이전트에게 작업 위임
    async delegateToAgent(agentId, taskData) {
        const agent = this.agents.get(agentId);
        
        if (!agent) {
            return this.createErrorResponse(`에이전트 '${agentId}'를 찾을 수 없습니다.`);
        }
        
        console.log(`🔄 ${agent.name}에게 작업 위임 중...`);
        
        try {
            const result = await agent.processor(taskData);
            console.log(`✅ ${agent.name} 처리 완료`);
            return result;
        } catch (error) {
            console.error(`❌ ${agent.name} 처리 오류:`, error);
            return this.createErrorResponse(`${agent.name} 처리 중 오류가 발생했습니다.`);
        }
    }
    
    // === 에이전트 처리 함수들 ===
    
    // 의도 분류 에이전트 (개선된 자연스러운 대화 분석)
    async processIntentClassification(taskData) {
        const { message, userId, context } = taskData;
        
        console.log('🧠 의도 분류 에이전트 시작');
        
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
        console.log('🔍 향상된 의도 분류 시작');
        
        // 1단계: 자연스러운 대화 분석 (안전한 처리)
        let conversationalAnalysis;
        try {
            conversationalAnalysis = this.analyzeConversationalContext(message, context || {});
        } catch (error) {
            console.error('❌ 대화 분석 오류:', error);
            conversationalAnalysis = {
                isEmotionalExpression: false,
                emotionType: null,
                isContextualStatement: false,
                needsEmpathyResponse: false,
                topicShift: false
            };
        }
        
        // 2단계: 명확한 패턴 매칭
        const explicitPatterns = {
            // 일반 대화/상담 (문맥적 표현)
            'CONVERSATIONAL': {
                patterns: [
                    /.*더위에.*어떻게.*해/, /.*추위에.*어떻게.*해/,
                    /.*힘들어/, /.*괴로워/, /.*답답해/, /.*어려워/,
                    /.*고민이야/, /.*걱정이야/, /.*스트레스/,
                    /.*어떡하지/, /.*어쩌지/, /.*고민인데/,
                    /.*힘든데/, /.*어려운데/, /.*모르겠어/
                ],
                weight: 0.9,
                conversational: true
            },
            
            // 정보성 질문 (명확한 질문)
            'INFORMATION_QUERY': {
                patterns: [
                    /.*운동.*방법.*알려/, /.*운동.*어떻게.*해/,
                    /.*다이어트.*방법/, /.*헬스.*루틴/,
                    /.*효과적인.*운동/, /.*좋은.*운동.*추천/,
                    /.*운동.*종류/, /.*운동.*시간/,
                    /.*방법.*알려.*줘/, /.*어떻게.*하는.*거/
                ],
                weight: 0.8,
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
                    /.*먹을곳.*추천|.*음식.*맛있는곳/
                ],
                weight: 0.9
            }
        };
        
        // 2단계: 패턴 매칭 및 점수 계산 (안전한 처리)
        let bestMatch = { category: 'GENERAL_QUESTION', confidence: 0.3 };
        
        try {
            for (const [category, config] of Object.entries(explicitPatterns)) {
                let score = 0;
                let matchCount = 0;
                
                // 긍정 패턴 체크 (안전한 처리)
                if (config.patterns && Array.isArray(config.patterns)) {
                    for (const pattern of config.patterns) {
                        try {
                            if (pattern && pattern.test && pattern.test(message)) {
                                score += (config.weight || 0.5);
                                matchCount++;
                            }
                        } catch (patternError) {
                            console.log(`⚠️ 패턴 매칭 오류: ${patternError.message}`);
                        }
                    }
                }
                
                // 제외 패턴 체크 (안전한 처리)
                if (config.exclusions && Array.isArray(config.exclusions)) {
                    for (const exclusion of config.exclusions) {
                        try {
                            if (exclusion && exclusion.test && exclusion.test(message)) {
                                score -= 0.5; // 제외 패턴에 매칭되면 점수 감소
                            }
                        } catch (exclusionError) {
                            console.log(`⚠️ 제외 패턴 매칭 오류: ${exclusionError.message}`);
                        }
                    }
                }
                
                // 가중평균 계산
                if (matchCount > 0 && config.patterns && config.patterns.length > 0) {
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
        } catch (error) {
            console.error('❌ 패턴 매칭 전체 오류:', error);
            // 에러 발생 시 기본값 유지
        }
        
        // 3단계: 컨텍스트 기반 조정
        if (context.previousCategory && bestMatch.confidence < 0.7) {
            // 이전 대화 컨텍스트 고려
            console.log(`🔄 컨텍스트 조정: 이전 카테고리 ${context.previousCategory}`);
        }
        
        console.log(`🎯 분류 결과: ${bestMatch.category} (신뢰도: ${bestMatch.confidence.toFixed(3)})`);
        
        return {
            category: bestMatch.category,
            confidence: bestMatch.confidence,
            originalMessage: message,
            matchDetails: bestMatch.matchDetails || null,
            conversationalContext: conversationalAnalysis,
            timestamp: new Date().toISOString()
        };
    }
    
    // 자연스러운 대화 컨텍스트 분석
    analyzeConversationalContext(message, context) {
        const analysis = {
            isEmotionalExpression: false,
            emotionType: null,
            isContextualStatement: false,
            needsEmpathyResponse: false,
            topicShift: false
        };
        
        // 감정 표현 분석
        const emotionPatterns = {
            frustration: /힘들어|어려워|답답해|괴로워|스트레스|짜증/,
            concern: /걱정|고민|불안|어떡하지|어쩌지/,
            confusion: /모르겠어|헷갈려|애매해|확실하지/,
            tiredness: /피곤해|지쳐|힘들어|못하겠어/
        };
        
        for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
            if (pattern.test(message)) {
                analysis.isEmotionalExpression = true;
                analysis.emotionType = emotion;
                analysis.needsEmpathyResponse = true;
                break;
            }
        }
        
        // 문맥적 표현 분석 (단순 정보 요청이 아닌)
        const contextualPatterns = [
            /.*더위에.*어떻게.*해/, /.*추위에.*어떻게.*해/,
            /.*이.*상황에서/, /.*이런.*때는/,
            /.*어떻게.*하면.*좋을까/, /.*뭘.*해야.*할까/
        ];
        
        analysis.isContextualStatement = contextualPatterns.some(pattern => pattern.test(message));
        
        // 주제 전환 감지
        if (context.previousCategory && !message.includes('계속') && !message.includes('더')) {
            analysis.topicShift = true;
        }
        
        return analysis;
    }
    
    // 정보성 질문 처리 에이전트 (자연스러운 대화 지원)
    async processInformationQuery(taskData) {
        const { message, userId, classification } = taskData;
        
        console.log('📚 정보 에이전트 처리 시작');
        
        // 대화형 분석이 있으면 감정적 응답 우선
        if (classification.conversationalContext?.needsEmpathyResponse) {
            console.log('💭 감정적 응답 모드 활성화');
            return await this.generateEmpathyResponse(message, classification);
        }
        
        // 문맥적 표현이면 대화식 조언 제공
        if (classification.conversationalContext?.isContextualStatement) {
            console.log('🗣️ 대화식 조언 모드 활성화');
            return await this.generateConversationalAdvice(message, classification);
        }
        
        // 일반적인 정보 질문 처리
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
            console.error('❌ 정보 에이전트 처리 오류:', error);
            return this.createErrorResponse('정보를 가져오는 중 오류가 발생했습니다.');
        }
    }
    
    // 감정적 응답 생성
    async generateEmpathyResponse(message, classification) {
        const emotionType = classification.conversationalContext.emotionType;
        
        let response = '';
        
        switch (emotionType) {
            case 'frustration':
                if (message.includes('더위')) {
                    response = `😓 정말 이 더위에 운동하기 힘들죠!\n\n🏠 **실내 운동 추천:**\n• 에어컨 있는 헬스장 이용\n• 집에서 요가나 스트레칭\n• 쇼핑몰 걷기 (시원하고 평평함)\n• 수영장 운동 (가장 시원!)\n\n⏰ **시간 조절:**\n• 새벽 6-7시 (해뜨기 전)\n• 저녁 8시 이후 (해진 후)\n\n💡 더위 때문에 포기하지 마세요! 방법은 있어요 😊`;
                } else {
                    response = `😊 힘든 상황이군요. 충분히 이해해요!\n\n💪 **작은 것부터 시작해보세요:**\n• 완벽하지 않아도 괜찮아요\n• 본인 페이스에 맞춰서\n• 조금씩이라도 꾸준히\n\n🤗 너무 스트레스 받지 마시고, 천천히 해보세요!`;
                }
                break;
                
            case 'concern':
                response = `🤔 고민이 많으시군요. 함께 생각해봐요!\n\n💭 **걱정 해결 방법:**\n• 문제를 작게 나누어 보기\n• 할 수 있는 것부터 차근차근\n• 전문가나 주변에 조언 구하기\n\n😌 혼자 고민하지 마시고, 언제든 물어보세요!`;
                break;
                
            case 'confusion':
                response = `🤷‍♀️ 헷갈리는 게 당연해요!\n\n✨ **차근차근 정리해보세요:**\n• 모르는 게 있으면 구체적으로 질문\n• 한 번에 하나씩 해결\n• 급하게 결정하지 말고 천천히\n\n💡 더 구체적으로 어떤 부분이 궁금한지 말씀해주세요!`;
                break;
                
            default:
                response = `😊 이해해요! 때로는 이런 고민들이 생기죠.\n\n🤝 **함께 해결해봐요:**\n• 구체적으로 어떤 도움이 필요한지 말씀해주세요\n• 작은 것부터 차근차근 시작\n• 완벽하지 않아도 괜찮아요\n\n💪 포기하지 마시고 한 걸음씩 나아가요!`;
        }
        
        return {
            success: true,
            data: {
                message: response,
                category: 'CONVERSATIONAL',
                processedBy: 'information-agent',
                responseType: 'empathy'
            },
            agent: 'information-agent'
        };
    }
    
    // 대화식 조언 생성
    async generateConversationalAdvice(message, classification) {
        let advice = '';
        
        if (message.includes('더위에') && message.includes('운동')) {
            advice = `🌡️ 이 더위에 운동은 정말 고민이죠!\n\n❄️ **시원한 운동법:**\n• **수영** - 최고의 선택! 전신운동+시원함\n• **아침 6-7시 걷기** - 해뜨기 전이 가장 시원\n• **에어컨 헬스장** - 쾌적한 환경에서\n• **지하상가 걷기** - 시원하고 평지라 편함\n• **집에서 요가** - 에어컨 틀고 실내에서\n\n⚠️ **주의사항:**\n• 충분한 수분 섭취 필수\n• 어지럽거나 메스꺼우면 즉시 중단\n• 무리하지 말고 강도 낮춰서\n\n😎 더위를 피해서 운동하는 게 답이에요!`;
        } else if (message.includes('어떻게') && message.includes('해')) {
            advice = `🤔 상황에 따라 다르겠지만, 이런 방법들은 어떨까요?\n\n💡 **실용적인 해결책:**\n• 문제를 작게 나누어서 접근\n• 우선순위를 정해서 하나씩\n• 전문가나 경험자에게 조언 구하기\n• 온라인에서 비슷한 사례 찾아보기\n\n🎯 더 구체적으로 어떤 상황인지 말씀해주시면, 더 정확한 조언을 드릴 수 있어요!`;
        } else {
            advice = `😊 상황을 이해했어요!\n\n🛠️ **단계별 접근법:**\n1. 현재 상황 정확히 파악\n2. 가능한 옵션들 나열\n3. 각각의 장단점 비교\n4. 실행 가능한 것부터 시작\n\n💪 작은 변화부터 시작하면 분명 좋은 결과가 있을 거예요!`;
        }
        
        return {
            success: true,
            data: {
                message: advice,
                category: 'CONVERSATIONAL',
                processedBy: 'information-agent',
                responseType: 'conversational_advice'
            },
            agent: 'information-agent'
        };
    }
    
    // 정보성 질문을 위한 향상된 프롬프트 생성
    buildInformationPrompt(message, classification) {
        const basePrompt = `당신은 친근하고 전문적인 정보 제공 전문가입니다. 사용자의 질문에 구체적이고 실용적인 정보를 즉시 제공하세요.

사용자 질문: "${message}"

답변 가이드라인:
- 절대 "흥미로운 질문이네요" 같은 대화형 표현 사용 금지
- 질문에 대한 구체적이고 정확한 정보를 바로 제공하세요
- 행정 절차, 법률 정보, 생활 정보, 건강, 취업, 교육 등 모든 분야 대응
- 단계별로 명확하게 나열하여 실행 가능한 정보 제공
- 필요한 서류, 비용, 기간, 장소 등 구체적 세부사항 포함
- 주의사항이나 팁을 실용적으로 제시
- 답변은 400자 이내로 간결하되 완전한 정보 제공

출산신고 질문 예시:
"👶 출산신고 필수 절차

📋 **신고 기한**: 출생일로부터 1개월 이내
📍 **신고 장소**: 
- 부모 주소지 관할 구청/시청/군청 민원실
- 출생지 관할 관공서

📄 **필요 서류**:
1. 출생신고서 (의료기관에서 발급)
2. 의사 출생증명서
3. 부모 신분증
4. 가족관계증명서
5. 주민등록등본

💰 **비용**: 무료
⚠️ **주의**: 기한 초과 시 과태료 부과 가능

💡 **팁**: 온라인 신고 시스템도 이용 가능"`;`

        return basePrompt;
    }
    
    // Claude AI 호출 (정보 제공용)
    async callClaudeForInformation(prompt) {
        const axios = require('axios');
        
        if (!process.env.CLAUDE_API_KEY) {
            console.log('⚠️ Claude API 키가 설정되지 않음 - 기본 응답 반환');
            return `💬 죄송합니다. 현재 AI 서비스가 일시적으로 사용할 수 없습니다.\n\n🔧 잠시 후 다시 시도해주세요.`;
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
            console.error('❌ Claude AI 호출 오류:', error.message);
            
            // 간단한 폴백 응답
            if (prompt.includes('운동') || prompt.includes('헬스')) {
                return `🏃‍♀️ 가벼운 유산소 운동 추천\n\n1. **걷기** - 하루 30분, 빠른 걸음으로\n2. **계단 오르기** - 일상에서 쉽게 실천 가능\n3. **제자리 걷기** - 실내에서도 가능\n4. **스트레칭** - 관절 운동과 함께\n5. **자전거 타기** - 무릎에 부담 적음\n\n💡 **팁**: 본인 체력에 맞춰 강도 조절하고, 꾸준히 하는 것이 가장 중요해요!`;
            }
            
            return `💬 죄송합니다. 현재 일시적인 서비스 문제로 정확한 정보를 제공하기 어렵습니다.\n\n🔄 잠시 후 다시 질문해주시거나, 더 구체적인 키워드로 검색해보세요.`;
        }
    }
    
    // 쇼핑 에이전트
    async processShoppingQuery(taskData) {
        const { message } = taskData;
        
        console.log('🛒 쇼핑 에이전트 처리 시작');
        
        // 기존 네이버 쇼핑 API 호출 로직 활용
        const shoppingResults = await this.getShoppingResults(message);
        
        if (!shoppingResults || shoppingResults.length === 0) {
            return {
                success: false,
                data: {
                    message: `🛒 "${message}" 상품을 찾을 수 없습니다.\n\n💡 다른 키워드로 다시 검색해보세요.`
                }
            };
        }
        
        // 쇼핑 결과 포맷팅
        let responseText = `🛒 "${message}" 상품 검색 결과 (상위 ${shoppingResults.length}개)\n\n`;
        
        shoppingResults.forEach((item, index) => {
            responseText += `${item.rank}. ${item.title}\n`;
            responseText += `   💰 ${item.price} (${item.mallName})\n`;
            responseText += `   🔗 ${item.link}\n\n`;
        });
        
        return {
            success: true,
            data: {
                message: responseText.trim(),
                category: 'SHOPPING',
                processedBy: 'shopping-agent'
            },
            agent: 'shopping-agent'
        };
    }
    
    // 맛집 에이전트
    async processRestaurantQuery(taskData) {
        const { message } = taskData;
        
        console.log('🍽️ 맛집 에이전트 처리 시작');
        
        // 기존 네이버 지역검색 API 호출 로직 활용
        const restaurantResults = await this.getLocalRestaurants(message);
        
        if (!restaurantResults || restaurantResults.length === 0) {
            return {
                success: false,
                data: {
                    message: `🍽️ "${message}" 맛집을 찾을 수 없습니다.\n\n💡 지역명과 함께 다시 검색해보세요.\n예) "강남역 맛집", "홍대 카페"`
                }
            };
        }
        
        // 맛집 결과 포맷팅
        let responseText = `🍽️ "${message}" 맛집 추천 (상위 ${restaurantResults.length}곳)\n\n`;
        
        restaurantResults.forEach((restaurant, index) => {
            responseText += `${index + 1}. ${restaurant.title}\n`;
            responseText += `   📍 ${restaurant.address}\n`;
            responseText += `   📞 ${restaurant.telephone}\n`;
            if (restaurant.category) {
                responseText += `   🏷️ ${restaurant.category}\n`;
            }
            responseText += `   🔗 ${restaurant.link}\n\n`;
        });
        
        return {
            success: true,
            data: {
                message: responseText.trim(),
                category: 'RESTAURANT',
                processedBy: 'restaurant-agent'
            },
            agent: 'restaurant-agent'
        };
    }
    
    // 뉴스 에이전트
    async processNewsQuery(taskData) {
        const { message } = taskData;
        
        console.log('📰 뉴스 에이전트 처리 시작');
        
        // 기존 네이버 뉴스 API 호출 로직 활용
        const newsResults = await this.getLatestNews(message);
        
        if (!newsResults || newsResults.length === 0) {
            return {
                success: false,
                data: {
                    message: `📰 "${message}" 관련 뉴스를 찾을 수 없습니다.\n\n💡 다른 키워드로 다시 검색해보세요.`
                }
            };
        }
        
        // 뉴스 결과 포맷팅
        let responseText = `📰 "${message}" 최신 뉴스 (상위 ${newsResults.length}개)\n\n`;
        
        newsResults.forEach((news, index) => {
            responseText += `${index + 1}. ${news.title}\n`;
            if (news.description) {
                responseText += `   ${news.description.substring(0, 80)}...\n`;
            }
            responseText += `   🔗 ${news.link}\n\n`;
        });
        
        return {
            success: true,
            data: {
                message: responseText.trim(),
                category: 'NEWS',
                processedBy: 'news-agent'
            },
            agent: 'news-agent'
        };
    }
    
    // 엔터테인먼트 에이전트
    async processEntertainmentQuery(taskData) {
        const { message, classification } = taskData;
        
        console.log('🎬 엔터테인먼트 에이전트 처리 시작');
        
        // 영화 평점 관련 처리는 기존 시스템 활용
        if (classification.category === 'MOVIE_REVIEW') {
            // 기존 영화 평점 시스템 호출
            const movieResult = await this.getMovieReview(message);
            
            return {
                success: true,
                data: {
                    message: movieResult,
                    category: 'MOVIE_REVIEW',
                    processedBy: 'entertainment-agent'
                },
                agent: 'entertainment-agent'
            };
        }
        
        // 기타 엔터테인먼트 질문은 Claude AI로 처리
        const response = await this.callClaudeForInformation(
            `엔터테인먼트 전문가로서 다음 질문에 답해주세요: "${message}"`
        );
        
        return {
            success: true,
            data: {
                message: response,
                category: 'ENTERTAINMENT',
                processedBy: 'entertainment-agent'
            },
            agent: 'entertainment-agent'
        };
    }
    
    // === 헬퍼 함수들 ===
    
    createErrorResponse(message) {
        return {
            success: false,
            data: {
                message: message,
                error: true
            }
        };
    }
    
    // 외부 API 호출 함수들 (기존 시스템 연동)
    async getShoppingResults(query) {
        // 기존 네이버 쇼핑 API 로직 활용
        try {
            const axios = require('axios');
            const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
                params: { query, display: 5, start: 1, sort: 'price' },
                headers: {
                    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
                },
                timeout: 4000
            });
            
            return response.data.items?.slice(0, 5).map((item, index) => ({
                rank: index + 1,
                title: item.title.replace(/<[^>]*>/g, ''),
                price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격정보없음',
                mallName: item.mallName || '쇼핑몰정보없음',
                link: item.link
            })) || [];
        } catch (error) {
            console.error('쇼핑 API 오류:', error);
            return [];
        }
    }
    
    async getLocalRestaurants(query) {
        // 기존 네이버 지역검색 API 로직 활용
        try {
            const axios = require('axios');
            const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
                params: { query, display: 5, start: 1, sort: 'comment' },
                headers: {
                    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
                },
                timeout: 4000
            });
            
            return response.data.items?.slice(0, 5).map(item => ({
                title: item.title.replace(/<[^>]*>/g, ''),
                category: item.category,
                address: item.address,
                telephone: item.telephone || '전화번호 없음',
                link: item.link
            })) || [];
        } catch (error) {
            console.error('맛집 API 오류:', error);
            return [];
        }
    }
    
    async getLatestNews(query) {
        // 기존 네이버 뉴스 API 로직 활용
        try {
            const axios = require('axios');
            const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
                params: { query, display: 5, start: 1, sort: 'date' },
                headers: {
                    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
                },
                timeout: 4000
            });
            
            return response.data.items?.slice(0, 5).map(item => ({
                title: item.title.replace(/<[^>]*>/g, ''),
                description: item.description?.replace(/<[^>]*>/g, ''),
                link: item.link
            })) || [];
        } catch (error) {
            console.error('뉴스 API 오류:', error);
            return [];
        }
    }
    
    async getMovieReview(movieTitle) {
        // 기존 영화 평점 시스템 활용
        try {
            // 간단한 영화 검색 결과 반환 (실제로는 기존 시스템 호출)
            return `🎬 "${movieTitle}" 영화 정보를 검색 중입니다...\n\n💡 더 정확한 정보를 위해 정확한 영화 제목으로 다시 검색해주세요.`;
        } catch (error) {
            console.error('영화 API 오류:', error);
            return `🎬 "${movieTitle}" 영화 정보를 찾을 수 없습니다.`;
        }
    }
}

module.exports = SubAgentManager;