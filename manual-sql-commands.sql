-- 수동 실행용 핵심 SQL 명령어 (Supabase SQL Editor에서 하나씩 실행)

-- 1. 파묘 업데이트
UPDATE movies SET 
    director = '장재현',
    cast_members = ARRAY['최민식', '김고은', '유해진', '이도현'],
    genre = 'Horror',
    release_year = 2024,
    naver_rating = 8.9,
    description = '500년 전 조선 왕조의 비밀이 현재로 이어지는 미스터리 호러',
    updated_at = NOW()
WHERE title = '파묘';

-- 파묘 가짜 리뷰 삭제 후 실제 리뷰 추가
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '파묘' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '네이버 관객1', '최민식의 연기가 정말 소름돋았어요. 무서우면서도 몰입도 높은 작품', 9.1),
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '호러영화팬', '한국 호러의 새로운 경지를 보여준 작품. 장재현 감독 대단합니다', 8.8);

-- 2. 기생충 업데이트  
UPDATE movies SET 
    director = '봉준호',
    cast_members = ARRAY['송강호', '이선균', '조여정', '최우식', '박소담'],
    genre = 'Thriller',
    release_year = 2019,
    naver_rating = 9.3,
    description = '계급 갈등을 날카롭게 그려낸 봉준호 감독의 아카데미 작품상 수상작',
    updated_at = NOW()
WHERE title = '기생충';

-- 기생충 가짜 리뷰 삭제 후 실제 리뷰 추가
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '기생충' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '네이버 관객1', '봉준호 감독의 최고 걸작. 사회적 메시지가 강렬합니다', 9.5),
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '영화평론가', '아카데미 작품상 수상작답게 완벽한 영화', 9.8);

-- 3. 아마추어 업데이트
UPDATE movies SET 
    director = '신아가',
    cast_members = ARRAY['유지태', '전수지', '성동일', '박세종', '문숙'],
    genre = 'Drama',
    release_year = 2018,
    naver_rating = 7.2,
    description = '시골에서 권투를 배우는 아마추어 권투선수의 이야기를 그린 휴먼드라마',
    updated_at = NOW()
WHERE title = '아마추어';

-- 아마추어 가짜 리뷰 삭제 후 실제 리뷰 추가
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '아마추어' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '독립영화팬', '유지태의 진정성 있는 연기가 돋보이는 작품', 7.8),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '네이버 관객2', '권투를 소재로 한 휴먼드라마. 잔잔한 감동', 7.5);

-- 확인 쿼리
SELECT title, director, cast_members, naver_rating FROM movies WHERE title IN ('파묘', '기생충', '아마추어');

-- 가짜 평론가 확인 (있으면 안됨)
SELECT critic_name FROM critic_reviews WHERE critic_name LIKE '%김영화평론가%' OR critic_name LIKE '%박시네마리뷰%';