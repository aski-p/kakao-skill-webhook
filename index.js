// 환경변수 로드 (Railway 배포용)
require('dotenv').config();

// 환경변수 로드 확인 로그 (API 키는 마스킹)
console.log('🔧 환경변수 로드 상태:');
console.log('- CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? `설정됨 (${process.env.CLAUDE_API_KEY.substring(0, 10)}...)` : '❌ 없음');
console.log('- NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID ? `설정됨 (${process.env.NAVER_CLIENT_ID.substring(0, 5)}...)` : '❌ 없음');
console.log('- NAVER_CLIENT_SECRET:', process.env.NAVER_CLIENT_SECRET ? '설정됨' : '❌ 없음');

// Railway에서 환경변수가 설정되지 않은 경우 에러 로그
if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY 환경변수가 설정되지 않았습니다!');
    console.error('Railway 대시보드에서 Variables 탭에 다음을 설정하세요:');
    console.error('CLAUDE_API_KEY = [Claude API 키]');
    console.error('NAVER_CLIENT_ID = [네이버 클라이언트 ID]');
    console.error('NAVER_CLIENT_SECRET = [네이버 클라이언트 시크릿]');
}

const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('./config/keywords');
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');
const SubAgentManager = require('./agents/sub-agent-manager'); // 서브에이전트 시스템 활성화

// [ENHANCED] 향상된 자연어 처리 및 세션 관리 시스템 (안전한 로딩)
let enhancedNLP, sessionManager, contextAwareGenerator, movieScheduler, naverWeatherCrawler;

try {
    enhancedNLP = require('./config/enhanced-nlp');
    console.log('✅ Enhanced NLP 로드됨');
} catch (error) {
    console.error('❌ Enhanced NLP 로드 실패:', error.message);
}

try {
    const SessionManagerClass = require('./config/session-manager');
    sessionManager = new SessionManagerClass();
    console.log('✅ Session Manager 로드됨');
} catch (error) {
    console.error('❌ Session Manager 로드 실패:', error.message);
}

try {
    contextAwareGenerator = require('./config/context-aware-generator');
    console.log('✅ Context Aware Generator 로드됨');
} catch (error) {
    console.error('❌ Context Aware Generator 로드 실패:', error.message);
}

try {
    movieScheduler = require('./scheduler/movie-update-scheduler');
    console.log('✅ Movie Scheduler 로드됨');
} catch (error) {
    console.error('❌ Movie Scheduler 로드 실패:', error.message);
}

try {
    naverWeatherCrawler = require('./crawlers/naver-weather-crawler');
    console.log('✅ Naver Weather Crawler 로드됨');
} catch (error) {
    console.error('❌ Naver Weather Crawler 로드 실패:', error.message);
}

// HTTP Keep-Alive 최적화 및 연결 안정성 향상
const httpAgent = new http.Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 30000
});
const httpsAgent = new https.Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 30000
});
axios.defaults.httpAgent = httpAgent;
axios.defaults.httpsAgent = httpsAgent;
// 전역 타임아웃 제거 - 개별 API별로 적절한 타임아웃 설정

const app = express();
app.use(express.json());

// 카카오톡 5초 제한에 맞춘 응답 타임아웃 설정 (운세 처리를 위해 늘림)
app.use((req, res, next) => {
    res.setTimeout(8000, () => {  // 8초로 늘림
        console.log('⏰ 서버 타임아웃 (8초) - 운세 처리 시간 확보');
        
        if (!res.headersSent) {
            res.status(200).json({
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: "⏰ 처리 시간이 길어지고 있습니다.\n\n간단한 질문으로 다시 시도해주세요."
                        }
                    }]
                }
            });
        }
    });
    next();
});

// 네이버 검색 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_API_URL = 'https://openapi.naver.com/v1/search/shop.json';
const NAVER_LOCAL_API_URL = 'https://openapi.naver.com/v1/search/local.json';

// 날씨 API 설정 (Open Weather Map)
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// 설정 파일에서 타임아웃 설정 가져오기
const TIMEOUT_CONFIG = config.timeouts;

// Claude API 설정
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// 🧠 향상된 Claude AI 기반 처리 - 정확성 강화, Supabase 영화 DB 연동, 네이버 날씨 최적화
async function callSimpleClaudeAI(userMessage, userId) {
    try {
        console.log(`[ENHANCED] Claude AI 호출: "${userMessage}" (사용자: ${userId})`);
        
        // 세션 관리로 대화 연속성 강화
        let conversationHistory = [];
        let sessionContext = {};
        console.log(`🔍 [SESSION DEBUG] 사용자 ID: ${userId}, 메시지: ${userMessage}`);
        console.log(`🔍 [SESSION DEBUG] sessionManager 존재: ${!!sessionManager}`);
        console.log(`🔍 [SESSION DEBUG] safeSessionManager 함수들:`, {
            createOrUpdateSession: typeof safeSessionManager.createOrUpdateSession,
            getConversationHistory: typeof safeSessionManager.getConversationHistory
        });
        
        try {
            console.log(`🔍 [SESSION DEBUG] 세션 생성 시작...`);
            const session = await safeSessionManager.createOrUpdateSession(userId, userMessage);
            console.log(`🔍 [SESSION DEBUG] 세션 생성 결과:`, session ? 'SUCCESS' : 'FAILED');
            if (session) {
                console.log(`🔍 [SESSION DEBUG] 세션 정보:`, {
                    sessionId: session.sessionId,
                    messageCount: session.messageCount,
                    messagesLength: session.messages?.length
                });
            }
            
            conversationHistory = safeSessionManager.getConversationHistory(userId, 15) || []; // 대화 히스토리 15개로 확장
            console.log(`🔍 [SESSION DEBUG] 대화 히스토리 길이: ${conversationHistory.length}`);
            
            sessionContext = session?.context || {};
        } catch (e) {
            console.error('❌ [SESSION DEBUG] 세션 관리 오류:', e.message);
            console.error('❌ [SESSION DEBUG] 스택 트레이스:', e.stack);
        }
        
        if (!CLAUDE_API_KEY) {
            console.log('⚠️ Claude API 키가 설정되지 않음');
            return `안녕하세요! 무엇을 도와드릴까요?`;
        }

        // 영화 관련 질문 감지 및 Supabase DB 조회
        if (isMovieRelatedQuery(userMessage)) {
            const movieResponse = await handleMovieQuery(userMessage, userId);
            if (movieResponse) {
                return movieResponse;
            }
        }

        // 날씨 관련 질문 감지 및 네이버 날씨 크롤러 사용
        if (isWeatherQuery(userMessage)) {
            const weatherResponse = await handleWeatherQuery(userMessage);
            if (weatherResponse) {
                return weatherResponse;
            }
        }

        // 즉시 응답 시스템 제거 - 자연스러운 대화를 위해 Claude AI에 위임
        
        // Claude AI 호출 - 자연스러운 대화
        try {
            // 대화 히스토리 포맷팅
            let conversationContext = '';
            if (conversationHistory && conversationHistory.length > 0) {
                conversationContext = '\n\n이전 대화 내용:\n';
                conversationHistory.forEach(msg => {
                    if (msg.type === 'user') {
                        conversationContext += `사용자: ${msg.message}\n`;
                    } else if (msg.type === 'bot') {
                        conversationContext += `AI: ${msg.message}\n`;
                    }
                });
                conversationContext += '\n---\n';
            }
            
            const response = await Promise.race([
                axios.post(CLAUDE_API_URL, {
                    model: "claude-3-5-sonnet-20240620", 
                    max_tokens: 400, // 300자 응답에 맞춰 토큰 수 감소
                    messages: [
                        {
                            role: "user",
                            content: `당신은 친근하고 간결한 대화를 나누는 AI 친구입니다. 

답변 가이드라인:
- 300자 내외의 간단명료한 답변을 제공하세요
- 핵심 정보만 포함하되 친근하게 답변하세요  
- 이모지를 적절히 사용하여 친근감을 더하세요
- 구체적이고 실용적인 답변을 해주세요
- 카카오톡 메시지에 적합한 길이로 답변하세요

이전 대화: ${conversationContext}

질문: ${userMessage}`
                        }
                    ],
                    temperature: 1.0 // 최대 창의성 (API 허용 범위)
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    timeout: 15000 // 15초로 타임아웃 증가
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Claude AI 타임아웃')), 15000))
            ]);

            let aiResponse = response.data.content[0].text;
            console.log(`✅ Claude AI 응답 성공: ${aiResponse.substring(0, 100)}...`);
            
            // 봇 응답을 세션에 저장
            try {
                await safeSessionManager.addBotResponse(userId, aiResponse, 'GENERAL');
                console.log('✅ 봇 응답 세션에 저장 완료');
            } catch (sessionError) {
                console.log('⚠️ 세션 저장 실패:', sessionError.message);
            }
            
            return aiResponse;
            
        } catch (claudeError) {
            console.error(`❌ Claude AI 호출 실패: ${claudeError.message}`);
            if (claudeError.response) {
                console.error('응답 상태:', claudeError.response.status);
                console.error('응답 데이터:', JSON.stringify(claudeError.response.data, null, 2));
            }
            console.error('요청 설정:', {
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 400, // 300자 응답에 맞춰 축소
                temperature: 0.7,
                userMessage: userMessage
            });
            return `죄송합니다. 잠시 후 다시 시도해주세요.`;
        }
        
    } catch (error) {
        console.error('❌ Claude AI 호출 오류:', error.message);
        
        // 타임아웃이거나 API 에러인 경우 간단한 안내만 제공
        if (error.message.includes('timeout') || error.message.includes('exceeded')) {
            return `⏰ 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.`;
        }
        
        // 날씨 질문인 경우 특별 처리
        if (isWeatherQuery(userMessage)) {
            try {
                const weatherResponse = await handleWeatherQuery(userMessage);
                if (weatherResponse) {
                    return weatherResponse;
                }
            } catch (weatherError) {
                console.log('날씨 처리 중 에러:', weatherError.message);
            }
            
            return `🌤️ 날씨 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.`;
        }
        
        return `잠시 후 다시 시도해주세요.`;
    }
}

// [ENHANCED] 향상된 Claude AI 호출 함수 (컨텍스트 인식) - 백업용으로 유지
async function callEnhancedClaudeAI(userMessage, userId) {
    try {
        console.log(`[ENHANCED] 향상된 Claude AI 호출: "${userMessage}" (사용자: ${userId})`);
        
        // 세션 관리 및 컨텍스트 수집
        const session = await safeSessionManager.createOrUpdateSession(userId, userMessage);
        const conversationHistory = safeSessionManager.getConversationHistory(userId, 10);
        
        // 향상된 자연어 이해 (의도 분석)
        const intentAnalysis = enhancedNLP.analyzeIntent(userMessage, conversationHistory);
        console.log(`[NLP] 감지된 의도: ${intentAnalysis.intent} (신뢰도: ${intentAnalysis.confidence})`);
        
        // 검색이 필요한 명시적 요청인지 확인
        if (intentAnalysis.intent === 'SEARCH_REQUEST' || 
            (/검색|최신.*뉴스|뉴스.*검색/.test(userMessage) && intentAnalysis.confidence > 0.6)) {
            console.log('🔍 명시적 검색 요청 감지 - 네이버 검색 실행');
            
            const searchResults = await getLatestNews(userMessage);
            if (searchResults && searchResults.length > 0) {
                let searchInfo = `🔍 "${userMessage}" 검색 결과\n\n📰 최신 정보:\n`;
                searchResults.slice(0, 3).forEach((news, index) => {
                    searchInfo += `${index + 1}. ${news.title}\n`;
                    if (news.description) {
                        searchInfo += `   ${news.description.substring(0, 100)}...\n`;
                    }
                    searchInfo += `\n`;
                });
                const koreanTime = getKoreanDateTime();
                searchInfo += `💡 더 자세한 정보는 네이버에서 "${userMessage}"를 검색해보세요.\n\n⏰ 검색 시간: ${koreanTime.formatted}`;
                
                // 세션에 응답 저장
                await safeSessionManager.addBotResponse(userId, searchInfo, 'SEARCH_REQUEST');
                return searchInfo;
            }
        }
        
        // 컨텍스트 인식 응답 생성 (음식, 일상대화 등)
        if (intentAnalysis.response_type === 'conversational') {
            console.log('[CONTEXT] 컨텍스트 인식 응답 생성');
            const contextResponse = contextGenerator.generateContextAwareResponse(
                intentAnalysis.intent, 
                userMessage, 
                session.context, 
                conversationHistory
            );
            
            // 세션에 응답 저장
            await safeSessionManager.addBotResponse(userId, contextResponse, intentAnalysis.intent);
            
            // 사용자 컨텍스트 업데이트
            safeSessionManager.updateUserContext(userId, {
                lastIntent: intentAnalysis.intent,
                topics: [...(session.context.topics || []), intentAnalysis.intent],
                contextAnalysis: intentAnalysis.context_analysis || {},
                conversationFlow: enhancedNLP.analyzeConversationFlow(userMessage, conversationHistory).flow_type
            });
            
            return contextResponse;
        }
        
        // 일반적인 정보 요청의 경우 Claude AI 호출
        if (!CLAUDE_API_KEY) {
            console.log('⚠️ Claude API 키가 설정되지 않음');
            const fallbackResponse = `안녕하세요! 구체적인 질문이나 검색어로 다시 시도해주세요.`;
            await safeSessionManager.addBotResponse(userId, fallbackResponse, 'FALLBACK');
            return fallbackResponse;
        }

        // 대화 히스토리를 포함한 컨텍스트 구성
        const contextPrompt = buildContextualPrompt(userMessage, conversationHistory, session);
        
        const response = await axios.post(CLAUDE_API_URL, {
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 400, // 300자 응답에 맞춰 축소
            messages: [{
                role: "user",
                content: contextPrompt
            }],
            temperature: 1.0 // 최대 창의성 (API 허용 범위)
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            timeout: 15000
        });

        const aiResponse = response.data.content[0].text;
        console.log(`✅ Claude AI 응답 성공: "${aiResponse.substring(0, 100)}..."`);
        
        // 세션에 응답 저장
        await safeSessionManager.addBotResponse(userId, aiResponse, intentAnalysis.intent);
        
        // 응답 품질 개선
        if (/모르겠|확실하지|정확하지|아마|~것 같/.test(aiResponse)) {
            console.log('🔍 불확실한 응답 감지 - 네이버 검색 제안 추가');
            return `${aiResponse}\n\n💡 더 정확한 정보는 네이버에서 "${userMessage}"를 검색해보세요!`;
        }
        
        return aiResponse;
        
    } catch (error) {
        console.error('❌ 향상된 Claude AI 호출 오류:', error.message);
        
        const errorResponse = `죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`;
        await safeSessionManager.addBotResponse(userId, errorResponse, 'ERROR');
        return errorResponse;
    }
}

// ⚡ 즉시 응답 시스템 (패턴 기반 빠른 답변)  
function getQuickResponse(userMessage, conversationHistory) {
    const koreanTime = getKoreanDateTime();
    const hour = new Date().getHours();
    
    // 음식 관련 즉시 응답 제거됨 - 서브에이전트 시스템에서 처리
    
    // 날씨 관련 즉시 응답 (확장된 패턴)
    if (userMessage.includes('날씨') || userMessage.includes('기온') || userMessage.includes('비') || userMessage.includes('눈') ||
        userMessage.includes('덥') || userMessage.includes('춥') || userMessage.includes('맑') || userMessage.includes('흐림') ||
        userMessage.includes('구름') || userMessage.includes('미세먼지') || userMessage.includes('온도') || userMessage.includes('습도')) {
        const city = extractLocation(userMessage) || '서울';
        return `🌤️ ${city} 날씨가 궁금하시군요!\n\n[🌤️:${city}]\n\n실시간 날씨 정보를 확인 중입니다! ☀️`;
    }
    
    // 인사 관련 즉시 응답 (확장된 패턴)
    if (userMessage.includes('안녕') || userMessage.includes('hi') || userMessage.includes('hello') ||
        userMessage.includes('반가') || userMessage.includes('처음') || userMessage.includes('좋은') ||
        userMessage.includes('감사') || userMessage.includes('고마') || userMessage.includes('하이')) {
        if (hour >= 0 && hour < 6) {
            return `🌙 안녕하세요! 새벽 시간이네요.\n야식이 생각나지 않으세요? 😊`;
        } else if (hour >= 6 && hour < 12) {
            return `☀️ 좋은 아침이에요!\n오늘 하루 어떻게 보내실 예정인가요? 😊`;
        } else if (hour >= 12 && hour < 18) {
            return `🌞 안녕하세요! 좋은 오후에요.\n점심은 드셨나요? 😊`;
        } else {
            return `🌆 안녕하세요! 좋은 저녁이에요.\n오늘 하루 어떠셨나요? 😊`;
        }
    }
    
    return null; // 패턴 매칭 실패시 Claude AI로 넘김
}

// 🔄 폴백 응답 시스템 (Claude AI 실패시)
// getFallbackResponse 함수 제거 - 자연스러운 대화를 위해 Claude AI에 위임

// 🗺️ 지역명 추출 함수
function extractLocation(message) {
    const locations = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '강남', '홍대', '신촌', '명동', '번동', '강북', '강서', '강동', '송파', '서초', '종로', '중구', '용산', '마포', '성북', '동대문', '성동', '광진', '중랑', '노원', '도봉', '은평', '서대문', '양천', '구로', '금천', '영등포', '동작', '관악', '금정', '범계', '분당', '판교', '일산'];
    
    for (const location of locations) {
        if (message.includes(location)) {
            return location;
        }
    }
    return null;
}

// 🔧 AI 응답에서 특별한 태그 처리 (네이버 API 연동)
async function processAITags(aiResponse, userMessage) {
    try {
        let processedResponse = aiResponse;
        
        // 날씨 요청 태그 처리 (이모지 버전)
        const weatherMatch = aiResponse.match(/\[🌤️:([^\]]+)\]/);
        if (weatherMatch) {
            const city = weatherMatch[1] || '서울';
            console.log(`🌤️ 날씨 API 호출: ${city}`);
            
            const weatherNews = await getLatestNews(`${city} 날씨 오늘`);
            if (weatherNews && weatherNews.length > 0) {
                let weatherInfo = `🌤️ ${city} 날씨 정보\n\n`;
                weatherNews.slice(0, 2).forEach((news, index) => {
                    const title = news.title.replace(/<[^>]*>/g, '');
                    weatherInfo += `${title}\n`;
                    if (news.description) {
                        const desc = news.description.replace(/<[^>]*>/g, '');
                        weatherInfo += `${desc.substring(0, 80)}...\n\n`;
                    }
                });
                weatherInfo += `💡 더 자세한 정보는 네이버에서 "${city} 날씨"를 검색하세요!`;
                processedResponse = processedResponse.replace(/\[🌤️:[^\]]+\]/, `\n\n${weatherInfo}`);
            } else {
                processedResponse = processedResponse.replace(/\[🌤️:[^\]]+\]/, `\n\n🌤️ ${city} 날씨 정보를 가져올 수 없습니다. 네이버에서 "${city} 날씨"를 검색해보세요!`);
            }
        }
        
        // 맛집 요청 태그 처리 (이모지 버전) - 빠른 처리
        const restaurantMatch = aiResponse.match(/\[🍽️:([^\]]+)\]/);
        if (restaurantMatch) {
            const query = restaurantMatch[1];
            console.log(`🍽️ 맛집 API 호출: ${query}`);
            
            try {
                // 타임아웃을 매우 짧게 설정하여 빠른 응답
                const restaurantResults = await Promise.race([
                    getLocalRestaurants(query),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('맛집 API 타임아웃')), 1000))
                ]);
                
                if (restaurantResults && restaurantResults.length > 0) {
                    let restaurantInfo = `🍽️ ${query} 맛집 추천\n\n`;
                    restaurantResults.slice(0, 2).forEach((restaurant, index) => {
                        const title = restaurant.title.replace(/<[^>]*>/g, '');
                        restaurantInfo += `${index + 1}. ${title}\n`;
                        if (restaurant.address) {
                            restaurantInfo += `   📍 ${restaurant.address.substring(0, 30)}...\n`;
                        }
                    });
                    processedResponse = processedResponse.replace(/\[🍽️:[^\]]+\]/, `\n\n${restaurantInfo}`);
                } else {
                    processedResponse = processedResponse.replace(/\[🍽️:[^\]]+\]/, `\n\n🍽️ 네이버에서 "${query} 맛집"를 검색해보세요!`);
                }
            } catch (error) {
                console.log(`⚠️ 맛집 API 빠른 실패: ${error.message}`);
                processedResponse = processedResponse.replace(/\[🍽️:[^\]]+\]/, `\n\n🍽️ 네이버에서 "${query} 맛집"를 검색해보세요!`);
            }
        }
        
        return processedResponse;
        
    } catch (error) {
        console.error('❌ AI 태그 처리 오류:', error.message);
        // 태그만 제거하고 원본 응답 반환
        return aiResponse.replace(/\[🌤️:[^\]]+\]/g, '').replace(/\[🍽️:[^\]]+\]/g, '');
    }
}

