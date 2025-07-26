#!/bin/bash

# 영화 데이터베이스 SQL 파일을 VS Code로 열기
# 사용법: ./open-movie-sql.sh

# 영화 데이터베이스 SQL 파일 찾기 (massive 우선)
MOVIE_SQL=$(ls -t massive_real_movie_database_*.sql massive_movies_*_with_reviews_*.sql *movie_database*.sql 2>/dev/null | head -n 1)

if [ -z "$MOVIE_SQL" ]; then
    echo "❌ 영화 데이터베이스 SQL 파일을 찾을 수 없습니다."
    echo "현재 디렉토리의 SQL 파일 목록:"
    ls -la *.sql 2>/dev/null || echo "SQL 파일이 없습니다."
    exit 1
fi

echo "🎬 VS Code로 영화 데이터베이스 SQL 파일 열기: $MOVIE_SQL"
echo "📁 파일 크기: $(du -h "$MOVIE_SQL" | cut -f1)"
echo "📍 파일 경로: $(realpath "$MOVIE_SQL")"
echo "📊 영화 개수: $(grep -c "INSERT INTO movies" "$MOVIE_SQL")"
echo "📝 리뷰 개수: $(grep -c "INSERT INTO critic_reviews" "$MOVIE_SQL")"

# VS Code로 파일 열기
if command -v code &> /dev/null; then
    code "$MOVIE_SQL"
    echo "✅ VS Code로 $MOVIE_SQL 파일을 열었습니다."
    echo ""
    echo "💡 사용 방법:"
    echo "1. 전체 선택: Ctrl+A"
    echo "2. 복사: Ctrl+C"
    echo "3. Supabase SQL 에디터에 붙여넣기: Ctrl+V"
    echo "4. Run 버튼 클릭하여 실행"
else
    echo "❌ VS Code가 설치되지 않았거나 PATH에 없습니다."
    echo "🔧 VS Code 설치 방법:"
    echo "   sudo snap install --classic code"
    echo ""
    echo "대안으로 nano 에디터로 열기:"
    nano "$MOVIE_SQL"
fi