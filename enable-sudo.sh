#!/bin/bash

echo "🔑 WSL에서 sudo 패스워드 설정하기"
echo "================================"

echo ""
echo "현재 사용자: $(whoami)"
echo "사용자 그룹: $(groups)"

echo ""
echo "📋 다음 중 하나를 선택하세요:"
echo ""
echo "1. 패스워드 설정 (권장):"
echo "   sudo passwd $(whoami)"
echo ""
echo "2. 패스워드 없이 sudo 사용 (보안 위험):"
echo "   echo '$(whoami) ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/$(whoami)"
echo ""
echo "3. Windows 터미널을 관리자 권한으로 실행하기:"
echo "   - Windows 시작 메뉴에서 'Windows Terminal' 검색"
echo "   - 우클릭 → '관리자 권한으로 실행'"
echo "   - WSL 탭에서 명령어 실행"

echo ""
echo "⚡ 패스워드 설정 후 다음 명령어 실행:"
echo "sudo apt-get update && sudo npx playwright install-deps"

echo ""
echo "🎯 최종 테스트:"
echo "cd /home/aski/mcp-servers && node deadlock-test.js"