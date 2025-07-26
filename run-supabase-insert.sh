#!/bin/bash

# Supabase 배치 인서트 실행 스크립트

echo "🚀 Supabase 배치 인서트 스크립트"
echo "=================================="

# 환경 변수 체크 (Railway 형식 지원)
SUPABASE_URL="${SUPABASE_URL:-$supabase_url}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$supabase_service_role_key}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Supabase 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "💡 먼저 환경 변수를 설정해주세요:"
    echo "export SUPABASE_URL=\"https://your-project.supabase.co\""
    echo "export SUPABASE_SERVICE_ROLE_KEY=\"your-service-role-key\""
    echo ""
    echo "또는 Railway 형식:"
    echo "export supabase_url=\"https://your-project.supabase.co\""
    echo "export supabase_service_role_key=\"your-service-role-key\""
    echo ""
    echo "Railway에서 환경 변수를 복사하여 설정하세요."
    exit 1
fi

# 환경변수 매핑
export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "✅ 환경 변수 확인 완료"
echo "SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."

# SQL 청크 디렉토리 확인
if [ ! -d "sql_chunks" ]; then
    echo "❌ sql_chunks 디렉토리를 찾을 수 없습니다."
    echo "💡 먼저 split-sql.js를 실행하여 SQL 파일을 분할하세요:"
    echo "node split-sql.js"
    exit 1
fi

# 청크 파일 개수 확인
CHUNK_COUNT=$(ls sql_chunks/*.sql 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -eq 0 ]; then
    echo "❌ sql_chunks 디렉토리에 SQL 파일이 없습니다."
    echo "💡 먼저 split-sql.js를 실행하여 SQL 파일을 분할하세요:"
    echo "node split-sql.js"
    exit 1
fi

echo "📂 SQL 청크 파일: ${CHUNK_COUNT}개 발견"

# Supabase 클라이언트 확인
if ! npm list @supabase/supabase-js > /dev/null 2>&1; then
    echo "📦 Supabase 클라이언트 설치 중..."
    npm install @supabase/supabase-js
fi

echo ""
echo "🔥 실행 옵션을 선택하세요:"
echo "1) 자동 실행 (권장) - 모든 청크를 자동으로 순서대로 실행"
echo "2) 수동 실행 - 파일 내용을 출력하여 Supabase 대시보드에서 수동 실행"
echo "3) 취소"

read -p "선택 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 자동 실행을 시작합니다..."
        echo "⚠️ 주의: 이 작업은 시간이 오래 걸릴 수 있습니다."
        echo ""
        node supabase-auto-insert.js
        ;;
    2)
        echo ""
        echo "📋 수동 실행 가이드:"
        echo "1. sql_chunks/README.md 파일을 참고하세요"
        echo "2. Supabase 대시보드 > SQL Editor로 이동"
        echo "3. 다음 순서로 파일을 복사하여 실행:"
        echo ""
        echo "   테이블 생성 (1개 파일):"
        ls sql_chunks/01_*.sql 2>/dev/null | head -5
        echo ""
        echo "   영화 데이터 (31개 파일):"
        ls sql_chunks/02_*.sql 2>/dev/null | head -5
        echo "   ..."
        echo ""
        echo "   리뷰 데이터 (122개 파일):"
        ls sql_chunks/03_*.sql 2>/dev/null | head -5
        echo "   ..."
        echo ""
        echo "💡 자세한 내용은 sql_chunks/README.md를 확인하세요"
        ;;
    3)
        echo "취소되었습니다."
        exit 0
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac