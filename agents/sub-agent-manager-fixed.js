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
        console.log(`서브에이전트 라우팅 시작: "${userMessage}"`);
        
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
            console.log(`분류 결과: ${classification.category} (신뢰도: ${classification.confidence})`);
            
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
            // 정보성 질문 (쇼핑이 아닌, 음식 제외)
            'INFORMATION_QUERY': {
                patterns: [
                    /^.*(어떻게|왜|무엇|뭐|방법|이유|원리|차이점|특징).*[가-힣]{2,}.*$/,
                    /^(운동|헬스|건강|다이어트|학습|공부|기술|과학).*방법/,
                    /^.*(효과|장점|단점|차이|비교|설명|정보).*알려.*$/,
                    /^.*(가벼운|쉬운|간단한|좋은|효과적인).*운동.*뭐.*있.*$/,
                    /^.*(운동|헬스|다이어트|건강).*추천.*해.*$/,
                    /^.*(어떤|뭔|무슨).*운동.*좋.*$/
                ],
                weight: 0.9,
                exclusions: [
                    /구매|쇼핑|가격|할인|어디서.*사|주문|배송/,
                    /맛집|식당|카페|음식점/,
                    /.*먹.*뭐|.*뭐.*먹|저녁.*먹|점심.*먹|아침.*먹|식사.*뭐|음식.*뭐|뭐.*음식/
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
            
            // 맛집/레스토랑/음식 추천
            'RESTAURANT': {
                patterns: [
                    /.*맛집.*추천|.*맛집.*어디|.*식당.*좋은곳|.*카페.*추천/,
                    /[가-힣\s]*[구동시군읍면역]\s*(맛집|식당|카페|음식점)/,
                    /.*먹을곳.*추천|.*음식.*맛있는곳/,
                    /.*먹.*뭐|.*뭐.*먹|저녁.*먹|점심.*먹|아침.*먹/,
                    /식사.*뭐|음식.*뭐|뭐.*음식|.*먹으면.*좋/,
                    /.*음식.*추천|.*메뉴.*추천|.*요리.*추천/,
                    /배고|허기|뭐.*드시|뭐.*잡수/
                ],
                weight: 0.95
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
        
        console.log(`분류 결과: ${bestMatch.category} (신뢰도: ${bestMatch.confidence.toFixed(3)})`);
        
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
}

module.exports = SubAgentManager;