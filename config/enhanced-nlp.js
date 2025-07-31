// 향상된 자연어 이해 시스템
// Enhanced Natural Language Processing for better conversation understanding

class EnhancedNLP {
    constructor() {
        // 의도 분류를 위한 고급 패턴
        this.intentPatterns = {
            // 음식/식사 관련 - 가장 높은 우선순위
            FOOD_QUESTION: {
                priority: 1,
                confidence: 0.9,
                patterns: [
                    /뭐.*먹지|먹을.*뭐|저녁.*뭐|아침.*뭐|점심.*뭐|간식.*뭐/,
                    /뭐.*드시|뭐.*잡수|뭐.*마실/,
                    /음식.*추천|메뉴.*추천|요리.*추천/,
                    /배고픈데|배고파서|허기져서/,
                    /식사.*추천|밥.*추천/
                ],
                context: ['time_based', 'preference_based', 'location_based'],
                response_type: 'conversational'
            },

            // 일상 대화 - 높은 우선순위
            CASUAL_CONVERSATION: {
                priority: 2,
                confidence: 0.85,
                patterns: [
                    /뭐해|뭐하고|뭐하니|뭐하세요/,
                    /어떻게.*지내|어떻게.*살|잘.*지내/,
                    /오늘.*어때|기분.*어때|컨디션.*어때/,
                    /안녕|반가워|만나서.*좋|처음.*뵙/,
                    /감사|고마워|정말.*도움/,
                    /힘들어|피곤해|지쳐|스트레스/
                ],
                context: ['emotional', 'social', 'personal'],
                response_type: 'conversational'
            },

            // 정보 요청 - 중간 우선순위
            INFORMATION_REQUEST: {
                priority: 3,
                confidence: 0.8,
                patterns: [
                    /어떻게.*해야|방법.*알려|어떻게.*하는지/,
                    /.*정보.*필요|.*정보.*알려|.*알고.*싶/,
                    /설명.*해줘|자세히.*알려|구체적으로/,
                    /차이.*뭐|비교.*해줘|어떤.*좋/
                ],
                context: ['specific_topic', 'comparative', 'instructional'],
                response_type: 'informational'
            },

            // 검색 요청 - 명시적인 검색만
            SEARCH_REQUEST: {
                priority: 4,
                confidence: 0.75,
                patterns: [
                    /검색.*해줘|찾아.*줘|검색.*결과/,
                    /최신.*뉴스|뉴스.*검색|뉴스.*찾아/,
                    /쇼핑.*검색|상품.*찾아|가격.*비교/,
                    /맛집.*검색|식당.*찾아|맛집.*추천.*검색/
                ],
                context: ['web_search', 'current_info', 'comparison'],
                response_type: 'search_based'
            }
        };

        // 컨텍스트 분석기
        this.contextAnalyzers = {
            time_based: (msg) => this.analyzeTimeContext(msg),
            preference_based: (msg) => this.analyzePreferenceContext(msg),
            location_based: (msg) => this.analyzeLocationContext(msg),
            emotional: (msg) => this.analyzeEmotionalContext(msg),
            social: (msg) => this.analyzeSocialContext(msg),
            specific_topic: (msg) => this.analyzeTopicContext(msg)
        };

        // 대화 흐름 패턴
        this.conversationFlows = {
            food_planning: ['meal_time', 'food_type', 'location', 'budget'],
            information_seeking: ['topic', 'specificity', 'urgency', 'source_preference'],
            casual_chat: ['mood', 'topic_interest', 'engagement_level'],
            problem_solving: ['problem_type', 'urgency', 'complexity', 'resources']
        };
    }

    // 주요 의도 분석 함수
    analyzeIntent(message, conversationHistory = []) {
        console.log(`[NLP] 의도 분석 시작: "${message}"`);
        
        const results = [];
        
        // 각 의도별로 점수 계산
        for (const [intentName, intent] of Object.entries(this.intentPatterns)) {
            let score = 0;
            let matchedPatterns = [];
            
            // 패턴 매칭
            for (const pattern of intent.patterns) {
                if (pattern.test(message)) {
                    score += intent.confidence;
                    matchedPatterns.push(pattern.source);
                }
            }
            
            // 컨텍스트 분석 추가 점수
            if (score > 0) {
                const contextScore = this.analyzeContexts(message, intent.context, conversationHistory);
                score += contextScore;
                
                results.push({
                    intent: intentName,
                    confidence: Math.min(score, 1.0),
                    priority: intent.priority,
                    response_type: intent.response_type,
                    matched_patterns: matchedPatterns,
                    context_analysis: this.getContextAnalysis(message, intent.context)
                });
            }
        }
        
        // 점수와 우선순위로 정렬
        results.sort((a, b) => {
            if (Math.abs(a.confidence - b.confidence) > 0.1) {
                return b.confidence - a.confidence;
            }
            return a.priority - b.priority;
        });
        
        console.log('[NLP] 의도 분석 결과:', results[0] || { intent: 'UNKNOWN' });
        
        return results[0] || {
            intent: 'UNKNOWN',
            confidence: 0,
            response_type: 'conversational',
            context_analysis: {}
        };
    }

