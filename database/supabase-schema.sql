-- 영화 데이터베이스 스키마 (Supabase)
-- 사용법: Supabase SQL 에디터에서 실행

-- 1. 영화 기본 정보 테이블
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    english_title VARCHAR(255),
    director VARCHAR(255),
    cast_members TEXT[], -- 배열로 저장
    genre VARCHAR(255),
    release_year INTEGER,
    runtime_minutes INTEGER,
    country VARCHAR(100),
    naver_rating DECIMAL(3,1), -- 8.2 형태
    description TEXT,
    keywords TEXT[], -- 검색 키워드 배열
    poster_url TEXT,
    naver_movie_id VARCHAR(50), -- 네이버 영화 고유 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스 및 제약조건
    UNIQUE(naver_movie_id),
    UNIQUE(title, release_year) -- 같은 제목이라도 연도가 다르면 허용
);

-- 2. 평론가 리뷰 테이블
CREATE TABLE critic_reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    critic_name VARCHAR(100) NOT NULL,
    score DECIMAL(3,1), -- 8.5 형태
    review_text TEXT NOT NULL,
    review_source VARCHAR(100), -- 출처 (씨네21, 매거진 등)
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 관객 리뷰 테이블
CREATE TABLE audience_reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    score DECIMAL(3,1), -- 8.7 형태
    review_text TEXT NOT NULL,
    review_source VARCHAR(100), -- 네이버영화, CGV 등
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 영화 박스오피스 정보 테이블 (선택사항)
CREATE TABLE box_office (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    ranking INTEGER,
    audience_count BIGINT,
    sales_amount BIGINT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_naver_id ON movies(naver_movie_id);
CREATE INDEX idx_movies_release_year ON movies(release_year);
CREATE INDEX idx_movies_keywords ON movies USING GIN(keywords);
CREATE INDEX idx_critic_reviews_movie_id ON critic_reviews(movie_id);
CREATE INDEX idx_audience_reviews_movie_id ON audience_reviews(movie_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 설정 (보안)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE critic_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_office ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Public movies are viewable by everyone" ON movies
    FOR SELECT USING (true);

CREATE POLICY "Public critic reviews are viewable by everyone" ON critic_reviews
    FOR SELECT USING (true);

CREATE POLICY "Public audience reviews are viewable by everyone" ON audience_reviews
    FOR SELECT USING (true);

-- 쓰기 권한 정책 (서비스 키로만 쓰기 가능)
CREATE POLICY "Only service can insert movies" ON movies
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service can update movies" ON movies
    FOR UPDATE USING (auth.role() = 'service_role');

-- 초기 데이터 삽입 (기존 영화들)
INSERT INTO movies (
    title, english_title, director, cast_members, genre, release_year, 
    runtime_minutes, country, naver_rating, description, keywords
) VALUES 
(
    'F1 더 무비', 'F1', '조제프 코신스키', 
    ARRAY['브래드 피트', '데미안 비칠', '케리 콘던', '하비에르 바르뎀', '토비아스 멘지스', '사라 니레스'],
    '액션, 스포츠, 드라마', 2024, 150, '미국', 8.1,
    '경험 많은 F1 드라이버가 젊은 팀메이트와 함께 마지막 시즌에 도전하는 이야기',
    ARRAY['f1', '더무비', '더 무비', '브래드피트', '브래드 피트', '조제프코신스키', '조제프 코신스키', 'formula1', 'formula 1']
),
(
    '친절한 금자씨', 'Lady Vengeance', '박찬욱',
    ARRAY['이영애', '최민식', '강혜정', '김시후', '남일우'],
    '스릴러, 드라마', 2005, 115, '한국', 8.2,
    '13년간 복수를 계획해온 여인 금자의 치밀하고 아름다운 복수극',
    ARRAY['친절한금자씨', '친절한 금자씨', '금자씨', '박찬욱', '이영애', '최민식', '복수삼부작', 'lady vengeance']
),
(
    '기생충', 'Parasite', '봉준호',
    ARRAY['송강호', '이선균', '조여정', '최우식', '박소담'],
    '코미디, 스릴러, 드라마', 2019, 132, '한국', 8.9,
    '전 세계를 충격에 빠뜨린 봉준호 감독의 사회 풍자 걸작',
    ARRAY['기생충', 'parasite', '봉준호', '송강호', '이선균', '조여정', '최우식', '박소담', '아카데미']
),
(
    '탑건: 매버릭', 'Top Gun: Maverick', '조제프 코신스키',
    ARRAY['톰 크루즈', '마일즈 텔러', '제니퍼 코넬리', '존 햄', '글렌 파월'],
    '액션, 드라마', 2022, 131, '미국', 8.7,
    '전설적인 파일럿 매버릭의 귀환과 새로운 도전',
    ARRAY['탑건', 'topgun', 'top gun', '매버릭', 'maverick', '톰크루즈', '톰 크루즈', '조제프코신스키']
);

-- 평론가 리뷰 초기 데이터
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text) VALUES
-- 친절한 금자씨 리뷰
(2, '이동진', 8.5, '박찬욱 감독의 복수 삼부작 완결편. 시각적 완성도와 서사의 깊이가 인상적이다.'),
(2, '김혜리', 8.3, '이영애의 카리스마틱한 연기와 박찬욱 특유의 미학이 조화를 이룬 걸작.'),
(2, '허지웅', 8.0, '복수라는 원초적 감정을 예술로 승화시킨 박찬욱의 역작.'),

-- 기생충 리뷰
(3, '이동진', 9.2, '봉준호 감독이 만들어낸 완벽한 사회 우화. 모든 장면이 의미로 가득하다.'),
(3, '김혜리', 9.0, '계급사회의 모순을 예리하게 파헤친 현대적 걸작. 연출과 연기 모두 완벽.'),
(3, '허지웅', 8.8, '한국 영화의 위상을 전 세계에 알린 역사적 작품. 봉준호의 연출력이 정점에 달했다.');

-- 관객 리뷰 초기 데이터
INSERT INTO audience_reviews (movie_id, username, score, review_text) VALUES
-- 친절한 금자씨 관객 리뷰
(2, 'movie_fanatic', 9.0, '이영애 연기 정말 대단해요. 복수극의 완성판!'),
(2, 'park_chanwook_fan', 8.8, '박찬욱 감독의 연출력이 빛나는 작품. 시각적으로도 완벽!'),
(2, 'korean_cinema', 8.5, '한국 영화의 수준을 보여주는 명작. 강력 추천합니다.'),
(2, 'thriller_lover', 8.7, '스릴러 장르의 최고봉. 몰입도가 장난 아니에요!'),

-- 기생충 관객 리뷰
(3, 'korean_pride', 9.5, '한국 영화 역사상 최고의 작품! 아카데미 수상이 당연해요.'),
(3, 'bong_joonho_fan', 9.3, '봉준호 감독님 천재! 사회비판이 이렇게 재미있을 수가!'),
(3, 'movie_critic88', 8.9, '계급갈등을 이렇게 깔끔하게 담아낼 수 있다니. 정말 대단!'),
(3, 'cinema_lover', 9.1, '몇 번을 봐도 새로운 의미를 발견하게 되는 영화. 명작 중의 명작!');

-- 조회용 뷰 생성 (편의성)
CREATE VIEW movie_details AS
SELECT 
    m.*,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'critic_name', cr.critic_name,
                'score', cr.score,
                'review_text', cr.review_text
            )
        ) FILTER (WHERE cr.id IS NOT NULL), 
        '[]'::json
    ) as critic_reviews,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'username', ar.username,
                'score', ar.score,
                'review_text', ar.review_text
            )
        ) FILTER (WHERE ar.id IS NOT NULL),
        '[]'::json
    ) as audience_reviews
FROM movies m
LEFT JOIN critic_reviews cr ON m.id = cr.movie_id
LEFT JOIN audience_reviews ar ON m.id = ar.movie_id
GROUP BY m.id;

-- 사용 예시 주석
/*
-- 영화 검색 예시
SELECT * FROM movie_details WHERE title ILIKE '%친절한%';

-- 키워드로 검색
SELECT * FROM movies WHERE keywords && ARRAY['기생충', '봉준호'];

-- 평점 높은 순으로 정렬
SELECT title, naver_rating FROM movies ORDER BY naver_rating DESC;

-- 특정 영화의 모든 리뷰
SELECT 
    m.title,
    'critic' as review_type,
    cr.critic_name as reviewer,
    cr.score,
    cr.review_text
FROM movies m
JOIN critic_reviews cr ON m.id = cr.movie_id
WHERE m.title = '기생충'
UNION ALL
SELECT 
    m.title,
    'audience' as review_type,
    ar.username as reviewer,
    ar.score,
    ar.review_text
FROM movies m
JOIN audience_reviews ar ON m.id = ar.movie_id
WHERE m.title = '기생충';
*/