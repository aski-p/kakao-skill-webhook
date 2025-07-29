-- 대용량 실제 영화 데이터베이스 (2010-2025년 7월)
-- 생성일시: 7/26/2025, 11:57:34 AM
-- 실제 영화 수: 30448개
-- 전문가 리뷰: 121792개
-- 30,000개 이상 대용량 영화 컬렉션

BEGIN;

-- 기존 데이터 유지하고 대용량 영화 추가
SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies) + 1);
SELECT setval('critic_reviews_id_seq', (SELECT MAX(id) FROM critic_reviews) + 1);

-- ==========================================
-- 대용량 영화 데이터 INSERT
-- ==========================================
