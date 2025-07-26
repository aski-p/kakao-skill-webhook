-- 영화 데이터베이스 INSERT 문
-- 생성일시: 2025. 7. 26. 오전 2:27:10
-- 총 영화 수: 3개
-- 데이터 소스: 네이버 영화 API

-- movies 테이블이 없는 경우 생성
CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_english VARCHAR(255),
    director VARCHAR(255),
    cast TEXT,
    genre VARCHAR(100),
    release_year INTEGER,
    release_date DATE,
    running_time INTEGER,
    rating VARCHAR(20),
    country VARCHAR(100),
    production_company VARCHAR(255),
    plot_summary TEXT,
    poster_image TEXT,
    naver_rating DECIMAL(3,1),
    critic_score DECIMAL(3,1),
    audience_score DECIMAL(3,1),
    data_source VARCHAR(50) DEFAULT 'naver_api',
    naver_link TEXT,
    kofic_movie_code VARCHAR(20),
    box_office_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 영화 데이터 INSERT
BEGIN;

-- 1. 영화 데이터
INSERT INTO movies (title, title_english, director, cast, genre, release_year, release_date, running_time, rating, country, production_company, plot_summary, poster_image, naver_rating, critic_score, audience_score, data_source, naver_link, created_at, updated_at) VALUES ('기생충', 'Parasite', '봉준호', '송강호, 이선균, 조여정, 최우식, 박소담', '드라마', 2019, NULL, NULL, NULL, '한국', NULL, '기생충 - 감독: 봉준호, 출연: 송강호, 이선균, 조여정', NULL, 8.5, NULL, 8.5, 'sample_data', NULL, '2025-07-25T17:27:10.603Z', '2025-07-25T17:27:10.603Z');

-- 2. 영화 데이터
INSERT INTO movies (title, title_english, director, cast, genre, release_year, release_date, running_time, rating, country, production_company, plot_summary, poster_image, naver_rating, critic_score, audience_score, data_source, naver_link, created_at, updated_at) VALUES ('어벤져스: 엔드게임', 'Avengers: Endgame', '안소니 루소, 조 루소', '로버트 다우니 주니어, 크리스 에반스, 마크 러팔로', '액션', 2019, NULL, NULL, NULL, '미국', NULL, '어벤져스: 엔드게임 - 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스, 마크 러팔로', NULL, 9, NULL, 9, 'sample_data', NULL, '2025-07-25T17:27:10.603Z', '2025-07-25T17:27:10.603Z');

-- 3. 영화 데이터
INSERT INTO movies (title, title_english, director, cast, genre, release_year, release_date, running_time, rating, country, production_company, plot_summary, poster_image, naver_rating, critic_score, audience_score, data_source, naver_link, created_at, updated_at) VALUES ('탑건: 매버릭', 'Top Gun: Maverick', '조셉 코신스키', '톰 크루즈, 마일즈 텔러, 제니퍼 코넬리', '액션', 2022, NULL, NULL, NULL, '미국', NULL, '탑건: 매버릭 - 감독: 조셉 코신스키, 출연: 톰 크루즈, 마일즈 텔러, 제니퍼 코넬리', NULL, 8.7, NULL, 8.7, 'sample_data', NULL, '2025-07-25T17:27:10.603Z', '2025-07-25T17:27:10.603Z');

COMMIT;

-- INSERT 완료. 총 3개 영화 추가됨
