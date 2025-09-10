// 간단한 일정 관리 에이전트
const SupabaseClient = require('../config/supabase-client');

class ScheduleAgent {
    constructor() {
        this.supabase = new SupabaseClient();
        this.name = '[SCHEDULE]';
    }

    // 메시지가 일정 관련인지 확인
    isScheduleMessage(message) {
        const scheduleKeywords = [
            '일정', '스케줄', '약속', '미팅', '회의', '등록해줘', '추가해줘',
            '일정 알려줘', '일정 보여줘', '무슨 일정', '오늘 일정', '내일 일정'
        ];

        return scheduleKeywords.some(keyword => message.includes(keyword));
    }

    // 한국어 날짜를 YYYY-MM-DD 형식으로 변환
    parseKoreanDate(dateString) {
        if (dateString.includes('오늘')) {
            const today = new Date();
            return today.toISOString().split('T')[0];
        }
        
        if (dateString.includes('내일')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }

        // YYYY-MM-DD 형식
        const dateMatch = dateString.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            return dateMatch[1];
        }

        // MM월 DD일 형식
        const koreanDateMatch = dateString.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (koreanDateMatch) {
            const month = koreanDateMatch[1].padStart(2, '0');
            const day = koreanDateMatch[2].padStart(2, '0');
            const year = new Date().getFullYear();
            return `${year}-${month}-${day}`;
        }

        // 기본값: 오늘
        return new Date().toISOString().split('T')[0];
    }

    // 시간 파싱
    parseTime(timeString) {
        const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        }

        const ampmMatch = timeString.match(/(오전|오후)\s*(\d{1,2})시/);
        if (ampmMatch) {
            let hour = parseInt(ampmMatch[2]);
            if (ampmMatch[1] === '오후' && hour !== 12) hour += 12;
            if (ampmMatch[1] === '오전' && hour === 12) hour = 0;
            return `${hour.toString().padStart(2, '0')}:00`;
        }

        const hourMatch = timeString.match(/(\d{1,2})시/);
        if (hourMatch) {
            return `${hourMatch[1].padStart(2, '0')}:00`;
        }

        return '09:00'; // 기본 시간
    }

    // 메인 처리 함수
    async processScheduleRequest(userMessage, userId) {
        try {
            console.log(`${this.name} 일정 요청 처리: "${userMessage}"`);

            // 등록 요청 처리
            if (userMessage.includes('등록') || userMessage.includes('추가') || userMessage.includes('해줘')) {
                const targetDate = this.parseKoreanDate(userMessage);
                const time = this.parseTime(userMessage);
                
                // 간단한 제목 추출
                let title = userMessage
                    .replace(/일정|스케줄|등록|추가|해줘|오늘|내일/g, '')
                    .replace(/(\d{1,2})시/g, '')
                    .replace(/오전|오후/g, '')
                    .trim();
                
                if (!title) title = '새 일정';

                const result = await this.supabase.addSchedule(targetDate, title, time, null, userId);
                
                if (result) {
                    return {
                        success: true,
                        message: `✅ 일정이 등록되었습니다!\n\n📅 날짜: ${targetDate}\n⏰ 시간: ${time}\n📝 제목: ${title}`
                    };
                } else {
                    return {
                        success: false,
                        message: '❌ 일정 등록에 실패했습니다. 다시 시도해주세요.'
                    };
                }
            }
            
            // 조회 요청 처리
            else {
                let schedules = [];
                let dateStr = '';

                if (userMessage.includes('오늘')) {
                    schedules = await this.supabase.getTodaySchedules(userId);
                    dateStr = '오늘';
                } else if (userMessage.includes('내일')) {
                    schedules = await this.supabase.getTomorrowSchedules(userId);
                    dateStr = '내일';
                } else {
                    const targetDate = this.parseKoreanDate(userMessage);
                    schedules = await this.supabase.getSchedulesByDate(targetDate, userId);
                    dateStr = targetDate;
                }

                if (schedules.length === 0) {
                    return {
                        success: true,
                        message: `📅 ${dateStr} 일정이 없습니다.`
                    };
                }

                let message = `📅 ${dateStr} 일정 (${schedules.length}개)\n\n`;
                schedules.forEach((schedule, index) => {
                    const timeStr = schedule.start_time ? schedule.start_time : '시간미정';
                    message += `${index + 1}. ⏰ ${timeStr} - ${schedule.title}\n`;
                });

                return {
                    success: true,
                    message: message.trim()
                };
            }

        } catch (error) {
            console.error(`${this.name} 일정 요청 처리 중 오류:`, error);
            return {
                success: false,
                message: '❌ 일정 처리 중 오류가 발생했습니다.'
            };
        }
    }

    // 오늘 일정 알림용
    async getTodayScheduleNotification(userId) {
        try {
            const schedules = await this.supabase.getTodaySchedules(userId);
            
            if (schedules.length === 0) {
                return null;
            }

            let message = `🌅 오늘의 일정 (${schedules.length}개)\n\n`;
            schedules.forEach((schedule, index) => {
                const timeStr = schedule.start_time ? schedule.start_time : '시간미정';
                message += `${index + 1}. ⏰ ${timeStr} - ${schedule.title}\n`;
            });
            message += '\n좋은 하루 되세요! ✨';

            return message;
        } catch (error) {
            console.error(`${this.name} 오늘 일정 알림 생성 중 오류:`, error);
            return null;
        }
    }
}

module.exports = ScheduleAgent;