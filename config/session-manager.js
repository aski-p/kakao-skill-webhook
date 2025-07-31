// 향상된 세션 관리 시스템
// Enhanced Session Management with 10-minute timeout and persistent storage

const fs = require('fs').promises;
const path = require('path');

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.sessionTimeout = 10 * 60 * 1000; // 10분 (600초)
        this.cleanupInterval = 2 * 60 * 1000; // 2분마다 정리
        this.dataPath = path.join(__dirname, '../data');
        this.sessionsFile = path.join(this.dataPath, 'user_sessions.json');
        this.contextFile = path.join(this.dataPath, 'user_contexts.json');
        
        // 정리 작업 시작
        this.startCleanupTimer();
        
        // 서버 시작 시 기존 세션 복구
        this.loadSessions();
        
        console.log('[SESSION] 세션 관리자 초기화 완료 (10분 타임아웃)');
    }

    // 세션 생성 또는 갱신
    async createOrUpdateSession(userId, message) {
        const now = Date.now();
        const existingSession = this.sessions.get(userId);
        
        if (existingSession && (now - existingSession.lastActivity) < this.sessionTimeout) {
            // 기존 세션 갱신
            existingSession.lastActivity = now;
            existingSession.messageCount++;
            existingSession.messages.push({
                message: message,
                timestamp: now,
                type: 'user'
            });
            
            // 최근 20개 메시지만 유지
            if (existingSession.messages.length > 20) {
                existingSession.messages = existingSession.messages.slice(-20);
            }
            
            console.log(`[SESSION] 기존 세션 갱신: ${userId} (메시지 수: ${existingSession.messageCount})`);
            
            return existingSession;
        } else {
            // 새 세션 생성
            const newSession = {
                userId: userId,
                sessionId: this.generateSessionId(),
                startTime: now,
                lastActivity: now,
                messageCount: 1,
                messages: [{
                    message: message,
                    timestamp: now,
                    type: 'user'
                }],
                context: {
                    topics: [],
                    preferences: {},
                    emotionalState: 'neutral',
                    conversationFlow: 'initial',
                    lastIntent: null,
                    userProfile: {
                        responseStyle: 'detailed',
                        interactionHistory: [],
                        preferredLanguage: 'ko'
                    }
                },
                isActive: true
            };
            
            this.sessions.set(userId, newSession);
            
            console.log(`[SESSION] 새 세션 생성: ${userId} (세션 ID: ${newSession.sessionId})`);
            
            // 비동기로 저장
            this.saveSessions();
            
            return newSession;
        }
    }

    // 봇 응답 추가
    async addBotResponse(userId, response, intent = null) {
        const session = this.sessions.get(userId);
        if (!session) return false;
        
        const now = Date.now();
        session.lastActivity = now;
        session.messages.push({
            message: response,
            timestamp: now,
            type: 'bot',
            intent: intent
        });
        
        // 의도 정보 업데이트
        if (intent) {
            session.context.lastIntent = intent;
        }
        
        // 최근 20개 메시지만 유지
        if (session.messages.length > 20) {
            session.messages = session.messages.slice(-20);
        }
        
        console.log(`[SESSION] 봇 응답 추가: ${userId}`);
        
        return true;
    }

    // 세션 정보 조회
    getSession(userId) {
        const session = this.sessions.get(userId);
        if (!session) return null;
        
        const now = Date.now();
        const timeSinceLastActivity = now - session.lastActivity;
        
        // 세션 만료 확인
        if (timeSinceLastActivity > this.sessionTimeout) {
            console.log(`[SESSION] 만료된 세션 제거: ${userId} (비활성 시간: ${Math.round(timeSinceLastActivity/1000)}초)`);
            this.sessions.delete(userId);
            return null;
        }
        
        return session;
    }

    // 대화 히스토리 조회 (문맥 이해용)
    getConversationHistory(userId, limit = 10) {
        const session = this.getSession(userId);
        if (!session) return [];
        
        return session.messages
            .slice(-limit * 2) // 사용자와 봇 메시지를 모두 포함
            .map(msg => ({
                message: msg.message,
                type: msg.type,
                timestamp: msg.timestamp,
                intent: msg.intent,
                timeSinceMessage: Date.now() - msg.timestamp
            }));
    }

    // 사용자 컨텍스트 업데이트
    updateUserContext(userId, updates) {
        const session = this.getSession(userId);
        if (!session) return false;
        
        // 컨텍스트 병합
        Object.assign(session.context, updates);
        
        console.log(`[SESSION] 사용자 컨텍스트 업데이트: ${userId}`, updates);
        
        return true;
    }

    // 세션 통계 조회
    getSessionStats(userId) {
        const session = this.getSession(userId);
        if (!session) return null;
        
        const now = Date.now();
        const sessionDuration = now - session.startTime;
        const timeSinceLastActivity = now - session.lastActivity;
        
        return {
            sessionId: session.sessionId,
            duration: sessionDuration,
            durationMinutes: Math.round(sessionDuration / 60000),
            timeSinceLastActivity: timeSinceLastActivity,
            messageCount: session.messageCount,
            averageResponseTime: sessionDuration / session.messageCount,
            isActive: timeSinceLastActivity < this.sessionTimeout,
            topics: session.context.topics,
            lastIntent: session.context.lastIntent
        };
    }

    // 활성 세션 수 조회
    getActiveSessionCount() {
        const now = Date.now();
        let activeCount = 0;
        
        for (const [userId, session] of this.sessions) {
            if ((now - session.lastActivity) < this.sessionTimeout) {
                activeCount++;
            }
        }
        
        return activeCount;
    }

    // 세션 정리 (만료된 세션 제거)
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [userId, session] of this.sessions) {
            if ((now - session.lastActivity) > this.sessionTimeout) {
                // 세션을 파일로 백업 후 제거
                this.archiveSession(session);
                this.sessions.delete(userId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`[SESSION] ${cleanedCount}개 만료 세션 정리 완료`);
            this.saveSessions();
        }
        
        return cleanedCount;
    }

    // 정리 타이머 시작
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
        
        console.log(`[SESSION] 자동 정리 타이머 시작 (${this.cleanupInterval/1000}초 간격)`);
    }

    // 세션 ID 생성
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${timestamp}_${random}`;
    }

    // 세션 저장 (영속성)
    async saveSessions() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            
            const activeSessions = {};
            const now = Date.now();
            
            // 활성 세션만 저장
            for (const [userId, session] of this.sessions) {
                if ((now - session.lastActivity) < this.sessionTimeout) {
                    activeSessions[userId] = {
                        ...session,
                        messages: session.messages.slice(-10) // 최근 10개만 저장
                    };
                }
            }
            
            await fs.writeFile(this.sessionsFile, JSON.stringify(activeSessions, null, 2));
            console.log(`[SESSION] ${Object.keys(activeSessions).length}개 활성 세션 저장 완료`);
            
        } catch (error) {
            console.error('[SESSION] 세션 저장 실패:', error.message);
        }
    }

    // 세션 로드 (서버 재시작 시)
    async loadSessions() {
        try {
            const data = await fs.readFile(this.sessionsFile, 'utf8');
            const savedSessions = JSON.parse(data);
            
            const now = Date.now();
            let loadedCount = 0;
            
            for (const [userId, session] of Object.entries(savedSessions)) {
                // 여전히 활성 상태인 세션만 복원
                if ((now - session.lastActivity) < this.sessionTimeout) {
                    this.sessions.set(userId, session);
                    loadedCount++;
                }
            }
            
            console.log(`[SESSION] ${loadedCount}개 세션 복원 완료`);
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('[SESSION] 세션 로드 실패:', error.message);
            }
        }
    }

    // 세션 아카이브 (분석용)
    async archiveSession(session) {
        try {
            const archivePath = path.join(this.dataPath, 'archived_sessions');
            await fs.mkdir(archivePath, { recursive: true });
            
            const archiveFile = path.join(archivePath, `session_${session.sessionId}.json`);
            const archiveData = {
                ...session,
                archivedAt: Date.now(),
                sessionDuration: session.lastActivity - session.startTime,
                finalMessageCount: session.messageCount
            };
            
            await fs.writeFile(archiveFile, JSON.stringify(archiveData, null, 2));
            
        } catch (error) {
            console.error('[SESSION] 세션 아카이브 실패:', error.message);
        }
    }

    // 세션 분석 정보
    getAnalytics() {
        const activeCount = this.getActiveSessionCount();
        const totalSessions = this.sessions.size;
        
        let totalMessages = 0;
        let totalDuration = 0;
        const now = Date.now();
        
        for (const session of this.sessions.values()) {
            totalMessages += session.messageCount;
            totalDuration += now - session.startTime;
        }
        
        return {
            activeSessions: activeCount,
            totalSessions: totalSessions,
            averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
            averageSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60000) : 0,
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
        };
    }

    // 사용자 패턴 분석
    getUserPatterns(userId) {
        const session = this.getSession(userId);
        if (!session) return null;
        
        const messages = session.messages.filter(msg => msg.type === 'user');
        const messageTexts = messages.map(msg => msg.message);
        
        // 패턴 분석
        const patterns = {
            commonWords: this.analyzeCommonWords(messageTexts),
            questionPatterns: this.analyzeQuestionPatterns(messageTexts),
            emotionalTone: this.analyzeEmotionalTone(messageTexts),
            topicInterests: this.analyzeTopicInterests(messageTexts),
            conversationStyle: this.analyzeConversationStyle(messageTexts)
        };
        
        return patterns;
    }

    // 공통 단어 분석
    analyzeCommonWords(messages) {
        const wordCount = {};
        const stopWords = ['을', '를', '이', '가', '은', '는', '에', '에서', '와', '과', '의', '로', '으로'];
        
        messages.forEach(msg => {
            const words = msg.split(/\s+/).filter(word => 
                word.length > 1 && !stopWords.includes(word)
            );
            
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });
        
        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [word, count]) => ({ ...obj, [word]: count }), {});
    }

    // 질문 패턴 분석
    analyzeQuestionPatterns(messages) {
        const patterns = {
            what: messages.filter(msg => /뭐|무엇/.test(msg)).length,
            how: messages.filter(msg => /어떻게|방법/.test(msg)).length,
            when: messages.filter(msg => /언제|시간/.test(msg)).length,
            where: messages.filter(msg => /어디|장소/.test(msg)).length,
            why: messages.filter(msg => /왜|이유/.test(msg)).length,
            recommendations: messages.filter(msg => /추천|제안/.test(msg)).length
        };
        
        return patterns;
    }

    // 감정 톤 분석
    analyzeEmotionalTone(messages) {
        const tones = {
            positive: 0,
            negative: 0,
            neutral: 0
        };
        
        messages.forEach(msg => {
            if (/좋아|최고|훌륭|감사|고마워|행복|기뻐/.test(msg)) {
                tones.positive++;
            } else if (/싫어|나빠|힘들어|화나|짜증|스트레스|우울/.test(msg)) {
                tones.negative++;
            } else {
                tones.neutral++;
            }
        });
        
        const total = tones.positive + tones.negative + tones.neutral;
        if (total > 0) {
            tones.positive = Math.round((tones.positive / total) * 100);
            tones.negative = Math.round((tones.negative / total) * 100);
            tones.neutral = Math.round((tones.neutral / total) * 100);
        }
        
        return tones;
    }

    // 주제 관심사 분석
    analyzeTopicInterests(messages) {
        const topics = {
            food: 0,
            entertainment: 0,
            health: 0,
            shopping: 0,
            weather: 0,
            news: 0,
            general: 0
        };
        
        messages.forEach(msg => {
            if (/음식|먹|식사|요리|맛|레시피/.test(msg)) topics.food++;
            else if (/영화|드라마|음악|게임|책/.test(msg)) topics.entertainment++;
            else if (/건강|운동|다이어트|의료/.test(msg)) topics.health++;
            else if (/쇼핑|제품|구매|가격/.test(msg)) topics.shopping++;
            else if (/날씨|기온|비|눈/.test(msg)) topics.weather++;
            else if (/뉴스|정보|소식/.test(msg)) topics.news++;
            else topics.general++;
        });
        
        return topics;
    }

    // 대화 스타일 분석
    analyzeConversationStyle(messages) {
        return {
            avgMessageLength: messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length,
            usesFormalLanguage: messages.filter(msg => /습니다|ㅂ니다/.test(msg)).length / messages.length,
            usesEmoticons: messages.filter(msg => /ㅋㅋ|ㅎㅎ|^^|😊|😄/.test(msg)).length / messages.length,
            asksQuestions: messages.filter(msg => /\?|？/.test(msg)).length / messages.length
        };
    }
}

module.exports = SessionManager;