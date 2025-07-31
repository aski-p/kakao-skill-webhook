// 컨텍스트 인식 응답 생성 시스템
// Context-Aware Response Generation System

class ContextAwareGenerator {
    constructor() {
        // 응답 템플릿 (컨텍스트별)
        this.responseTemplates = {
            // 음식 관련 응답
            FOOD_QUESTION: {
                time_based: {
                    breakfast: [
                        "아침이네요! 건강한 아침식사 어떠세요?",
                        "좋은 아침이에요! 든든한 아침 메뉴를 추천드릴게요.",
                        "아침 식사로는 이런 메뉴가 좋을 것 같아요."
                    ],
                    lunch: [
                        "점심시간이네요! 맛있는 점심 메뉴를 제안해드릴게요.",
                        "든든한 점심식사 어떠세요?",
                        "점심으로는 이런 메뉴가 어떨까요?"
                    ],
                    dinner: [
                        "저녁시간이네요! 오늘 하루 수고 많으셨습니다.",
                        "맛있는 저녁식사로 하루를 마무리해보세요!",
                        "저녁으로는 이런 메뉴가 좋을 것 같아요."
                    ],
                    late_night: [
                        "늦은 시간이네요. 가벼운 야식 어떠세요?",
                        "야식으로는 부담스럽지 않은 메뉴가 좋겠어요.",
                        "늦은 시간이니 간단한 음식이 어떨까요?"
                    ]
                },
                weather_based: {
                    cold: [
                        "추운 날씨네요. 따뜻한 음식이 좋겠어요!",
                        "이런 추위에는 뜨끈한 음식이 최고죠!",
                        "몸을 따뜻하게 해줄 음식을 추천드릴게요."
                    ],
                    hot: [
                        "더운 날씨네요. 시원한 음식이 어떨까요?",
                        "이런 더위에는 시원하고 상큼한 메뉴가 좋겠어요!",
                        "더위를 식혀줄 시원한 음식을 제안해드릴게요."
                    ],
                    rainy: [
                        "비 오는 날에는 뜨끈한 음식이 생각나죠!",
                        "이런 날씨에는 따뜻한 국물 요리가 어떨까요?",
                        "비 오는 날의 로맨틱한 식사 메뉴를 추천드릴게요."
                    ]
                },
                conversation_history: {
                    repeat_question: [
                        "아까 말씀하신 것처럼 식사 고민이 많으시네요!",
                        "계속 메뉴 선택에 고민이 많으시군요. 다른 옵션을 제안해드릴게요.",
                        "이번에는 조금 다른 스타일의 메뉴는 어떠세요?"
                    ],
                    follow_up: [
                        "앞서 말씀하신 취향을 고려해서 추천드릴게요.",
                        "이전 대화를 참고해서 맞춤 메뉴를 제안해드릴게요.",
                        "말씀하신 선호도에 맞는 메뉴를 찾아드릴게요."
                    ]
                }
            },

            // 일상 대화 응답
            CASUAL_CONVERSATION: {
                greeting: [
                    "안녕하세요! 오늘 하루 어떻게 보내고 계세요?",
                    "반갑습니다! 무엇을 도와드릴까요?",
                    "안녕하세요! 좋은 하루 되고 계신가요?"
                ],
                mood_inquiry: [
                    "오늘 기분이 어떠세요? 함께 이야기 나눠봐요!",
                    "컨디션은 괜찮으신가요? 편하게 대화해요.",
                    "어떤 기분이신지 궁금해요. 이야기해보세요!"
                ],
                emotional_support: {
                    tired: [
                        "피곤하시군요. 잠시 휴식을 취하시는 게 어떨까요?",
                        "수고 많으셨어요. 편안히 쉬세요.",
                        "힘드시겠지만 조금만 더 힘내세요!"
                    ],
                    happy: [
                        "기분이 좋으시네요! 좋은 일이 있으셨나 봐요.",
                        "밝은 에너지가 느껴져요! 계속 좋은 하루 되세요.",
                        "행복한 기분이 전해져요!"
                    ],
                    stressed: [
                        "스트레스가 많으시군요. 잠깐 깊게 숨을 쉬어보세요.",
                        "힘든 시간이시겠지만 이것도 지나갈 거예요.",
                        "스트레스 해소 방법을 함께 생각해볼까요?"
                    ]
                }
            },

            // 정보 요청 응답
            INFORMATION_REQUEST: {
                specific: [
                    "구체적인 정보를 찾아드릴게요!",
                    "자세한 내용을 알려드리겠습니다.",
                    "정확한 정보를 제공해드릴게요."
                ],
                comparative: [
                    "두 가지를 비교해서 설명해드릴게요.",
                    "차이점을 명확하게 알려드리겠습니다.",
                    "각각의 장단점을 비교해드릴게요."
                ],
                uncertain: [
                    "정확하지 않을 수 있지만, 일반적으로는 이렇습니다.",
                    "확실하지 않으니 추가로 검색해보시는 걸 추천드려요.",
                    "대략적인 정보는 이렇고, 더 정확한 정보는 전문 사이트에서 확인해보세요."
                ]
            }
        };

        // 음식 추천 데이터베이스
        this.foodRecommendations = {
            time_based: {
                breakfast: [
                    { name: "토스트와 커피", description: "간단하고 든든한 아침식사", prep_time: "10분" },
                    { name: "계란말이와 밥", description: "단백질이 풍부한 건강한 아침", prep_time: "15분" },
                    { name: "시리얼과 우유", description: "빠르고 영양가 있는 선택", prep_time: "5분" },
                    { name: "샌드위치", description: "포만감 있는 아침 메뉴", prep_time: "10분" }
                ],
                lunch: [
                    { name: "비빔밥", description: "영양 균형이 좋은 한식", prep_time: "20분" },
                    { name: "파스타", description: "든든한 양식 메뉴", prep_time: "25분" },
                    { name: "덮밥", description: "간편하고 맛있는 일식", prep_time: "15분" },
                    { name: "샐러드", description: "가볍고 건강한 선택", prep_time: "10분" }
                ],
                dinner: [
                    { name: "삼겹살 구이", description: "한국인이 사랑하는 저녁 메뉴", prep_time: "30분" },
                    { name: "치킨", description: "간편하고 맛있는 치킨 요리", prep_time: "40분" },
                    { name: "찌개류", description: "따뜻하고 든든한 국물 요리", prep_time: "25분" },
                    { name: "스테이크", description: "특별한 날의 고급 메뉴", prep_time: "20분" }
                ],
                late_night: [
                    { name: "라면", description: "야식의 정석", prep_time: "10분" },
                    { name: "치킨", description: "배달 치킨으로 간편하게", prep_time: "30분" },
                    { name: "과일", description: "가벼운 야식", prep_time: "5분" },
                    { name: "요거트", description: "부담스럽지 않은 선택", prep_time: "2분" }
                ]
            },
            weather_based: {
                cold: ["국밥", "찌개", "전골", "온면", "호빵", "붕어빵"],
                hot: ["냉면", "물냉면", "비빔냉면", "샐러드", "아이스크림", "빙수"],
                rainy: ["파전", "막걸리", "라면", "호떡", "김치찌개", "부대찌개"]
            },
            mood_based: {
                happy: ["케이크", "디저트", "고급 요리", "새로운 메뉴", "특별한 음식"],
                sad: ["따뜻한 죽", "차분한 차", "달콤한 디저트", "편안한 음식"],
                stressed: ["매운 음식", "자극적인 맛", "스트레스 해소 음식", "좋아하는 음식"],
                tired: ["간편한 배달", "에너지 보충 음식", "비타민 많은 과일", "단순한 요리"]
            }
        };

        // 시간대별 인사말
        this.timeBasedGreetings = {
            morning: ["좋은 아침이에요!", "아침이네요!", "좋은 하루 시작하세요!"],
            afternoon: ["좋은 오후예요!", "오후 시간이네요!", "점심은 드셨나요?"],
            evening: ["좋은 저녁이에요!", "저녁 시간이네요!", "하루 수고 많으셨어요!"],
            night: ["늦은 시간이네요!", "밤이 깊었네요!", "오늘도 수고하셨어요!"]
        };
    }

