const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 카카오톡 5초 제한에 맞춘 최적화된 타임아웃 설정
const TIMEOUT_CONFIG = {
    naver_api: 3000,
    claude_general: 4000,
    claude_image: 6000,
    image_download: 4000
};

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
    
    return {
        formatted: formatted
    };
}

// 스마트 메시지 분할 시스템
function smartSplit(text, maxLength = 800) {
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

// 응답 분할 처리 함수
const pendingMessages = new Map();

function handleLongResponse(text, userId, responseType = 'general') {
    const chunks = smartSplit(text, 800);
    
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

// Basic health check
app.get('/', (req, res) => {
    const koreanTime = getKoreanDateTime();
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${koreanTime.formatted}</p>
        <p><strong>Claude API:</strong> ${process.env.CLAUDE_API_KEY ? '✅ 설정됨' : '❌ 미설정'}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> /kakao-skill-webhook</p>
    `);
});

// Main webhook endpoint with Claude AI integration
app.post('/kakao-skill-webhook', async (req, res) => {
    console.log('🔔 카카오 웹훅 요청 받음!');
    
    try {
        const userMessage = req.body.userRequest?.utterance || '';
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        if (!userMessage) {
            throw new Error('메시지가 없습니다');
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
        // "계속" 요청 처리
        if (userMessage.includes('계속') || userMessage.includes('이어서') || userMessage.includes('더보기')) {
            console.log('📄 계속 요청 감지됨');
            const pendingMessage = pendingMessages.get(userId);
            if (pendingMessage) {
                console.log('✅ 저장된 나머지 내용 전송');
                pendingMessages.delete(userId);
                
                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: pendingMessage
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 나머지 내용 전송 완료');
                return;
            } else {
                console.log('⚠️ 저장된 내용이 없음');
                const response = {
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: {
                                text: '전송할 나머지 내용이 없습니다. 새로운 질문을 해주세요!'
                            }
                        }]
                    }
                };
                
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.status(200).json(response);
                console.log('✅ 안내 메시지 전송 완료');
                return;
            }
        }
        
        // Claude API 호출
        console.log('✅ Claude API 호출 시작...');
        const startTime = Date.now();
        
        let responseText;
        try {
            const claudeResponse = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: "claude-3-haiku-20240307",
                    system: `현재 정확한 한국 시간은 ${koreanTime.formatted}입니다. 
사용자가 시간이나 날짜를 물어보면 이 정보를 사용해주세요.

답변 가이드라인:
1. 명확하고 도움이 되는 답변을 제공하세요.
2. 핵심 내용을 간결하게 설명하세요.
3. 답변 길이는 반드시 950자 이내로 작성하세요.
4. 카카오톡 메시지 형태에 적합하도록 간결하게 작성하세요.

중요 제한사항:
- 맛집, 식당, 카페 등 실제 장소 추천을 요청받으면 "실제 운영 중인 맛집 정보는 네이버 지역검색을 통해 확인해주세요. 예: '강남역 맛집', '홍대 카페' 등으로 검색해주세요."라고 안내하세요.
- 구체적인 가게 이름이나 주소는 절대 임의로 만들어서 제공하지 마세요.
- 존재하지 않는 상호명이나 위치 정보를 제공하지 마세요.`,
                    messages: [{
                        role: "user",
                        content: userMessage
                    }],
                    max_tokens: 800
                },
                {
                    headers: {
                        'x-api-key': process.env.CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    timeout: TIMEOUT_CONFIG.claude_general
                }
            );
            
            const responseTime = Date.now() - startTime;
            responseText = claudeResponse.data.content[0].text;
            console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.log(`⚠️ Claude API 에러 (${responseTime}ms): ${error.message}`);
            
            // API 키 문제인지 확인
            if (error.response?.status === 401) {
                responseText = `Claude API 인증에 문제가 있습니다. 서버 관리자에게 문의해주세요.`;
            }
            // 네트워크 문제
            else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                responseText = `네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.`;
            }
            // 시간 관련 질문 특별 처리
            else if (userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) {
                const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                const now = new Date();
                const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
                const dayOfWeek = dayNames[koreaDate.getDay()];
                responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
            }
            // 간단한 인사 응답
            else if (userMessage.includes('안녕') || userMessage.includes('hi') || userMessage.includes('hello')) {
                responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
            }
            // 일반적인 질문에 대한 기본 안내
            else {
                responseText = `현재 AI 서비스가 일시적으로 불안정합니다. 간단한 질문이나 뉴스/쇼핑 검색은 가능합니다. (현재 시간: ${koreanTime.formatted})`;
            }
        }
        
        console.log(`📝 응답 내용 일부: ${responseText.substring(0, 100)}...`);
        
        // 스마트 분할 시스템 적용
        const processedResponse = handleLongResponse(responseText, userId, 'general');
        responseText = processedResponse.text;
        
        const kakaoResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: responseText
                    }
                }]
            }
        };
        
        // Kakao Skills 응답 검증
        if (!kakaoResponse.template || !kakaoResponse.template.outputs || !Array.isArray(kakaoResponse.template.outputs)) {
            throw new Error('Invalid Kakao response format');
        }
        
        console.log(`📤 카카오 응답 전송: ${JSON.stringify(kakaoResponse, null, 2).substring(0, 300)}...`);
        
        // 응답 헤더 명시적 설정 (Kakao Skills 호환성)
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(kakaoResponse);
        console.log('✅ 카카오 웹훅 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 웹훅 처리 중 전체 오류:', error);
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: "죄송합니다. 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                    }
                }]
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(errorResponse);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
});