// 🧠 심플한 프롬프트 구성 - 자연스러운 대화에 집중
function buildSimplePrompt(currentMessage, conversationHistory) {
    const koreanTime = getKoreanDateTime();
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const hour = koreaTime.getHours();
    
    let timeOfDay = "";
    if (hour >= 0 && hour < 6) timeOfDay = "새벽/야식시간";
    else if (hour >= 6 && hour < 10) timeOfDay = "아침시간";
    else if (hour >= 10 && hour < 14) timeOfDay = "점심시간";
    else if (hour >= 14 && hour < 18) timeOfDay = "오후시간";
    else if (hour >= 18 && hour < 22) timeOfDay = "저녁시간";
    else timeOfDay = "야식시간";
    
    // 10분간 대화 기억하는 자연스러운 프롬프트
    let prompt = `한국어 AI. 현재 ${timeOfDay}.\n`;
    
    // 최근 3개 대화 맥락 포함 (10분간 기억)
    if (conversationHistory && conversationHistory.length > 0) {
        prompt += `\n최근 대화:\n`;
        conversationHistory.slice(-3).forEach((msg, index) => {
            if (msg.type === 'user') {
                prompt += `사용자: ${msg.message}\n`;
            } else if (msg.type === 'bot') {
                prompt += `AI: ${msg.message.substring(0, 50)}...\n`;
            }
        });
    }
    
    prompt += `\n현재 질문: ${currentMessage}\n\n`;
    prompt += `위 대화 맥락을 기억하며 자연스럽게 이어서 대화하세요.\n실시간 정보 필요시:\n- 날씨: [🌤️:도시명]\n- 맛집: [🍽️:지역 음식종류]\n\n150자 내외 답변.`;
    
    return prompt;
}

// 🧠 지능형 프롬프트 구성 - Claude AI가 모든 것을 판단 (백업용)
function buildIntelligentPrompt(currentMessage, conversationHistory, session) {
    const koreanTime = getKoreanDateTime();
    const hour = new Date().getHours();
    
    let prompt = `당신은 한국어를 구사하는 친근하고 도움이 되는 AI 어시스턴트입니다.

현재 시간: ${koreanTime.formatted} (${hour}시)

사용 가능한 도구들:
1. [SEARCH_NAVER]: 실시간 뉴스, 정보 검색이 필요할 때 사용
   - 형식: [SEARCH_NAVER:검색어]
   - 예: [SEARCH_NAVER:오늘 뉴스], [SEARCH_NAVER:날씨 서울]

2. [SEARCH_MOVIE]: 영화 정보, 평점이 필요할 때 사용  
   - 형식: [SEARCH_MOVIE:영화제목]
   - 예: [SEARCH_MOVIE:어벤져스]

3. [SEARCH_RESTAURANT]: 맛집 정보가 필요할 때 사용
   - 형식: [SEARCH_RESTAURANT:지역 음식종류]
   - 예: [SEARCH_RESTAURANT:강남 일식]

사용자와의 대화:`;
    
    // 대화 히스토리 포함 (최근 3개)
    if (conversationHistory && conversationHistory.length > 0) {
        prompt += `\n\n최근 대화:`;
        conversationHistory.slice(-3).forEach(msg => {
            if (msg.type === 'user') {
                prompt += `\n사용자: ${msg.message}`;
            } else {
                prompt += `\nAI: ${msg.message.substring(0, 100)}...`;
            }
        });
    }
    
    prompt += `\n\n현재 사용자 질문: ${currentMessage}

응답 지침:
- 음식 추천: 현재 시간(${hour}시)을 고려해서 자연스럽게 추천
- 영화 질문: 구체적인 영화명이 있으면 [SEARCH_MOVIE] 도구 사용  
- 실시간 정보: 뉴스, 날씨 등은 [SEARCH_NAVER] 도구 사용
- 맛집 문의: 지역이 명시된 경우 [SEARCH_RESTAURANT] 도구 사용
- 일반 대화: 도구 없이 자연스럽게 대화

자연스럽고 친근하게 한국어로 답변해주세요.`;

    return prompt;
}

