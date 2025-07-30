// Playwright 크롤러 실제 테스트
const PlaywrightCrawler = require('./config/playwright-crawler');

async function testPlaywrightCrawler() {
    console.log('[DRAMA] Playwright 크롤러 실제 테스트 시작\n');
    
    const crawler = new PlaywrightCrawler();
    
    try {
        // F1 더무비 테스트
        console.log('[MEMO] 테스트: "F1 더무비"');
        console.log('='.repeat(60));
        
        const movieTitle = "F1 더무비";
        const crawlResults = await crawler.crawlMultipleSites(movieTitle);
        
        console.log('\n[SEARCH] 크롤링 결과:');
        console.log(JSON.stringify(crawlResults, null, 2));
        
        console.log('\n[INFO] 포맷팅된 결과:');
        const formattedResult = crawler.formatForKakaoSkill(crawlResults, movieTitle);
        console.log(formattedResult.data.message);
        
    } catch (error) {
        console.error('[ERROR] 테스트 실패:', error.message);
        console.error(error.stack);
    } finally {
        await crawler.close();
        console.log('\n[PARTY] Playwright 크롤러 테스트 완료!');
    }
}

// 테스트 실행
testPlaywrightCrawler().catch(console.error);