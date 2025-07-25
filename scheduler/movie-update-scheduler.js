// 매일 오전 12시 영화 데이터 자동 업데이트 스케줄러
const cron = require('node-cron');
const NaverMovieCrawler = require('../crawlers/naver-movie-crawler');

class MovieUpdateScheduler {
    constructor() {
        this.crawler = new NaverMovieCrawler();
        this.isRunning = false;
    }

    // 스케줄러 시작
    start() {
        console.log('📅 영화 데이터 자동 업데이트 스케줄러 시작');
        
        // 매일 오전 12시에 실행 (한국 시간 기준)
        // cron 표현식: 초 분 시 일 월 요일
        // '0 0 0 * * *' = 매일 자정 (0시 0분 0초)
        this.dailyJob = cron.schedule('0 0 0 * * *', async () => {
            if (this.isRunning) {
                console.log('⚠️ 이미 크롤링이 실행 중입니다. 스킵합니다.');
                return;
            }

            try {
                this.isRunning = true;
                console.log('🚀 매일 자동 영화 데이터 업데이트 시작:', new Date().toISOString());
                
                const result = await this.crawler.crawlAndUpdateMovies();
                
                if (result.success) {
                    console.log(`✅ 크롤링 완료 - 새 영화 ${result.newMoviesAdded}개 추가`);
                    console.log(`📊 처리된 영화: ${result.totalProcessed}개`);
                    console.log(`🗄️ 기존 영화: ${result.existingMovies}개`);
                } else {
                    console.error('❌ 크롤링 실패:', result.error);
                }

            } catch (error) {
                console.error('❌ 스케줄러 실행 중 오류:', error);
            } finally {
                this.isRunning = false;
                console.log('🏁 크롤링 작업 완료');
            }
        }, {
            scheduled: true,
            timezone: "Asia/Seoul" // 한국 시간대
        });

        // 테스트용: 5분마다 실행 (개발 중에만 사용)
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 개발 모드: 5분마다 테스트 크롤링 실행');
            this.testJob = cron.schedule('*/5 * * * *', async () => {
                if (this.isRunning) {
                    console.log('⚠️ 이미 크롤링이 실행 중입니다. 스킵합니다.');
                    return;
                }

                try {
                    this.isRunning = true;
                    console.log('🧪 테스트 크롤링 시작:', new Date().toISOString());
                    
                    // 테스트용으로 적은 수의 영화만 처리
                    const result = await this.crawler.crawlAndUpdateMovies();
                    console.log('🧪 테스트 크롤링 결과:', result);

                } catch (error) {
                    console.error('❌ 테스트 크롤링 오류:', error);
                } finally {
                    this.isRunning = false;
                }
            }, {
                scheduled: true,
                timezone: "Asia/Seoul"
            });
        }

        console.log('✅ 스케줄러 설정 완료');
        console.log('📅 다음 실행 시간: 매일 오전 12시 (KST)');
        
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 테스트 모드: 5분마다 실행');
        }
    }

    // 즉시 실행 (수동 트리거)
    async runNow() {
        if (this.isRunning) {
            console.log('⚠️ 이미 크롤링이 실행 중입니다.');
            return { success: false, message: 'Already running' };
        }

        try {
            this.isRunning = true;
            console.log('🚀 수동 크롤링 시작:', new Date().toISOString());
            
            const result = await this.crawler.crawlAndUpdateMovies();
            console.log('✅ 수동 크롤링 완료:', result);
            
            return result;

        } catch (error) {
            console.error('❌ 수동 크롤링 오류:', error);
            return { success: false, error: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    // 스케줄러 중지
    stop() {
        if (this.dailyJob) {
            this.dailyJob.stop();
            console.log('🛑 일일 스케줄러 중지');
        }

        if (this.testJob) {
            this.testJob.stop();
            console.log('🛑 테스트 스케줄러 중지');
        }
    }

    // 스케줄러 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            dailyJobRunning: this.dailyJob ? this.dailyJob.running : false,
            testJobRunning: this.testJob ? this.testJob.running : false,
            nextExecutionTime: '매일 00:00 (KST)',
            lastExecutionTime: new Date().toISOString()
        };
    }
}

// 싱글톤 인스턴스 생성
const movieScheduler = new MovieUpdateScheduler();

module.exports = movieScheduler;