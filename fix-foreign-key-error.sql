-- Foreign Key 오류 해결을 위한 SQL
-- 문제: critic_reviews 테이블의 movie_id 외래키 제약조건 위반

-- 1. 기존 데이터 정리 (안전한 삭제)
BEGIN;

-- 기존 영화 및 리뷰 데이터 삭제 (외래키 제약조건으로 인해 reviews도 자동 삭제됨)
TRUNCATE TABLE critic_reviews CASCADE;
TRUNCATE TABLE movies RESTART IDENTITY CASCADE;

-- 2. AUTO INCREMENT 시퀀스 리셋
ALTER SEQUENCE movies_id_seq RESTART WITH 1;
ALTER SEQUENCE critic_reviews_id_seq RESTART WITH 1;

COMMIT;

-- 3. 테이블 구조 확인
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('movies', 'critic_reviews')
ORDER BY table_name, ordinal_position;

-- 4. 외래키 제약조건 확인
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'critic_reviews';

-- 이제 원본 SQL 파일을 다시 실행하면 됩니다.