    // 메인 응답 생성 함수
    generateContextAwareResponse(intent, message, sessionContext, conversationHistory) {
        console.log(`[CONTEXT] 컨텍스트 인식 응답 생성: ${intent}`);
        
        const context = this.analyzeFullContext(message, sessionContext, conversationHistory);
        
        switch (intent) {
            case 'FOOD_QUESTION':
                return this.generateFoodResponse(message, context, conversationHistory);
            
            case 'CASUAL_CONVERSATION':
                return this.generateCasualResponse(message, context, conversationHistory);
            
            case 'INFORMATION_REQUEST':
                return this.generateInformationResponse(message, context);
            
            default:
                return this.generateDefaultResponse(message, context);
        }
    }

    // 음식 관련 응답 생성
    generateFoodResponse(message, context, conversationHistory) {
        let response = "";
        
        // 컨텍스트 기반 인사말
        const greeting = this.getContextualGreeting(context);
        if (greeting) {
            response += greeting + "\n\n";
        }

        // 대화 히스토리 기반 개인화
        if (this.isRepeatQuestion(message, conversationHistory)) {
            response += "계속 메뉴 고민이 많으시네요! 이번에는 다른 스타일로 추천해드릴게요.\n\n";
        }

        // 시간대별 추천
        const timeRecommendations = this.getTimeBasedRecommendations(context.time_period);
        response += `🍽️ ${this.getTimePeriodText(context.time_period)} 메뉴 추천\n\n`;
        
        timeRecommendations.slice(0, 4).forEach((food, index) => {
            response += `${index + 1}. **${food.name}**\n`;
            response += `   ${food.description}\n`;
            if (food.prep_time) {
                response += `   ⏱️ 조리시간: ${food.prep_time}\n`;
            }
            response += `\n`;
        });

        // 날씨 기반 추가 추천
        if (context.weather_condition) {
            const weatherFoods = this.foodRecommendations.weather_based[context.weather_condition];
            if (weatherFoods && weatherFoods.length > 0) {
                response += `🌤️ ${this.getWeatherText(context.weather_condition)} 특별 추천: ${weatherFoods.slice(0, 3).join(', ')}\n\n`;
            }
        }

        // 개인화된 마무리 문구
        response += this.getPersonalizedClosing(context, conversationHistory);

        return response;
    }

