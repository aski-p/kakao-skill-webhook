#!/bin/bash

echo "🚀 WSL에서 Playwright 실행을 위한 설정 스크립트"
echo "=============================================="

echo ""
echo "📋 필요한 시스템 종속성 설치 (sudo 권한 필요):"
echo "sudo apt-get update"
echo "sudo apt-get install -y \\"
echo "    libnspr4 \\"
echo "    libnss3 \\"
echo "    libasound2t64 \\"
echo "    libxss1 \\"
echo "    libgconf-2-4 \\"
echo "    libxrandr2 \\"
echo "    libasound2 \\"
echo "    libpangocairo-1.0-0 \\"
echo "    libatk1.0-0 \\"
echo "    libcairo-gobject2 \\"
echo "    libgtk-3-0 \\"
echo "    libgdk-pixbuf2.0-0 \\"
echo "    libdrm2 \\"
echo "    libxcomposite1 \\"
echo "    libxdamage1 \\"
echo "    libxfixes3"

echo ""
echo "또는 Playwright에서 제공하는 자동 설치 명령어:"
echo "sudo npx playwright install-deps"

echo ""
echo "🔧 현재 상태 확인:"

# 현재 설치된 패키지 확인
echo ""
echo "설치된 관련 패키지:"
if command -v dpkg >&/dev/null; then
    PACKAGES=(libnspr4 libnss3 libasound2 libxss1 libgconf-2-4 libxrandr2 libatk1.0-0 libgtk-3-0 libdrm2)
    for pkg in "${PACKAGES[@]}"; do
        if dpkg -l | grep -q "^ii.*$pkg"; then
            echo "✅ $pkg - 설치됨"
        else
            echo "❌ $pkg - 누락"
        fi
    done
fi

echo ""
echo "📦 Playwright 브라우저 설치 상태:"
if [ -d "/home/aski/.cache/ms-playwright" ]; then
    echo "✅ Playwright 브라우저 캐시 존재"
    ls -la /home/aski/.cache/ms-playwright/ | grep -E "(chromium|firefox|webkit)"
else
    echo "❌ Playwright 브라우저 캐시 없음"
fi

echo ""
echo "🌐 네트워크 연결 테스트:"
if curl -s --connect-timeout 5 https://www.google.com >/dev/null; then
    echo "✅ 인터넷 연결 정상"
else
    echo "❌ 인터넷 연결 문제"
fi

echo ""
echo "💡 대안 방법들:"
echo "1. Docker를 사용한 Playwright 실행:"
echo "   docker run --rm -v \$(pwd):/work -w /work mcr.microsoft.com/playwright:v1.40.0-jammy npm test"
echo ""
echo "2. GitHub Codespaces 또는 Cloud IDE 사용"
echo ""
echo "3. Windows에서 직접 Playwright 실행 후 WSL과 결과 공유"
echo ""
echo "4. Playwright를 headless 모드로만 사용 (GUI 없이)"

echo ""
echo "🔍 현재 시스템 정보:"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Architecture: $(uname -m)"
echo "Kernel: $(uname -r)"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"

echo ""
echo "⚡ 빠른 테스트 명령어:"
echo "cd /home/aski/mcp-servers && node deadlock-test.js"