    // 컨텍스트 분석
    analyzeContexts(message, contexts, conversationHistory) {
        let contextScore = 0;
        
        for (const context of contexts) {
            if (this.contextAnalyzers[context]) {
                const score = this.contextAnalyzers[context](message, conversationHistory);
                contextScore += score * 0.1; // 컨텍스트는 추가 점수로만 활용
            }
        }
        
        return contextScore;
    }

    // 시간 기반 컨텍스트 분석
    analyzeTimeContext(message) {
        const now = new Date();
        const hour = now.getHours();
        
        let timeScore = 0;
        
        // 식사 시간 패턴
        if (/아침|조식/.test(message) && hour >= 6 && hour <= 10) timeScore += 0.3;
        if (/점심|중식/.test(message) && hour >= 11 && hour <= 14) timeScore += 0.3;
        if (/저녁|석식|dinner/.test(message) && hour >= 17 && hour <= 21) timeScore += 0.3;
        if (/야식|밤|late/.test(message) && (hour >= 22 || hour <= 2)) timeScore += 0.3;
        
        // 시간 표현
        if (/지금|현재|당장/.test(message)) timeScore += 0.2;
        if (/나중에|이따가|내일/.test(message)) timeScore += 0.1;
        
        return timeScore;
    }

    // 선호도 기반 컨텍스트 분석
    analyzePreferenceContext(message) {
        let prefScore = 0;
        
        // 맛 선호도
        if (/매운|맵게|매콤/.test(message)) prefScore += 0.2;
        if (/달콤|달게|sweet/.test(message)) prefScore += 0.2;
        if (/깔끔|담백|light/.test(message)) prefScore += 0.2;
        if (/진한|thick|rich/.test(message)) prefScore += 0.2;
        
        // 음식 유형
        if (/한식|한국/.test(message)) prefScore += 0.1;
        if (/양식|western/.test(message)) prefScore += 0.1;
        if (/중식|chinese/.test(message)) prefScore += 0.1;
        if (/일식|japanese/.test(message)) prefScore += 0.1;
        
        return prefScore;
    }

    // 위치 기반 컨텍스트 분석
    analyzeLocationContext(message) {
        let locScore = 0;
        
        // 위치 언급
        const locationPattern = /([가-힣]{2,}(?:시|구|군|동|역|읍|면))/;
        if (locationPattern.test(message)) locScore += 0.3;
        
        // 거리/접근성 언급
        if (/가까운|근처|주변/.test(message)) locScore += 0.2;
        if (/멀어도|상관없이|어디든/.test(message)) locScore += 0.1;
        
        return locScore;
    }

    // 감정적 컨텍스트 분석
    analyzeEmotionalContext(message) {
        let emotionScore = 0;
        
        // 긍정적 감정
        if (/좋아|행복|기뻐|즐거|신나|최고/.test(message)) emotionScore += 0.3;
        
        // 부정적 감정
        if (/힘들어|우울|슬퍼|화나|짜증|스트레스/.test(message)) emotionScore += 0.3;
        
        // 중립적 감정
        if (/그냥|보통|괜찮|so-so/.test(message)) emotionScore += 0.2;
        
        // 피로/컨디션
        if (/피곤|지쳐|힘빠|에너지/.test(message)) emotionScore += 0.2;
        
        return emotionScore;
    }

    // 사회적 컨텍스트 분석
    analyzeSocialContext(message) {
        let socialScore = 0;
        
        // 예의/정중함
        if (/주세요|해주세요|부탁|감사|고마워/.test(message)) socialScore += 0.2;
        
        // 친근함
        if (/ㅋㅋ|ㅎㅎ|^^|😊|😄|ㅠㅠ/.test(message)) socialScore += 0.3;
        
        // 격식성
        if (/합니다|습니다|ㅂ니다/.test(message)) socialScore += 0.1;
        
        return socialScore;
    }

