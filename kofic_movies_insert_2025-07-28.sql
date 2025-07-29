-- KOFIC 한국 영화 데이터 INSERT 스크립트
-- 생성일: 2025. 7. 28. 오후 9:19:00
-- 총 영화 수: 21개

-- 중복 방지를 위해 기존 데이터 확인 후 삽입하는 함수
DO $$
DECLARE
    movie_exists BOOLEAN;
BEGIN

    -- 1. 전지적 독자 시점
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '전지적 독자 시점' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '전지적 독자 시점',
    'Omniscient Reader',
    '김병우',
    ARRAY['안효섭', '이민호', '채수빈', '신승호', '나나', '지수', '권은성'],
    'Fantasy',
    2025,
    116,
    '한국',
    NULL,
    '판타지, 액션 영화. 김병우 감독 작품. 안효섭, 이민호, 채수빈 주연.',
    ARRAY['전지적 독자 시점', 'Omniscient Reader', '김병우', '안효섭', '이민호', '채수빈', '신승호', '나나', '판타지', '액션'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 전지적 독자 시점';
    ELSE
        RAISE NOTICE 'Skipped (exists): 전지적 독자 시점';
    END IF;

    -- 2. 킹 오브 킹스
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '킹 오브 킹스' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '킹 오브 킹스',
    'The King of Kings',
    '장성호',
    ARRAY['이병헌', '진선규', '이하늬', '양동근', '차인표', '권오중', '장광', '피어스 브로스넌', '오스카 아이삭', '케네스 브래너'],
    'Animation',
    2025,
    100,
    '한국',
    NULL,
    '애니메이션 영화. 장성호 감독 작품. 이병헌, 진선규, 이하늬 주연.',
    ARRAY['킹 오브 킹스', 'The King of Kings', '장성호', '이병헌', '진선규', '이하늬', '양동근', '차인표', '애니메이션'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 킹 오브 킹스';
    ELSE
        RAISE NOTICE 'Skipped (exists): 킹 오브 킹스';
    END IF;

    -- 3. 노이즈
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '노이즈' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '노이즈',
    'Noise',
    '김수진',
    ARRAY['이선빈', '김민석', '한수아', '류경수', '전익령', '백주희', '안석현', '이은미'],
    'Horror',
    2025,
    93,
    '한국',
    NULL,
    '공포(호러), 스릴러 영화. 김수진 감독 작품. 이선빈, 김민석, 한수아 주연.',
    ARRAY['노이즈', 'Noise', '김수진', '이선빈', '김민석', '한수아', '류경수', '전익령', '공포(호러)', '스릴러'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 노이즈';
    ELSE
        RAISE NOTICE 'Skipped (exists): 노이즈';
    END IF;

    -- 4. 베베핀 극장판: 사라진 베베핀과 핑크퐁 대모험
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '베베핀 극장판: 사라진 베베핀과 핑크퐁 대모험' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '베베핀 극장판: 사라진 베베핀과 핑크퐁 대모험',
    'Bebefinn Sing-Along Movie: Into the Pinkfong World',
    '변희선',
    ARRAY['조경이', '엠머슨브룩김', '이현경', '김해나', '강은애'],
    'Animation',
    2025,
    64,
    '한국',
    NULL,
    '애니메이션 영화. 변희선 감독 작품. 조경이, 엠머슨브룩김, 이현경 주연.',
    ARRAY['베베핀 극장판: 사라진 베베핀과 핑크퐁 대모험', 'Bebefinn Sing-Along Movie: Into the Pinkfong World', '변희선', '조경이', '엠머슨브룩김', '이현경', '김해나', '강은애', '애니메이션'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 베베핀 극장판: 사라진 베베핀과 핑크퐁 대모험';
    ELSE
        RAISE NOTICE 'Skipped (exists): 베베핀 극장판: 사라진 베베핀과 핑크퐁 대모험';
    END IF;

    -- 5. 좀비딸
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '좀비딸' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '좀비딸',
    'My Daughter is a Zombie',
    '필감성',
    ARRAY['조정석', '이정은', '조여정', '윤경호', '최유리'],
    'Comedy',
    2025,
    113,
    '한국',
    NULL,
    '코미디, 드라마 영화. 필감성 감독 작품. 조정석, 이정은, 조여정 주연.',
    ARRAY['좀비딸', 'My Daughter is a Zombie', '필감성', '조정석', '이정은', '조여정', '윤경호', '최유리', '코미디', '드라마'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 좀비딸';
    ELSE
        RAISE NOTICE 'Skipped (exists): 좀비딸';
    END IF;

    -- 6. 대탈출 : 더 스토리 특별판
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '대탈출 : 더 스토리 특별판' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '대탈출 : 더 스토리 특별판',
    'The Great Escape : The Story',
    NULL,
    NULL,
    'Adventure',
    2025,
    121,
    '한국',
    NULL,
    '어드벤처, 미스터리, 스릴러 영화. ',
    ARRAY['대탈출 : 더 스토리 특별판', 'The Great Escape : The Story', '어드벤처', '미스터리', '스릴러'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 대탈출 : 더 스토리 특별판';
    ELSE
        RAISE NOTICE 'Skipped (exists): 대탈출 : 더 스토리 특별판';
    END IF;

    -- 7. 괴기열차
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '괴기열차' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '괴기열차',
    'Ghost Train',
    '탁세웅',
    ARRAY['주현영', '전배수', '최보민', '김상혁', '김상혁', '이아율'],
    'Horror',
    2025,
    94,
    '한국',
    NULL,
    '공포(호러) 영화. 탁세웅 감독 작품. 주현영, 전배수, 최보민 주연.',
    ARRAY['괴기열차', 'Ghost Train', '탁세웅', '주현영', '전배수', '최보민', '김상혁', '김상혁', '공포(호러)'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 괴기열차';
    ELSE
        RAISE NOTICE 'Skipped (exists): 괴기열차';
    END IF;

    -- 8. 커미션
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '커미션' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '커미션',
    'Commission',
    '신재민',
    ARRAY['김현수', '김용지', '김진우'],
    'Mystery',
    2025,
    112,
    '한국',
    NULL,
    '미스터리, 스릴러 영화. 신재민 감독 작품. 김현수, 김용지, 김진우 주연.',
    ARRAY['커미션', 'Commission', '신재민', '김현수', '김용지', '김진우', '미스터리', '스릴러'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 커미션';
    ELSE
        RAISE NOTICE 'Skipped (exists): 커미션';
    END IF;

    -- 9. 신명
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '신명' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '신명',
    'The Pact',
    NULL,
    ARRAY['김규리', '안내상', '동방우', '박지서', '이주미'],
    'Drama',
    2025,
    117,
    '한국',
    NULL,
    '드라마, 미스터리 영화. 김규리, 안내상, 동방우 주연.',
    ARRAY['신명', 'The Pact', '김규리', '안내상', '동방우', '박지서', '이주미', '드라마', '미스터리'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 신명';
    ELSE
        RAISE NOTICE 'Skipped (exists): 신명';
    END IF;

    -- 10. 무명 無名
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '무명 無名' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '무명 無名',
    'Nameless',
    '유진주',
    ARRAY['하정우', '김중희'],
    'Documentary',
    2025,
    89,
    '한국',
    NULL,
    '다큐멘터리 영화. 유진주 감독 작품. 하정우, 김중희 주연.',
    ARRAY['무명 無名', 'Nameless', '유진주', '하정우', '김중희', '다큐멘터리'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 무명 無名';
    ELSE
        RAISE NOTICE 'Skipped (exists): 무명 無名';
    END IF;

    -- 11. 세븐틴 월드 투어 '비 더 선'
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '세븐틴 월드 투어 ''비 더 선''' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '세븐틴 월드 투어 ''비 더 선''',
    'SEVENTEEN WORLD TOUR [BE THE SUN]',
    NULL,
    NULL,
    'Drama',
    2025,
    80,
    '한국',
    NULL,
    '공연 영화. ',
    ARRAY['세븐틴 월드 투어 ''비 더 선''', 'SEVENTEEN WORLD TOUR [BE THE SUN]', '공연'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 세븐틴 월드 투어 '비 더 선'';
    ELSE
        RAISE NOTICE 'Skipped (exists): 세븐틴 월드 투어 '비 더 선'';
    END IF;

    -- 12. 하이파이브
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '하이파이브' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '하이파이브',
    'HI-FIVE',
    '강형철',
    ARRAY['이재인', '안재홍', '유아인', '라미란', '김희원', '김수혁', '오정세', '신구', '박진영', '진희경'],
    'Comedy',
    2025,
    119,
    '한국',
    NULL,
    '코미디, 액션 영화. 강형철 감독 작품. 이재인, 안재홍, 유아인 주연.',
    ARRAY['하이파이브', 'HI-FIVE', '강형철', '이재인', '안재홍', '유아인', '라미란', '김희원', '코미디', '액션'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 하이파이브';
    ELSE
        RAISE NOTICE 'Skipped (exists): 하이파이브';
    END IF;

    -- 13. 파묘지관
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '파묘지관' 
        AND (release_year = NULL OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '파묘지관',
    'Tomb Making Notes',
    NULL,
    NULL,
    'Action',
    NULL,
    75,
    '한국',
    NULL,
    '액션, 판타지 영화. ',
    ARRAY['파묘지관', 'Tomb Making Notes', '액션', '판타지'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 파묘지관';
    ELSE
        RAISE NOTICE 'Skipped (exists): 파묘지관';
    END IF;

    -- 14. 제 2회 서울문화고 문화영상제 1학년 작품
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '제 2회 서울문화고 문화영상제 1학년 작품' 
        AND (release_year = NULL OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '제 2회 서울문화고 문화영상제 1학년 작품',
    NULL,
    NULL,
    NULL,
    'Drama',
    NULL,
    NULL,
    '한국',
    NULL,
    '기타 영화. ',
    ARRAY['제 2회 서울문화고 문화영상제 1학년 작품', '기타'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 제 2회 서울문화고 문화영상제 1학년 작품';
    ELSE
        RAISE NOTICE 'Skipped (exists): 제 2회 서울문화고 문화영상제 1학년 작품';
    END IF;

    -- 15. 서울의 봄
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '서울의 봄' 
        AND (release_year = 2023 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '서울의 봄',
    '12.12: THE DAY',
    '김성수',
    ARRAY['황정민', '정우성', '이성민', '박해준', '김성균', '김의성', '정동환', '안내상', '유성주', '최병모'],
    'Drama',
    2023,
    141,
    '한국',
    NULL,
    '드라마 영화. 김성수 감독 작품. 황정민, 정우성, 이성민 주연.',
    ARRAY['서울의 봄', '12.12: THE DAY', '김성수', '황정민', '정우성', '이성민', '박해준', '김성균', '드라마'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 서울의 봄';
    ELSE
        RAISE NOTICE 'Skipped (exists): 서울의 봄';
    END IF;

    -- 16. 콘크리트 유토피아
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '콘크리트 유토피아' 
        AND (release_year = 2023 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '콘크리트 유토피아',
    'Concrete Utopia',
    '엄태화',
    ARRAY['이병헌', '박서준', '박보영', '김선영', '김도윤', '박지후', '김학선', '공민정', '엄태구', '정영기'],
    'Drama',
    2023,
    129,
    '한국',
    NULL,
    '드라마, 기타 영화. 엄태화 감독 작품. 이병헌, 박서준, 박보영 주연.',
    ARRAY['콘크리트 유토피아', 'Concrete Utopia', '엄태화', '이병헌', '박서준', '박보영', '김선영', '김도윤', '드라마', '기타'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 콘크리트 유토피아';
    ELSE
        RAISE NOTICE 'Skipped (exists): 콘크리트 유토피아';
    END IF;

    -- 17. 잠 든 누나는 내 휴지 도둑
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '잠 든 누나는 내 휴지 도둑' 
        AND (release_year = 2025 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '잠 든 누나는 내 휴지 도둑',
    'NANANIWO TUKARETE',
    NULL,
    NULL,
    'Drama',
    2025,
    61,
    '한국',
    NULL,
    '성인물(에로), 드라마, 멜로/로맨스 영화. ',
    ARRAY['잠 든 누나는 내 휴지 도둑', 'NANANIWO TUKARETE', '성인물(에로)', '드라마', '멜로/로맨스'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 잠 든 누나는 내 휴지 도둑';
    ELSE
        RAISE NOTICE 'Skipped (exists): 잠 든 누나는 내 휴지 도둑';
    END IF;

    -- 18. 기생충
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '기생충' 
        AND (release_year = 2019 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '기생충',
    'PARASITE',
    '봉준호',
    ARRAY['송강호', '이선균', '조여정', '최우식', '박소담', '이정은', '장혜진', '박명훈', '정지소', '정현준'],
    'Drama',
    2019,
    131,
    '한국',
    NULL,
    '드라마 영화. 봉준호 감독 작품. 송강호, 이선균, 조여정 주연.',
    ARRAY['기생충', 'PARASITE', '봉준호', '송강호', '이선균', '조여정', '최우식', '박소담', '드라마'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 기생충';
    ELSE
        RAISE NOTICE 'Skipped (exists): 기생충';
    END IF;

    -- 19. 미나리
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '미나리' 
        AND (release_year = 2021 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '미나리',
    'Minari',
    '정이삭',
    ARRAY['스티븐 연', '한예리', '윤여정', '앨런 김', '노엘 조', '윌 패튼'],
    'Drama',
    2021,
    115,
    '한국',
    NULL,
    '드라마 영화. 정이삭 감독 작품. 스티븐 연, 한예리, 윤여정 주연.',
    ARRAY['미나리', 'Minari', '정이삭', '스티븐 연', '한예리', '윤여정', '앨런 김', '노엘 조', '드라마'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 미나리';
    ELSE
        RAISE NOTICE 'Skipped (exists): 미나리';
    END IF;

    -- 20. 여성감독네트워크 WDN x 인디스페이스 상반기 기획전: 비연대기적 여성의 움직임 단편 3
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '여성감독네트워크 WDN x 인디스페이스 상반기 기획전: 비연대기적 여성의 움직임 단편 3' 
        AND (release_year = NULL OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '여성감독네트워크 WDN x 인디스페이스 상반기 기획전: 비연대기적 여성의 움직임 단편 3',
    NULL,
    NULL,
    NULL,
    'Drama',
    NULL,
    NULL,
    '한국',
    NULL,
    '드라마 영화. ',
    ARRAY['여성감독네트워크 WDN x 인디스페이스 상반기 기획전: 비연대기적 여성의 움직임 단편 3', '드라마'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 여성감독네트워크 WDN x 인디스페이스 상반기 기획전: 비연대기적 여성의 움직임 단편 3';
    ELSE
        RAISE NOTICE 'Skipped (exists): 여성감독네트워크 WDN x 인디스페이스 상반기 기획전: 비연대기적 여성의 움직임 단편 3';
    END IF;

    -- 21. 모가디슈
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = '모가디슈' 
        AND (release_year = 2021 OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    '모가디슈',
    'Escape from Mogadishu',
    '류승완',
    ARRAY['김윤석', '조인성', '허준호', '구교환', '김소진', '정만식', '김재화', '박경혜', '박명신', '한철우'],
    'Action',
    2021,
    121,
    '한국',
    NULL,
    '액션, 드라마 영화. 류승완 감독 작품. 김윤석, 조인성, 허준호 주연.',
    ARRAY['모가디슈', 'Escape from Mogadishu', '류승완', '김윤석', '조인성', '허준호', '구교환', '김소진', '액션', '드라마'],
    NULL,
    NULL,
    NOW(),
    NOW()
);
        RAISE NOTICE 'Inserted: 모가디슈';
    ELSE
        RAISE NOTICE 'Skipped (exists): 모가디슈';
    END IF;

END $$;

-- 삽입 결과 확인
SELECT 
    COUNT(*) as total_movies,
    COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as inserted_today
FROM movies;

-- 최근 삽입된 영화 목록 (오늘 날짜)
SELECT title, director, genre, release_year, created_at
FROM movies 
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