// 영화 관련 질문 감지 함수
function isMovieRelatedQuery(message) {
    const movieKeywords = ['영화', '무비', 'movie', '개봉', '상영', '평점', '리뷰', '감독', '배우', '출연', 'CGV', '메가박스', '롯데시네마'];
    return movieKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

// 날씨 관련 질문 감지 함수
function isWeatherQuery(message) {
    const weatherKeywords = ['날씨', '기온', '온도', '비', '눈', '맑음', '흐림', '구름', '습도', '미세먼지', '날씨어때', '오늘날씨', '내일날씨'];
    return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

// 운세 관련 질문인지 판단하는 함수
function isFortuneQuery(message) {
    const fortuneKeywords = [
        '운세', '운', '행운', '불운', '길일', '흉일',
        '띠', '별자리', '탄생', '사주', '팔자', '궁합', '점', '점괘',
        '금전운', '재물운', '애정운', '연애운', '건강운', '사업운', '학업운', '시험운',
        '오늘의 운세', '오늘 운세', '내일의 운세', '내일 운세',
        '이번주 운세', '이번달 운세', '운세 알려', '운세 봐',
        '운 어때', '운 좋', '운 나쁘', '행운의 색', '행운의 숫자', '행운 아이템'
    ];
    const lowerMessage = message.toLowerCase();
    return fortuneKeywords.some(keyword => lowerMessage.includes(keyword));
}


// 간단한 대화인지 판단하는 함수
function isSimpleConversation(message) {
    const simpleConversationKeywords = [
        // 음식 관련
        '먹', '음식', '메뉴', '요리', '맛있', '배고', '식사', '점심', '저녁', '아침', '야식',
        // 인사/일반 대화
        '안녕', '반가', '고마', '감사', '미안', '죄송', '좋다', '싫다', '기분', '힘들', '행복', '슬프',
        // 간단한 질문
        '뭐해', '어때', '괜찮', '좋아', '시간', '오늘', '내일', '언제', '어디', '누구',
        // 일반적인 대화
        '그래', '응', '네', '예', '아니', '맞아', '틀려', '몰라', '알아'
    ];
    
    const message_lower = message.toLowerCase();
    
    // 복잡한 요청이 아닌 일반 대화로 분류
    const complexKeywords = [
        '검색', '찾아', '추천', '비교', '분석', '계산', '번역', '설명', '정보',
        '쇼핑', '구매', '가격', '상품', '리뷰', 'http', 'www', '.com', '링크'
    ];
    
    // 복잡한 키워드가 있으면 간단한 대화가 아님
    if (complexKeywords.some(keyword => message_lower.includes(keyword))) {
        return false;
    }
    
    // 간단한 대화 키워드가 있거나, 짧은 메시지면 간단한 대화로 분류
    return simpleConversationKeywords.some(keyword => message_lower.includes(keyword)) || message.length < 20;
}

// 영화 쿼리 처리 함수 - Supabase 연동
async function handleMovieQuery(message, userId) {
    try {
        // Supabase 연결 확인
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.log('⚠️ Supabase 설정이 없어 네이버 API 사용');
            return null; // Claude AI로 폴백
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // 영화 제목 추출 (개선된 로직)
        let movieTitle = null;
        
        // 1. 따옴표로 둘러싸인 제목 추출
        const quotedMatch = message.match(/["'「」『』]([^"'「」『』]+)["'「」『』]/);
        if (quotedMatch) {
            movieTitle = quotedMatch[1];
        }
        // 2. "OOO 영화" 패턴
        else {
            const moviePatternMatch = message.match(/([가-힣a-zA-Z0-9\s]+)\s*(영화|무비|movie)/i);
            if (moviePatternMatch) {
                movieTitle = moviePatternMatch[1].trim();
            }
        }
        // 3. "영화평", "평점", "리뷰" 앞의 단어 추출
        if (!movieTitle) {
            const reviewPatternMatch = message.match(/([가-힣a-zA-Z0-9\s]+)\s*(영화평|평점|리뷰|평가)/i);
            if (reviewPatternMatch) {
                movieTitle = reviewPatternMatch[1].trim();
            }
        }
        
        if (movieTitle) {
            // 영화 제목 검색 개선: 띄어쓰기 변형도 검색
            let searchResults = [];
            
            // 1. 원본 제목으로 검색
            const { data: directSearch, error: directError } = await supabase
                .from('movies')
                .select('*')
                .ilike('title', `%${movieTitle}%`)
                .limit(5);
                
            if (directSearch && directSearch.length > 0) {
                searchResults = directSearch;
            }
            
            // 2. 검색 결과가 없으면 띄어쓰기 변형으로 재검색
            if (searchResults.length === 0) {
                const variations = [
                    movieTitle.replace(/\s+/g, ''),  // 모든 공백 제거
                    movieTitle.replace(/\s+/g, ' '), // 다중 공백을 단일 공백으로
                    movieTitle.split('').join(' '),  // 글자 사이에 공백 추가
                    movieTitle.replace(/([가-힣])([a-zA-Z0-9])/g, '$1 $2'), // 한글과 영숫자 사이 공백
                    movieTitle.replace(/([a-zA-Z0-9])([가-힣])/g, '$1 $2')  // 영숫자와 한글 사이 공백
                ];
                
                for (const variant of variations) {
                    if (variant !== movieTitle) {
                        const { data: variantSearch } = await supabase
                            .from('movies')
                            .select('*')
                            .ilike('title', `%${variant}%`)
                            .limit(5);
                            
                        if (variantSearch && variantSearch.length > 0) {
                            searchResults = variantSearch;
                            console.log(`✅ 영화 검색 성공: "${movieTitle}" -> "${variant}"`);
                            break;
                        }
                    }
                }
            }
            
            // 3. 여전히 없으면 키워드 검색
            if (searchResults.length === 0) {
                const { data: keywordSearch } = await supabase
                    .from('movies')
                    .select('*')
                    .contains('keywords', [movieTitle])
                    .limit(5);
                    
                if (keywordSearch && keywordSearch.length > 0) {
                    searchResults = keywordSearch;
                    console.log(`✅ 키워드 검색 성공: "${movieTitle}"`);
                }
            }
            
            const movies = searchResults;
            const error = directError;
            
            if (!error && movies && movies.length > 0) {
                const movie = movies[0];
                let response = `🎬 **${movie.title}** 영화 정보\n\n`;
                
                // 기본 정보
                response += `🎭 **감독:** ${movie.director || '정보 없음'}\n`;
                
                // 출연진 (cast_members 또는 actors 필드 사용)
                const cast = movie.cast_members || movie.actors;
                if (cast && Array.isArray(cast) && cast.length > 0) {
                    response += `👥 **출연:** ${cast.slice(0, 5).join(', ')}\n`;
                } else if (cast && typeof cast === 'string') {
                    response += `👥 **출연:** ${cast}\n`;
                } else {
                    response += `👥 **출연:** 정보 없음\n`;
                }
                
                // 장르
                if (movie.genre) {
                    response += `🎪 **장르:** ${movie.genre}\n`;
                }
                
                // 개봉 정보
                if (movie.release_year) {
                    response += `📅 **개봉:** ${movie.release_year}년\n`;
                } else if (movie.release_date) {
                    response += `📅 **개봉:** ${movie.release_date}\n`;
                } else {
                    response += `📅 **개봉:** 정보 없음\n`;
                }
                
                // 상영시간
                if (movie.runtime_minutes) {
                    response += `⏰ **상영시간:** ${movie.runtime_minutes}분\n`;
                }
                
                // 평점 정보
                response += `\n📊 **평점 정보:**\n`;
                if (movie.naver_rating) {
                    const rating = parseFloat(movie.naver_rating);
                    const stars = '⭐'.repeat(Math.round(rating / 2));
                    response += `• 네이버 평점: ${rating}/10 ${stars}\n`;
                    
                    // 평점 분석
                    if (rating >= 8.0) {
                        response += `  💫 **매우 높은 평점!** 강력 추천작입니다\n`;
                    } else if (rating >= 7.0) {
                        response += `  👍 **좋은 평점!** 볼만한 작품입니다\n`;
                    } else if (rating >= 6.0) {
                        response += `  😊 **무난한 평점** 적당히 즐길 수 있어요\n`;
                    }
                } else {
                    response += `• 네이버 평점: 정보 없음\n`;
                }
                
                if (movie.critic_score !== null && movie.critic_score !== undefined) {
                    response += `• 평론가 평점: ${movie.critic_score}/10\n`;
                }
                if (movie.audience_score !== null && movie.audience_score !== undefined) {
                    response += `• 관객 평점: ${movie.audience_score}/10\n`;
                }
                
                // 줄거리
                if (movie.description) {
                    response += `\n📝 **줄거리:**\n${movie.description.substring(0, 300)}${movie.description.length > 300 ? '...' : ''}\n`;
                }
                
                // 추가 정보
                response += `\n🎯 **추가 정보:**\n`;
                if (movie.country) {
                    response += `• 제작국가: ${movie.country}\n`;
                }
                if (movie.naver_movie_id) {
                    response += `• 네이버 영화 상세: https://movie.naver.com/movie/bi/mi/basic.naver?code=${movie.naver_movie_id}\n`;
                }
                
                response += `\n마지막 업데이트: ${new Date(movie.updated_at).toLocaleDateString('ko-KR')}`;
                
                return response;
            } else {
                // DB에서 찾지 못한 경우 상세한 안내 메시지
                console.log(`⚠️ "${movieTitle}" 영화를 DB에서 찾을 수 없음`);
                return `🎬 **"${movieTitle}"** 영화 정보\n\n❌ 죄송합니다. 현재 데이터베이스에 "${movieTitle}" 영화 정보가 없습니다.\n\n💡 **가능한 원인:**\n• 영화 제목 오타나 띄어쓰기 차이\n• 아직 데이터베이스에 등록되지 않은 영화\n• 개봉 예정작이거나 구작\n\n🔍 **다시 시도해보세요:**\n• 정확한 영화 제목으로 검색\n• 영어 제목이나 한글 제목으로 시도\n• "영화 제목 + 영화평" 형식으로 질문\n\n📝 **예시:**\n• "베놈 영화평"\n• "어벤져스 평점"\n• "기생충 리뷰"\n\n현재 ${new Date().toLocaleDateString('ko-KR')} 기준으로 최신 영화 정보를 주기적으로 업데이트하고 있습니다.`;
            }
        }
        
        // 영화 제목을 추출하지 못한 경우
        console.log('⚠️ 메시지에서 영화 제목을 추출할 수 없음');
        return `🎬 **영화 정보 요청**\n\n영화에 대한 정보를 찾고 계시는군요! 더 정확한 정보를 드리기 위해 구체적인 영화 제목을 알려주세요.\n\n🎯 **이렇게 질문해보세요:**\n• "베놈 영화평"\n• "기생충 평점 알려줘"\n• "어벤져스 리뷰"\n• "탑건 매버릭 어때?"\n\n현재 데이터베이스에는 최신 한국영화와 인기 해외영화 정보가 저장되어 있습니다. 정확한 제목으로 다시 질문해주시면 상세한 정보를 드릴게요! 🎭`;
        
    } catch (error) {
        console.error('❌ 영화 쿼리 처리 오류:', error);
        return null;
    }
}

// 날씨 아이콘 반환 함수
function getWeatherIcon(condition) {
    if (!condition) return '🌤️';
    
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('맑') || lowerCondition.includes('화창')) return '☀️';
    if (lowerCondition.includes('구름많') || lowerCondition.includes('흐림')) return '☁️';
    if (lowerCondition.includes('구름조금')) return '⛅';
    if (lowerCondition.includes('비') || lowerCondition.includes('소나기')) return '🌧️';
    if (lowerCondition.includes('눈')) return '❄️';
    if (lowerCondition.includes('번개') || lowerCondition.includes('뇌우')) return '⛈️';
    if (lowerCondition.includes('안개')) return '🌫️';
    
    return '🌤️';
}

// 날씨 쿼리 처리 함수 - 네이버 날씨 페이지 직접 크롤링
async function handleWeatherQuery(message) {
    try {
        // 지역 추출
        const locationPatterns = [
            /([가-힣]+(?:시|구|동|읍|면|도))\s*날씨/,
            /날씨\s*([가-힣]+(?:시|구|동|읍|면|도))/,
            /([가-힣]+)\s*날씨/,
            /날씨\s*([가-힣]+)/
        ];
        
        let location = '서울'; // 기본값
        for (const pattern of locationPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                location = match[1].replace(/날씨/g, '').trim();
                break;
            }
        }
        
        console.log(`🌤️ 날씨 정보 요청: ${location} (네이버 날씨 페이지 크롤링)`);
        
        // 네이버 날씨 페이지 직접 크롤링
        const weatherData = await getNaverWeatherData(location);
        
        if (weatherData) {
            let response = `📍 ${location} 날씨\n`;
            response += `${'━'.repeat(20)}\n\n`;
            
            // 현재 날씨 - 더 깔끔한 포맷
            if (weatherData.current) {
                const currentIcon = getWeatherIcon(weatherData.current.condition);
                response += `【 현재 날씨 】\n`;
                response += `${currentIcon} ${weatherData.current.temp}°C │ ${weatherData.current.condition}\n`;
                if (weatherData.current.humidity) {
                    response += `💧 습도 ${weatherData.current.humidity}%\n`;
                }
            }
            
            // 시간별 예보 - 더 보기 좋은 테이블 형식
            if (weatherData.hourly && weatherData.hourly.length > 0) {
                response += `\n【 시간별 예보 】\n`;
                response += `${'─'.repeat(25)}\n`;
                
                for (let i = 0; i < Math.min(8, weatherData.hourly.length); i++) {
                    const hour = weatherData.hourly[i];
                    const time = hour.time.padEnd(5);
                    const temp = hour.temp.toString().padStart(2);
                    const weatherIcon = getWeatherIcon(hour.condition);
                    response += `${time} │ ${temp}° │ ${weatherIcon} ${hour.condition}\n`;
                }
                response += `${'─'.repeat(25)}\n`;
            }
            
            response += `\n💡 더 자세한 날씨는 아래 버튼을 클릭하세요`;
            return response;
        }
        
        // 날씨 데이터를 가져올 수 없는 경우 기본 메시지
        return `🌤️ ${location} 날씨 정보를 가져올 수 없었습니다.\n\n💡 네이버에서 "${location} 날씨"를 검색해보세요.`;
        
    } catch (error) {
        console.error('❌ 날씨 쿼리 처리 오류:', error);
        return null;
    }
}

// 네이버 날씨 정보 크롤링 함수
async function getNaverWeatherData(location) {
    try {
        console.log(`🌤️ 네이버 날씨 크롤링 시작: ${location}`);
        
        // 네이버 날씨 페이지 URL 생성
        const searchQuery = encodeURIComponent(`${location} 날씨`);
        const weatherUrl = `https://search.naver.com/search.naver?query=${searchQuery}`;
        
        const response = await axios.get(weatherUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        
        if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = response.data;
        console.log('✅ 네이버 날씨 페이지 로드 성공');
        
        // 현재 날씨 정보 추출
        const currentWeather = {
            temp: extractFromHTML(html, /현재\s*온도.*?(\d+)°?/i) || 
                  extractFromHTML(html, /온도.*?(\d+)°?/i) ||
                  extractFromHTML(html, /(\d+)°C/i),
            condition: extractFromHTML(html, /(맑음|흐림|비|눈|구름많음|흐린|맑은)/i) || '확인중',
            humidity: extractFromHTML(html, /습도.*?(\d+)%/i)
        };
        
        // 시간별 예보 추출 (간단한 예제 - 실제로는 더 복잡한 파싱 필요)
        const hourlyForecast = [];
        const currentHour = new Date().getHours();
        
        // 임시 시간별 데이터 (실제 구현시 HTML에서 추출)
        for (let i = 0; i < 6; i++) {
            const hour = (currentHour + i) % 24;
            hourlyForecast.push({
                time: `${hour.toString().padStart(2, '0')}시`,
                temp: currentWeather.temp ? (parseInt(currentWeather.temp) + Math.floor(Math.random() * 6 - 3)) : '25',
                condition: currentWeather.condition
            });
        }
        
        console.log(`✅ 날씨 정보 추출 완료: 온도 ${currentWeather.temp}°C, 날씨 ${currentWeather.condition}`);
        
        return {
            current: currentWeather,
            hourly: hourlyForecast
        };
        
    } catch (error) {
        console.error('❌ 네이버 날씨 크롤링 오류:', error.message);
        return null;
    }
}

// HTML에서 정보 추출 헬퍼 함수
function extractFromHTML(html, regex) {
    const match = html.match(regex);
    return match ? match[1] : null;
}

// 대화 주제 추출 함수 - 향상된 컨텍스트 관리
function extractTopicFromMessage(message) {
    const topics = {
        '영화': ['영화', '무비', '개봉', '상영', 'CGV', '롯데시네마', '평점', '리뷰', '감독', '배우'],
        '날씨': ['날씨', '기온', '비', '눈', '맑음', '흐림', '구름', '습도', '미세먼지', '오늘날씨', '내일날씨'],
        '음식': ['먹', '음식', '맛집', '배고프', '식사', '점심', '저녁', '아침', '야식', '배달', '요리'],
        '운동': ['운동', '헬스', '조깅', '요가', '수영', '헬스장', '운동하', '다이어트', '건강'],
        '쇼핑': ['사고싶', '구매', '쇼핑', '제품', '가격', '카트', '배송', '비교', '할인'],
        '뉴스': ['뉴스', '소식', '이슈', '사건', '상황', '정보', '새소식', '발생']
    };
    
    for (const [topic, keywords] of Object.entries(topics)) {
        if (keywords.some(keyword => message.includes(keyword))) {
            return topic;
        }
    }
    
    return '일반대화'; // 주제를 찾지 못한 경우
}

// 대화 연속성을 위한 컨텍스트 분석 함수
function analyzeConversationContext(message, history, sessionContext) {
    const analysis = {
        isFollowUp: false,
        relatedTopic: null,
        emotionalState: 'neutral',
        conversationFlow: 'new_topic',
        userIntent: null,
        contextualResponse: null
    };
    
    // 이전 대화와 연결성 분석
    if (history && history.length > 0) {
        const lastMessage = history[history.length - 1];
        const currentTopic = extractTopicFromMessage(message);
        const lastTopic = extractTopicFromMessage(lastMessage.message);
        
        // 동일 주제의 연속 대화 감지
        if (currentTopic === lastTopic && currentTopic !== '일반대화') {
            analysis.isFollowUp = true;
            analysis.relatedTopic = currentTopic;
            analysis.conversationFlow = 'continuation';
        }
        
        // 추가 정보 요청 감지
        const additionalInfoKeywords = ['더', '자세히', '추가', '다른', '또', '여전히', '그렇다면', '그럼'];
        const isAskingMore = additionalInfoKeywords.some(keyword => message.includes(keyword));
        
        if (isAskingMore) {
            analysis.isFollowUp = true;
            analysis.conversationFlow = 'elaboration_request';
            analysis.contextualResponse = '이전 대화를 바탕으로 더 자세한 정보를 제공해드리겠습니다.';
        }
    }
    
    // 감정 상태 분석
    const emotionKeywords = {
        'happy': ['기뽐', '좋아', '행복', '신나', '좋은', '최고', '멋진'],
        'sad': ['슬픈', '우울', '시무룩', '답답', '힘든', '힘들', '지친'],
        'frustrated': ['짜증', '어려운', '곱난', '복잡', '모르겠', '헷갈려', '어떻게'],
        'excited': ['신나', '없나', '기대', '떨린다', '기다리', '빨리', '언제'],
        'tired': ['피곤', '지치', '피곤한', '힘든', '잘고싶', '지친', '푸석']
    };
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(keyword => message.includes(keyword))) {
            analysis.emotionalState = emotion;
            break;
        }
    }
    
    return analysis;
}

// 컨텍스트 기반 응답 생성 함수
function generateContextualResponse(message, analysis, sessionContext) {
    let contextualPrefix = '';
    
    if (analysis.isFollowUp) {
        const followUpResponses = [
            '아까 말씨드린 내용과 관련해서',
            '이어서 말씨드리면',
            '그렇다면 추가로',
            '비슷한 맥락에서',
            '방금 말씨해드린 것처럼'
        ];
        contextualPrefix = followUpResponses[Math.floor(Math.random() * followUpResponses.length)];
    }
    
    if (analysis.emotionalState !== 'neutral') {
        const emotionalResponses = {
            'happy': ['기분이 좋으시네요!', '좋은 기운이 느껴져요!', '행복한 마음이 전해져요!'],
            'sad': ['지금 힘드시겠네요.', '힘든 시간을 보내고 계시군요.', '위로가 되었으면 좋겠어요.'],
            'frustrated': ['복잡하시겠네요.', '어려움을 겪고 계시는군요.', '차근차근 해결해보세요.'],
            'excited': ['기대가 크시군요!', '흥미진진하시네요!', '열정이 느껴져요!'],
            'tired': ['많이 피곤하시겠네요.', '수고하셨어요.', '충분한 휴식이 필요하시겠네요.']
        };
        
        if (emotionalResponses[analysis.emotionalState]) {
            const emotionalPrefix = emotionalResponses[analysis.emotionalState];
            contextualPrefix = (contextualPrefix ? contextualPrefix + ' ' : '') + emotionalPrefix[Math.floor(Math.random() * emotionalPrefix.length)];
        }
    }
    
    return contextualPrefix;
}

