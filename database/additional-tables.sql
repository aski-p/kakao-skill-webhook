-- 영화 평점 데이터 테이블
CREATE TABLE IF NOT EXISTS movie_ratings (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    naver_rating DECIMAL(3,1), -- 네이버 영화 평점 (0.0 ~ 10.0)
    critic_rating DECIMAL(3,1), -- 평론가 평점
    audience_rating DECIMAL(3,1), -- 관객 평점
    rating_count INTEGER DEFAULT 0, -- 평점 참여 수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id)
);

-- 영화 리뷰 데이터 테이블
CREATE TABLE IF NOT EXISTS movie_reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(100), -- 리뷰어 이름
    review_text TEXT, -- 리뷰 내용
    rating INTEGER CHECK (rating >= 1 AND rating <= 10), -- 개별 평점 (1-10)
    review_type VARCHAR(20) DEFAULT 'audience', -- 'critic' 또는 'audience'
    platform VARCHAR(20) DEFAULT 'naver', -- 'naver', 'cgv', 'watcha' 등
    helpful_count INTEGER DEFAULT 0, -- 도움 수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 박스오피스 데이터 테이블 (영화진흥위원회 데이터)
CREATE TABLE IF NOT EXISTS box_office (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    rank_date DATE, -- 순위 기준 날짜
    daily_rank INTEGER, -- 일일 순위
    weekly_rank INTEGER, -- 주간 순위
    monthly_rank INTEGER, -- 월간 순위
    audience_count INTEGER DEFAULT 0, -- 관객 수
    sales_amount BIGINT DEFAULT 0, -- 매출액 (원)
    screen_count INTEGER DEFAULT 0, -- 상영관 수
    show_count INTEGER DEFAULT 0, -- 상영 횟수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_movie_ratings_movie_id ON movie_ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_reviews_movie_id ON movie_reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_reviews_platform ON movie_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_movie_reviews_type ON movie_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_box_office_movie_id ON box_office(movie_id);
CREATE INDEX IF NOT EXISTS idx_box_office_rank_date ON box_office(rank_date);
CREATE INDEX IF NOT EXISTS idx_box_office_daily_rank ON box_office(daily_rank);

-- 기본 데이터 확인용 뷰
CREATE OR REPLACE VIEW movie_summary AS
SELECT 
    m.id,
    m.title,
    m.director,
    m.release_year,
    m.data_source,
    mr.naver_rating,
    mr.audience_rating,
    COALESCE(review_stats.review_count, 0) as review_count,
    COALESCE(review_stats.avg_review_rating, 0) as avg_review_rating
FROM movies m
LEFT JOIN movie_ratings mr ON m.id = mr.movie_id
LEFT JOIN (
    SELECT 
        movie_id,
        COUNT(*) as review_count,
        AVG(rating::DECIMAL) as avg_review_rating
    FROM movie_reviews 
    GROUP BY movie_id
) review_stats ON m.id = review_stats.movie_id
ORDER BY m.created_at DESC;