// Docker를 사용한 Playwright 테스트 - WSL 환경에서 시스템 종속성 없이 실행
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runPlaywrightInDocker() {
    console.log('🐳 Docker를 사용한 Playwright 테스트 시작...');
    
    // Docker가 설치되어 있는지 확인
    try {
        const dockerCheck = spawn('docker', ['--version'], { stdio: 'pipe' });
        
        dockerCheck.on('error', (error) => {
            console.log('❌ Docker가 설치되어 있지 않습니다.');
            console.log('💡 Docker Desktop for Windows를 설치하고 WSL 통합을 활성화하세요.');
            console.log('   https://docs.docker.com/desktop/wsl/');
            return;
        });
        
        dockerCheck.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Docker 사용 가능');
                runTest();
            } else {
                console.log('❌ Docker 실행 실패');
            }
        });
        
    } catch (error) {
        console.log('❌ Docker 확인 중 오류:', error.message);
        showAlternatives();
    }
}

function runTest() {
    console.log('🎮 Deadlock Items 페이지 테스트 (Docker 환경)...');
    
    // Docker에서 실행할 테스트 스크립트 생성
    const dockerTestScript = `
const { chromium } = require('playwright');

async function testDeadlockItems() {
    console.log('🎮 Deadlock Items 페이지 테스트 시작...');
    
    let browser = null;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        
        console.log('🌐 페이지 로딩 중...');
        await page.goto('https://deadlock-new-production.up.railway.app/ko/items', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        const title = await page.title();
        console.log('📄 페이지 제목:', title);
        
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
        
        console.log(\`🖼️ 이미지 상태: 총 \${imageStats.total}개, 로드 성공 \${imageStats.loaded}개, 실패 \${imageStats.failed}개\`);
        
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
        console.log(\`  - 무기: \${categories.weapon}\`);
        console.log(\`  - 활력: \${categories.vitality}\`);
        console.log(\`  - 정신력: \${categories.spirit}\`);
        
        // 스크린샷 캡처
        await page.screenshot({ 
            path: '/work/deadlock-items-docker-test.png',
            fullPage: true 
        });
        console.log('📸 스크린샷 저장됨: deadlock-items-docker-test.png');
        
        console.log('🎉 모든 테스트 완료!');
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testDeadlockItems();
`;

    // Docker 테스트 스크립트 저장
    fs.writeFileSync('/tmp/docker-test.js', dockerTestScript);
    
    // Docker 명령어 실행
    const dockerCmd = [
        'run', '--rm',
        '-v', '/tmp/docker-test.js:/work/test.js',
        '-v', process.cwd() + ':/work/output',
        'mcr.microsoft.com/playwright:v1.40.0-focal',
        'node', '/work/test.js'
    ];
    
    console.log('🐳 Docker 명령어 실행 중...');
    console.log('docker', dockerCmd.join(' '));
    
    const dockerProcess = spawn('docker', dockerCmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    dockerProcess.on('error', (error) => {
        console.log('❌ Docker 실행 오류:', error.message);
        showAlternatives();
    });
    
    dockerProcess.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Docker 테스트 완료!');
        } else {
            console.log(\`❌ Docker 테스트 실패 (종료 코드: \${code})\`);
            showAlternatives();
        }
    });
}

function showAlternatives() {
    console.log('');
    console.log('💡 대안 방법들:');
    console.log('');
    console.log('1. 시스템 종속성 직접 설치:');
    console.log('   sudo apt-get update');
    console.log('   sudo npx playwright install-deps');
    console.log('');
    console.log('2. Windows PowerShell에서 실행:');
    console.log('   npm install playwright');
    console.log('   npx playwright install');
    console.log('   node test-script.js');
    console.log('');
    console.log('3. GitHub Codespaces 사용:');
    console.log('   https://github.com/codespaces');
    console.log('');
    console.log('4. 온라인 IDE 사용:');
    console.log('   - Replit: https://replit.com');
    console.log('   - StackBlitz: https://stackblitz.com');
    console.log('   - CodeSandbox: https://codesandbox.io');
    console.log('');
}

// 실행
if (require.main === module) {
    runPlaywrightInDocker();
}