# 🔧 Foreign Key 오류 해결 가이드

## 🚨 발생한 오류
```
ERROR: 23503: insert or update on table "critic_reviews" violates foreign key constraint "critic_reviews_movie_id_fkey"
DETAIL: Key (movie_id)=(5) is not present in table "movies".
```

## 🔍 원인 분석

### 1. 외래키 제약조건 위반
- `critic_reviews` 테이블의 `movie_id`가 `movies` 테이블에 존재하지 않음
- SQL 실행 순서 문제 또는 데이터 정합성 문제

### 2. 가능한 원인들
- 기존 데이터와 새 데이터 간의 ID 충돌
- 트랜잭션 중간에 실패로 인한 불완전한 데이터 상태
- AUTO INCREMENT 시퀀스와 실제 데이터 불일치

## ✅ 해결 방법

### 방법 1: 안전한 SQL 파일 사용 (추천)
```bash
# 새로 생성된 안전한 SQL 파일 사용
./open-sql.sh  # VS Code로 열기
```

**특징:**
- ✅ ID 순서 보장 (1부터 순차적)
- ✅ Foreign Key 제약조건 준수
- ✅ 트랜잭션 안전성
- ✅ 기존 데이터 정리 포함

### 방법 2: 수동 데이터 정리 후 재실행
```sql
-- 1단계: 기존 데이터 정리
BEGIN;

TRUNCATE TABLE critic_reviews CASCADE;
TRUNCATE TABLE movies RESTART IDENTITY CASCADE;
ALTER SEQUENCE movies_id_seq RESTART WITH 1;
ALTER SEQUENCE critic_reviews_id_seq RESTART WITH 1;

COMMIT;

-- 2단계: 새 SQL 파일 실행
-- (VS Code에서 SQL 내용 복사 후 실행)
```

### 방법 3: 오류 해결 전용 SQL 실행
```bash
# Supabase에서 실행
cat fix-foreign-key-error.sql
```

## 📋 사용 가능한 SQL 파일들

### 1. `safe_movies_database_2025-07-26T01-30-59-853Z.sql` (추천)
- ✅ **9개 영화 + 36개 리뷰**
- ✅ Foreign Key 오류 방지
- ✅ 트랜잭션 안전성
- ✅ ID 순서 보장

### 2. `massive_movies_2010_2025_with_reviews_2025-07-26T01-24-47-927Z.sql`
- ⚠️ **94개 영화 + 376개 리뷰**
- ⚠️ Foreign Key 오류 가능성
- ⚠️ 복잡한 데이터 구조

### 3. `fix-foreign-key-error.sql`
- 🔧 오류 해결 전용
- 🔧 데이터 정리 및 시퀀스 리셋

## 🚀 권장 실행 순서

### Step 1: 환경변수 설정 확인
```bash
node setup-env.js
```

### Step 2: 안전한 SQL 파일 열기
```bash
./open-sql.sh
```

### Step 3: Supabase에서 실행
1. VS Code에서 전체 선택 (Ctrl+A)
2. 복사 (Ctrl+C)
3. Supabase SQL 에디터에 붙여넣기 (Ctrl+V)
4. Run 버튼 클릭

### Step 4: 결과 확인
```sql
-- 영화 수 확인
SELECT COUNT(*) FROM movies;

-- 리뷰 수 확인  
SELECT COUNT(*) FROM critic_reviews;

-- 데이터 무결성 확인
SELECT 
    m.title,
    COUNT(cr.id) as review_count
FROM movies m
LEFT JOIN critic_reviews cr ON m.id = cr.movie_id
GROUP BY m.id, m.title
ORDER BY m.id;
```

## 🔍 문제 예방

### 1. 항상 트랜잭션 사용
```sql
BEGIN;
-- SQL 명령들
COMMIT;
```

### 2. 데이터 정리 먼저 수행
```sql
TRUNCATE TABLE critic_reviews CASCADE;
TRUNCATE TABLE movies RESTART IDENTITY CASCADE;
```

### 3. 시퀀스 리셋
```sql
ALTER SEQUENCE movies_id_seq RESTART WITH 1;
ALTER SEQUENCE critic_reviews_id_seq RESTART WITH 1;
```

## 🧪 테스트

### 영화 검색 테스트
```bash
# 서버 시작
npm start

# 영화 검색 테스트
node test-restaurant.js
```

### 카카오 스킬 테스트
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"userRequest":{"utterance":"기생충 영화평"}}'
```

## 📊 데이터 현황

### 안전한 SQL 파일 (추천)
- **영화**: 9개 (대표작 선별)
- **리뷰**: 36개 (영화당 4개)
- **평론가**: 이동진, 박평식 + 랜덤 2명
- **연도**: 2010-2024
- **크기**: 16KB

### 대용량 SQL 파일 (오류 가능성)
- **영화**: 94개 (전체 컬렉션)
- **리뷰**: 376개 (영화당 4개)
- **크기**: 164KB

## 💡 추가 팁

1. **항상 백업**: 데이터 변경 전 백업 권장
2. **단계별 실행**: 큰 SQL을 작은 단위로 나누어 실행
3. **로그 확인**: Supabase 로그에서 상세 오류 메시지 확인
4. **테스트 환경**: 가능하면 테스트 DB에서 먼저 확인

이제 안전한 SQL 파일로 Foreign Key 오류 없이 데이터를 삽입할 수 있습니다! 🎉