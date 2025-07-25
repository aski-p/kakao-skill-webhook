-- 네이버 API 실제 크롤링 영화 데이터베이스
-- 생성일시: 7/26/2025, 11:48:37 AM
-- 크롤링 영화 수: 0개
-- 전문가 리뷰: 0개
-- 크롤링 오류: 107개
-- 데이터 소스: 네이버 영화 검색 API

BEGIN;

-- 기존 데이터에 추가 (ID 순서 보장)
SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies) + 1);
SELECT setval('critic_reviews_id_seq', (SELECT MAX(id) FROM critic_reviews) + 1);

-- ==========================================
-- 네이버 API 크롤링 영화 데이터
-- ==========================================

-- ==========================================
-- 전문가 리뷰 데이터
-- ==========================================


COMMIT;

-- 크롤링 완료
-- 📊 크롤링 영화: 0개
-- 📝 전문가 리뷰: 0개
-- ❌ 크롤링 오류: 107개