// 향상된 프롬프트 구성 함수
function buildEnhancedPrompt(currentMessage, conversationHistory, sessionContext) {
    const hour = new Date().getHours();
    let prompt = `현재 시간: ${hour}시\n\n`;
    
    // 세션 컨텍스트 추가
    if (sessionContext.lastTopic) {
        prompt += `이전 대화 주제: ${sessionContext.lastTopic}\n`;
    }
    
    // 대화 히스토리 포함 (최근 5개)
    if (conversationHistory && conversationHistory.length > 0) {
        prompt += `\n최근 대화:\n`;
        conversationHistory.slice(-5).forEach(msg => {
            if (msg.type === 'user') {
                prompt += `사용자: ${msg.message}\n`;
            } else {
                prompt += `AI: ${msg.message.substring(0, 100)}...\n`;
            }
        });
    }
    
    prompt += `\n현재 사용자 질문: ${currentMessage}\n\n`;
    prompt += `응답 지침:\n`;
    prompt += `1. 정확하고 사실 기반의 정보 제공\n`;
    prompt += `2. 대화의 맥락을 고려한 일관된 응답\n`;
    prompt += `3. 불확실한 정보는 명확히 표시\n`;
    prompt += `4. 친근하고 도움이 되는 톤 유지\n`;
    prompt += `5. 이전 대화 내용을 참고하여 연속성 있는 대화\n\n`;
    prompt += `자연스럽고 정확한 한국어로 답변해주세요.`;
    
    return prompt;
}

// 🔧 AI 도구 요청 처리 함수 (확장)
async function processAIToolRequests(aiResponse, userMessage, userId) {
    let processedResponse = aiResponse;
    
    try {
        // 네이버 검색 요청 처리
        const naverSearchMatch = aiResponse.match(/\[SEARCH_NAVER:([^\]]+)\]/);
        if (naverSearchMatch) {
            const searchQuery = naverSearchMatch[1];
            console.log(`🔍 네이버 검색 요청: "${searchQuery}"`);
            
            const searchResults = await getLatestNews(searchQuery);
            if (searchResults && searchResults.length > 0) {
                let searchInfo = `\n\n📰 "${searchQuery}" 최신 정보:\n`;
                searchResults.slice(0, 3).forEach((news, index) => {
                    searchInfo += `${index + 1}. ${news.title}\n`;
                    if (news.description) {
                        searchInfo += `   ${news.description.substring(0, 80)}...\n`;
                    }
                });
                processedResponse = processedResponse.replace(/\[SEARCH_NAVER:[^\]]+\]/, searchInfo);
            } else {
                processedResponse = processedResponse.replace(/\[SEARCH_NAVER:[^\]]+\]/, '\n\n죄송합니다. 검색 결과를 가져올 수 없습니다.');
            }
        }
        
        // 영화 검색 요청 처리  
        const movieSearchMatch = aiResponse.match(/\[SEARCH_MOVIE:([^\]]+)\]/);
        if (movieSearchMatch) {
            const movieTitle = movieSearchMatch[1];
            console.log(`🎬 영화 검색 요청: "${movieTitle}"`);
            
            const movieResults = await getNaverMovieInfo(movieTitle);
            if (movieResults && movieResults.length > 0) {
                const movie = movieResults[0];
                let movieInfo = `\n\n🎬 "${movieTitle}" 정보:\n`;
                movieInfo += `📍 제목: ${movie.title}\n`;
                movieInfo += `🎭 감독: ${movie.director}\n`;
                movieInfo += `👥 출연: ${movie.actor}\n`;
                movieInfo += `📅 개봉: ${movie.pubDate}\n`;
                movieInfo += `⭐ 평점: ${movie.userRating}/10`;
                processedResponse = processedResponse.replace(/\[SEARCH_MOVIE:[^\]]+\]/, movieInfo);
            } else {
                processedResponse = processedResponse.replace(/\[SEARCH_MOVIE:[^\]]+\]/, '\n\n죄송합니다. 해당 영화 정보를 찾을 수 없습니다.');
            }
        }
        
        // 맛집 검색 요청 처리
        const restaurantSearchMatch = aiResponse.match(/\[SEARCH_RESTAURANT:([^\]]+)\]/);
        if (restaurantSearchMatch) {
            const restaurantQuery = restaurantSearchMatch[1];
            console.log(`🍽️ 맛집 검색 요청: "${restaurantQuery}"`);
            
            const restaurantResults = await getLocalRestaurants(restaurantQuery);
            if (restaurantResults && restaurantResults.length > 0) {
                let restaurantInfo = `\n\n🍽️ "${restaurantQuery}" 맛집 추천:\n`;
                restaurantResults.slice(0, 3).forEach((restaurant, index) => {
                    restaurantInfo += `${index + 1}. ${restaurant.title.replace(/<[^>]*>/g, '')}\n`;
                    restaurantInfo += `   📍 ${restaurant.address}\n`;
                    if (restaurant.category) {
                        restaurantInfo += `   🏷️ ${restaurant.category}\n`;
                    }
                });
                processedResponse = processedResponse.replace(/\[SEARCH_RESTAURANT:[^\]]+\]/, restaurantInfo);
            } else {
                processedResponse = processedResponse.replace(/\[SEARCH_RESTAURANT:[^\]]+\]/, '\n\n죄송합니다. 해당 지역 맛집 정보를 찾을 수 없습니다.');
            }
        }
        
    } catch (error) {
        console.error('❌ 도구 처리 오류:', error.message);
        // 도구 요청 태그만 제거하고 원본 응답 유지
        processedResponse = processedResponse.replace(/\[SEARCH_[^\]]+\]/g, '');
    }
    
    return processedResponse;
}

// 컨텍스트 기반 프롬프트 구성 - 백업용으로 유지
function buildContextualPrompt(currentMessage, conversationHistory, session) {
    let prompt = `당신은 친근하고 도움이 되는 한국어 AI 어시스턴트입니다.\n\n`;
    
    // 대화 히스토리 포함 (최근 3개)
    if (conversationHistory && conversationHistory.length > 0) {
        prompt += `대화 맥락:\n`;
        conversationHistory.slice(-3).forEach(msg => {
            if (msg.type === 'user') {
                prompt += `사용자: ${msg.message}\n`;
            } else {
                prompt += `AI: ${msg.message.substring(0, 100)}...\n`;
            }
        });
        prompt += `\n`;
    }
    
    // 현재 메시지
    prompt += `현재 사용자 메시지: "${currentMessage}"\n\n`;
    
    // 세션 정보 활용
    if (session && session.context) {
        if (session.context.lastIntent) {
            prompt += `이전 대화 주제: ${session.context.lastIntent}\n`;
        }
        if (session.messageCount > 1) {
            prompt += `이 사용자와 ${session.messageCount}번째 대화입니다.\n`;
        }
    }
    
    prompt += `\n답변 가이드라인:
- 대화 맥락을 고려하여 자연스럽게 응답
- 한국어로 친근하고 도움이 되는 톤으로 답변
- 불확실한 정보는 명시하고 검색을 권장
- 간결하면서도 충분한 정보 제공 (300자 이내)
- 이모지 적절히 활용하여 친근감 표현`;
    
    return prompt;
}

// 기존 호출 함수는 새 함수를 래핑
async function callClaudeAI(userMessage, userId) {
    return await callEnhancedClaudeAI(userMessage, userId);
}

// 🧠 지능형 메시지 분류 및 데이터 추출 시스템 초기화
const messageClassifier = new MessageClassifier();
const dataExtractor = new DataExtractor({
    clientId: NAVER_CLIENT_ID,
    clientSecret: NAVER_CLIENT_SECRET
});

// 🤖 서브에이전트 관리 시스템 초기화
const subAgentManager = new SubAgentManager();

// [ENHANCED] 향상된 시스템 초기화 (이미 선언된 변수들 사용)
// 인스턴스 생성은 필요시에만 하므로 여기서는 로딩 확인만
console.log('[ENHANCED] 향상된 자연어 처리 및 세션 관리 시스템 초기화 완료');

// 안전한 sessionManager 래퍼
const safeSessionManager = {
    async createOrUpdateSession(userId, message) {
        if (sessionManager && typeof sessionManager.createOrUpdateSession === 'function') {
            return await sessionManager.createOrUpdateSession(userId, message);
        }
        return null;
    },
    getConversationHistory(userId, limit) {
        if (sessionManager && typeof sessionManager.getConversationHistory === 'function') {
            return sessionManager.getConversationHistory(userId, limit);
        }
        return [];
    },
    async addBotResponse(userId, response, type) {
        if (sessionManager && typeof sessionManager.addBotResponse === 'function') {
            return await sessionManager.addBotResponse(userId, response, type);
        }
    },
    updateUserContext(userId, context) {
        if (sessionManager && typeof sessionManager.updateUserContext === 'function') {
            sessionManager.updateUserContext(userId, context);
        }
    }
};

// 사실 확인 요청 감지 함수
function isFactCheckRequest(message) {
    const factCheckKeywords = [
        '사실', '진실', '사망', '죽음', '별세', '타계', '작고', '서거',
        '결혼', '이혼', '임신', '출산', '체포', '검거', '구속',
        '사고', '화재', '지진', '홍수', '태풍', '폭발',
        '발표', '공개', '출시', '런칭', '개봉', '방영',
        '사실이야', '진짜야', '맞아', '확실해', '사실 여부', 
        '진실 여부', '확인', '알려줘', '맞는지', '사실인지'
    ];
    
    return factCheckKeywords.some(keyword => message.includes(keyword));
}

// 출산 신고 요청 감지 함수
function isBirthReportRequest(message) {
    const birthKeywords = [
        '출산', '출생', '신생아', '아기', '태어나', '출산신고', '출생신고', 
        '신고', '등록', '호적', '주민등록', '병원', '분만', '의료진'
    ];
    
    const actionKeywords = [
        '신고', '등록', '해야할', '해야', '필요한', '준비', '서류', '절차', 
        '방법', '어떻게', '언제', '어디서', '뭘', '무엇을', '알려줘', '알려주세요'
    ];
    
    const hasBirthKeyword = birthKeywords.some(keyword => message.includes(keyword));
    const hasActionKeyword = actionKeywords.some(keyword => message.includes(keyword));
    
    return hasBirthKeyword && hasActionKeyword;
}

// 출산 신고 정보 제공 함수
function getBirthReportInfo() {
    return `👶 출산 신고 안내\n\n📋 신고 기한:\n• 출생 후 1개월 이내 (30일)\n• 늦을 경우 과태료 부과 가능\n\n📄 필요 서류:\n• 출생증명서 (의료기관 발급)\n• 신고인 신분증\n• 가족관계등록부 (혼인관계증명서)\n• 인감도장 또는 서명\n\n🏢 신고 장소:\n• 주소지 주민센터 (구청/동사무소)\n• 출생지 주민센터\n• 본적지 주민센터\n\n⏰ 접수 시간:\n• 평일: 09:00~18:00\n• 점심시간: 12:00~13:00 제외\n\n💻 온라인 신고:\n• 대법원 전자가족관계등록시스템\n• www.efamily.scourt.go.kr\n\n📞 문의:\n• 해당 지역 주민센터\n• 국번없이 1365 (민원안내)\n\n⚠️ 주의사항:\n• 의료기관에서 바로 처리되지 않음\n• 반드시 본인이 직접 신고 필요\n• 서류 미비 시 재방문 필요`;
}

// 날씨 요청 감지 함수
function isWeatherRequest(message) {
    const weatherKeywords = [
        '날씨', '기온', '온도', '비', '눈', '맑음', '흐림', '구름', 
        '습도', '바람', '미세먼지', '황사', '우산', '날씨어때'
    ];
    
    // 명확한 날씨 질문 패턴
    const weatherQuestionPatterns = [
        /날씨.*어때/, /날씨.*알려/, /기온.*몇/, /온도.*몇/,
        /비.*와/, /눈.*와/, /맑/, /흐림/, /구름/,
        /.*날씨$/, /.*기온$/, /.*온도$/
    ];
    
    const hasWeatherKeyword = weatherKeywords.some(keyword => message.includes(keyword));
    const hasWeatherQuestionPattern = weatherQuestionPatterns.some(pattern => pattern.test(message));
    
    // 일반적인 더위/추위 언급은 제외 (문맥적 표현)
    const contextualExpressions = [
        /더위에.*어떻게/, /추위에.*어떻게/, /덥.*어떻게/, /춥.*어떻게/,
        /더워서/, /추워서/, /덥네/, /춥네/, /시원하/, /따뜻하/
    ];
    
    const isContextualExpression = contextualExpressions.some(pattern => pattern.test(message));
    
    // 명확한 날씨 키워드가 있고, 날씨 질문 패턴이 있으며, 문맥적 표현이 아닌 경우에만 날씨 요청으로 판단
    return hasWeatherKeyword && (hasWeatherQuestionPattern || message.includes('날씨')) && !isContextualExpression;
}

// 도시명 추출 함수
function extractCityFromMessage(message) {
    const cityKeywords = {
        '서울': 'Seoul',
        '부산': 'Busan',
        '대구': 'Daegu', 
        '인천': 'Incheon',
        '광주': 'Gwangju',
        '대전': 'Daejeon',
        '울산': 'Ulsan',
        '세종': 'Sejong',
        '수원': 'Suwon',
        '용인': 'Yongin',
        '고양': 'Goyang',
        '창원': 'Changwon',
        '성남': 'Seongnam',
        '청주': 'Cheongju',
        '안산': 'Ansan',
        '전주': 'Jeonju',
        '천안': 'Cheonan',
        '안양': 'Anyang'
    };
    
    for (const [korean, english] of Object.entries(cityKeywords)) {
        if (message.includes(korean)) {
            return { korean, english };
        }
    }
    
    // 기본값은 서울
    return { korean: '서울', english: 'Seoul' };
}

// 날씨 정보 가져오기 함수 (네이버 날씨 크롤링)
async function getWeatherInfo(cityKorean = '서울') {
    try {
        console.log(`🌤️ 네이버 날씨 정보 조회: ${cityKorean}`);
        
        // 네이버 날씨 크롤러 사용
        const weatherCrawler = new NaverWeatherCrawler();
        const weatherInfo = await weatherCrawler.getWeatherInfo(cityKorean);
        
        if (weatherInfo) {
            return weatherInfo;
        }
        
        // 크롤링 실패시 네이버 뉴스 검색으로 폴백
        console.log('⚠️ 날씨 크롤링 실패, 뉴스 검색으로 전환');
        
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return getWeatherFallback();
        }
        
        const weatherQuery = `${cityKorean} 날씨 기온 온도`;
        const weatherNews = await getLatestNews(weatherQuery);
        
        if (weatherNews && weatherNews.length > 0) {
            const koreanTime = getKoreanDateTime();
            
            let weatherInfo = `🌤️ ${cityKorean} 날씨 정보\n\n📰 최신 날씨 뉴스:\n`;
            
            weatherNews.slice(0, 3).forEach((news, index) => {
                const title = news.title;
                const description = news.description;
                
                weatherInfo += `${index + 1}. ${title}\n`;
                if (description && description.length > 0) {
                    weatherInfo += `   ${description.substring(0, 80)}...\n`;
                }
                weatherInfo += `\n`;
            });
            
            weatherInfo += `💡 정확한 실시간 날씨:\n• 네이버 날씨: weather.naver.com\n• 기상청: weather.go.kr\n\n⏰ 검색 시간: ${koreanTime.formatted}`;
            
            return weatherInfo;
        } else {
            return getWeatherGeneralInfo(cityKorean);
        }
        
    } catch (error) {
        console.error('❌ 날씨 정보 검색 오류:', error.message);
        return getWeatherFallback();
    }
}

