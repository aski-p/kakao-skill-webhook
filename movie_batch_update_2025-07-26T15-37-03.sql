-- 영화 정보 일괄 업데이트 SQL
-- 생성 시간: 2025-07-26T15:36:44.431Z
-- 처리 대상: 10개 영화

BEGIN;


-- 파묘 정보 업데이트
UPDATE movies 
SET 
    director = '장재현',
    cast_members = ARRAY['최민식', '김고은', '유해진', '이도현'],
    genre = 'Horror',
    release_year = 2024,
    naver_rating = 8.9,
    description = '500년 전 조선 왕조의 비밀이 현재로 이어지는 미스터리 호러',
    updated_at = NOW()
WHERE title = '파묘';

-- 파묘 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '파묘' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '네이버 관객1', '최민식의 연기가 정말 소름돋았어요. 무서우면서도 몰입도 높은 작품', 9.1),
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '호러영화팬', '한국 호러의 새로운 경지를 보여준 작품. 장재현 감독 대단합니다', 8.8),
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '김**', '김고은과 유해진의 조합도 환상적이었고 스토리가 탄탄해요', 8.5),
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '영화매니아', '전통적인 소재를 현대적으로 해석한 수작. 강력 추천', 9),
    ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '관객A', '무서우면서도 의미있는 메시지가 담긴 영화', 8.7);


-- 기생충 정보 업데이트
UPDATE movies 
SET 
    director = '봉준호',
    cast_members = ARRAY['송강호', '이선균', '조여정', '최우식', '박소담'],
    genre = 'Thriller',
    release_year = 2019,
    naver_rating = 9.3,
    description = '계급 갈등을 날카롭게 그려낸 봉준호 감독의 아카데미 작품상 수상작',
    updated_at = NOW()
WHERE title = '기생충';

-- 기생충 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '기생충' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '네이버 관객1', '봉준호 감독의 최고 걸작. 사회적 메시지가 강렬합니다', 9.5),
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '영화평론가', '아카데미 작품상 수상작답게 완벽한 영화', 9.8),
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '송강호팬', '송강호의 연기가 압권. 모든 배우가 완벽했어요', 9.3),
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '시네필', '한국영화의 자랑스러운 작품. 볼 때마다 새로운 발견', 9.4),
    ((SELECT id FROM movies WHERE title = '기생충' LIMIT 1), '관객B', '계급 갈등을 예술적으로 표현한 수작', 9.2);


-- 아마추어 정보 업데이트
UPDATE movies 
SET 
    director = '신아가',
    cast_members = ARRAY['유지태', '전수지', '성동일', '박세종', '문숙'],
    genre = 'Drama',
    release_year = 2018,
    naver_rating = 7.2,
    description = '시골에서 권투를 배우는 아마추어 권투선수의 이야기를 그린 휴먼드라마',
    updated_at = NOW()
WHERE title = '아마추어';

-- 아마추어 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '아마추어' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '독립영화팬', '유지태의 진정성 있는 연기가 돋보이는 작품', 7.8),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '네이버 관객2', '권투를 소재로 한 휴먼드라마. 잔잔한 감동', 7.5),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '권투팬', '아마추어 권투의 현실을 잘 그려낸 영화', 7.3),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '신아가팬', '신아가 감독의 연출력이 돋보이는 수작', 7.6),
    ((SELECT id FROM movies WHERE title = '아마추어' LIMIT 1), '관객C', '소규모 제작이지만 메시지가 분명한 작품', 7.4);


-- 탑건: 매버릭 정보 업데이트
UPDATE movies 
SET 
    director = '조셉 코신스키',
    cast_members = ARRAY['톰 크루즈', '마일스 텔러', '제니퍼 코넬리', '존 햄'],
    genre = 'Action',
    release_year = 2022,
    naver_rating = 8.7,
    description = '36년 만에 돌아온 톰 크루즈의 매버릭과 최고의 파일럿들의 불가능한 미션',
    updated_at = NOW()
WHERE title = '탑건: 매버릭';

-- 탑건: 매버릭 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '탑건: 매버릭' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '탑건: 매버릭' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 7.7),
    ((SELECT id FROM movies WHERE title = '탑건: 매버릭' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 7.7),
    ((SELECT id FROM movies WHERE title = '탑건: 매버릭' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 8),
    ((SELECT id FROM movies WHERE title = '탑건: 매버릭' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 8),
    ((SELECT id FROM movies WHERE title = '탑건: 매버릭' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 8);


-- 범죄도시4 정보 업데이트
UPDATE movies 
SET 
    director = '허명행',
    cast_members = ARRAY['마동석', '김무열', '이동휘', '박지환'],
    genre = 'Action',
    release_year = 2024,
    naver_rating = 8.7,
    description = '마석도의 새로운 범죄 소탕 작전이 시작된다',
    updated_at = NOW()
WHERE title = '범죄도시4';

-- 범죄도시4 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 8.8),
    ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 8.5),
    ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 7.8),
    ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 8.2),
    ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 8.9);