    // 일상 대화 응답 생성
    generateCasualResponse(message, context, conversationHistory) {
        let response = "";
        
        // 감정 상태 파악
        const emotionalState = this.detectEmotionalState(message);
        
        if (emotionalState !== 'neutral') {
            const emotionalResponse = this.getEmotionalResponse(emotionalState);
            response += emotionalResponse + "\n\n";
        }

        // 시간대 기반 인사
        const timeGreeting = this.getTimeBasedGreeting(context.time_period);
        response += timeGreeting + "\n\n";

        // 대화 맥락 파악
        if (this.isFollowUpConversation(conversationHistory)) {
            response += "계속 이야기하고 계시네요! ";
        }

        // 개방형 질문으로 대화 유도
        response += this.generateOpenEndedQuestion(context, conversationHistory);

        return response;
    }

    // 정보 요청 응답 생성
    generateInformationResponse(message, context) {
        let response = "";
        
        // 정보의 확실성 체크
        const certaintyLevel = this.assessInformationCertainty(message);
        
        if (certaintyLevel === 'uncertain') {
            response += "정확하지 않을 수 있지만, 일반적으로는 이렇습니다:\n\n";
        } else if (certaintyLevel === 'specific') {
            response += "구체적인 정보를 알려드릴게요:\n\n";
        }

        // 추가 검색 제안
        response += "\n\n💡 더 정확한 정보가 필요하시면 네이버에서 검색해보시는 것을 추천드려요!";

        return response;
    }

    // 기본 응답 생성
    generateDefaultResponse(message, context) {
        const greeting = this.getTimeBasedGreeting(context.time_period);
        return `${greeting}\n\n무엇을 도와드릴까요? 편하게 말씀해주세요!`;
    }

    // 전체 컨텍스트 분석
    analyzeFullContext(message, sessionContext, conversationHistory) {
        const now = new Date();
        const hour = now.getHours();
        
        return {
            time_period: this.getTimePeriod(hour),
            hour: hour,
            day_of_week: now.getDay(),
            weather_condition: this.inferWeatherFromContext(message, conversationHistory),
            user_mood: this.detectEmotionalState(message),
            conversation_depth: conversationHistory ? conversationHistory.length : 0,
            session_duration: sessionContext ? (Date.now() - sessionContext.startTime) / 60000 : 0, // 분
            user_patterns: sessionContext ? this.analyzeUserPatterns(sessionContext) : {},
            recent_topics: this.extractRecentTopics(conversationHistory),
            is_repeat_user: conversationHistory && conversationHistory.length > 2
        };
    }