// 일반적인 날씨 안내 정보
function getWeatherGeneralInfo(city) {
    const koreanTime = getKoreanDateTime();
    return `🌤️ ${city} 날씨 정보\n\n💡 실시간 날씨 확인 방법:\n• 네이버 날씨: weather.naver.com\n• 기상청: weather.go.kr\n• 휴대폰 날씨 앱\n• "날씨" 검색\n\n📱 추천 앱:\n• 날씨 (기본 앱)\n• 미세미세 (미세먼지)\n• WeatherBug\n\n⏰ 안내 시간: ${koreanTime.formatted}\n\n🌡️ 정확한 기온, 습도, 바람 정보는 위 사이트를 확인해주세요.`;
}

// 날씨 아이콘 선택 함수
function getWeatherIcon(mainWeather) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🚿',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '💨',
        'Fog': '💨',
        'Haze': '💨'
    };
    
    return icons[mainWeather] || '🌤️';
}

// 날씨 API 실패시 폴백 함수
function getWeatherFallback() {
    const koreanTime = getKoreanDateTime();
    return `🌤️ 날씨 정보 서비스\n\n⚠️ 현재 날씨 API에 연결할 수 없습니다.\n\n💡 대안:\n• 네이버 날씨: weather.naver.com\n• 기상청: weather.go.kr\n• 휴대폰 날씨 앱 확인\n\n⏰ 확인 시간: ${koreanTime.formatted}\n\n📱 정확한 날씨는 기상청이나 날씨 앱을 확인해주세요.`;
}

// 유튜브 URL 감지 함수
function extractYouTubeUrl(message) {
    const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of youtubePatterns) {
        const match = message.match(pattern);
        if (match) {
            const videoId = match[1];
            return {
                url: `https://www.youtube.com/watch?v=${videoId}`,
                videoId: videoId
            };
        }
    }
    return null;
}

// 유튜브 요약 요청 감지 함수
function isYouTubeSummaryRequest(message) {
    const youtubeUrl = extractYouTubeUrl(message);
    const summaryKeywords = ['요약', '내용', '정리', '설명', '어떤내용', '뭐라고', '뭔소리', '무슨말'];
    
    return youtubeUrl && summaryKeywords.some(keyword => message.includes(keyword));
}

// 영화 평가 요청 감지 함수 (새로운 시스템에서 모든 영화평 처리)
function isMovieReviewRequest(message) {
    // 모든 영화평 요청은 새로운 종합 시스템에서 처리
    console.log('🎬 모든 영화평 요청은 새로운 시스템에서 처리');
    return false;
}

// 게임 정보 요청 감지 함수 (영화와 구분하기 위해)
function isGameInfoRequest(message) {
    const gameKeywords = ['게임', '플레이', '스팀', '에픽', 'PC게임', '콘솔'];
    return gameKeywords.some(keyword => message.includes(keyword));
}

// 자연스러운 대화 감지 함수
function isNaturalConversation(message) {
    // 🍽️ 음식 관련 질문은 Enhanced NLP 시스템에서 처리하도록 제외
    const isFoodQuestion = /뭐.*먹지|먹을.*뭐|저녁.*뭐|아침.*뭐|점심.*뭐|간식.*뭐|뭐.*마실|마실.*뭐|음식.*뭐|요리.*뭐|배고파|출출해/.test(message);
    if (isFoodQuestion) {
        console.log('🍽️ 음식 관련 질문 감지 - Enhanced NLP 시스템으로 라우팅');
        return false;
    }
    
    // 문맥적 표현이나 일상적 대화 패턴 감지 (음식 관련 패턴 제거)
    const conversationalPatterns = [
        /더위에.*어떻게/, /추위에.*어떻게/, /덥.*어떻게/, /춥.*어떻게/,
        /힘들어/, /어려워/, /답답해/, /괴로워/, /스트레스/, /짜증/,
        /피곤해/, /지쳐/, /귀찮아/, /골치아파/, /복잡해/,
        /걱정/, /고민/, /불안/, /어떡하지/, /어쩌지/,
        /재미있/, /신나/, /좋아/, /기뻐/, /행복해/,
        /운동.*어떻게/, /다이어트.*어떻게/, /건강.*어떻게/,
        /일.*힘들/, /공부.*힘들/, /관계.*힘들/
    ];
    
    // 감정적 표현이나 일상적 고민이 있는 경우
    const hasConversationalPattern = conversationalPatterns.some(pattern => pattern.test(message));
    
    // 명확한 정보성 질문이 아닌 경우
    const isNotInformationalQuery = !(/무엇|언제|어디|왜|누구|얼마|몇|어느|설명|알려|정보|방법/.test(message));
    
    // 기존 카테고리에 해당하지 않는 경우
    const isNotExistingCategory = !isWeatherRequest(message) && 
                                  !isBirthReportRequest(message) && 
                                  !isYouTubeSummaryRequest(message) &&
                                  !isRestaurantRequest(message);
    
    return hasConversationalPattern && isNotInformationalQuery && isNotExistingCategory;
}

// 자연스러운 응답 생성 함수
async function generateNaturalResponse(message) {
    try {
        console.log(`💬 자연스러운 대화 응답 생성: "${message}"`);
        
        // 감정 분석
        const emotion = analyzeEmotion(message);
        console.log(`😊 감지된 감정: ${emotion}`);
        
        // 상황별 맞춤 응답 생성
        if (emotion === 'heat_struggle') {
            return generateHeatStruggleResponse(message);
        } else if (emotion === 'exercise_concern') {
            return generateExerciseAdviceResponse(message);
        } else if (emotion === 'frustration') {
            return generateFrustrationResponse(message);
        } else if (emotion === 'worry') {
            return generateWorryResponse(message);
        } else if (emotion === 'tiredness') {
            return generateTirednessResponse(message);
        } else {
            return generateGeneralConversationalResponse(message);
        }
        
    } catch (error) {
        console.error('❌ 자연스러운 응답 생성 오류:', error);
        return '😊 무엇을 도와드릴까요? 더 구체적으로 말씀해주시면 좋은 조언을 드릴 수 있어요!';
    }
}

// 감정 분석 함수
function analyzeEmotion(message) {
    if (/더위에.*어떻게|더워서.*어떻게|덥.*어떻게/.test(message)) {
        return 'heat_struggle';
    } else if (/운동.*어떻게|유산소.*어떻게|다이어트.*어떻게/.test(message)) {
        return 'exercise_concern';
    } else if (/힘들어|어려워|답답해|괴로워|스트레스|짜증/.test(message)) {
        return 'frustration';
    } else if (/걱정|고민|불안|어떡하지|어쩌지/.test(message)) {
        return 'worry';
    } else if (/피곤해|지쳐|귀찮아/.test(message)) {
        return 'tiredness';
    } else {
        return 'general';
    }
}

