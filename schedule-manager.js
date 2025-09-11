// 일정 관리 시스템
class ScheduleManager {
    constructor() {
        // 메모리 기반 일정 저장 (사용자별로 관리)
        this.schedules = new Map();
    }

    // 일정 추가
    addSchedule(userId, date, time, event) {
        if (!this.schedules.has(userId)) {
            this.schedules.set(userId, []);
        }
        
        const schedule = {
            id: Date.now().toString(),
            date: this.normalizeDate(date),
            time: time || '종일',
            event: event,
            createdAt: new Date().toISOString()
        };
        
        this.schedules.get(userId).push(schedule);
        console.log(`📅 일정 등록: ${userId} - ${schedule.date} ${schedule.time} ${schedule.event}`);
        
        return schedule;
    }

    // 날짜 정규화 (YYYY-MM-DD 형식)
    normalizeDate(dateStr) {
        const today = new Date();
        
        // 오늘, 내일, 모레 처리
        if (dateStr === '오늘') {
            return this.formatDate(today);
        } else if (dateStr === '내일') {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return this.formatDate(tomorrow);
        } else if (dateStr === '모레') {
            const dayAfter = new Date(today);
            dayAfter.setDate(today.getDate() + 2);
            return this.formatDate(dayAfter);
        }
        
        // MM월 DD일 형식 처리
        const monthDayMatch = dateStr.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (monthDayMatch) {
            const month = parseInt(monthDayMatch[1]);
            const day = parseInt(monthDayMatch[2]);
            const year = today.getFullYear();
            
            // 현재 날짜보다 이전이면 다음 해로 설정
            const targetDate = new Date(year, month - 1, day);
            if (targetDate < today) {
                targetDate.setFullYear(year + 1);
            }
            
            return this.formatDate(targetDate);
        }
        
        // 기본값: 오늘
        return this.formatDate(today);
    }

    // 날짜 포맷팅 (YYYY-MM-DD)
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 일정 조회 (특정 날짜)
    getSchedulesByDate(userId, date) {
        const userSchedules = this.schedules.get(userId) || [];
        const normalizedDate = this.normalizeDate(date);
        
        return userSchedules.filter(schedule => schedule.date === normalizedDate);
    }

    // 일정 조회 (전체)
    getAllSchedules(userId) {
        return this.schedules.get(userId) || [];
    }

    // 일정 조회 (기간별)
    getSchedulesByRange(userId, startDate, endDate) {
        const userSchedules = this.schedules.get(userId) || [];
        const start = this.normalizeDate(startDate);
        const end = this.normalizeDate(endDate);
        
        return userSchedules.filter(schedule => {
            return schedule.date >= start && schedule.date <= end;
        });
    }

    // 일정 삭제
    deleteSchedule(userId, scheduleId) {
        const userSchedules = this.schedules.get(userId) || [];
        const index = userSchedules.findIndex(s => s.id === scheduleId);
        
        if (index !== -1) {
            const deleted = userSchedules.splice(index, 1)[0];
            console.log(`🗑️ 일정 삭제: ${userId} - ${deleted.event}`);
            return true;
        }
        
        return false;
    }

    // 일정 포맷팅 (응답용)
    formatScheduleResponse(schedules, targetDate = null) {
        if (!schedules || schedules.length === 0) {
            if (targetDate) {
                return `📅 ${targetDate} 일정이 없습니다.`;
            }
            return `📅 등록된 일정이 없습니다.`;
        }

        // 날짜별로 그룹화
        const groupedSchedules = {};
        schedules.forEach(schedule => {
            if (!groupedSchedules[schedule.date]) {
                groupedSchedules[schedule.date] = [];
            }
            groupedSchedules[schedule.date].push(schedule);
        });

        let response = '';
        
        // 특정 날짜만 조회하는 경우
        if (targetDate) {
            const normalizedTargetDate = this.normalizeDate(targetDate);
            const daySchedules = groupedSchedules[normalizedTargetDate] || [];
            
            if (daySchedules.length === 0) {
                return `📅 ${targetDate} 일정이 없습니다.`;
            }
            
            response = `📅 **${this.getDateDisplay(normalizedTargetDate)} 일정**\n\n`;
            daySchedules.forEach((schedule, index) => {
                response += `${index + 1}. ${schedule.time} - ${schedule.event}\n`;
            });
        } else {
            // 전체 일정 조회
            response = `📅 **일정 목록**\n\n`;
            
            // 날짜 순으로 정렬
            const sortedDates = Object.keys(groupedSchedules).sort();
            
            sortedDates.forEach(date => {
                response += `**${this.getDateDisplay(date)}**\n`;
                groupedSchedules[date].forEach((schedule, index) => {
                    response += `  ${index + 1}. ${schedule.time} - ${schedule.event}\n`;
                });
                response += '\n';
            });
        }

        return response;
    }

    // 날짜 표시 형식 변환
    getDateDisplay(dateStr) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // 오늘/내일 표시
        if (this.formatDate(date) === this.formatDate(today)) {
            return `오늘 (${month}월 ${day}일)`;
        } else if (this.formatDate(date) === this.formatDate(tomorrow)) {
            return `내일 (${month}월 ${day}일)`;
        }
        
        // 요일 계산
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayOfWeek = days[date.getDay()];
        
        return `${month}월 ${day}일 (${dayOfWeek})`;
    }

    // 일정 파싱 (메시지에서 일정 정보 추출)
    parseScheduleFromMessage(message) {
        const result = {
            date: '오늘',
            time: null,
            event: null
        };

        // 날짜 추출
        const datePatterns = [
            /내일/,
            /모레/,
            /(\d{1,2})월\s*(\d{1,2})일/,
            /다음주/,
            /이번주/
        ];

        for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match) {
                if (match[0] === '내일') result.date = '내일';
                else if (match[0] === '모레') result.date = '모레';
                else if (match[1] && match[2]) result.date = `${match[1]}월 ${match[2]}일`;
                else result.date = match[0];
                break;
            }
        }

        // 시간 추출
        const timeMatch = message.match(/(\d{1,2})시(?:\s*(\d{1,2})분)?|오전\s*(\d{1,2})시|오후\s*(\d{1,2})시/);
        if (timeMatch) {
            if (timeMatch[3]) {
                // 오전
                result.time = `오전 ${timeMatch[3]}시`;
            } else if (timeMatch[4]) {
                // 오후
                result.time = `오후 ${timeMatch[4]}시`;
            } else if (timeMatch[1]) {
                // 시간만
                const hour = parseInt(timeMatch[1]);
                const minute = timeMatch[2] ? `:${timeMatch[2]}` : '';
                result.time = `${hour}시${minute}`;
            }
        }

        // 일정 내용 추출 (날짜와 시간 정보 제거)
        let eventText = message;
        eventText = eventText.replace(/일정\s*(등록|추가|저장|기록)/gi, '');
        eventText = eventText.replace(/내일|모레|\d{1,2}월\s*\d{1,2}일/g, '');
        eventText = eventText.replace(/\d{1,2}시(?:\s*\d{1,2}분)?|오전\s*\d{1,2}시|오후\s*\d{1,2}시/g, '');
        eventText = eventText.trim();

        result.event = eventText || '일정';

        return result;
    }
}

module.exports = ScheduleManager;