    // 시간대 분석
    getTimePeriod(hour) {
        if (hour >= 6 && hour < 10) return 'breakfast';
        if (hour >= 10 && hour < 14) return 'lunch'; 
        if (hour >= 14 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'dinner';
        return 'late_night';
    }

    // 시간대별 음식 추천
    getTimeBasedRecommendations(timePeriod) {
        return this.foodRecommendations.time_based[timePeriod] || this.foodRecommendations.time_based.lunch;
    }

    // 컨텍스트 기반 인사말
    getContextualGreeting(context) {
        const timePeriod = context.time_period;
        const greetings = {
            breakfast: "좋은 아침이에요! ☀️",
            lunch: "점심시간이네요! 🌤️", 
            dinner: "저녁시간이에요! 오늘도 수고 많으셨어요! 🌆",
            late_night: "늦은 시간이네요! 🌙"
        };
        
        return greetings[timePeriod] || "안녕하세요! 😊";
    }

    // 반복 질문 감지
    isRepeatQuestion(currentMessage, conversationHistory) {
        if (!conversationHistory || conversationHistory.length < 2) return false;
        
        const recentMessages = conversationHistory
            .filter(msg => msg.type === 'user')
            .slice(-3)
            .map(msg => msg.message);
        
        // 유사한 음식 관련 질문이 반복되는지 확인
        const foodKeywords = ['먹', '음식', '메뉴', '요리', '식사'];
        const currentHasFoodKeywords = foodKeywords.some(keyword => currentMessage.includes(keyword));
        
        if (currentHasFoodKeywords) {
            return recentMessages.some(msg => 
                foodKeywords.some(keyword => msg.includes(keyword))
            );
        }
        
        return false;
    }

    // 감정 상태 감지
    detectEmotionalState(message) {
        if (/좋아|행복|기뻐|최고|훌륭|감사/.test(message)) return 'happy';
        if (/힘들어|우울|슬퍼|스트레스|화나|짜증/.test(message)) return 'stressed';
        if (/피곤|지쳐|힘빠|졸려/.test(message)) return 'tired';
        if (/배고|허기|굶/.test(message)) return 'hungry';
        return 'neutral';
    }

    // 감정 기반 응답
    getEmotionalResponse(emotionalState) {
        const responses = {
            happy: "기분이 좋으시네요! 좋은 에너지가 느껴져요! ✨",
            stressed: "스트레스가 많으시군요. 잠깐 깊게 숨을 쉬어보세요. 💪",
            tired: "피곤하시겠어요. 오늘 하루 정말 수고 많으셨습니다. 😌",
            hungry: "배고프시군요! 맛있는 음식으로 에너지를 채워보세요! 🍽️"
        };
        
        return responses[emotionalState] || "오늘 하루 어떻게 지내고 계세요?";
    }

    // 시간대별 인사말
    getTimeBasedGreeting(timePeriod) {
        const greetings = this.timeBasedGreetings;
        const periodGreetings = greetings[timePeriod] || greetings.afternoon;
        return periodGreetings[Math.floor(Math.random() * periodGreetings.length)];
    }

    // 개방형 질문 생성
    generateOpenEndedQuestion(context, conversationHistory) {
        const questions = [
            "오늘 어떤 일이 있으셨나요?",
            "요즘 관심 있는 것이 있으시나요?",
            "혹시 도움이 필요한 것이 있을까요?",
            "편하게 이야기해보세요!"
        ];
        
        return questions[Math.floor(Math.random() * questions.length)];
    }

    // 후속 대화 감지
    isFollowUpConversation(conversationHistory) {
        return conversationHistory && conversationHistory.length > 3;
    }

    // 정보 확실성 평가
    assessInformationCertainty(message) {
        if (/어떻게|방법|구체적|자세히/.test(message)) return 'specific';
        if (/최신|정확한|확실한/.test(message)) return 'uncertain';
        return 'general';
    }

    // 개인화된 마무리 문구
    getPersonalizedClosing(context, conversationHistory) {
        const closings = [
            "맛있게 드세요! 😋",
            "좋은 식사 시간 되세요! 🍽️",
            "오늘도 맛있는 하루 보내세요! ✨",
            "든든하게 드시고 힘내세요! 💪"
        ];
        
        return closings[Math.floor(Math.random() * closings.length)];
    }

    // 시간대 텍스트
    getTimePeriodText(timePeriod) {
        const texts = {
            breakfast: "아침식사",
            lunch: "점심식사", 
            dinner: "저녁식사",
            late_night: "야식"
        };
        
        return texts[timePeriod] || "식사";
    }

    // 날씨 텍스트
    getWeatherText(weatherCondition) {
        const texts = {
            cold: "추운 날씨",
            hot: "더운 날씨",
            rainy: "비 오는 날"
        };
        
        return texts[weatherCondition] || "오늘 날씨";
    }

    // 날씨 추론 (메시지나 컨텍스트에서)
    inferWeatherFromContext(message, conversationHistory) {
        if (/춥|추워|겨울|차가/.test(message)) return 'cold';
        if (/덥|더워|여름|뜨거/.test(message)) return 'hot';
        if (/비|장마|우산/.test(message)) return 'rainy';
        return null;
    }

    // 사용자 패턴 분석
    analyzeUserPatterns(sessionContext) {
        if (!sessionContext) {
            return {
                messageCount: 0,
                averageMessageLength: 0,
                preferredTopics: {},
                responseStyle: 'detailed'
            };
        }
        
        return {
            messageCount: sessionContext.messageCount || 0,
            averageMessageLength: this.calculateAverageMessageLength(sessionContext.messages),
            preferredTopics: this.extractPreferredTopics(sessionContext.messages),
            responseStyle: (sessionContext.context && sessionContext.context.userProfile && sessionContext.context.userProfile.responseStyle) || 'detailed'
        };
    }

    // 평균 메시지 길이 계산
    calculateAverageMessageLength(messages) {
        if (!messages || messages.length === 0) return 0;
        
        const userMessages = messages.filter(msg => msg.type === 'user');
        const totalLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0);
        
        return userMessages.length > 0 ? Math.round(totalLength / userMessages.length) : 0;
    }