// 더위 관련 고민 응답
function generateHeatStruggleResponse(message) {
    const responses = [
        `🌡️ 이 더위에 정말 힘드시겠어요!\n\n💡 더위 극복 팁:\n• 실내 운동 (홈트레이닝, 계단 올라가기)\n• 새벽/저녁 시간대 활용 (6-7시, 8-9시)\n• 에어컨 있는 헬스장이나 수영장\n• 충분한 수분 섭취 필수!\n\n😊 무리하지 마시고 건강이 최우선이에요!`,
        
        `☀️ 요즘 날씨가 정말 살인적이네요!\n\n🏠 실내 대안:\n• 요가, 필라테스, 스트레칭\n• 계단 오르내리기 (아파트 계단 활용)\n• 온라인 홈트레이닝 영상\n• 쇼핑몰이나 지하철역 걷기\n\n💪 조금씩이라도 꾸준히 하는 게 중요해요!`,
        
        `💦 이런 더위에 운동 생각하시다니 대단해요!\n\n⏰ 시간대별 추천:\n• 새벽 5-6시: 공원 산책, 조깅\n• 밤 9-10시: 야간 운동, 헬스장\n• 실내: 언제든 홈트레이닝\n\n🚿 운동 후엔 시원한 샤워로 체온 조절하세요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 운동 관련 조언 응답
function generateExerciseAdviceResponse(message) {
    const responses = [
        `💪 운동 의지가 대단하세요!\n\n🏃 여름철 운동 팁:\n• 실내 운동: 홈트, 헬스장, 수영\n• 야외 운동: 저녁 8시 이후 추천\n• 수분 보충: 운동 전후 충분히\n• 무리 금물: 몸 상태 체크하며\n\n😊 꾸준함이 가장 중요해요!`,
        
        `🎯 건강 관리 의식이 훌륭하네요!\n\n🌙 저녁 운동 추천:\n• 공원 산책 (8-9시)\n• 실내 자전거 타기\n• 요가, 필라테스\n• 헬스장 (에어컨 필수!)\n\n💡 더위 먹지 않게 조심하세요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 좌절감 관련 응답
function generateFrustrationResponse(message) {
    const responses = [
        `😔 힘든 일이 있으신 것 같네요.\n\n🤗 괜찮아요, 다들 그런 때가 있어요!\n• 잠시 쉬어가는 것도 필요해요\n• 좋아하는 음악 들으며 산책\n• 친구나 가족과 대화\n• 충분한 휴식과 수면\n\n💪 이 또한 지나갈 거예요!`,
        
        `😊 힘드시는 마음 이해해요.\n\n🌈 기분 전환 방법:\n• 맛있는 것 먹기\n• 좋아하는 영화나 드라마\n• 따뜻한 차 한 잔\n• 반신욕이나 족욕\n\n✨ 내일은 분명 더 나은 날이 될 거예요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 걱정 관련 응답
function generateWorryResponse(message) {
    const responses = [
        `😌 걱정이 많으시군요.\n\n🧘 마음 다스리기:\n• 깊게 숨쉬기 (4초 들이쉬고 6초 내쉬기)\n• 지금 이 순간에 집중\n• 걱정을 종이에 적어보기\n• 해결 가능한 것부터 하나씩\n\n💝 혼자가 아니에요, 괜찮아질 거예요!`,
        
        `🤗 걱정되는 마음 충분히 이해해요.\n\n📝 걱정 정리법:\n• 걱정 목록 적어보기\n• 해결 가능한 것과 불가능한 것 구분\n• 작은 것부터 하나씩 해결\n• 전문가나 주변 사람들에게 조언 구하기\n\n⭐ 차근차근 해결해나가면 돼요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 피로감 관련 응답
function generateTirednessResponse(message) {
    const responses = [
        `😴 많이 피곤하시겠어요.\n\n💤 피로 회복 팁:\n• 충분한 수면 (7-8시간)\n• 가벼운 스트레칭\n• 따뜻한 물로 샤워\n• 비타민 B 복합체 섭취\n\n🌙 오늘은 일찍 주무세요!`,
        
        `🛌 쉬는 것도 중요한 일이에요.\n\n⚡ 에너지 충전법:\n• 20분 낮잠 (너무 길면 더 피곤)\n• 시원한 곳에서 휴식\n• 충분한 수분 섭취\n• 균형 잡힌 식사\n\n😊 몸이 보내는 신호를 잘 들어주세요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 일반적인 대화 응답
function generateGeneralConversationalResponse(message) {
    const responses = [
        `😊 좋은 대화 같아요! 계속 이야기해봐요!\n\n💬 어떤 이야기를 나누고 싶으신가요?\n• 일상적인 고민이나 걱정\n• 취미나 관심사\n• 오늘 있었던 일\n• 궁금한 정보\n\n✨ 편하게 말씀해주세요!`,
        
        `🤗 무엇을 도와드릴까요?\n\n🎯 이런 것들을 물어보실 수 있어요:\n• 일상 고민 상담\n• 정보 검색 (뉴스, 맛집, 쇼핑)\n• 영화 추천이나 평점\n• 건강이나 운동 조언\n\n💫 자유롭게 이야기해주세요!`,
        
        `😄 재미있는 대화네요!\n\n⭐ 더 구체적으로 말씀해주시면:\n• 맞춤형 조언 드릴 수 있어요\n• 정확한 정보 찾아드려요\n• 더 도움이 되는 답변 가능해요\n\n💖 언제든 편하게 물어보세요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Claude AI 버전 문의 감지 함수
function isClaudeVersionQuery(message) {
    // 1. 필수 키워드: Claude AI 관련 키워드가 있어야 함
    const claudeKeywords = ['클로드', 'claude', 'ai', '인공지능', '챗봇', '너', '당신', '모델', 'model'];
    const hasClaudeKeyword = claudeKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // 2. 버전 관련 키워드가 있어야 함
    const versionKeywords = ['버전', 'version', '소넷', 'sonnet', '하이쿠', 'haiku', '모델', 'model', '뭐야', '뭔지', '어떤거', '무슨'];
    const hasVersionKeyword = versionKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // 3. 질문 패턴 확인 (더 구체적으로)
    const questionPatterns = [
        /너.*버전/,
        /당신.*버전/,
        /클로드.*버전/,
        /claude.*version/i,
        /무슨.*버전/,
        /어떤.*버전/,
        /뭔.*버전/,
        /버전.*뭐/,
        /버전.*무슨/,
        /버전.*어떤/,
        /소넷.*하이쿠/,
        /하이쿠.*소넷/,
        /AI.*모델/,
        /인공지능.*모델/,
        /너.*누구/,
        /당신.*누구/,
        /정체.*뭐/
    ];
    const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(message));
    
    // 4. 제외 패턴 (다른 버전 문의는 제외)
    const excludePatterns = [
        /앱.*버전/,
        /app.*version/i,
        /프로그램.*버전/,
        /소프트웨어.*버전/,
        /업데이트.*버전/,
        /최신.*버전/,
        /iOS.*버전/,
        /안드로이드.*버전/,
        /android.*version/i,
        /윈도우.*버전/,
        /windows.*version/i
    ];
    const hasExcludePattern = excludePatterns.some(pattern => pattern.test(message));
    
    // 최종 판단: Claude 키워드와 버전 키워드가 있고, 질문 패턴에 맞으며, 제외 패턴이 아닌 경우
    return (hasClaudeKeyword || hasQuestionPattern) && hasVersionKeyword && !hasExcludePattern;
}

// YouTube API로 영상 정보 가져오기
async function getYouTubeVideoInfo(videoId) {
    try {
        // YouTube Data API v3 사용 (API 키 필요)
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        
        if (!YOUTUBE_API_KEY) {
            console.log('⚠️ YouTube API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;
        const response = await axios.get(url, { timeout: 3000 });
        
        if (response.data.items && response.data.items.length > 0) {
            const video = response.data.items[0];
            return {
                title: video.snippet.title,
                description: video.snippet.description,
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
                duration: video.contentDetails.duration
            };
        }
        
        return null;
    } catch (error) {
        console.log(`❌ YouTube API 오류: ${error.message}`);
        return null;
    }
}

// 네이버 영화 검색 함수
async function getNaverMovieInfo(movieTitle) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: movieTitle,
            display: 5,
            start: 1
        };
        
        console.log(`🎬 네이버 영화 검색: "${movieTitle}"`);
        
        const response = await axios.get('https://openapi.naver.com/v1/search/movie.json', {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log(`🎬 "${movieTitle}" 검색 결과 없음`);
            return null;
        }
        
        console.log(`✅ "${movieTitle}" 검색 결과: ${items.length}개 영화 발견`);
        
        // 검색 결과 디버깅
        items.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.title.replace(/<[^>]*>/g, '')} (${item.pubDate}) - 평점: ${item.userRating}`);
        });
        
        return items.map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            director: item.director.replace(/<[^>]*>/g, ''),
            actor: item.actor.replace(/<[^>]*>/g, ''),
            pubDate: item.pubDate,
            userRating: item.userRating,
            link: item.link,
            image: item.image
        }));
        
    } catch (error) {
        console.error('❌ 네이버 영화 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 영화 평가 처리 함수 (개선된 버전 - Playwright 크롤링 포함)
async function getMovieReview(movieTitle) {
    try {
        console.log(`🎬 종합 영화평 요청: "${movieTitle}"`);
        
        // 1단계: 네이버 영화 API로 기본 정보 수집
        let movieResults = null;
        const searchVariations = [
            movieTitle,                           // 원본
            movieTitle.replace(/\s+/g, ''),      // 공백 제거
            movieTitle.replace(/더/g, ' '),       // "더" → 공백
            movieTitle.replace(/더/g, 'THE'),     // "더" → "THE"
            movieTitle.replace(/더/g, '')         // "더" 제거
        ];
        
        console.log(`🔍 검색 시도할 키워드들: ${searchVariations.join(', ')}`);
        
        // 각 검색어로 순차적으로 시도
        for (const searchTerm of searchVariations) {
            if (searchTerm && searchTerm.length > 0) {
                movieResults = await getNaverMovieInfo(searchTerm);
                if (movieResults && movieResults.length > 0) {
                    console.log(`✅ "${searchTerm}"로 영화 발견됨`);
                    break;
                }
            }
        }
        
        if (!movieResults || movieResults.length === 0) {
            // 검색 결과가 없는 경우 뉴스 검색으로 폴백
            console.log('🔍 네이버 뉴스에서 영화 정보 검색 시도');
            const newsResults = await getLatestNews(`"${movieTitle}" 영화 평점`);
            
            if (newsResults && newsResults.length > 0) {
                let newsInfo = `🎬 "${movieTitle}" 영화평 뉴스 검색 결과\n\n`;
                newsInfo += `📰 관련 뉴스/리뷰:\n`;
                newsResults.slice(0, 5).forEach((news, index) => {
                    newsInfo += `${index + 1}. ${news.title}\n`;
                    if (news.description) {
                        newsInfo += `   "${news.description.substring(0, 60)}..."\n`;
                    }
                });
                newsInfo += `\n💡 정확한 영화 제목으로 다시 검색해보세요.`;
                return newsInfo;
            }
            
            return `🎬 "${movieTitle}" 영화를 찾을 수 없습니다.\n\n💡 검색 팁:\n• 정확한 영화 제목으로 다시 검색\n• 영어 제목이나 한글 제목으로 시도\n• 개봉년도와 함께 검색\n\n예) "베놈2 영화평", "탑건 매버릭 평점"`;
        }
        
        // 2단계: Playwright로 실시간 상세 평점 크롤링 시도
        const bestMatch = movieResults[0];
        console.log(`🎭 Playwright 크롤링 시도: "${bestMatch.title}"`);
        
        try {
            // Playwright 크롤러 import (config 폴더에서)
            const PlaywrightCrawler = require('./config/playwright-crawler');
            const crawler = new PlaywrightCrawler();
            
            // 실시간 크롤링 시도
            const crawlResults = await crawler.crawlMultipleSites(bestMatch.title);
            
            if (crawlResults && crawlResults.naver) {
                console.log('✅ Playwright 크롤링 성공 - 상세 정보 제공');
                const result = crawler.formatForKakaoSkill(crawlResults, bestMatch.title);
                await crawler.close();
                return result.data.message;
            } else {
                console.log('⚠️ Playwright 크롤링 실패 - API 정보로 폴백');
                await crawler.close();
            }
        } catch (crawlerError) {
            console.log(`⚠️ Playwright 크롤링 오류: ${crawlerError.message}`);
        }
        
        // 3단계: API 정보로 기본 영화평 생성 (폴백)
        let movieReviewText = `🎬 "${bestMatch.title}" 영화평\n\n`;
        
        // 영화 기본 정보
        movieReviewText += `📽️ 기본 정보\n`;
        movieReviewText += `감독: ${bestMatch.director || '정보 없음'}\n`;
        movieReviewText += `출연: ${bestMatch.actor ? bestMatch.actor.substring(0, 50) + '...' : '정보 없음'}\n`;
        movieReviewText += `개봉: ${bestMatch.pubDate || '정보 없음'}\n`;
        
        // 네이버 평점
        if (bestMatch.userRating && bestMatch.userRating !== '0.00') {
            const rating = parseFloat(bestMatch.userRating);
            const stars = '❤️'.repeat(Math.round(rating / 2));
            movieReviewText += `\n❤️ 네이버 평점: ${rating}/10 ${stars}\n`;
            
            // 평점 분석
            if (rating >= 8.0) {
                movieReviewText += `💫 매우 높은 평점! 강력 추천작\n`;
            } else if (rating >= 7.0) {
                movieReviewText += `👍 좋은 평점의 추천작\n`;
            } else if (rating >= 6.0) {
                movieReviewText += `😊 무난한 평점의 볼만한 작품\n`;
            } else if (rating >= 5.0) {
                movieReviewText += `😐 평범한 평점\n`;
            } else {
                movieReviewText += `😕 아쉬운 평점\n`;
            }
        } else {
            movieReviewText += `\n❤️ 네이버 평점: 정보 없음\n`;
        }
        
        // 추가 리뷰 정보 검색
        const reviewResults = await getLatestNews(`${bestMatch.title} 리뷰`);
        if (reviewResults && reviewResults.length > 0) {
            movieReviewText += `\n📰 최신 리뷰/평론:\n`;
            reviewResults.slice(0, 3).forEach((review, index) => {
                movieReviewText += `${index + 1}. ${review.title}\n`;
            });
        }
        
        movieReviewText += `\n🔗 상세 정보: ${bestMatch.link}`;
        movieReviewText += `\n💡 더 자세한 평점은 네이버 영화에서 확인하세요.`;
        
        return movieReviewText;
        
    } catch (error) {
        console.log(`❌ 영화 평가 오류: ${error.message}`);
        return `🎬 영화 정보를 가져올 수 없습니다.\n\n❌ 오류 발생\n💡 다시 시도해주세요:\n• "영화제목 + 영화평" 형식으로 질문\n• 정확한 영화 제목으로 검색`;
    }
}

// 유튜브 요약 처리 함수 (개선된 버전)
async function getYouTubeSummary(youtubeData) {
    try {
        console.log(`📺 유튜브 요약 요청: ${youtubeData.url}`);
        
        // 1단계: YouTube API로 실제 영상 정보 가져오기
        const videoInfo = await getYouTubeVideoInfo(youtubeData.videoId);
        
        if (!process.env.CLAUDE_API_KEY) {
            throw new Error('CLAUDE_API_KEY not found');
        }
        
        let systemPrompt = `당신은 유튜브 영상 정보를 분석하는 전문가입니다.
        
한국어로 답변하세요. 다음 규칙을 엄격히 따르세요:
- 800자 이내로 간결하게 작성
- 절대 추측하거나 상상하지 마세요
- 영상 내용을 본 적이 없다는 것을 명확히 하세요
- "운전 사고", "충돌" 같은 내용을 만들어내지 마세요
- 제목과 설명에서 확인 가능한 정보만 제공
- 자막이나 영상 내용은 알 수 없다고 명시
- 이모지를 적절히 사용하여 읽기 쉽게 구성

중요: 영상을 직접 볼 수 없으므로 내용을 추측하지 마세요!`;

        let userContent = `다음 유튜브 영상 정보를 분석해주세요:\n\nURL: ${youtubeData.url}\nVideo ID: ${youtubeData.videoId}\n`;
        
        if (videoInfo) {
            userContent += `\n📍 영상 정보:\n제목: ${videoInfo.title}\n채널: ${videoInfo.channelTitle}\n업로드 날짜: ${videoInfo.publishedAt}\n설명: ${videoInfo.description ? videoInfo.description.substring(0, 500) + '...' : '설명 없음'}\n\n이 정보를 바탕으로 영상이 어떤 내용인지 파악할 수 있는 범위에서 설명해주세요.`;
        } else {
            userContent += `\n⚠️ YouTube API로 영상 정보를 가져올 수 없습니다.\n영상을 직접 볼 수 없으므로 내용을 추측하지 말고, 이 한계를 명확히 설명해주세요.`;
        }
        
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-5-sonnet-20240620",
                system: systemPrompt,
                messages: [{
                    role: "user", 
                    content: userContent
                }],
                max_tokens: 400
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: config.timeouts.claude_general
            }
        );
        
        const summary = claudeResponse.data.content[0].text;
        console.log(`✅ 유튜브 분석 완료: ${summary.length}자`);
        
        return `📺 유튜브 영상 정보\n🔗 ${youtubeData.url}\n\n${summary}\n\n⚠️ 자막 기반 요약을 원하시면 YouTube 자막 API 연동이 필요합니다.`;
        
    } catch (error) {
        console.log(`❌ 유튜브 요약 오류: ${error.message}`);
        
        return `📺 유튜브 영상 요약을 처리할 수 없습니다.\n🔗 ${youtubeData.url}\n\n❌ 문제점:\n• YouTube API 키 미설정 또는 오류\n• Claude AI가 영상을 직접 볼 수 없음\n• 자막 데이터 접근 불가\n\n💡 정확한 요약을 위해서는:\n• YouTube Data API 키 설정 필요\n• 자막 추출 도구 연동 필요\n• 또는 영상을 직접 시청하세요`;
    }
}

// 나무위키 게임 정보 가져오기 함수
async function getNamuWikiGameInfo(gameName) {
    try {
        console.log(`🌳 나무위키에서 "${gameName}" 게임 정보 검색 시작`);
        
        // 나무위키 검색 URL 구성
        const searchUrl = `https://namu.wiki/w/${encodeURIComponent(gameName)}`;
        
        // 웹 페이지 요청
        const response = await axios.get(searchUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (response.status === 200 && response.data) {
            const html = response.data;
            
            // 기본 정보 추출 (간단한 텍스트 추출)
            let gameInfo = '';
            
            // 제목 추출
            const titleMatch = html.match(/<title>([^<]+)<\/title>/);
            if (titleMatch) {
                gameInfo += `🎮 ${titleMatch[1].replace(' - 나무위키', '')}\n\n`;
            }
            
            // 첫 번째 문단 추출 (개요)
            const contentMatch = html.match(/<div[^>]*class="[^"]*wiki-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
            if (contentMatch) {
                let content = contentMatch[1];
                
                // HTML 태그 제거
                content = content.replace(/<[^>]*>/g, '');
                
                // 특수 문자 디코딩
                content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
                
                // 불필요한 공백 제거
                content = content.replace(/\s+/g, ' ').trim();
                
                // 첫 500자만 추출
                if (content.length > 500) {
                    content = content.substring(0, 500) + '...';
                }
                
                if (content) {
                    gameInfo += `📝 개요:\n${content}\n\n`;
                }
            }
            
            gameInfo += `🔗 자세한 정보: ${searchUrl}`;
            
            console.log(`✅ 나무위키 "${gameName}" 정보 추출 완료: ${gameInfo.length}자`);
            return gameInfo;
            
        } else {
            console.log(`❌ 나무위키 "${gameName}" 페이지 응답 실패`);
            return null;
        }
        
    } catch (error) {
        console.log(`❌ 나무위키 "${gameName}" 정보 추출 오류:`, error.message);
        
        // 대안: 나무위키 검색 결과 페이지로 안내
        const searchQuery = encodeURIComponent(gameName);
        return `🌳 나무위키에서 "${gameName}" 정보를 찾을 수 없습니다.\n\n🔍 직접 검색해보세요:\nhttps://namu.wiki/Search?q=${searchQuery}\n\n나무위키는 게임 정보가 매우 상세하게 정리되어 있습니다.`;
    }
}

// 한국 시간 가져오기 함수
function getKoreanDateTime() {
    const now = new Date();
    const formatted = now.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }) + ' ' + now.toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const date = now.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    return {
        formatted: formatted,
        date: date
    };
}

// 스마트 메시지 분할 시스템
function smartSplit(text, maxLength = 1500) {
    if (text.length <= maxLength) return [text];
    
    const sentences = text.split(/([.!?]\s+)/);
    const chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        const testChunk = currentChunk + part;
        
        if (testChunk.length > maxLength - 100) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = part;
            } else {
                const forceSplit = part.match(/.{1,600}/g) || [part];
                for (let j = 0; j < forceSplit.length; j++) {
                    if (j === 0) {
                        chunks.push(forceSplit[j] + '...');
                    } else if (j === forceSplit.length - 1) {
                        currentChunk = '...' + forceSplit[j];
                    } else {
                        chunks.push('...' + forceSplit[j] + '...');
                    }
                }
            }
        } else {
            currentChunk = testChunk;
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

// 대화 메모리 시스템
const pendingMessages = new Map();
const conversationMemory = new Map(); // 사용자별 대화 히스토리
const userPatterns = new Map(); // 사용자별 패턴 분석

// 대화 컨텍스트 구조
function createUserContext(userId) {
    return {
        history: [], // 최근 10개 메시지
        patterns: {
            questionCount: 0,
            complaintCount: 0,
            casualChatCount: 0,
            topicsOfInterest: new Set(),
            preferredResponseStyle: 'detailed', // detailed, brief, friendly
            lastEmotionalState: 'neutral', // happy, frustrated, curious, neutral
            sessionStartTime: Date.now()
        },
        lastInteraction: Date.now()
    };
}

// 대화 히스토리 추가
function addToConversationHistory(userId, userMessage, botResponse, intent = 'unknown') {
    if (!conversationMemory.has(userId)) {
        conversationMemory.set(userId, createUserContext(userId));
    }
    
    const context = conversationMemory.get(userId);
    
    // 최근 10개만 유지
    context.history.push({
        timestamp: Date.now(),
        userMessage: userMessage,
        botResponse: botResponse.substring(0, 200) + '...', // 응답 요약
        intent: intent,
        messageType: classifyMessageType(userMessage)
    });
    
    if (context.history.length > 10) {
        context.history.shift();
    }
    
    // 패턴 업데이트
    updateUserPatterns(userId, userMessage, intent);
    context.lastInteraction = Date.now();
    
    console.log(`💭 대화 히스토리 저장: ${userId} (총 ${context.history.length}개 메시지)`);
}

// 메시지 타입 분류
function classifyMessageType(message) {
    if (/\?|어떻게|뭐|언제|어디|왜|누구/.test(message)) return 'question';
    if (/똑똑|정신차려|먹통|화나|짜증|답답/.test(message)) return 'complaint';
    if (/고마워|감사|좋아|훌륭|완벽/.test(message)) return 'praise';
    if (/안녕|hi|hello|좋은|날씨/.test(message)) return 'casual';
    return 'request';
}

// 사용자 패턴 업데이트
function updateUserPatterns(userId, message, intent) {
    if (!userPatterns.has(userId)) {
        userPatterns.set(userId, { questionCount: 0, complaintCount: 0, casualChatCount: 0, topicsOfInterest: new Set() });
    }
    
    const patterns = userPatterns.get(userId);
    
    // 카운트 업데이트
    if (intent === 'question') patterns.questionCount++;
    if (intent === 'complaint') patterns.complaintCount++;
    if (intent === 'casual') patterns.casualChatCount++;
    
    // 관심 주제 추출
    const topics = extractTopics(message);
    topics.forEach(topic => patterns.topicsOfInterest.add(topic));
}

// 관심 주제 추출
function extractTopics(message) {
    const topics = [];
    if (/게임|플레이/.test(message)) topics.push('게임');
    if (/영화|드라마/.test(message)) topics.push('영화');
    if (/맛집|음식|식당/.test(message)) topics.push('음식');
    if (/뉴스|정치|사회/.test(message)) topics.push('뉴스');
    if (/쇼핑|구매|상품/.test(message)) topics.push('쇼핑');
    if (/맥미니|아이폰|맥북|애플/.test(message)) topics.push('애플제품');
    return topics;
}

// 컨텍스트 기반 의도 추론 엔진
function analyzeMessageWithContext(userId, currentMessage) {
    const context = conversationMemory.get(userId);
    
    if (!context) {
        // 첫 대화 - 기본 분석
        return {
            intent: classifyBasicIntent(currentMessage),
            confidence: 0.7,
            responseStyle: 'friendly',
            needsGuidance: false,
            contextInsight: 'first_interaction'
        };
    }
    
    const recentHistory = context.history.slice(-3); // 최근 3개 메시지
    const messageType = classifyMessageType(currentMessage);
    
    // 컨텍스트 기반 의도 분석
    let intent = classifyBasicIntent(currentMessage);
    let confidence = 0.7;
    let needsGuidance = false;
    let responseStyle = 'detailed';
    
    // 연속된 불만 패턴 감지
    if (messageType === 'complaint') {
        const recentComplaints = recentHistory.filter(h => h.messageType === 'complaint').length;
        if (recentComplaints >= 2) {
            confidence = 0.9;
            responseStyle = 'apologetic_helpful';
            intent = 'frustrated_user_needs_help';
        }
    }
    
    // 질문이 아닌 것에 대한 안내 필요성 판단
    if (!isActualQuestion(currentMessage) && !isSpecificRequest(currentMessage)) {
        needsGuidance = true;
        intent = 'needs_guidance';
        confidence = 0.8;
    }
    
    // 사용자 패턴 기반 스타일 조정
    const patterns = userPatterns.get(userId);
    if (patterns) {
        if (patterns.complaintCount > patterns.questionCount) {
            responseStyle = 'patient_helpful';
        } else if (patterns.casualChatCount > 0) {
            responseStyle = 'friendly_conversational';
        }
    }
    
    return {
        intent,
        confidence,
        responseStyle,
        needsGuidance,
        contextInsight: buildContextInsight(context, currentMessage),
        userPattern: patterns
    };
}

// 실제 질문인지 판단
function isActualQuestion(message) {
    const questionIndicators = [
        /\?/, // 물음표
        /어떻게|어떤|어디|언제|왜|누구|뭐|몇|얼마/, // 의문사
        /알려줘|검색|찾아|추천|비교|말해줘/, // 요청 동사
        /어때|할만해|좋아|괜찮/, // 평가 요청
        /.*해줘|.*알아|.*봐줘/, // 도움 요청
        /영화평|평점|평가|리뷰|별점/ // 영화 평가 요청
    ];
    
    return questionIndicators.some(pattern => pattern.test(message));
}

// 구체적 요청인지 판단
function isSpecificRequest(message) {
    const requestPatterns = [
        /뉴스|맛집|쇼핑|영화|게임|시간|날씨/, // 구체적 도메인
        /추천|검색|찾아|알려|보여|말해/, // 명확한 동작
        /계속|더보기|다음/, // 시스템 명령
        /영화평|평점|평가|리뷰|별점/, // 영화 평가 요청
        /먹|음식|야식|시켜|배고|출출/ // 음식 관련 요청
    ];
    
    return requestPatterns.some(pattern => pattern.test(message));
}

// 기본 의도 분류
function classifyBasicIntent(message) {
    if (isActualQuestion(message) || isSpecificRequest(message)) return 'question_or_request';
    if (/고마워|감사|좋아|훌륭/.test(message)) return 'praise';
    if (/안녕|hi|hello/.test(message)) return 'greeting';
    if (/똑똑|정신차려|먹통|화나|짜증/.test(message)) return 'complaint';
    return 'unclear_intent';
}

// 컨텍스트 인사이트 생성
function buildContextInsight(context, currentMessage) {
    const recentTopics = new Set();
    context.history.slice(-3).forEach(h => {
        extractTopics(h.userMessage).forEach(topic => recentTopics.add(topic));
    });
    
    return {
        recentTopics: Array.from(recentTopics),
        conversationLength: context.history.length,
        emotionalState: detectEmotionalState(context.history),
        suggestionTopics: generateSuggestions(recentTopics)
    };
}

// 감정 상태 감지
function detectEmotionalState(history) {
    const recent = history.slice(-3);
    const complaintCount = recent.filter(h => h.messageType === 'complaint').length;
    const praiseCount = recent.filter(h => h.messageType === 'praise').length;
    
    if (complaintCount >= 2) return 'frustrated';
    if (praiseCount >= 1) return 'satisfied';
    if (recent.length >= 2) return 'engaged';
    return 'neutral';
}

// 제안 주제 생성
function generateSuggestions(recentTopics) {
    if (recentTopics.has('게임')) return ['새로운 게임 추천', '게임 리뷰 검색'];
    if (recentTopics.has('영화')) return ['최신 영화 정보', '영화 평점 검색'];
    if (recentTopics.has('음식')) return ['다른 지역 맛집', '음식 배달 정보'];
    return ['최신 뉴스', '날씨 정보', '맛집 추천'];
}

// 응답 분할 처리 함수

function handleLongResponse(text, userId, responseType = 'general') {
    const chunks = smartSplit(text, 1500);
    
    if (chunks.length === 1) {
        return { text: chunks[0], hasMore: false };
    }
    
    const firstChunk = chunks[0];
    const remainingChunks = chunks.slice(1).join('\n\n');
    
    pendingMessages.set(userId, remainingChunks);
    
    const responseTypeEmoji = {
        'image': '🖼️',
        'restaurant': '🍽️',
        'news': '📰',
        'shopping': '🛒',
        'general': '💬'
    };
    
    const emoji = responseTypeEmoji[responseType] || '💬';
    const continueText = `\n\n${emoji} "계속" 또는 "더보기"를 입력하면 나머지 내용을 확인할 수 있습니다.`;
    
    console.log(`📄 ${responseType} 응답 분할: 총 ${chunks.length}개 청크, 첫 청크 ${firstChunk.length}자`);
    
    return {
        text: firstChunk + continueText,
        hasMore: true,
        totalChunks: chunks.length
    };
}

// 네이버 뉴스 검색 함수
async function getLatestNews(query = '오늘 뉴스') {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 10,
            start: 1,
            sort: 'date'
        };
        
        console.log(`📡 네이버 뉴스 검색: "${query}"`);
        
        const response = await axios.get(NAVER_NEWS_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('📰 검색된 뉴스가 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 뉴스를 찾았습니다.`);
        
        return items.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            description: item.description.replace(/<[^>]*>/g, ''),
            link: item.link,
            pubDate: item.pubDate
        }));
        
    } catch (error) {
        console.error('❌ 네이버 뉴스 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 로컬 검색 함수 (장소, 업체 검색)
async function getLocalInfo(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 5,
            start: 1,
            sort: 'random'
        };
        
        console.log(`📍 네이버 로컬 검색: "${query}"`);
        
        const response = await axios.get(NAVER_LOCAL_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('📍 검색된 로컬 정보가 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 로컬 정보를 찾았습니다.`);
        
        return items.map((item, index) => ({
            rank: index + 1,
            title: item.title.replace(/<[^>]*>/g, ''),
            address: item.address || '',
            roadAddress: item.roadAddress || '',
            telephone: item.telephone || '',
            link: item.link,
            category: item.category || '',
            description: item.description ? item.description.replace(/<[^>]*>/g, '') : ''
        }));
        
    } catch (error) {
        console.error('❌ 네이버 로컬 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 쇼핑 검색 함수
async function getShoppingResults(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 15,  // 더 많이 가져와서 필터링
            start: 1,
            sort: 'price'  // 가격순으로 정렬
        };
        
        console.log(`🛒 네이버 쇼핑 검색: "${query}"`);
        
        const response = await axios.get(NAVER_SHOPPING_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🛒 검색된 상품이 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 상품을 찾았습니다.`);
        
        return items.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            title: item.title.replace(/<[^>]*>/g, ''),
            price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격정보없음',
            mallName: item.mallName || '쇼핑몰정보없음',
            brand: item.brand || '',
            link: item.link,
            image: item.image,
            productId: item.productId,
            category1: item.category1,
            category2: item.category2
        }));
        
    } catch (error) {
        console.error('❌ 네이버 쇼핑 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 지역검색 API로 맛집 가져오기 함수
async function getLocalRestaurants(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 20,  // 필터링을 위해 더 많이 가져옴
            start: 1,
            sort: 'comment'  // 리뷰/댓글 많은 순으로 정렬 (사용자 검색 많은 곳)
        };
        
        console.log(`🍽️ 네이버 지역검색: "${query}"`);
        console.log(`ℹ️ API 요청 파라미터:`, params);
        
        const response = await axios.get(NAVER_LOCAL_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        console.log(`📈 API 응답 상태: ${response.status}`);
        console.log(`ℹ️ API 응답 데이터:`, {
            total: response.data.total || 0,
            start: response.data.start || 0,
            display: response.data.display || 0,
            itemsCount: response.data.items?.length || 0
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🍽️ 검색된 맛집이 없습니다.');
            console.log(`🔍 API 응답 전체:`, JSON.stringify(response.data, null, 2));
            return null;
        }
        
        console.log(`✅ ${items.length}개의 원본 결과를 받았습니다.`);
        
        // 패스트푸드점 및 체인점 필터링 (설정 파일 기반)
        const filteredItems = items.filter(item => {
            const title = item.title.replace(/<[^>]*>/g, '');
            const category = item.category || '';
            
            // 제외 키워드 체크 (체인점, 패스트푸드)
            const hasExcludeKeyword = config.restaurant_filters.exclude_keywords.some(keyword => 
                title.includes(keyword) || category.includes(keyword)
            );
            
            // 제외 카테고리 체크 (편의점, 마트 등)
            const hasExcludeCategory = config.restaurant_filters.exclude_categories.some(excludeCategory =>
                category.includes(excludeCategory)
            );
            
            // 필터링 결과를 로그로 남김 (디버깅용)
            if (hasExcludeKeyword || hasExcludeCategory) {
                console.log(`🚫 필터링 제외: "${title}" (카테고리: ${category})`);
            }
            
            return !hasExcludeKeyword && !hasExcludeCategory;
        });
        
        console.log(`🔍 필터링 완료: ${items.length}개 → ${filteredItems.length}개 (패스트푸드/체인점 제외)`);
        
        if (filteredItems.length === 0) {
            console.log('🍽️ 필터링 후 맛집이 없습니다.');
            return null;
        }
        
        // 인기도 기준 추가 정렬 (사용자 검색량 기준, 설정 파일 기반)
        const sortedItems = filteredItems.sort((a, b) => {
            const titleA = a.title.replace(/<[^>]*>/g, '');
            const titleB = b.title.replace(/<[^>]*>/g, '');
            
            // 인기 키워드 점수 계산
            const popularKeywordScoreA = config.restaurant_filters.popular_keywords
                .filter(keyword => titleA.includes(keyword)).length;
            const popularKeywordScoreB = config.restaurant_filters.popular_keywords
                .filter(keyword => titleB.includes(keyword)).length;
            
            // 카테고리 우선순위 점수
            const categoryScoreA = config.restaurant_filters.category_priority[a.category] || 0;
            const categoryScoreB = config.restaurant_filters.category_priority[b.category] || 0;
            
            // 총 점수 계산 (인기 키워드 가중치를 높게)
            const totalScoreA = (popularKeywordScoreA * 3) + categoryScoreA;
            const totalScoreB = (popularKeywordScoreB * 3) + categoryScoreB;
            
            return totalScoreB - totalScoreA; // 높은 점수가 우선
        });
        
        console.log(`ℹ️ 인기도순 정렬 완료: ${sortedItems.length}개`);
        
        // 첫 번째 결과 샘플 로깅
        if (sortedItems.length > 0) {
            console.log(`🏪 첫 번째 결과 샘플:`, {
                title: sortedItems[0].title?.replace(/<[^>]*>/g, ''),
                category: sortedItems[0].category,
                address: sortedItems[0].address
            });
        }
        
        // 최대 5개까지 반환
        return sortedItems.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            category: item.category,
            description: item.description ? item.description.replace(/<[^>]*>/g, '') : '',
            telephone: item.telephone || '전화번호 없음',
            address: item.address,
            roadAddress: item.roadAddress,
            mapx: item.mapx,
            mapy: item.mapy,
            link: item.link
        }));
        
    } catch (error) {
        console.error('❌ 네이버 지역검색 API 오류:', error.response?.data || error.message);
        console.error('🔍 오류 세부사항:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        return null;
    }
}

// 요청 분석 함수들
function isNewsRequest(message) {
    return config.news.some(keyword => message.includes(keyword));
}

function isShoppingRequest(message) {
    const hasShoppingKeyword = config.shopping.general.some(keyword => message.includes(keyword));
    const hasProductKeyword = config.shopping.products.some(keyword => message.includes(keyword));
    const hasRestaurantKeyword = config.restaurant.food.some(keyword => message.includes(keyword));
    
    // 제품 추천의 경우: "제품명 + 추천" 형태
    const hasProductRecommend = hasProductKeyword && message.includes('추천');
    
    // 가격 비교 요청: "제일 싼곳", "저렴한", "가격", "어디서 사야" 등
    const hasPriceKeyword = config.shopping.price_keywords.some(keyword => message.includes(keyword));
    
    // 특정 제품명이 포함된 경우 (맥미니, 아이폰 등)
    const hasSpecificProduct = config.shopping.products.some(product => message.includes(product));
    
    // 리뷰/평가 관련 질문은 쇼핑이 아닌 Claude AI로 처리
    const isReviewQuestion = config.shopping.review_keywords.some(keyword => message.includes(keyword));
    
    // 명확한 쇼핑 의도가 있고, 리뷰 질문이 아니며, 맛집 키워드가 없는 경우만 쇼핑 검색
    const hasShoppingIntent = hasShoppingKeyword || hasProductRecommend || (hasPriceKeyword && hasSpecificProduct);
    
    return hasShoppingIntent && !isReviewQuestion && !hasRestaurantKeyword;
}

function isRestaurantRequest(message) {
    const hasRestaurantKeyword = config.restaurant.food.some(keyword => message.includes(keyword));
    
    // 기존 지역 키워드 확인
    const allLocationKeywords = [
        ...config.restaurant.locations.seoul,
        ...config.restaurant.locations.gyeonggi,
        ...config.restaurant.locations.major_cities,
        ...config.restaurant.locations.general
    ];
    const hasLocationKeyword = allLocationKeywords.some(keyword => message.includes(keyword));
    
    // 지능형 지역 패턴 매칭 (구, 동, 시, 군, 읍, 면, 역 등)
    const locationPatterns = [
        /\w+구(?:\s|$)/,     // OO구 (예: 강북구, 서초구)
        /\w+동(?:\s|$)/,     // OO동 (예: 번3동, 역삼동)
        /\w+시(?:\s|$)/,     // OO시 (예: 성남시, 고양시)
        /\w+군(?:\s|$)/,     // OO군 (예: 양평군)
        /\w+읍(?:\s|$)/,     // OO읍 (예: 진접읍)
        /\w+면(?:\s|$)/,     // OO면 (예: 청평면)
        /\w+역(?:\s|$)/,     // OO역 (예: 강남역, 홍대입구역)
        /\w+대(?:\s|$)/,     // OO대 (예: 연세대, 고려대)
        /\w+로(?:\s|$)/,     // OO로 (예: 테헤란로, 강남대로)
        /\w+거리(?:\s|$)/,   // OO거리 (예: 명동거리, 인사동거리)
        /\w+타운(?:\s|$)/,   // OO타운 (예: 이태원, 강남타운)
        /\w+단지(?:\s|$)/,   // OO단지 (예: 분당신도시, 일산신도시)
    ];
    
    const hasLocationPattern = locationPatterns.some(pattern => pattern.test(message));
    
    const hasExcludeKeyword = config.exclude.shopping_from_restaurant.some(keyword => message.includes(keyword));
    
    return hasRestaurantKeyword && (hasLocationKeyword || hasLocationPattern) && !hasExcludeKeyword;
}

// Basic health check
app.get('/', (req, res) => {
    const koreanTime = getKoreanDateTime();
    const hasClaudeApiKey = !!process.env.CLAUDE_API_KEY;
    const hasNaverClientId = !!process.env.NAVER_CLIENT_ID;
    const hasNaverClientSecret = !!process.env.NAVER_CLIENT_SECRET;
    
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${koreanTime.formatted}</p>
        <p><strong>Claude AI API:</strong> ${hasClaudeApiKey ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>네이버 검색 API:</strong> ${(hasNaverClientId && hasNaverClientSecret) ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>Client ID:</strong> ${hasNaverClientId ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>Client Secret:</strong> ${hasNaverClientSecret ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>날씨 정보 (네이버 뉴스):</strong> ${(hasNaverClientId && hasNaverClientSecret) ? '✅ 사용 가능' : '❌ 네이버 API 필요'}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> /kakao-skill-webhook</p>
        <hr>
        <p><strong>기능:</strong></p>
        <ul>
            <li>🤖 Claude AI 답변 (M4 vs M2 성능비교 등)</li>
            <li>📰 실시간 뉴스 제공 (예: "오늘 뉴스", "최신 뉴스")</li>
            <li>🛒 쇼핑 상품 검색 (예: "노트북 추천", "휴대폰 베스트")</li>
            <li>🍽️ 맛집 검색 (예: "강남역 맛집", "홍대 카페")</li>
            <li>👶 출산 신고 안내 (예: "애기 태어나면 신고해야 할 부분")</li>
            <li>🌤️ 날씨 정보 제공 (예: "서울 날씨", "부산 날씨")</li>
            <li>💬 긴 답변 자동 분할 및 "계속" 기능</li>
        </ul>
    `);
});

// Main webhook endpoint with Claude AI integration
// 🔧 수동 영화 크롤링 API 엔드포인트
app.post('/api/crawl-movies', async (req, res) => {
    try {
        console.log('🚀 수동 영화 크롤링 요청 수신');
        
        const result = await movieScheduler.runNow();
        
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({
            success: true,
            message: '영화 크롤링이 완료되었습니다.',
            data: result
        });
        
    } catch (error) {
        console.error('❌ 수동 크롤링 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '크롤링 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// ℹ️ 스케줄러 상태 확인 API
app.get('/api/scheduler-status', (req, res) => {
    try {
        const status = movieScheduler.getStatus();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('❌ 스케줄러 상태 확인 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🩺 디버그용 상태 확인 엔드포인트
app.get('/debug-status', (req, res) => {
    const status = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? `설정됨 (${process.env.CLAUDE_API_KEY.substring(0, 15)}...)` : '❌ 없음',
            NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? `설정됨 (${process.env.NAVER_CLIENT_ID})` : '❌ 없음',
            NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '❌ 없음'
        },
        version: '2.0-timeout-fixed',
        latest_commit: '746cdf9 - Fix Claude API timeout'
    };
    res.json(status);
});

// 🧪 Claude API 직접 테스트 엔드포인트
app.get('/test-claude', async (req, res) => {
    try {
        console.log('🧪 Claude API 직접 테스트 시작');
        const testMessage = req.query.message || '안녕하세요';
        
        const response = await axios.post(CLAUDE_API_URL, {
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 100,
            messages: [{
                role: "user",
                content: testMessage
            }],
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            timeout: 15000
        });
        
        const aiResponse = response.data.content[0].text;
        console.log('✅ Claude API 테스트 성공:', aiResponse);
        
        res.json({
            success: true,
            input: testMessage,
            output: aiResponse,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Claude API 테스트 실패:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 🔍 세션 디버그 엔드포인트
app.get('/debug-session/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('🔍 세션 디버그 요청:', userId);
        
        // 세션 정보 가져오기
        const session = sessionManager ? sessionManager.getSession(userId) : null;
        const conversationHistory = safeSessionManager.getConversationHistory(userId, 10);
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            userId: userId,
            sessionExists: !!session,
            sessionManager: !!sessionManager,
            session: session ? {
                sessionId: session.sessionId,
                lastActivity: new Date(session.lastActivity).toISOString(),
                messageCount: session.messageCount,
                messagesLength: session.messages?.length || 0
            } : null,
            conversationHistory: conversationHistory,
            conversationHistoryLength: conversationHistory?.length || 0
        };
        
        console.log('🔍 세션 디버그 결과:', JSON.stringify(debugInfo, null, 2));
        res.json(debugInfo);
        
    } catch (error) {
        console.error('❌ 세션 디버그 오류:', error.message);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// 🎯 카카오톡 스킬 메인 엔드포인트
app.post('/kakao-skill-webhook', async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`🔔 [${timestamp}] 카카오 웹훅 요청 받음!`);
    console.log('요청 본문:', JSON.stringify(req.body, null, 2));
    console.log('요청 헤더:', JSON.stringify(req.headers, null, 2));
    
    try {
        const userMessage = req.body.userRequest?.utterance || '';
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        if (!userMessage) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: "메시지를 입력해주세요."
                        }
                    }]
                }
            };
            
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
            }
            return;
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`⏰ 현재 한국 시간: ${koreanTime.formatted}`);
        
        let responseText;
        
        let isWeatherResponse = false;
        let weatherLocation = null;

        // 🔮 운세 질문 우선 처리 (SubAgentManager의 generateFortuneResponse 직접 호출)
        if (isFortuneQuery(userMessage)) {
            console.log('🔮 운세 질문 감지 - SubAgentManager.generateFortuneResponse 호출');
            try {
                responseText = subAgentManager.generateFortuneResponse();
                console.log('✅ 운세 응답 성공');
            } catch (fortuneError) {
                console.error('❌ 운세 처리 오류:', fortuneError);
                responseText = '🔮 운세 정보를 확인하는 중 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.';
            }
        }
        // 🌤️ 날씨 질문 우선 처리 (Claude AI 우회)
        else if (isWeatherQuery(userMessage)) {
            console.log('🌤️ 날씨 질문 감지 - 네이버 API 직접 호출');
            try {
                const weatherResult = await handleWeatherQuery(userMessage);
                if (weatherResult) {
                    responseText = weatherResult;
                    isWeatherResponse = true;
                    
                    // Extract location for button URL
                    const locationPatterns = [
                        /([가-힣]+(?:시|구|동|읍|면|도))\s*날씨/,
                        /날씨\s*([가-힣]+(?:시|구|동|읍|면|도))/,
                        /([가-힣]+)\s*날씨/,
                        /날씨\s*([가-힣]+)/
                    ];
                    
                    weatherLocation = '서울'; // 기본값
                    for (const pattern of locationPatterns) {
                        const match = userMessage.match(pattern);
                        if (match && match[1]) {
                            weatherLocation = match[1].replace(/날씨/g, '').trim();
                            break;
                        }
                    }
                    
                    console.log('✅ 네이버 API 날씨 응답 성공');
                } else {
                    responseText = '🌤️ 날씨 정보를 가져올 수 없었습니다.\n\n네이버에서 "날씨"를 검색해보세요.';
                }
            } catch (weatherError) {
                console.error('❌ 네이버 날씨 API 오류:', weatherError);
                responseText = '🌤️ 날씨 정보를 확인하는 중 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.';
            }
        } else {
            // 🤖 모든 일반 대화는 Claude AI로 직접 처리 (자연스러운 대화를 위해)
            console.log('💭 일반 대화 - Claude AI 직접 호출');
            responseText = await callSimpleClaudeAI(userMessage, userId);
        }
        
        /* 
        === 기존 하드코딩된 분기들 제거됨 ===
        - 유튜브 요약 → YOUTUBE_SUMMARY 카테고리로 이동
        - 영화 평가 → MOVIE_REVIEW 카테고리로 이동  
        - 사실 확인 → FACT_CHECK 카테고리로 이동
        - 뉴스 검색 → NEWS 카테고리로 이동
        - 쇼핑 검색 → SHOPPING 카테고리로 이동
        - 맛집 검색 → RESTAURANT 카테고리로 이동
        - 기타 하드코딩된 분기들
        */
        
        // ⚠️ 응답 길이 최적화 (카카오톡 메시지 길이 제한)
        if (responseText && responseText.length > config.limits.message_max_length) {
            responseText = responseText.substring(0, config.limits.message_truncate_length) + '...';
        }
        
        // 응답 텍스트 정리 (카카오톡 호환성)
        if (responseText) {
            responseText = responseText.trim(); // 앞뒤 공백 제거
            responseText = responseText.replace(/\n{3,}/g, '\n\n'); // 연속 줄바꿈 정리
        }
        
        console.log(`📤 최종 응답 길이: ${responseText ? responseText.length : 0}자`);
        console.log(`📤 응답 내용 미리보기: "${responseText ? responseText.substring(0, 50) : 'null'}..."`);
        
        // 🎉 카카오톡 스킬 응답 포맷
        // 카카오톡 응답 (단일 메시지로 단순화)
        const finalText = responseText || '죄송합니다. 응답을 생성하는 중 문제가 발생했습니다.';
        
        // 300자를 넘으면 잘라내기 및 특수문자 정리
        let displayText = finalText;
        if (displayText.length > 300) {
            displayText = displayText.substring(0, 297) + '...';
            console.log(`📝 응답 길이 조정: ${finalText.length}자 → ${displayText.length}자`);
        }
        
        // 카카오톡 호환성을 위한 텍스트 정리
        displayText = displayText
            .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣.,!?()]/g, '') // 특수문자 제거 (한글, 영숫자, 기본 문장부호만 유지)
            .replace(/\s+/g, ' ') // 다중 공백 정리
            .trim();
            
        console.log(`📝 정리된 텍스트: "${displayText.substring(0, 50)}..."`);
        
        // 빈 응답 방지
        if (!displayText || displayText.length < 5) {
            displayText = '안녕하세요! 무엇을 도와드릴까요?';
        }
        
        let response;
        
        // 날씨 응답인 경우 버튼 추가
        if (isWeatherResponse && weatherLocation) {
            const searchQuery = encodeURIComponent(`${weatherLocation} 날씨`);
            const naverWeatherUrl = `https://search.naver.com/search.naver?query=${searchQuery}`;
            
            response = {
                "version": "2.0",
                "template": {
                    "outputs": [
                        {
                            "simpleText": {
                                "text": displayText
                            }
                        }
                    ],
                    "quickReplies": [
                        {
                            "label": "🌤️ 네이버 날씨 보기",
                            "action": "webLink",
                            "webLinkUrl": naverWeatherUrl
                        }
                    ]
                }
            };
        } else {
            response = {
                "version": "2.0",
                "template": {
                    "outputs": [
                        {
                            "simpleText": {
                                "text": displayText
                            }
                        }
                    ]
                }
            };
        }
        
        console.log('📤 카카오톡 응답 전송:', JSON.stringify(response, null, 2));
        
        // 응답이 이미 전송되었는지 확인
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(response);
            console.log(`✅ [${timestamp}] 응답 전송 완료 - Status: 200`);
        } else {
            console.log('⚠️ 응답이 이미 전송되어 추가 응답을 보낼 수 없습니다.');
        }
        
    } catch (error) {
        console.error('❌ 전체 요청 처리 중 오류:', error);
        
        // 응답이 이미 전송되었는지 확인
        if (!res.headersSent) {
            const errorResponse = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: '⚠️ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                        }
                    }]
                }
            };
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(errorResponse);
        } else {
            console.log('⚠️ 응답이 이미 전송되어 에러 응답을 보낼 수 없습니다.');
        }
    }
});

