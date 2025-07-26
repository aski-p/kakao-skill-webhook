#!/bin/bash

echo "🚂 Railway CLI 로그인 및 환경변수 가져오기"
echo "============================================"
echo ""

# Railway CLI 설치 확인
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI가 설치되지 않았습니다."
    echo ""
    echo "🔧 Railway CLI 설치:"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    echo "   또는"
    echo "   npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✅ Railway CLI가 설치되어 있습니다."
echo ""

# Railway 로그인
echo "🔑 Railway 로그인 진행..."
railway login

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Railway 로그인 성공!"
    echo ""
    
    # 프로젝트 환경변수 가져오기
    echo "📋 프로젝트 환경변수 목록:"
    railway variables
    
    echo ""
    echo "💾 환경변수를 .env 파일로 내보내기:"
    railway variables --json > .env.railway.json
    
    if [ -f ".env.railway.json" ]; then
        echo "✅ 환경변수가 .env.railway.json에 저장되었습니다."
        echo ""
        echo "📝 이제 다음 파일들을 확인하세요:"
        echo "   - .env (로컬 개발용)"
        echo "   - .env.railway.json (Railway 설정 백업)"
    fi
    
else
    echo ""
    echo "❌ Railway 로그인 실패"
    echo ""
    echo "🔧 수동으로 환경변수 설정:"
    echo "1. https://railway.app 접속"
    echo "2. 프로젝트 선택"
    echo "3. Variables 탭에서 환경변수 복사"
    echo "4. .env 파일에 붙여넣기"
    echo ""
    echo "   code .env"
fi