    // 선호 주제 추출
    extractPreferredTopics(messages) {
        const topics = {};
        const topicKeywords = {
            food: ['음식', '먹', '식사', '요리', '맛'],
            entertainment: ['영화', '드라마', '음악', '게임'],
            health: ['건강', '운동', '다이어트'],
            daily: ['오늘', '일상', '생활']
        };
        
        if (!messages) return topics;
        
        messages.forEach(msg => {
            if (msg.type === 'user') {
                Object.entries(topicKeywords).forEach(([topic, keywords]) => {
                    if (keywords.some(keyword => msg.message.includes(keyword))) {
                        topics[topic] = (topics[topic] || 0) + 1;
                    }
                });
            }
        });
        
        return topics;
    }

    // 최근 주제 추출
    extractRecentTopics(conversationHistory) {
        if (!conversationHistory || conversationHistory.length === 0) return [];
        
        const recentMessages = conversationHistory.slice(-5);
        const topics = new Set();
        
        recentMessages.forEach(msg => {
            if (msg.type === 'user') {
                if (/음식|먹|식사/.test(msg.message)) topics.add('food');
                if (/영화|드라마/.test(msg.message)) topics.add('entertainment');
                if (/날씨|기온/.test(msg.message)) topics.add('weather');
                if (/뉴스|정보/.test(msg.message)) topics.add('news');
            }
        });
        
        return Array.from(topics);
    }

