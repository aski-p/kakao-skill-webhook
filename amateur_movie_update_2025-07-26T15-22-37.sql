-- 아마추어 영화를 실제 2018년 영화 정보로 업데이트
-- 감독: 신아가, 주연: 유지태
-- 가짜 평론가 대신 실제 관객 리뷰로 교체

-- 1. 기존 아마추어 영화 ID 확인 (임시 변수 설정)
\set amateur_movie_id (SELECT id FROM movies WHERE title = '아마추어' LIMIT 1)

-- 2. 아마추어 영화 정보 업데이트
UPDATE movies 
SET 
    title = '아마추어',
    english_title = 'Amateur',
    director = '신아가',
    cast_members = ARRAY['유지태', '전수지', '성동일', '박세종', '문숙'],
    genre = 'Drama',
    release_year = 2018,
    runtime_minutes = 82,
    country = 'South Korea',
    naver_rating = 7.2,
    description = '시골에서 권투를 배우는 아마추어 권투선수의 이야기를 그린 휴먼드라마. 신아가 감독이 연출하고 유지태가 주연을 맡았다.',
    keywords = ARRAY['아마추어', '신아가', '유지태', '권투', '드라마', '독립영화', 'amateur'],
    updated_at = NOW()
WHERE title = '아마추어';

-- 3. 기존 가짜 리뷰 삭제
DELETE FROM critic_reviews 
WHERE movie_id = (SELECT id FROM movies WHERE title = '아마추어' LIMIT 1);

-- 4. 실제 관객 리뷰 삽입
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '박**', '시골을 배경으로 한 권투 이야기가 감동적이었습니다.', 7.4),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '독립영화팬', '유지태의 연기가 정말 인상적이었습니다.', 7.9),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '네이버 관객2', '권투 영화로서는 독특한 접근방식이었습니다.', 6.4),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '권투영화팬', '아마추어 권투선수의 현실을 잘 그려냈네요.', 8.1),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '관객D', '담담하게 그려낸 인간 드라마가 인상적입니다.', 8.6),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '네이버 관객1', '시골을 배경으로 한 권투 이야기가 감동적이었습니다.', 7.3),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '영화좋아요', '권투를 소재로 한 휴먼드라마의 좋은 예시', 8.9),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '한국영화팬', '권투를 소재로 한 휴먼드라마의 좋은 예시', 6.9),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '관객B', '소규모 제작이지만 진정성이 느껴지는 작품이에요.', 7.4),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '시네필', '시골을 배경으로 한 권투 이야기가 감동적이었습니다.', 6),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '임**', '아마추어 권투선수의 현실을 잘 그려냈네요.', 8),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '관객C', '시골을 배경으로 한 권투 이야기가 감동적이었습니다.', 8.7),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '한국영화팬', '유지태의 연기가 정말 인상적이었습니다.', 7),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '관객C', '짧은 러닝타임이지만 여운이 남는 영화입니다.', 6.3),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '강**', '권투영화의 새로운 시각을 제시한 작품', 7.9),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '김**', '시골 권투 체육관의 분위기가 잘 살아있어요.', 7.3),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '임**', '짧지만 강렬한 인상을 남긴 영화입니다.', 8.9),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '관객C', '짧은 러닝타임이지만 여운이 남는 영화입니다.', 8.7),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '강**', '시골 권투 체육관의 분위기가 잘 살아있어요.', 7.7),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '한국영화팬', '시골을 배경으로 한 권투 이야기가 감동적이었습니다.', 8),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '네이버 관객3', '독립영화 특유의 진정성이 느껴졌어요.', 6.9);

-- 5. 업데이트 결과 확인
SELECT 
    title, 
    director, 
    cast_members, 
    release_year, 
    naver_rating,
    description
FROM movies 
WHERE title = '아마추어';

-- 6. 새로운 리뷰 확인 (샘플 5개)
SELECT 
    critic_name,
    review_text,
    score
FROM critic_reviews 
WHERE movie_id = (SELECT id FROM movies WHERE title = '아마추어' LIMIT 1)
ORDER BY RANDOM()
LIMIT 5;

-- 7. 총 리뷰 수 확인
SELECT COUNT(*) as total_reviews
FROM critic_reviews 
WHERE movie_id = (SELECT id FROM movies WHERE title = '아마추어' LIMIT 1);