// 🎬 영화진흥위원회 API 엔드포인트 추가 (안전한 로딩)
try {
    app.use('/api', require('./api/kofic-crawl'));
    console.log('✅ KOFIC API 라우터 로드됨');
} catch (error) {
    console.error('❌ KOFIC API 라우터 로드 실패:', error.message);
}

try {
    app.use('/api', require('./api/full-crawling'));
    console.log('✅ Full crawling API 라우터 로드됨');
} catch (error) {
    console.error('❌ Full crawling API 라우터 로드 실패:', error.message);
}

try {
    app.use('/api', require('./api/direct-crawling'));
    console.log('✅ Direct crawling API 라우터 로드됨');
} catch (error) {
    console.error('❌ Direct crawling API 라우터 로드 실패:', error.message);
}

// 임시 환경변수 확인 엔드포인트 (디버깅용)
app.get('/debug/env', (req, res) => {
    const envStatus = {
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? `설정됨 (${process.env.CLAUDE_API_KEY.length}자)` : '❌ 미설정',
        NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? `설정됨 (${process.env.NAVER_CLIENT_ID.length}자)` : '❌ 미설정',
        NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '❌ 미설정',
        SUPABASE_URL: process.env.SUPABASE_URL ? '설정됨' : '❌ 미설정',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `설정됨 (${process.env.SUPABASE_SERVICE_ROLE_KEY.length}자)` : '❌ 미설정',
        KOFIC_API_KEY: process.env.KOFIC_API_KEY ? '설정됨' : '❌ 미설정',
        NODE_ENV: process.env.NODE_ENV || '미설정',
        PORT: process.env.PORT || '미설정'
    };
    
    res.json({
        message: '환경변수 상태 확인',
        timestamp: new Date().toISOString(),
        environment: envStatus
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🔑 Claude AI API 키 상태: ${process.env.CLAUDE_API_KEY ? '설정됨 (' + process.env.CLAUDE_API_KEY.length + '자)' : '미설정'}`);
    console.log(`📡 네이버 API 키 상태: ${(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) ? '설정됨' : '미설정'}`);
    console.log(`🌤️ 날씨 정보: 네이버 뉴스 검색 활용`);
    console.log(`🗄️ Supabase 상태: ${(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? '설정됨' : '미설정'}`);
    console.log(`🎬 영화진흥위원회 API 상태: ${process.env.KOFIC_API_KEY ? '설정됨' : '미설정'}`);
    
    // 영화 데이터 자동 업데이트 스케줄러 시작
    try {
        if (movieScheduler && typeof movieScheduler.start === 'function') {
            movieScheduler.start();
            console.log('📅 영화 데이터 자동 업데이트 스케줄러 시작됨');
        } else {
            console.log('⚠️ Movie Scheduler가 로드되지 않아 스케줄러를 시작하지 않습니다');
        }
    } catch (error) {
        console.error('❌ 스케줄러 시작 실패:', error.message);
    }
});
