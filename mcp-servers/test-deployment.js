// Railway 배포 상태 및 이미지 로드 테스트
const { chromium } = require('playwright');

async function testDeployment() {
    console.log('🚀 Railway 배포 상태 테스트 시작...');
    
    let browser = null;
    try {
        // WSL에서 시스템 종속성 없이도 테스트 가능하도록 설정
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage', 
                '--disable-gpu',
                '--disable-extensions',
                '--no-first-run'
            ]
        });
        
        const page = await browser.newPage();
        
        // 네트워크 요청 모니터링
        const failedRequests = [];
        page.on('response', response => {
            if (!response.ok()) {
                failedRequests.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });
        
        console.log('🌐 페이지 로딩 중...');
        await page.goto('https://deadlock-new-production.up.railway.app/ko/items', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        // 페이지 제목 확인
        const title = await page.title();
        console.log(`📄 페이지 제목: ${title}`);
        
        // 로딩 상태 대기
        console.log('⏳ 아이템 로딩 대기 중...');
        await page.waitForSelector('.items-content', { 
            state: 'visible',
            timeout: 15000 
        });
        
        // 이미지 URL 분석
        const imageAnalysis = await page.evaluate(() => {
            const images = document.querySelectorAll('.item-image img');
            const analysis = {
                total: images.length,
                placeholder: 0,
                broken: 0,
                loaded: 0,
                urls: []
            };
            
            images.forEach(img => {
                const src = img.src;
                analysis.urls.push(src);
                
                if (src.includes('via.placeholder.com')) {
                    analysis.placeholder++;
                } else if (src.includes('cdn.deadlock.coach')) {
                    analysis.broken++;
                }
                
                if (img.complete && img.naturalWidth > 0) {
                    analysis.loaded++;
                }
            });
            
            return analysis;
        });
        
        console.log('🖼️ 이미지 분석 결과:');
        console.log(`  총 이미지: ${imageAnalysis.total}개`);
        console.log(`  Placeholder: ${imageAnalysis.placeholder}개`);
        console.log(`  깨진 URL: ${imageAnalysis.broken}개`);
        console.log(`  로드 성공: ${imageAnalysis.loaded}개`);
        
        if (imageAnalysis.broken > 0) {
            console.log('❌ 아직 깨진 이미지 URL이 있습니다!');
            console.log('처음 5개 URL:', imageAnalysis.urls.slice(0, 5));
        } else if (imageAnalysis.placeholder === imageAnalysis.total) {
            console.log('✅ 모든 이미지가 placeholder로 교체되었습니다!');
        }
        
        // 카테고리별 아이템 수 확인
        const categories = await page.evaluate(() => {
            return {
                weapon: document.querySelector('#weapon-count')?.textContent || '0',
                vitality: document.querySelector('#vitality-count')?.textContent || '0',  
                spirit: document.querySelector('#spirit-count')?.textContent || '0'
            };
        });
        
        console.log('📊 카테고리별 아이템:');
        console.log(`  무기: ${categories.weapon}`);
        console.log(`  활력: ${categories.vitality}`);
        console.log(`  정신력: ${categories.spirit}`);
        
        // 실패한 네트워크 요청 확인
        if (failedRequests.length > 0) {
            console.log('🚨 실패한 네트워크 요청:');
            failedRequests.slice(0, 5).forEach(req => {
                console.log(`  ${req.status}: ${req.url}`);
            });
        } else {
            console.log('✅ 모든 네트워크 요청 성공');
        }
        
        // 최종 결과
        if (imageAnalysis.broken === 0 && imageAnalysis.placeholder > 0) {
            console.log('🎉 배포 성공! 모든 이미지가 올바르게 표시됩니다.');
        } else {
            console.log('⚠️ 배포가 아직 완료되지 않았거나 캐시 문제가 있습니다.');
            console.log('💡 몇 분 후 다시 테스트해보세요.');
        }
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        
        if (error.message.includes('dependencies')) {
            console.log('💡 시스템 종속성 설치 필요:');
            console.log('   sudo apt-get update && sudo npx playwright install-deps');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 실행
if (require.main === module) {
    testDeployment();
}