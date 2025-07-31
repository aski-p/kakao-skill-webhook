// Playwright MCP 서버 테스트 스크립트
const { chromium } = require('playwright');

async function testBrowser() {
  console.log('Playwright 테스트 시작...');
  
  try {
    // Windows Chrome 경로 설정
    const executablePath = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
    
    const browser = await chromium.launch({
      executablePath,
      headless: false, // GUI 모드로 실행
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log('페이지 제목:', title);
    
    await browser.close();
    console.log('테스트 완료!');
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

testBrowser();