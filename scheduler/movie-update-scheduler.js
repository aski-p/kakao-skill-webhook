// 매일 오전 12시 영화 데이터 자동 업데이트 스케줄러 (KOFIC 통합)
const cron = require('node-cron');
const NaverMovieCrawler = require('../crawlers/naver-movie-crawler');
const KoficMovieCrawler = require('../crawlers/kofic-movie-crawler');
const KoficDailyUpdater = require('../kofic-daily-updater');
const FinalDatabaseMovieUpdater = require('../final-db-movie-updater');

class MovieUpdateScheduler {
    constructor() {
        this.naverCrawler = new NaverMovieCrawler();
        this.koficCrawler = new KoficMovieCrawler();
        this.koficDailyUpdater = new KoficDailyUpdater();
        this.dbUpdater = new FinalDatabaseMovieUpdater();
        this.isRunning = false;
    }

    // 스케줄러 시작
    start() {
        console.log('[TOMORROW] 영화 데이터 자동 업데이트 스케줄러 시작');
        
        // 매일 오전 12시에 실행 (한국 시간 기준)
        // cron 표현식: 초 분 시 일 월 요일
        // '0 0 0 * * *' = 매일 자정 (0시 0분 0초)
        this.dailyJob = cron.schedule('0 0 0 * * *', async () => {
            if (this.isRunning) {
                console.log('[WARN] 이미 업데이트가 실행 중입니다. 스킵합니다.');
                return;
            }

            try {
                this.isRunning = true;
                console.log('🚀 매일 자동 영화 데이터 업데이트 시작:', new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}));
                
                // 1. KOFIC API로 최신 박스오피스 영화 수집
                console.log('[MOVIE] KOFIC API 일일 업데이트 시작...');
                await this.koficDailyUpdater.updateMovies();
                
                // 2. 수집된 데이터가 있다면 데이터베이스 업데이트
                const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const dailyFile = `daily_update_${today}.json`;
                
                try {
                    const fs = require('fs');
                    if (fs.existsSync(dailyFile)) {
                        console.log('[INFO] 수집된 데이터를 데이터베이스에 업데이트 중...');
                        await this.dbUpdater.run(dailyFile);
                    } else {
                        console.log('[TIP] 오늘 새로운 한국 영화가 없습니다.');
                    }
                } catch (dbError) {
                    console.error('[ERROR] 데이터베이스 업데이트 오류:', dbError.message);
                }
                
                // 3. 네이버 API로 추가 영화 정보 보완 (기존 크롤러)
                console.log('[SEARCH] 네이버 API로 최신 영화 정보 보완...');
                try {
                    const naverResult = await this.naverCrawler.crawlAndUpdateMovies();
                    console.log('[SUCCESS] 네이버 API 업데이트 완료:', naverResult.newMoviesAdded || 0, '개 추가');
                } catch (naverError) {
                    console.error('[ERROR] 네이버 API 업데이트 오류:', naverError.message);
                }
                
                console.log('[PARTY] 매일 자동 업데이트 완료!');

            } catch (error) {
                console.error('[ERROR] 스케줄러 실행 중 오류:', error);
            } finally {
                this.isRunning = false;
                console.log('[CHECKERED] 일일 업데이트 작업 완료:', new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}));
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
                    console.log('[WARN] 이미 크롤링이 실행 중입니다. 스킵합니다.');
                    return;
                }

                try {
                    this.isRunning = true;
                    console.log('🧪 테스트 크롤링 시작:', new Date().toISOString());
                    
                    // 테스트용으로 적은 수의 영화만 처리
                    const result = await this.naverCrawler.crawlAndUpdateMovies();
                    console.log('🧪 테스트 크롤링 결과:', result);

                } catch (error) {
                    console.error('[ERROR] 테스트 크롤링 오류:', error);
                } finally {
                    this.isRunning = false;
                }
            }, {
                scheduled: true,
                timezone: "Asia/Seoul"
            });
        }

        console.log('[SUCCESS] 스케줄러 설정 완료');
        console.log('[TOMORROW] 다음 실행 시간: 매일 오전 12시 (KST)');
        
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 테스트 모드: 5분마다 실행');
        }
    }

    // 즉시 실행 (수동 트리거)
    async runNow() {
        if (this.isRunning) {
            console.log('[WARN] 이미 업데이트가 실행 중입니다.');
            return { success: false, message: 'Already running' };
        }

        try {
            this.isRunning = true;
            console.log('🚀 수동 영화 데이터 업데이트 시작:', new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}));
            
            let koficMoviesAdded = 0;
            let naverMoviesAdded = 0;
            
            // 1. KOFIC API로 최신 박스오피스 영화 수집
            console.log('[MOVIE] KOFIC API 수동 업데이트 시작...');
            try {
                await this.koficDailyUpdater.updateMovies();
                console.log('[SUCCESS] KOFIC API 데이터 수집 완료');
                
                // 수집된 데이터 처리
                const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const dailyFile = `daily_update_${today}.json`;
                
                const fs = require('fs');
                if (fs.existsSync(dailyFile)) {
                    console.log('[INFO] 수집된 데이터를 데이터베이스에 업데이트 중...');
                    await this.dbUpdater.run(dailyFile);
                    
                    // 파일에서 추가된 영화 수 확인
                    const dailyData = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
                    koficMoviesAdded = dailyData.total_new_movies || 0;
                }
            } catch (koficError) {
                console.error('[ERROR] KOFIC 업데이트 오류:', koficError.message);
            }
            
            // 2. 네이버 API로 추가 영화 정보 보완
            console.log('[SEARCH] 네이버 API로 최신 영화 정보 보완...');
            try {
                const naverResult = await this.naverCrawler.crawlAndUpdateMovies();
                naverMoviesAdded = naverResult.newMoviesAdded || 0;
                console.log('[SUCCESS] 네이버 API 업데이트 완료');
            } catch (naverError) {
                console.error('[ERROR] 네이버 API 업데이트 오류:', naverError.message);
            }
            
            const result = {
                success: true,
                koficMoviesAdded: koficMoviesAdded,
                naverMoviesAdded: naverMoviesAdded,
                totalNewMovies: koficMoviesAdded + naverMoviesAdded,
                executedAt: new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})
            };
            
            console.log('[SUCCESS] 수동 업데이트 완료:', result);
            return result;

        } catch (error) {
            console.error('[ERROR] 수동 업데이트 오류:', error);
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