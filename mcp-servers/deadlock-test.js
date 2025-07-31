// Deadlock Items 페이지 테스트 스크립트
const { chromium } = require('playwright');

async function testDeadlockItems() {
    console.log('🎮 Deadlock Items 페이지 테스트 시작...');
    
    let browser = null;
    try {
        // 헤드리스 모드로 브라우저 실행 (WSL 환경에서 안정적)
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--no-first-run',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows'
            ]
        });
        
        const page = await browser.newPage();
        
        // 콘솔 로그 수집
        page.on('console', msg => {
            console.log(`📝 Console: ${msg.text()}`);
        });
        
        // 네트워크 오류 감지
        page.on('response', response => {
            if (!response.ok()) {
                console.log(`❌ Failed request: ${response.url()} - ${response.status()}`);
            }
        });
        
        console.log('🌐 페이지 로딩 중...');
        await page.goto('https://deadlock-new-production.up.railway.app/ko/items', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        const title = await page.title();
        console.log(`📄 페이지 제목: ${title}`);
        
        // 로딩 완료까지 대기
        await page.waitForSelector('.items-content', { 
            state: 'visible',
            timeout: 15000 
        });
        
        console.log('✅ 아이템 컨텐츠 로드 완료');
        
        // 이미지 로드 상태 확인
        const imageStats = await page.evaluate(() => {
            const images = document.querySelectorAll('.item-image img');
            let loaded = 0;
            let failed = 0;
            let total = images.length;
            
            images.forEach(img => {
                if (img.complete) {
                    if (img.naturalWidth > 0) {
                        loaded++;
                    } else {
                        failed++;
                    }
                }
            });
            
            return { total, loaded, failed };
        });
        
        console.log(`🖼️ 이미지 상태: 총 ${imageStats.total}개, 로드 성공 ${imageStats.loaded}개, 실패 ${imageStats.failed}개`);
        
        // 각 카테고리별 아이템 수 확인
        const categories = await page.evaluate(() => {
            const weaponCount = document.querySelector('#weapon-count')?.textContent || '0';
            const vitalityCount = document.querySelector('#vitality-count')?.textContent || '0';
            const spiritCount = document.querySelector('#spirit-count')?.textContent || '0';
            
            return {
                weapon: weaponCount,
                vitality: vitalityCount,
                spirit: spiritCount
            };
        });
        
        console.log('📊 카테고리별 아이템 수:');
        console.log(`  - 무기: ${categories.weapon}`);
        console.log(`  - 활력: ${categories.vitality}`);
        console.log(`  - 정신력: ${categories.spirit}`);
        
        // 스크린샷 캡처
        await page.screenshot({ 
            path: '/home/aski/deadlock-items-test.png',
            fullPage: true 
        });
        console.log('📸 스크린샷 저장됨: /home/aski/deadlock-items-test.png');
        
        // 필터 테스트
        console.log('🔧 필터 기능 테스트...');
        await page.selectOption('#hero-filter', 'infernus');
        await page.waitForTimeout(1000);
        
        await page.selectOption('#game-stage-filter', 'early-game');
        await page.waitForTimeout(1000);
        
        console.log('✅ 필터 테스트 완료');
        
        // 아이템 클릭 테스트
        console.log('🎯 아이템 클릭 테스트...');
        const firstItem = await page.querySelector('.item-card');
        if (firstItem) {
            await firstItem.click();
            await page.waitForTimeout(500);
            console.log('✅ 아이템 클릭 테스트 완료');
        }
        
        console.log('🎉 모든 테스트 완료!');
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        
        if (error.message.includes('dependencies')) {
            console.log('💡 해결 방법: sudo apt-get install libnspr4 libnss3 libasound2t64');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 이미지 URL 개별 테스트
async function testImageUrls() {
    console.log('🔍 이미지 URL 개별 테스트...');
    
    const testUrls = [
        'https://via.placeholder.com/64x64/4A90E2/ffffff?text=MAG',
        'https://via.placeholder.com/64x64/27AE60/ffffff?text=HP',
        'https://via.placeholder.com/64x64/F1C40F/ffffff?text=CHARGE',
        'https://via.placeholder.com/32x32/E74C3C/ffffff?text=⚔',
        'https://via.placeholder.com/20x20/F1C40F/ffffff?text=$'
    ];
    
    for (const url of testUrls) {
        try {
            const response = await fetch(url);
            const status = response.ok ? '✅' : '❌';
            console.log(`${status} ${url} - ${response.status}`);
        } catch (error) {
            console.log(`❌ ${url} - Error: ${error.message}`);
        }
    }
}

// 메인 실행
async function main() {
    await testImageUrls();
    console.log(''); // 구분선
    await testDeadlockItems();
}

if (require.main === module) {
    main();
}