#!/bin/bash

echo "🔧 WSL Playwright 종속성 설치 스크립트"
echo "====================================="

echo ""
echo "다음 명령어를 복사해서 터미널에서 실행하세요:"
echo ""
echo "sudo apt-get update && sudo apt-get install -y libnspr4 libnss3 libasound2t64 libxss1 libgconf-2-4 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0 libdrm2 libxcomposite1 libxdamage1 libxfixes3"

echo ""
echo "또는 더 간단하게:"
echo "sudo npx playwright install-deps"

echo ""
echo "설치 후 다음 명령어로 테스트:"
echo "cd /home/aski/mcp-servers && node deadlock-test.js"