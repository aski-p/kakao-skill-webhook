#!/bin/bash

# VS Code로 최신 생성된 SQL 파일을 열기
# 사용법: ./open-sql.sh

# 최신 생성된 SQL 파일 찾기
LATEST_SQL=$(ls -t *.sql 2>/dev/null | head -n 1)

if [ -z "$LATEST_SQL" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다."
    echo "현재 디렉토리: $(pwd)"
    echo "SQL 파일 목록:"
    ls -la *.sql 2>/dev/null || echo "SQL 파일이 없습니다."
    exit 1
fi

echo "🚀 VS Code로 최신 SQL 파일 열기: $LATEST_SQL"
echo "파일 크기: $(du -h "$LATEST_SQL" | cut -f1)"
echo "파일 경로: $(realpath "$LATEST_SQL")"

# VS Code로 파일 열기
if command -v code &> /dev/null; then
    code "$LATEST_SQL"
    echo "✅ VS Code로 $LATEST_SQL 파일을 열었습니다."
else
    echo "❌ VS Code가 설치되지 않았거나 PATH에 없습니다."
    echo "대안으로 nano 에디터로 열기:"
    nano "$LATEST_SQL"
fi