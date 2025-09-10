// 매일 오전 9시 일정 알림 스케줄러
const cron = require('node-cron');
const ScheduleAgent = require('../agents/schedule-agent');

class DailyScheduleNotifier {
    constructor() {
        this.scheduleAgent = new ScheduleAgent();
        this.name = '[SCHEDULE-NOTIFIER]';
        this.isRunning = false;
        this.enabledUsers = ['default']; // 기본 사용자
    }

    // 스케줄러 시작
    start() {
        if (this.isRunning) {
            console.log(`${this.name} 이미 실행 중입니다.`);
            return;
        }

        console.log(`${this.name} 매일 오전 9시 일정 알림 스케줄러 시작`);

        // 매일 오전 9시에 실행
        this.dailyTask = cron.schedule('0 9 * * *', async () => {
            console.log(`${this.name} 일정 알림 작업 시작 - ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
            await this.sendDailyScheduleNotifications();
        }, {
            scheduled: true,
            timezone: 'Asia/Seoul'
        });

        this.isRunning = true;
        console.log(`${this.name} 스케줄러가 성공적으로 시작되었습니다.`);
    }

    // 스케줄러 중지
    stop() {
        if (!this.isRunning) return;

        if (this.dailyTask) {
            this.dailyTask.stop();
            this.dailyTask.destroy();
        }

        this.isRunning = false;
        console.log(`${this.name} 스케줄러가 중지되었습니다.`);
    }

    // 매일 일정 알림 전송
    async sendDailyScheduleNotifications() {
        try {
            const today = new Date().toISOString().split('T')[0];
            console.log(`${this.name} ${today} 일정 알림 전송 시작`);

            for (const userId of this.enabledUsers) {
                try {
                    const todayNotification = await this.scheduleAgent.getTodayScheduleNotification(userId);
                    
                    if (todayNotification) {
                        console.log(`${this.name} [NOTIFICATION] 사용자: ${userId}`);
                        console.log(`${this.name} [MESSAGE] ${todayNotification}`);
                        
                        // TODO: 실제 알림 전송 로직 구현 (카카오 알림톡 등)
                    } else {
                        console.log(`${this.name} ${userId} 사용자는 오늘 일정이 없습니다.`);
                    }
                } catch (userError) {
                    console.error(`${this.name} ${userId} 사용자 일정 알림 처리 중 오류:`, userError);
                }
            }

            console.log(`${this.name} 일정 알림 전송 완료`);
        } catch (error) {
            console.error(`${this.name} 일정 알림 전송 중 오류:`, error);
        }
    }

    // 현재 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            enabledUsers: this.enabledUsers,
            notificationTime: '9:00 AM (Asia/Seoul)',
            nextRun: this.dailyTask ? 'Every day at 9:00 AM' : null
        };
    }

    // 즉시 알림 테스트 실행
    async triggerTestNotification(userId = null) {
        try {
            console.log(`${this.name} 즉시 알림 테스트 실행`);
            
            const targetUserId = userId || this.enabledUsers[0];
            const todayNotification = await this.scheduleAgent.getTodayScheduleNotification(targetUserId);
            
            if (todayNotification) {
                console.log(`${this.name} [MANUAL-TEST] 사용자 ${targetUserId}의 오늘 일정:`);
                console.log(todayNotification);
                return {
                    success: true,
                    userId: targetUserId,
                    notification: todayNotification
                };
            } else {
                console.log(`${this.name} [MANUAL-TEST] 사용자 ${targetUserId}는 오늘 일정이 없습니다.`);
                return {
                    success: true,
                    userId: targetUserId,
                    notification: null,
                    message: '오늘 일정이 없습니다.'
                };
            }
        } catch (error) {
            console.error(`${this.name} 즉시 알림 테스트 중 오류:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = DailyScheduleNotifier;