    // 주제 컨텍스트 분석
    analyzeTopicContext(message) {
        let topicScore = 0;
        
        // 구체적 주제 언급
        if (/영화|음악|책|게임|스포츠|여행/.test(message)) topicScore += 0.2;
        if (/건강|다이어트|운동|의료/.test(message)) topicScore += 0.2;
        if (/요리|레시피|음식|맛/.test(message)) topicScore += 0.2;
        if (/쇼핑|제품|브랜드|가격/.test(message)) topicScore += 0.2;
        
        return topicScore;
    }

    // 컨텍스트 분석 결과 반환
    getContextAnalysis(message, contexts) {
        const analysis = {};
        
        for (const context of contexts) {
            if (this.contextAnalyzers[context]) {
                analysis[context] = this.contextAnalyzers[context](message);
            }
        }
        
        return analysis;
    }

    // 대화 흐름 분석
    analyzeConversationFlow(currentMessage, history) {
        if (!history || history.length === 0) {
            return { flow_type: 'initial', context: 'new_conversation' };
        }
        
        const recentMessages = history.slice(-3);
        const topics = recentMessages.map(msg => this.extractTopic(msg.message));
        
        // 일관된 주제인지 확인
        const topicConsistency = this.checkTopicConsistency(topics);
        
        // 대화 깊이 분석
        const conversationDepth = this.analyzeConversationDepth(recentMessages);
        
        return {
            flow_type: topicConsistency > 0.7 ? 'focused' : 'exploratory',
            topic_consistency: topicConsistency,
            depth: conversationDepth,
            context: this.inferConversationContext(recentMessages)
        };
    }

    // 주제 일관성 확인
    checkTopicConsistency(topics) {
        if (topics.length < 2) return 1.0;
        
        const primaryTopic = topics[0];
        let consistentCount = 1;
        
        for (let i = 1; i < topics.length; i++) {
            if (this.areTopicsRelated(primaryTopic, topics[i])) {
                consistentCount++;
            }
        }
        
        return consistentCount / topics.length;
    }

    // 주제 연관성 확인
    areTopicsRelated(topic1, topic2) {
        const relatedTopics = {
            'food': ['restaurant', 'cooking', 'meal', 'recipe'],
            'entertainment': ['movie', 'music', 'game', 'book'],
            'health': ['exercise', 'diet', 'medical', 'wellness'],
            'shopping': ['product', 'price', 'brand', 'review']
        };
        
        for (const [mainTopic, related] of Object.entries(relatedTopics)) {
            if ((topic1 === mainTopic && related.includes(topic2)) ||
                (topic2 === mainTopic && related.includes(topic1)) ||
                (related.includes(topic1) && related.includes(topic2))) {
                return true;
            }
        }
        
        return topic1 === topic2;
    }

    // 주제 추출
    extractTopic(message) {
        if (/음식|먹|식사|요리|맛|레시피/.test(message)) return 'food';
        if (/영화|드라마|시리즈|애니/.test(message)) return 'entertainment';
        if (/건강|운동|다이어트|의료/.test(message)) return 'health';
        if (/쇼핑|제품|구매|가격/.test(message)) return 'shopping';
        if (/날씨|기온|비|눈/.test(message)) return 'weather';
        if (/뉴스|정보|소식/.test(message)) return 'news';
        
        return 'general';
    }

    // 대화 깊이 분석
    analyzeConversationDepth(messages) {
        let depth = 0;
        
        for (const msg of messages) {
            // 질문의 구체성
            if (/어떻게|왜|뭐|언제|어디/.test(msg.message)) depth += 1;
            
            // 세부 정보 요청
            if (/자세히|구체적|더|상세/.test(msg.message)) depth += 2;
            
            // 후속 질문
            if (/그런데|그럼|그래서|또/.test(msg.message)) depth += 1;
        }
        
        return Math.min(depth, 10) / 10; // 0-1 범위로 정규화
    }

    // 대화 맥락 추론
    inferConversationContext(messages) {
        const contexts = [];
        
        for (const msg of messages) {
            if (/도움|문제|해결/.test(msg.message)) contexts.push('help_seeking');
            if (/추천|제안|의견/.test(msg.message)) contexts.push('advice_seeking');
            if (/궁금|알고싶|정보/.test(msg.message)) contexts.push('information_seeking');
            if (/그냥|심심|대화/.test(msg.message)) contexts.push('casual_chat');
        }
        
        // 가장 빈번한 컨텍스트 반환
        const contextCounts = {};
        contexts.forEach(ctx => contextCounts[ctx] = (contextCounts[ctx] || 0) + 1);
        
        const primaryContext = Object.keys(contextCounts).reduce((a, b) => 
            contextCounts[a] > contextCounts[b] ? a : b, 'general'
        );
        
        return primaryContext;
    }
}

module.exports = EnhancedNLP;