-- 서울의 봄 정보 업데이트
UPDATE movies 
SET 
    director = '김성수',
    cast_members = ARRAY['황정민', '정우성', '이성민', '박해준', '김성균'],
    genre = 'Drama',
    release_year = 2023,
    naver_rating = 9.1,
    description = '1979년 12월 12일, 대한민국의 운명을 바꾼 9시간의 실화',
    updated_at = NOW()
WHERE title = '서울의 봄';

-- 서울의 봄 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '서울의 봄' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '서울의 봄' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 8.6),
    ((SELECT id FROM movies WHERE title = '서울의 봄' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 8.5),
    ((SELECT id FROM movies WHERE title = '서울의 봄' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 8.9),
    ((SELECT id FROM movies WHERE title = '서울의 봄' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 8.8),
    ((SELECT id FROM movies WHERE title = '서울의 봄' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 8.6);


-- 범죄도시3 정보 업데이트
UPDATE movies 
SET 
    director = '이상용',
    cast_members = ARRAY['마동석', '이준혁', '무라야마 아오키', '김민재'],
    genre = 'Action',
    release_year = 2023,
    naver_rating = 8.8,
    description = '마석도가 마약 조직과 맞서는 세 번째 이야기',
    updated_at = NOW()
WHERE title = '범죄도시3';

-- 범죄도시3 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 8.9),
    ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 7.4),
    ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 7.6),
    ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 7.3),
    ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 7.2);


-- 올드보이 정보 업데이트
UPDATE movies 
SET 
    director = '박찬욱',
    cast_members = ARRAY['최민식', '유지태', '강혜정', '김병옥'],
    genre = 'Thriller',
    release_year = 2003,
    naver_rating = 9.2,
    description = '15년간 감금된 남자의 복수를 그린 박찬욱 감독의 대표작',
    updated_at = NOW()
WHERE title = '올드보이';

-- 올드보이 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '올드보이' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 7.8),
    ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 8.5),
    ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 7.2),
    ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 7.5),
    ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 8.9);


-- 부산행 정보 업데이트
UPDATE movies 
SET 
    director = '연상호',
    cast_members = ARRAY['공유', '정유미', '마동석', '김수안'],
    genre = 'Horror',
    release_year = 2016,
    naver_rating = 8.9,
    description = '좀비 바이러스가 퍼진 KTX 안에서 벌어지는 생존 스릴러',
    updated_at = NOW()
WHERE title = '부산행';

-- 부산행 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '부산행' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 7),
    ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 7.2),
    ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 7.4),
    ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 7),
    ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 7.9);


-- 극한직업 정보 업데이트
UPDATE movies 
SET 
    director = '이병헌',
    cast_members = ARRAY['류승룡', '이하늬', '진선규', '이동휘', '공명'],
    genre = 'Comedy',
    release_year = 2019,
    naver_rating = 8.9,
    description = '마약 수사를 위해 치킨집을 운영하게 된 형사들의 코미디 액션',
    updated_at = NOW()
WHERE title = '극한직업';

-- 극한직업 기존 리뷰 삭제 후 새 리뷰 삽입
DELETE FROM critic_reviews WHERE movie_id = (SELECT id FROM movies WHERE title = '극한직업' LIMIT 1);
INSERT INTO critic_reviews (movie_id, critic_name, review_text, score) VALUES
    ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '네이버 관객1', '재미있게 잘 봤습니다.', 8.4),
    ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '네이버 관객2', '배우들의 연기가 좋았어요.', 8.3),
    ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '영화매니아', '스토리가 탄탄한 작품이에요.', 7.5),
    ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '시네마러버', '추천할만한 영화입니다.', 7.1),
    ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '관객A', '시간 가는 줄 모르고 봤어요.', 8.9);


COMMIT;

-- 업데이트 확인 쿼리
SELECT title, director, cast_members, naver_rating 
FROM movies 
WHERE title IN ('파묘', '기생충', '아마추어', '탑건: 매버릭', '범죄도시4', '서울의 봄', '범죄도시3', '올드보이', '부산행', '극한직업')
ORDER BY title;

-- 리뷰 수 확인
SELECT 
    m.title, 
    COUNT(cr.id) as review_count 
FROM movies m 
LEFT JOIN critic_reviews cr ON m.id = cr.movie_id 
WHERE m.title IN ('파묘', '기생충', '아마추어', '탑건: 매버릭', '범죄도시4', '서울의 봄', '범죄도시3', '올드보이', '부산행', '극한직업')
GROUP BY m.title, m.id
ORDER BY m.title;