    // 텍스트 이모지를 실제 이모지로 변환
    convertToEmoji(text) {
        const emojiMap = {
            // 기본 감정 이모지
            '[SMILE]': '😊',
            '[SPARKLE]': '✨',
            '[HEART]': '❤️',
            '[THUMBS_UP]': '👍',
            '[CLAP]': '👏',
            '[WAVE]': '👋',
            '[WINK]': '😉',
            '[LAUGH]': '😄',
            '[LOVE]': '🥰',
            '[HAPPY]': '😆',
            
            // 음식 관련 이모지
            '[FORK]': '🍽️',
            '[CHEF]': '👨‍🍳',
            '[YUM]': '😋',
            '[COOK]': '🍳',
            '[MEAL]': '🍽️',
            '[DELICIOUS]': '😋',
            
            // 시간/날씨 이모지
            '[SUN]': '☀️',
            '[MOON]': '🌙',
            '[CLOUD]': '☁️',
            '[RAIN]': '🌧️',
            '[SNOW]': '❄️',
            '[HOT]': '🌡️',
            '[COLD]': '🥶',
            
            // 활동 이모지
            '[THINK]': '🤔',
            '[IDEAS]': '💡',
            '[SEARCH]': '🔍',
            '[INFO]': 'ℹ️',
            '[TIP]': '💡',
            '[WARNING]': '⚠️',
            '[SUCCESS]': '✅',
            '[ERROR]': '❌',
            
            // 대화 관련 이모지
            '[CHAT]': '💬',
            '[QUESTION]': '❓',
            '[EXCLAMATION]': '❗',
            '[GREETING]': '👋',
            '[BYE]': '👋',
            
            // 기타 유용한 이모지
            '[FIRE]': '🔥',
            '[STAR]': '⭐',
            '[GIFT]': '🎁',
            '[PARTY]': '🎉',
            '[MUSIC]': '🎵',
            '[BOOK]': '📚',
            '[GAME]': '🎮',
            '[MOVIE]': '🎬',
            '[SPORT]': '⚽',
            '[COFFEE]': '☕',
            '[TEA]': '🍵'
        };

        let convertedText = text;
        
        // 모든 텍스트 이모지를 실제 이모지로 변환
        Object.entries(emojiMap).forEach(([textEmoji, realEmoji]) => {
            const regex = new RegExp(textEmoji.replace(/[[\]]/g, '\\$&'), 'g');
            convertedText = convertedText.replace(regex, realEmoji);
        });
        
        return convertedText;
    }

    // 응답에 자연스러운 이모지 추가
    addNaturalEmojis(text, intent, context) {
        let enhancedText = text;
        
        // 의도에 따른 이모지 추가
        if (intent === 'FOOD_QUESTION') {
            // 음식 관련 응답에 적절한 이모지 추가
            if (!enhancedText.includes('🍽️') && !enhancedText.includes('😋')) {
                if (context && context.time_period === 'dinner') {
                    enhancedText = '🌆 ' + enhancedText;
                } else if (context && context.time_period === 'breakfast') {
                    enhancedText = '☀️ ' + enhancedText;
                } else {
                    enhancedText = '🍽️ ' + enhancedText;
                }
            }
        } else if (intent === 'CASUAL_CONVERSATION') {
            // 일상 대화에 친근한 이모지 추가
            if (!enhancedText.includes('😊') && !enhancedText.includes('✨')) {
                enhancedText = '😊 ' + enhancedText;
            }
        }
        
        // 마무리에 적절한 이모지 추가
        if (enhancedText.includes('맛있게') && !enhancedText.includes('😋')) {
            enhancedText = enhancedText.replace('맛있게', '맛있게 😋');
        }
        
        if (enhancedText.includes('좋은') && !enhancedText.includes('✨')) {
            enhancedText = enhancedText.replace(/좋은\s+([^\s]+)/, '좋은 $1 ✨');
        }
        
        return enhancedText;
    }

    // 메인 응답 생성 함수 오버라이드 (이모지 변환 포함)
    generateContextAwareResponse(intent, message, sessionContext, conversationHistory) {
        console.log(`[CONTEXT] 컨텍스트 인식 응답 생성: ${intent}`);
        
        const context = this.analyzeFullContext(message, sessionContext, conversationHistory);
        
        let response = "";
        
        switch (intent) {
            case 'FOOD_QUESTION':
                response = this.generateFoodResponse(message, context, conversationHistory);
                break;
            
            case 'CASUAL_CONVERSATION':
                response = this.generateCasualResponse(message, context, conversationHistory);
                break;
            
            case 'INFORMATION_REQUEST':
                response = this.generateInformationResponse(message, context);
                break;
            
            default:
                response = this.generateDefaultResponse(message, context);
        }
        
        // 텍스트 이모지를 실제 이모지로 변환
        response = this.convertToEmoji(response);
        
        // 자연스러운 이모지 추가
        response = this.addNaturalEmojis(response, intent, context);
        
        return response;
    }
}

module.exports = ContextAwareGenerator;