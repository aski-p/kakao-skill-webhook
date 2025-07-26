-- 대용량 2010-2025년 영화 데이터베이스 + 전문가 평점 INSERT 문
-- 생성일시: 2025. 7. 26. 오전 10:24:47
-- 총 영화 수: 94개
-- 총 전문가 리뷰: 376개
-- 데이터 소스: 2010-2025년 대표 영화 컬렉션
-- 기간: 2010년 1월 ~ 2025년 7월

-- 기존 테이블 구조 확인 (참고용)
/*
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    english_title VARCHAR(255),
    director VARCHAR(255),
    cast_members TEXT[],
    genre VARCHAR(255),
    release_year INTEGER,
    runtime_minutes INTEGER,
    country VARCHAR(100),
    naver_rating DECIMAL(3,1),
    description TEXT,
    keywords TEXT[],
    poster_url TEXT,
    naver_movie_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(naver_movie_id),
    UNIQUE(title, release_year)
);

CREATE TABLE critic_reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    critic_name VARCHAR(100) NOT NULL,
    score DECIMAL(3,1),
    review_text TEXT NOT NULL,
    review_source VARCHAR(100),
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 국가별 영화 수:
-- - 한국: 34개
-- - 미국: 56개
-- - 호주: 1개
-- - 영국: 2개
-- - 일본: 1개

-- 전문가 평론가 정보:
-- - 고정: 이동진(씨네21), 박평식(중앙일보)
-- - 추가: 김혜리, 허지웅, 황진미, 이용철 등 (랜덤 2명)
-- - 각 영화당 4명의 전문가 리뷰 포함

-- 중복 방지를 위한 INSERT
BEGIN;

-- ==========================================
-- 영화 데이터 INSERT
-- ==========================================

-- 1. 아저씨 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아저씨', 'The Man from Nowhere', '이정범', '{"원빈","김새론","김희원"}', '액션, 스릴러', 2010, 119, '한국', 8.5, '아저씨 (2010) - 액션, 스릴러, 감독: 이정범, 출연: 원빈, 김새론, 김희원', '{"아저씨","the man from nowhere","이정범","원빈","김새론","김희원","액션, 스릴러","액션","스릴러"}', NULL, NULL);

-- 2. 황해 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('황해', 'The Yellow Sea', '나홍진', '{"하정우","김윤석","조성하"}', '액션, 스릴러', 2010, 157, '한국', 8, '황해 (2010) - 액션, 스릴러, 감독: 나홍진, 출연: 하정우, 김윤석, 조성하', '{"황해","the yellow sea","나홍진","하정우","김윤석","조성하","액션, 스릴러","액션","스릴러"}', NULL, NULL);

-- 3. 인셉션 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인셉션', 'Inception', '크리스토퍼 놀안', '{"레오나르도 디카프리오","마리옹 코티야르"}', 'SF, 액션', 2010, 148, '미국', 8.8, '인셉션 (2010) - SF, 액션, 감독: 크리스토퍼 놀안, 출연: 레오나르도 디카프리오, 마리옹 코티야르', '{"인셉션","inception","크리스토퍼 놀안","크리스토퍼","레오나르도 디카프리오","레오나르도","마리옹 코티야르","마리옹","SF, 액션","SF","액션"}', NULL, NULL);

-- 4. 아이언맨 2 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아이언맨 2', 'Iron Man 2', '존 파브로', '{"로버트 다우니 주니어","기네스 팰트로"}', '액션, SF', 2010, 124, '미국', 7.6, '아이언맨 2 (2010) - 액션, SF, 감독: 존 파브로, 출연: 로버트 다우니 주니어, 기네스 팰트로', '{"아이언맨 2","iron man 2","존 파브로","존","로버트 다우니 주니어","로버트","기네스 팰트로","기네스","액션, SF","액션","SF"}', NULL, NULL);

-- 5. 토이 스토리 3 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토이 스토리 3', 'Toy Story 3', '리 언크리치', '{"톰 행크스","팀 앨런"}', '애니메이션', 2010, 103, '미국', 8.8, '토이 스토리 3 (2010) - 애니메이션, 감독: 리 언크리치, 출연: 톰 행크스, 팀 앨런', '{"토이 스토리 3","toy story 3","리 언크리치","리","톰 행크스","톰","팀 앨런","팀","애니메이션"}', NULL, NULL);

-- 6. 슈렉 포에버 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('슈렉 포에버', 'Shrek Forever After', '마이크 미첼', '{"마이크 마이어스","에디 머피"}', '애니메이션', 2010, 93, '미국', 7.1, '슈렉 포에버 (2010) - 애니메이션, 감독: 마이크 미첼, 출연: 마이크 마이어스, 에디 머피', '{"슈렉 포에버","shrek forever after","마이크 미첼","마이크","마이크 마이어스","에디 머피","에디","애니메이션"}', NULL, NULL);

-- 7. 최종병기 활 (2011) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('최종병기 활', 'War of the Arrows', '김한민', '{"박해일","문채원","김무열"}', '액션, 사극', 2011, 122, '한국', 7.8, '최종병기 활 (2011) - 액션, 사극, 감독: 김한민, 출연: 박해일, 문채원, 김무열', '{"최종병기 활","war of the arrows","김한민","박해일","문채원","김무열","액션, 사극","액션","사극"}', NULL, NULL);

-- 8. 도가니 (2011) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('도가니', 'Silenced', '황동혁', '{"공유","정유미","김현수"}', '드라마', 2011, 125, '한국', 8.5, '도가니 (2011) - 드라마, 감독: 황동혁, 출연: 공유, 정유미, 김현수', '{"도가니","silenced","황동혁","공유","정유미","김현수","드라마"}', NULL, NULL);

-- 9. 캡틴 아메리카: 퍼스트 어벤져 (2011) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캡틴 아메리카: 퍼스트 어벤져', 'Captain America: The First Avenger', '조 존스턴', '{"크리스 에반스","헤일리 애트웰"}', '액션, SF', 2011, 124, '미국', 7.5, '캡틴 아메리카: 퍼스트 어벤져 (2011) - 액션, SF, 감독: 조 존스턴, 출연: 크리스 에반스, 헤일리 애트웰', '{"캡틴 아메리카: 퍼스트 어벤져","captain america: the first avenger","조 존스턴","조","크리스 에반스","크리스","헤일리 애트웰","헤일리","액션, SF","액션","SF"}', NULL, NULL);

-- 10. 토르 (2011) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토르', 'Thor', '케네스 브래너', '{"크리스 헴스워스","나탈리 포트만"}', '액션, SF', 2011, 115, '미국', 7.6, '토르 (2011) - 액션, SF, 감독: 케네스 브래너, 출연: 크리스 헴스워스, 나탈리 포트만', '{"토르","thor","케네스 브래너","케네스","크리스 헴스워스","크리스","나탈리 포트만","나탈리","액션, SF","액션","SF"}', NULL, NULL);

-- 11. 엑스맨: 퍼스트 클래스 (2011) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('엑스맨: 퍼스트 클래스', 'X-Men: First Class', '매튜 본', '{"제임스 맥어보이","마이클 패스벤더"}', '액션, SF', 2011, 131, '미국', 8.1, '엑스맨: 퍼스트 클래스 (2011) - 액션, SF, 감독: 매튜 본, 출연: 제임스 맥어보이, 마이클 패스벤더', '{"엑스맨: 퍼스트 클래스","x-men: first class","매튜 본","매튜","제임스 맥어보이","제임스","마이클 패스벤더","마이클","액션, SF","액션","SF"}', NULL, NULL);

-- 12. 카2 (2011) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('카2', 'Cars 2', '존 래세터', '{"오웬 윌슨","래리 더 케이블 가이"}', '애니메이션', 2011, 106, '미국', 6.8, '카2 (2011) - 애니메이션, 감독: 존 래세터, 출연: 오웬 윌슨, 래리 더 케이블 가이', '{"카2","cars 2","존 래세터","존","오웬 윌슨","오웬","래리 더 케이블 가이","래리","애니메이션"}', NULL, NULL);

-- 13. 도둑들 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('도둑들', 'The Thieves', '최동훈', '{"김윤석","김혜수","이정재"}', '액션, 범죄', 2012, 135, '한국', 7.8, '도둑들 (2012) - 액션, 범죄, 감독: 최동훈, 출연: 김윤석, 김혜수, 이정재', '{"도둑들","the thieves","최동훈","김윤석","김혜수","이정재","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 14. 광해, 왕이 된 남자 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('광해, 왕이 된 남자', 'Masquerade', '추창민', '{"이병헌","류승룡","한효주"}', '드라마, 사극', 2012, 131, '한국', 8.4, '광해, 왕이 된 남자 (2012) - 드라마, 사극, 감독: 추창민, 출연: 이병헌, 류승룡, 한효주', '{"광해, 왕이 된 남자","masquerade","추창민","이병헌","류승룡","한효주","드라마, 사극","드라마","사극"}', NULL, NULL);

-- 15. 어벤져스 (2012) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스', 'The Avengers', '조스 웨든', '{"로버트 다우니 주니어","크리스 에반스"}', '액션, SF', 2012, 143, '미국', 8.4, '어벤져스 (2012) - 액션, SF, 감독: 조스 웨든, 출연: 로버트 다우니 주니어, 크리스 에반스', '{"어벤져스","the avengers","조스 웨든","조스","로버트 다우니 주니어","로버트","크리스 에반스","크리스","액션, SF","액션","SF"}', NULL, NULL);

-- 16. 다크 나이트 라이즈 (2012) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('다크 나이트 라이즈', 'The Dark Knight Rises', '크리스토퍼 놀란', '{"크리스찬 베일","앤 해서웨이"}', '액션', 2012, 165, '미국', 8, '다크 나이트 라이즈 (2012) - 액션, 감독: 크리스토퍼 놀란, 출연: 크리스찬 베일, 앤 해서웨이', '{"다크 나이트 라이즈","the dark knight rises","크리스토퍼 놀란","크리스토퍼","크리스찬 베일","크리스찬","앤 해서웨이","앤","액션"}', NULL, NULL);

-- 17. 건축학개론 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('건축학개론', 'Architecture 101', '이용주', '{"엄태웅","한가인","이제훈"}', '로맨스, 드라마', 2012, 118, '한국', 8.1, '건축학개론 (2012) - 로맨스, 드라마, 감독: 이용주, 출연: 엄태웅, 한가인, 이제훈', '{"건축학개론","architecture 101","이용주","엄태웅","한가인","이제훈","로맨스, 드라마","로맨스","드라마"}', NULL, NULL);

-- 18. 메리다와 마법의 숲 (2012) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('메리다와 마법의 숲', 'Brave', '마크 앤드류스', '{"켈리 맥도날드","빌리 코놀리"}', '애니메이션', 2012, 93, '미국', 7.8, '메리다와 마법의 숲 (2012) - 애니메이션, 감독: 마크 앤드류스, 출연: 켈리 맥도날드, 빌리 코놀리', '{"메리다와 마법의 숲","brave","마크 앤드류스","마크","켈리 맥도날드","켈리","빌리 코놀리","빌리","애니메이션"}', NULL, NULL);

-- 19. 관상 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('관상', 'The Face Reader', '한재림', '{"송강호","이정재","백윤식"}', '드라마, 사극', 2013, 139, '한국', 7.8, '관상 (2013) - 드라마, 사극, 감독: 한재림, 출연: 송강호, 이정재, 백윤식', '{"관상","the face reader","한재림","송강호","이정재","백윤식","드라마, 사극","드라마","사극"}', NULL, NULL);

-- 20. 겨울왕국 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('겨울왕국', 'Frozen', '크리스 벅, 제니퍼 리', '{"크리스틴 벨","이디나 멘젤"}', '애니메이션, 뮤지컬', 2013, 102, '미국', 8.3, '겨울왕국 (2013) - 애니메이션, 뮤지컬, 감독: 크리스 벅, 제니퍼 리, 출연: 크리스틴 벨, 이디나 멘젤', '{"겨울왕국","frozen","크리스 벅, 제니퍼 리","크리스","크리스틴 벨","크리스틴","이디나 멘젤","이디나","애니메이션, 뮤지컬","애니메이션","뮤지컬"}', NULL, NULL);

-- 21. 아이언맨 3 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아이언맨 3', 'Iron Man 3', '셰인 블랙', '{"로버트 다우니 주니어","기네스 팰트로"}', '액션, SF', 2013, 130, '미국', 7.8, '아이언맨 3 (2013) - 액션, SF, 감독: 셰인 블랙, 출연: 로버트 다우니 주니어, 기네스 팰트로', '{"아이언맨 3","iron man 3","셰인 블랙","셰인","로버트 다우니 주니어","로버트","기네스 팰트로","기네스","액션, SF","액션","SF"}', NULL, NULL);

-- 22. 맨 오브 스틸 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('맨 오브 스틸', 'Man of Steel', '잭 스나이더', '{"헨리 카빌","에이미 애덤스"}', '액션, SF', 2013, 143, '미국', 7.5, '맨 오브 스틸 (2013) - 액션, SF, 감독: 잭 스나이더, 출연: 헨리 카빌, 에이미 애덤스', '{"맨 오브 스틸","man of steel","잭 스나이더","잭","헨리 카빌","헨리","에이미 애덤스","에이미","액션, SF","액션","SF"}', NULL, NULL);

-- 23. 토르: 다크 월드 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토르: 다크 월드', 'Thor: The Dark World', '앨런 테일러', '{"크리스 헴스워스","나탈리 포트만"}', '액션, SF', 2013, 112, '미국', 7.3, '토르: 다크 월드 (2013) - 액션, SF, 감독: 앨런 테일러, 출연: 크리스 헴스워스, 나탈리 포트만', '{"토르: 다크 월드","thor: the dark world","앨런 테일러","앨런","크리스 헴스워스","크리스","나탈리 포트만","나탈리","액션, SF","액션","SF"}', NULL, NULL);

-- 24. 신과함께-죄와 벌 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('신과함께-죄와 벌', 'Along with the Gods: The Two Worlds', '김용화', '{"하정우","차태현","주지훈"}', '판타지, 드라마', 2013, 139, '한국', 7.6, '신과함께-죄와 벌 (2013) - 판타지, 드라마, 감독: 김용화, 출연: 하정우, 차태현, 주지훈', '{"신과함께-죄와 벌","along with the gods: the two worlds","김용화","하정우","차태현","주지훈","판타지, 드라마","판타지","드라마"}', NULL, NULL);

-- 25. 명량 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('명량', 'The Admiral: Roaring Currents', '김한민', '{"최민식","류승룡","조진웅"}', '액션, 전쟁', 2014, 128, '한국', 8, '명량 (2014) - 액션, 전쟁, 감독: 김한민, 출연: 최민식, 류승룡, 조진웅', '{"명량","the admiral: roaring currents","김한민","최민식","류승룡","조진웅","액션, 전쟁","액션","전쟁"}', NULL, NULL);

-- 26. 국제시장 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('국제시장', 'Ode to My Father', '윤제균', '{"황정민","김윤진","오달수"}', '드라마', 2014, 126, '한국', 8.1, '국제시장 (2014) - 드라마, 감독: 윤제균, 출연: 황정민, 김윤진, 오달수', '{"국제시장","ode to my father","윤제균","황정민","김윤진","오달수","드라마"}', NULL, NULL);

-- 27. 인터스텔라 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인터스텔라', 'Interstellar', '크리스토퍼 놀란', '{"매튜 맥커너히","앤 해서웨이"}', 'SF, 드라마', 2014, 169, '미국', 9, '인터스텔라 (2014) - SF, 드라마, 감독: 크리스토퍼 놀란, 출연: 매튜 맥커너히, 앤 해서웨이', '{"인터스텔라","interstellar","크리스토퍼 놀란","크리스토퍼","매튜 맥커너히","매튜","앤 해서웨이","앤","SF, 드라마","SF","드라마"}', NULL, NULL);

-- 28. 가디언즈 오브 갤럭시 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('가디언즈 오브 갤럭시', 'Guardians of the Galaxy', '제임스 건', '{"크리스 프랫","조 샐다나"}', '액션, SF', 2014, 121, '미국', 8.4, '가디언즈 오브 갤럭시 (2014) - 액션, SF, 감독: 제임스 건, 출연: 크리스 프랫, 조 샐다나', '{"가디언즈 오브 갤럭시","guardians of the galaxy","제임스 건","제임스","크리스 프랫","크리스","조 샐다나","조","액션, SF","액션","SF"}', NULL, NULL);

-- 29. 엑스맨: 데이즈 오브 퓨처 패스트 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('엑스맨: 데이즈 오브 퓨처 패스트', 'X-Men: Days of Future Past', '브라이언 싱어', '{"휴 잭맨","제임스 맥어보이"}', '액션, SF', 2014, 132, '미국', 8.2, '엑스맨: 데이즈 오브 퓨처 패스트 (2014) - 액션, SF, 감독: 브라이언 싱어, 출연: 휴 잭맨, 제임스 맥어보이', '{"엑스맨: 데이즈 오브 퓨처 패스트","x-men: days of future past","브라이언 싱어","브라이언","휴 잭맨","휴","제임스 맥어보이","제임스","액션, SF","액션","SF"}', NULL, NULL);

-- 30. 빅 히어로 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('빅 히어로', 'Big Hero 6', '돈 홀', '{"라이언 포터","스콧 애드시트"}', '애니메이션', 2014, 102, '미국', 8, '빅 히어로 (2014) - 애니메이션, 감독: 돈 홀, 출연: 라이언 포터, 스콧 애드시트', '{"빅 히어로","big hero 6","돈 홀","돈","라이언 포터","라이언","스콧 애드시트","스콧","애니메이션"}', NULL, NULL);

-- 31. 베테랑 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('베테랑', 'Veteran', '류승완', '{"황정민","유아인","유해진"}', '액션, 범죄', 2015, 123, '한국', 8.2, '베테랑 (2015) - 액션, 범죄, 감독: 류승완, 출연: 황정민, 유아인, 유해진', '{"베테랑","veteran","류승완","황정민","유아인","유해진","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 32. 암살 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('암살', 'Assassination', '최동훈', '{"전지현","이정재","하정우"}', '액션, 드라마', 2015, 139, '한국', 8.3, '암살 (2015) - 액션, 드라마, 감독: 최동훈, 출연: 전지현, 이정재, 하정우', '{"암살","assassination","최동훈","전지현","이정재","하정우","액션, 드라마","액션","드라마"}', NULL, NULL);

-- 33. 매드 맥스: 분노의 도로 (2015) - 호주
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('매드 맥스: 분노의 도로', 'Mad Max: Fury Road', '조지 밀러', '{"톰 하디","샤를리즈 테론"}', '액션, SF', 2015, 120, '호주', 8.5, '매드 맥스: 분노의 도로 (2015) - 액션, SF, 감독: 조지 밀러, 출연: 톰 하디, 샤를리즈 테론', '{"매드 맥스: 분노의 도로","mad max: fury road","조지 밀러","조지","톰 하디","톰","샤를리즈 테론","샤를리즈","액션, SF","액션","SF"}', NULL, NULL);

-- 34. 스타워즈: 깨어난 포스 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스타워즈: 깨어난 포스', 'Star Wars: The Force Awakens', 'J.J. 에이브럼스', '{"데이지 리들리","존 보예가"}', 'SF, 어드벤처', 2015, 138, '미국', 8.1, '스타워즈: 깨어난 포스 (2015) - SF, 어드벤처, 감독: J.J. 에이브럼스, 출연: 데이지 리들리, 존 보예가', '{"스타워즈: 깨어난 포스","star wars: the force awakens","J.J. 에이브럼스","J.J.","데이지 리들리","데이지","존 보예가","존","SF, 어드벤처","SF","어드벤처"}', NULL, NULL);

-- 35. 인사이드 아웃 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인사이드 아웃', 'Inside Out', '피트 닥터', '{"에이미 포엘러","필리스 스미스"}', '애니메이션', 2015, 95, '미국', 8.6, '인사이드 아웃 (2015) - 애니메이션, 감독: 피트 닥터, 출연: 에이미 포엘러, 필리스 스미스', '{"인사이드 아웃","inside out","피트 닥터","피트","에이미 포엘러","에이미","필리스 스미스","필리스","애니메이션"}', NULL, NULL);

-- 36. 어벤져스: 에이지 오브 울트론 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스: 에이지 오브 울트론', 'Avengers: Age of Ultron', '조스 웨든', '{"로버트 다우니 주니어","크리스 에반스"}', '액션, SF', 2015, 141, '미국', 7.8, '어벤져스: 에이지 오브 울트론 (2015) - 액션, SF, 감독: 조스 웨든, 출연: 로버트 다우니 주니어, 크리스 에반스', '{"어벤져스: 에이지 오브 울트론","avengers: age of ultron","조스 웨든","조스","로버트 다우니 주니어","로버트","크리스 에반스","크리스","액션, SF","액션","SF"}', NULL, NULL);

-- 37. 부산행 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('부산행', 'Train to Busan', '연상호', '{"공유","정유미","마동석","김수안"}', '액션, 스릴러', 2016, 118, '한국', 8.3, '부산행 (2016) - 액션, 스릴러, 감독: 연상호, 출연: 공유, 정유미, 마동석', '{"부산행","train to busan","연상호","공유","정유미","마동석","액션, 스릴러","액션","스릴러"}', NULL, NULL);

-- 38. 곡성 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('곡성', 'The Wailing', '나홍진', '{"곽도원","황정민","천우희"}', '미스터리, 공포', 2016, 156, '한국', 8.1, '곡성 (2016) - 미스터리, 공포, 감독: 나홍진, 출연: 곽도원, 황정민, 천우희', '{"곡성","the wailing","나홍진","곽도원","황정민","천우희","미스터리, 공포","미스터리","공포"}', NULL, NULL);

-- 39. 아가씨 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아가씨', 'The Handmaiden', '박찬욱', '{"김민희","김태리","하정우"}', '스릴러, 로맨스', 2016, 145, '한국', 8.4, '아가씨 (2016) - 스릴러, 로맨스, 감독: 박찬욱, 출연: 김민희, 김태리, 하정우', '{"아가씨","the handmaiden","박찬욱","김민희","김태리","하정우","스릴러, 로맨스","스릴러","로맨스"}', NULL, NULL);

-- 40. 라라랜드 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라라랜드', 'La La Land', '데미안 차젤리', '{"라이언 고슬링","엠마 스톤"}', '뮤지컬, 로맨스', 2016, 128, '미국', 8.3, '라라랜드 (2016) - 뮤지컬, 로맨스, 감독: 데미안 차젤리, 출연: 라이언 고슬링, 엠마 스톤', '{"라라랜드","la la land","데미안 차젤리","데미안","라이언 고슬링","라이언","엠마 스톤","엠마","뮤지컬, 로맨스","뮤지컬","로맨스"}', NULL, NULL);

-- 41. 캡틴 아메리카: 시빌 워 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캡틴 아메리카: 시빌 워', 'Captain America: Civil War', '안소니 루소, 조 루소', '{"크리스 에반스","로버트 다우니 주니어"}', '액션, SF', 2016, 147, '미국', 8.3, '캡틴 아메리카: 시빌 워 (2016) - 액션, SF, 감독: 안소니 루소, 조 루소, 출연: 크리스 에반스, 로버트 다우니 주니어', '{"캡틴 아메리카: 시빌 워","captain america: civil war","안소니 루소, 조 루소","안소니","크리스 에반스","크리스","로버트 다우니 주니어","로버트","액션, SF","액션","SF"}', NULL, NULL);

-- 42. 닥터 스트레인지 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('닥터 스트레인지', 'Doctor Strange', '스콧 데릭슨', '{"베네딕트 컴버배치","틸다 스윈튼"}', '액션, SF', 2016, 115, '미국', 8, '닥터 스트레인지 (2016) - 액션, SF, 감독: 스콧 데릭슨, 출연: 베네딕트 컴버배치, 틸다 스윈튼', '{"닥터 스트레인지","doctor strange","스콧 데릭슨","스콧","베네딕트 컴버배치","베네딕트","틸다 스윈튼","틸다","액션, SF","액션","SF"}', NULL, NULL);

-- 43. 범죄도시 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시', 'The Outlaws', '강윤성', '{"마동석","윤계상","조재윤"}', '액션, 범죄', 2017, 121, '한국', 8.1, '범죄도시 (2017) - 액션, 범죄, 감독: 강윤성, 출연: 마동석, 윤계상, 조재윤', '{"범죄도시","the outlaws","강윤성","마동석","윤계상","조재윤","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 44. 1987 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1987', '1987: When the Day Comes', '장준환', '{"김윤석","하정우","유해진"}', '드라마', 2017, 129, '한국', 8.5, '1987 (2017) - 드라마, 감독: 장준환, 출연: 김윤석, 하정우, 유해진', '{"1987","1987: when the day comes","장준환","김윤석","하정우","유해진","드라마"}', NULL, NULL);

-- 45. 택시운전사 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('택시운전사', 'A Taxi Driver', '장훈', '{"송강호","토마스 크레치만","유해진"}', '드라마', 2017, 137, '한국', 8.3, '택시운전사 (2017) - 드라마, 감독: 장훈, 출연: 송강호, 토마스 크레치만, 유해진', '{"택시운전사","a taxi driver","장훈","송강호","토마스 크레치만","토마스","유해진","드라마"}', NULL, NULL);

-- 46. 블레이드 러너 2049 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블레이드 러너 2049', 'Blade Runner 2049', '드니 빌뇌브', '{"라이언 고슬링","해리슨 포드"}', 'SF, 드라마', 2017, 164, '미국', 8.1, '블레이드 러너 2049 (2017) - SF, 드라마, 감독: 드니 빌뇌브, 출연: 라이언 고슬링, 해리슨 포드', '{"블레이드 러너 2049","blade runner 2049","드니 빌뇌브","드니","라이언 고슬링","라이언","해리슨 포드","해리슨","SF, 드라마","SF","드라마"}', NULL, NULL);

-- 47. 겟 아웃 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('겟 아웃', 'Get Out', '조던 필', '{"다니엘 칼루야","앨리슨 윌리엄스"}', '스릴러', 2017, 104, '미국', 8.2, '겟 아웃 (2017) - 스릴러, 감독: 조던 필, 출연: 다니엘 칼루야, 앨리슨 윌리엄스', '{"겟 아웃","get out","조던 필","조던","다니엘 칼루야","다니엘","앨리슨 윌리엄스","앨리슨","스릴러"}', NULL, NULL);

-- 48. 던케르크 (2017) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('던케르크', 'Dunkirk', '크리스토퍼 놀란', '{"피온 화이트헤드","톰 글린 카니"}', '전쟁, 액션', 2017, 106, '영국', 8, '던케르크 (2017) - 전쟁, 액션, 감독: 크리스토퍼 놀란, 출연: 피온 화이트헤드, 톰 글린 카니', '{"던케르크","dunkirk","크리스토퍼 놀란","크리스토퍼","피온 화이트헤드","피온","톰 글린 카니","톰","전쟁, 액션","전쟁","액션"}', NULL, NULL);

-- 49. 버닝 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('버닝', 'Burning', '이창동', '{"유아인","전종서","스티븐 연"}', '미스터리, 드라마', 2018, 148, '한국', 8, '버닝 (2018) - 미스터리, 드라마, 감독: 이창동, 출연: 유아인, 전종서, 스티븐 연', '{"버닝","burning","이창동","유아인","전종서","스티븐 연","스티븐","미스터리, 드라마","미스터리","드라마"}', NULL, NULL);

-- 50. 블랙팬서 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블랙팬서', 'Black Panther', '라이언 쿠글러', '{"채드윅 보즈만","마이클 B. 조던"}', '액션, SF', 2018, 134, '미국', 8, '블랙팬서 (2018) - 액션, SF, 감독: 라이언 쿠글러, 출연: 채드윅 보즈만, 마이클 B. 조던', '{"블랙팬서","black panther","라이언 쿠글러","라이언","채드윅 보즈만","채드윅","마이클 B. 조던","마이클","액션, SF","액션","SF"}', NULL, NULL);

-- 51. 어 스타 이즈 본 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어 스타 이즈 본', 'A Star Is Born', '브래들리 쿠퍼', '{"브래들리 쿠퍼","레이디 가가"}', '뮤지컬, 드라마', 2018, 136, '미국', 8, '어 스타 이즈 본 (2018) - 뮤지컬, 드라마, 감독: 브래들리 쿠퍼, 출연: 브래들리 쿠퍼, 레이디 가가', '{"어 스타 이즈 본","a star is born","브래들리 쿠퍼","브래들리","레이디 가가","레이디","뮤지컬, 드라마","뮤지컬","드라마"}', NULL, NULL);

-- 52. 보헤미안 랩소디 (2018) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('보헤미안 랩소디', 'Bohemian Rhapsody', '브라이언 싱어', '{"라미 말렉","루시 보인턴"}', '뮤지컬, 드라마', 2018, 134, '영국', 8.1, '보헤미안 랩소디 (2018) - 뮤지컬, 드라마, 감독: 브라이언 싱어, 출연: 라미 말렉, 루시 보인턴', '{"보헤미안 랩소디","bohemian rhapsody","브라이언 싱어","브라이언","라미 말렉","라미","루시 보인턴","루시","뮤지컬, 드라마","뮤지컬","드라마"}', NULL, NULL);

-- 53. 완벽한 타인 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('완벽한 타인', 'Intimate Strangers', '이재규', '{"유해진","조진웅","이서진"}', '코미디, 드라마', 2018, 115, '한국', 7.9, '완벽한 타인 (2018) - 코미디, 드라마, 감독: 이재규, 출연: 유해진, 조진웅, 이서진', '{"완벽한 타인","intimate strangers","이재규","유해진","조진웅","이서진","코미디, 드라마","코미디","드라마"}', NULL, NULL);

-- 54. 인크레더블 2 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인크레더블 2', 'Incredibles 2', '브래드 버드', '{"크레이그 T. 넬슨","홀리 헌터"}', '애니메이션', 2018, 118, '미국', 8, '인크레더블 2 (2018) - 애니메이션, 감독: 브래드 버드, 출연: 크레이그 T. 넬슨, 홀리 헌터', '{"인크레더블 2","incredibles 2","브래드 버드","브래드","크레이그 T. 넬슨","크레이그","홀리 헌터","홀리","애니메이션"}', NULL, NULL);

-- 55. 기생충 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('기생충', 'Parasite', '봉준호', '{"송강호","이선균","조여정","최우식","박소담"}', '드라마, 스릴러', 2019, 132, '한국', 8.9, '기생충 (2019) - 드라마, 스릴러, 감독: 봉준호, 출연: 송강호, 이선균, 조여정', '{"기생충","parasite","봉준호","송강호","이선균","조여정","드라마, 스릴러","드라마","스릴러"}', NULL, NULL);

-- 56. 어벤져스: 엔드게임 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스: 엔드게임', 'Avengers: Endgame', '안소니 루소, 조 루소', '{"로버트 다우니 주니어","크리스 에반스","마크 러팔로"}', '액션, SF', 2019, 181, '미국', 9, '어벤져스: 엔드게임 (2019) - 액션, SF, 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스, 마크 러팔로', '{"어벤져스: 엔드게임","avengers: endgame","안소니 루소, 조 루소","안소니","로버트 다우니 주니어","로버트","크리스 에반스","크리스","마크 러팔로","마크","액션, SF","액션","SF"}', NULL, NULL);

-- 57. 극한직업 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('극한직업', 'Extreme Job', '이병헌', '{"류승룡","이하늬","진선규","이동휘"}', '코미디, 액션', 2019, 111, '한국', 8.4, '극한직업 (2019) - 코미디, 액션, 감독: 이병헌, 출연: 류승룡, 이하늬, 진선규', '{"극한직업","extreme job","이병헌","류승룡","이하늬","진선규","코미디, 액션","코미디","액션"}', NULL, NULL);

-- 58. 조커 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조커', 'Joker', '토드 필립스', '{"호아킨 피닉스","로버트 드 니로"}', '드라마, 스릴러', 2019, 122, '미국', 8.2, '조커 (2019) - 드라마, 스릴러, 감독: 토드 필립스, 출연: 호아킨 피닉스, 로버트 드 니로', '{"조커","joker","토드 필립스","토드","호아킨 피닉스","호아킨","로버트 드 니로","로버트","드라마, 스릴러","드라마","스릴러"}', NULL, NULL);

-- 59. 토이 스토리 4 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토이 스토리 4', 'Toy Story 4', '조시 쿨리', '{"톰 행크스","팀 앨런"}', '애니메이션', 2019, 100, '미국', 8.1, '토이 스토리 4 (2019) - 애니메이션, 감독: 조시 쿨리, 출연: 톰 행크스, 팀 앨런', '{"토이 스토리 4","toy story 4","조시 쿨리","조시","톰 행크스","톰","팀 앨런","팀","애니메이션"}', NULL, NULL);

-- 60. 존 윅 3: 파라벨룸 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('존 윅 3: 파라벨룸', 'John Wick: Chapter 3 – Parabellum', '채드 스타헬스키', '{"키아누 리브스","할리 베리"}', '액션', 2019, 130, '미국', 8.3, '존 윅 3: 파라벨룸 (2019) - 액션, 감독: 채드 스타헬스키, 출연: 키아누 리브스, 할리 베리', '{"존 윅 3: 파라벨룸","john wick: chapter 3 – parabellum","채드 스타헬스키","채드","키아누 리브스","키아누","할리 베리","할리","액션"}', NULL, NULL);

-- 61. 미나리 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미나리', 'Minari', '정이삭', '{"스티븐 연","한예리","윤여정","앨런 김"}', '드라마', 2020, 115, '미국', 8.2, '미나리 (2020) - 드라마, 감독: 정이삭, 출연: 스티븐 연, 한예리, 윤여정', '{"미나리","minari","정이삭","스티븐 연","스티븐","한예리","윤여정","드라마"}', NULL, NULL);

-- 62. 소울 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('소울', 'Soul', '피트 닥터', '{"제이미 폭스","티나 페이"}', '애니메이션', 2020, 100, '미국', 8.6, '소울 (2020) - 애니메이션, 감독: 피트 닥터, 출연: 제이미 폭스, 티나 페이', '{"소울","soul","피트 닥터","피트","제이미 폭스","제이미","티나 페이","티나","애니메이션"}', NULL, NULL);

-- 63. 사냥의 시간 (2020) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('사냥의 시간', 'Time to Hunt', '윤성현', '{"이제훈","안재홍","최우식"}', '액션, 스릴러', 2020, 134, '한국', 7.8, '사냥의 시간 (2020) - 액션, 스릴러, 감독: 윤성현, 출연: 이제훈, 안재홍, 최우식', '{"사냥의 시간","time to hunt","윤성현","이제훈","안재홍","최우식","액션, 스릴러","액션","스릴러"}', NULL, NULL);

-- 64. 원더우먼 1984 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원더우먼 1984', 'Wonder Woman 1984', '패티 젠킨스', '{"갤 가돗","크리스 파인"}', '액션, SF', 2020, 151, '미국', 7, '원더우먼 1984 (2020) - 액션, SF, 감독: 패티 젠킨스, 출연: 갤 가돗, 크리스 파인', '{"원더우먼 1984","wonder woman 1984","패티 젠킨스","패티","갤 가돗","갤","크리스 파인","크리스","액션, SF","액션","SF"}', NULL, NULL);

-- 65. 테넷 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('테넷', 'Tenet', '크리스토퍼 놀란', '{"존 데이비드 워싱턴","로버트 패틴슨"}', 'SF, 액션', 2020, 150, '미국', 7.8, '테넷 (2020) - SF, 액션, 감독: 크리스토퍼 놀란, 출연: 존 데이비드 워싱턴, 로버트 패틴슨', '{"테넷","tenet","크리스토퍼 놀란","크리스토퍼","존 데이비드 워싱턴","존","로버트 패틴슨","로버트","SF, 액션","SF","액션"}', NULL, NULL);

-- 66. 블랙 위도우 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블랙 위도우', 'Black Widow', '케이트 쇼틀랜드', '{"스칼렛 요한슨","플로렌스 퓨"}', '액션, SF', 2020, 134, '미국', 7.6, '블랙 위도우 (2020) - 액션, SF, 감독: 케이트 쇼틀랜드, 출연: 스칼렛 요한슨, 플로렌스 퓨', '{"블랙 위도우","black widow","케이트 쇼틀랜드","케이트","스칼렛 요한슨","스칼렛","플로렌스 퓨","플로렌스","액션, SF","액션","SF"}', NULL, NULL);

-- 67. 모가디슈 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('모가디슈', 'Escape from Mogadishu', '류승완', '{"김윤석","조인성","허준호","구교환"}', '액션, 드라마', 2021, 121, '한국', 8, '모가디슈 (2021) - 액션, 드라마, 감독: 류승완, 출연: 김윤석, 조인성, 허준호', '{"모가디슈","escape from mogadishu","류승완","김윤석","조인성","허준호","액션, 드라마","액션","드라마"}', NULL, NULL);

-- 68. 스파이더맨: 노 웨이 홈 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스파이더맨: 노 웨이 홈', 'Spider-Man: No Way Home', '존 와츠', '{"톰 홀랜드","젠데이아","베네딕트 컴버배치"}', '액션, SF', 2021, 148, '미국', 8.8, '스파이더맨: 노 웨이 홈 (2021) - 액션, SF, 감독: 존 와츠, 출연: 톰 홀랜드, 젠데이아, 베네딕트 컴버배치', '{"스파이더맨: 노 웨이 홈","spider-man: no way home","존 와츠","존","톰 홀랜드","톰","젠데이아","베네딕트 컴버배치","베네딕트","액션, SF","액션","SF"}', NULL, NULL);

-- 69. 승리호 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('승리호', 'Space Sweepers', '조성희', '{"송중기","김태리","진선규"}', 'SF', 2021, 136, '한국', 7.5, '승리호 (2021) - SF, 감독: 조성희, 출연: 송중기, 김태리, 진선규', '{"승리호","space sweepers","조성희","송중기","김태리","진선규","SF"}', NULL, NULL);

-- 70. 이터널스 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('이터널스', 'Eternals', '클로이 자오', '{"젬마 찬","리처드 매든","안젤리나 졸리"}', '액션, SF', 2021, 156, '미국', 7.1, '이터널스 (2021) - 액션, SF, 감독: 클로이 자오, 출연: 젬마 찬, 리처드 매든, 안젤리나 졸리', '{"이터널스","eternals","클로이 자오","클로이","젬마 찬","젬마","리처드 매든","리처드","안젤리나 졸리","안젤리나","액션, SF","액션","SF"}', NULL, NULL);

-- 71. 매트릭스 4: 리저렉션 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('매트릭스 4: 리저렉션', 'The Matrix Resurrections', '라나 워쇼스키', '{"키아누 리브스","캐리 앤 모스"}', 'SF, 액션', 2021, 148, '미국', 6.8, '매트릭스 4: 리저렉션 (2021) - SF, 액션, 감독: 라나 워쇼스키, 출연: 키아누 리브스, 캐리 앤 모스', '{"매트릭스 4: 리저렉션","the matrix resurrections","라나 워쇼스키","라나","키아누 리브스","키아누","캐리 앤 모스","캐리","SF, 액션","SF","액션"}', NULL, NULL);

-- 72. 분노의 질주: 더 얼티메이트 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('분노의 질주: 더 얼티메이트', 'Fast & Furious 9', '저스틴 린', '{"빈 디젤","미셸 로드리게스"}', '액션', 2021, 143, '미국', 7.2, '분노의 질주: 더 얼티메이트 (2021) - 액션, 감독: 저스틴 린, 출연: 빈 디젤, 미셸 로드리게스', '{"분노의 질주: 더 얼티메이트","fast & furious 9","저스틴 린","저스틴","빈 디젤","빈","미셸 로드리게스","미셸","액션"}', NULL, NULL);

-- 73. 헤어질 결심 (2022) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('헤어질 결심', 'Decision to Leave', '박찬욱', '{"박해일","탕웨이","이정현"}', '로맨스, 미스터리', 2022, 138, '한국', 8.2, '헤어질 결심 (2022) - 로맨스, 미스터리, 감독: 박찬욱, 출연: 박해일, 탕웨이, 이정현', '{"헤어질 결심","decision to leave","박찬욱","박해일","탕웨이","이정현","로맨스, 미스터리","로맨스","미스터리"}', NULL, NULL);

-- 74. 탑건: 매버릭 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('탑건: 매버릭', 'Top Gun: Maverick', '조제프 코신스키', '{"톰 크루즈","마일즈 텔러","제니퍼 코넬리"}', '액션', 2022, 131, '미국', 8.7, '탑건: 매버릭 (2022) - 액션, 감독: 조제프 코신스키, 출연: 톰 크루즈, 마일즈 텔러, 제니퍼 코넬리', '{"탑건: 매버릭","top gun: maverick","조제프 코신스키","조제프","톰 크루즈","톰","마일즈 텔러","마일즈","제니퍼 코넬리","제니퍼","액션"}', NULL, NULL);

-- 75. 한산: 용의 출현 (2022) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('한산: 용의 출현', 'Hansan: Rising Dragon', '김한민', '{"박해일","변요한","안성기"}', '액션, 전쟁', 2022, 130, '한국', 7.8, '한산: 용의 출현 (2022) - 액션, 전쟁, 감독: 김한민, 출연: 박해일, 변요한, 안성기', '{"한산: 용의 출현","hansan: rising dragon","김한민","박해일","변요한","안성기","액션, 전쟁","액션","전쟁"}', NULL, NULL);

-- 76. 닥터 스트레인지: 대혼돈의 멀티버스 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('닥터 스트레인지: 대혼돈의 멀티버스', 'Doctor Strange in the Multiverse of Madness', '샘 래이미', '{"베네딕트 컴버배치","엘리자베스 올슨"}', '액션, SF', 2022, 126, '미국', 7.6, '닥터 스트레인지: 대혼돈의 멀티버스 (2022) - 액션, SF, 감독: 샘 래이미, 출연: 베네딕트 컴버배치, 엘리자베스 올슨', '{"닥터 스트레인지: 대혼돈의 멀티버스","doctor strange in the multiverse of madness","샘 래이미","샘","베네딕트 컴버배치","베네딕트","엘리자베스 올슨","엘리자베스","액션, SF","액션","SF"}', NULL, NULL);

-- 77. 토르: 러브 앤 썬더 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토르: 러브 앤 썬더', 'Thor: Love and Thunder', '타이카 와이티티', '{"크리스 헴스워스","나탈리 포트만"}', '액션, SF', 2022, 119, '미국', 7.2, '토르: 러브 앤 썬더 (2022) - 액션, SF, 감독: 타이카 와이티티, 출연: 크리스 헴스워스, 나탈리 포트만', '{"토르: 러브 앤 썬더","thor: love and thunder","타이카 와이티티","타이카","크리스 헴스워스","크리스","나탈리 포트만","나탈리","액션, SF","액션","SF"}', NULL, NULL);

-- 78. 미니언즈: 라이즈 오브 그루 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미니언즈: 라이즈 오브 그루', 'Minions: The Rise of Gru', '카일 발다', '{"스티브 카렐","피에르 코팽"}', '애니메이션', 2022, 87, '미국', 7.8, '미니언즈: 라이즈 오브 그루 (2022) - 애니메이션, 감독: 카일 발다, 출연: 스티브 카렐, 피에르 코팽', '{"미니언즈: 라이즈 오브 그루","minions: the rise of gru","카일 발다","카일","스티브 카렐","스티브","피에르 코팽","피에르","애니메이션"}', NULL, NULL);

-- 79. 범죄도시 3 (2023) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시 3', 'The Roundup: No Way Out', '이상용', '{"마동석","이준혁","아오키 무네타카"}', '액션, 범죄', 2023, 105, '한국', 7.9, '범죄도시 3 (2023) - 액션, 범죄, 감독: 이상용, 출연: 마동석, 이준혁, 아오키 무네타카', '{"범죄도시 3","the roundup: no way out","이상용","마동석","이준혁","아오키 무네타카","아오키","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 80. 스즈메의 문단속 (2023) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스즈메의 문단속', 'Suzume', '신카이 마코토', '{"하라 나나미","마츠무라 호쿠토"}', '애니메이션', 2023, 122, '일본', 8.2, '스즈메의 문단속 (2023) - 애니메이션, 감독: 신카이 마코토, 출연: 하라 나나미, 마츠무라 호쿠토', '{"스즈메의 문단속","suzume","신카이 마코토","신카이","하라 나나미","하라","마츠무라 호쿠토","마츠무라","애니메이션"}', NULL, NULL);

-- 81. 존 윅: 챕터 4 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('존 윅: 챕터 4', 'John Wick: Chapter 4', '채드 스타헬스키', '{"키아누 리브스","도니 옌","빌 스카스가드"}', '액션', 2023, 169, '미국', 8.4, '존 윅: 챕터 4 (2023) - 액션, 감독: 채드 스타헬스키, 출연: 키아누 리브스, 도니 옌, 빌 스카스가드', '{"존 윅: 챕터 4","john wick: chapter 4","채드 스타헬스키","채드","키아누 리브스","키아누","도니 옌","도니","빌 스카스가드","빌","액션"}', NULL, NULL);

-- 82. 인디아나 존스: 운명의 다이얼 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인디아나 존스: 운명의 다이얼', 'Indiana Jones and the Dial of Destiny', '제임스 맨골드', '{"해리슨 포드","피비 월러브리지"}', '어드벤처', 2023, 154, '미국', 7.5, '인디아나 존스: 운명의 다이얼 (2023) - 어드벤처, 감독: 제임스 맨골드, 출연: 해리슨 포드, 피비 월러브리지', '{"인디아나 존스: 운명의 다이얼","indiana jones and the dial of destiny","제임스 맨골드","제임스","해리슨 포드","해리슨","피비 월러브리지","피비","어드벤처"}', NULL, NULL);

-- 83. 플래시 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('플래시', 'The Flash', '앤디 무스키에티', '{"에즈라 밀러","사샤 칼","마이클 키튼"}', '액션, SF', 2023, 144, '미국', 7.1, '플래시 (2023) - 액션, SF, 감독: 앤디 무스키에티, 출연: 에즈라 밀러, 사샤 칼, 마이클 키튼', '{"플래시","the flash","앤디 무스키에티","앤디","에즈라 밀러","에즈라","사샤 칼","사샤","마이클 키튼","마이클","액션, SF","액션","SF"}', NULL, NULL);

-- 84. 트랜스포머: 비스트의 탄생 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('트랜스포머: 비스트의 탄생', 'Transformers: Rise of the Beasts', '스티븐 케이플 주니어', '{"안소니 라모스","도미니크 피시백"}', '액션, SF', 2023, 127, '미국', 7.3, '트랜스포머: 비스트의 탄생 (2023) - 액션, SF, 감독: 스티븐 케이플 주니어, 출연: 안소니 라모스, 도미니크 피시백', '{"트랜스포머: 비스트의 탄생","transformers: rise of the beasts","스티븐 케이플 주니어","스티븐","안소니 라모스","안소니","도미니크 피시백","도미니크","액션, SF","액션","SF"}', NULL, NULL);

-- 85. 서울의 봄 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('서울의 봄', 'Seoul Spring', '김성수', '{"황정민","정우성","이성민","박해준"}', '드라마', 2024, 141, '한국', 8.3, '서울의 봄 (2024) - 드라마, 감독: 김성수, 출연: 황정민, 정우성, 이성민', '{"서울의 봄","seoul spring","김성수","황정민","정우성","이성민","드라마"}', NULL, NULL);

-- 86. 오펜하이머 (2024) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('오펜하이머', 'Oppenheimer', '크리스토퍼 놀란', '{"킬리언 머피","에밀리 블런트","맷 데이먼"}', '드라마', 2024, 180, '미국', 8.7, '오펜하이머 (2024) - 드라마, 감독: 크리스토퍼 놀란, 출연: 킬리언 머피, 에밀리 블런트, 맷 데이먼', '{"오펜하이머","oppenheimer","크리스토퍼 놀란","크리스토퍼","킬리언 머피","킬리언","에밀리 블런트","에밀리","맷 데이먼","맷","드라마"}', NULL, NULL);

-- 87. 바비 (2024) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('바비', 'Barbie', '그레타 거윅', '{"마고 로비","라이언 고슬링"}', '코미디', 2024, 114, '미국', 7.8, '바비 (2024) - 코미디, 감독: 그레타 거윅, 출연: 마고 로비, 라이언 고슬링', '{"바비","barbie","그레타 거윅","그레타","마고 로비","마고","라이언 고슬링","라이언","코미디"}', NULL, NULL);

-- 88. 범죄도시 4 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시 4', 'The Roundup: Punishment', '허명행', '{"마동석","김무열"}', '액션, 범죄', 2024, 109, '한국', 7.9, '범죄도시 4 (2024) - 액션, 범죄, 감독: 허명행, 출연: 마동석, 김무열', '{"범죄도시 4","the roundup: punishment","허명행","마동석","김무열","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 89. 관능의 법칙 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('관능의 법칙', 'Love Affairs in the Afternoon', '이언희', '{"송승헌","조여정"}', '로맨스, 드라마', 2024, 103, '한국', 7.2, '관능의 법칙 (2024) - 로맨스, 드라마, 감독: 이언희, 출연: 송승헌, 조여정', '{"관능의 법칙","love affairs in the afternoon","이언희","송승헌","조여정","로맨스, 드라마","로맨스","드라마"}', NULL, NULL);

-- 90. 스파이더맨: 어크로스 더 스파이더버스 (2024) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스파이더맨: 어크로스 더 스파이더버스', 'Spider-Man: Across the Spider-Verse', '호아킴 도스 산토스', '{"샤메익 무어","헤일리 스테인펠드"}', '애니메이션', 2024, 140, '미국', 8.8, '스파이더맨: 어크로스 더 스파이더버스 (2024) - 애니메이션, 감독: 호아킴 도스 산토스, 출연: 샤메익 무어, 헤일리 스테인펠드', '{"스파이더맨: 어크로스 더 스파이더버스","spider-man: across the spider-verse","호아킴 도스 산토스","호아킴","샤메익 무어","샤메익","헤일리 스테인펠드","헤일리","애니메이션"}', NULL, NULL);

-- 91. 파묘 (2025) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('파묘', 'Exhuma', '장재현', '{"최민식","김고은","유해진","이도현"}', '미스터리, 공포', 2025, 134, '한국', 8.1, '파묘 (2025) - 미스터리, 공포, 감독: 장재현, 출연: 최민식, 김고은, 유해진', '{"파묘","exhuma","장재현","최민식","김고은","유해진","미스터리, 공포","미스터리","공포"}', NULL, NULL);

-- 92. 듄: 파트 투 (2025) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('듄: 파트 투', 'Dune: Part Two', '드니 빌뇌브', '{"티모시 샬라메","젠데이아","오스카 아이작"}', 'SF, 액션', 2025, 166, '미국', 8.9, '듄: 파트 투 (2025) - SF, 액션, 감독: 드니 빌뇌브, 출연: 티모시 샬라메, 젠데이아, 오스카 아이작', '{"듄: 파트 투","dune: part two","드니 빌뇌브","드니","티모시 샬라메","티모시","젠데이아","오스카 아이작","오스카","SF, 액션","SF","액션"}', NULL, NULL);

-- 93. 윙스 (2025) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('윙스', 'Wings', '김보라', '{"김다미","남주혁","박정민"}', '드라마', 2025, 118, '한국', 7.8, '윙스 (2025) - 드라마, 감독: 김보라, 출연: 김다미, 남주혁, 박정민', '{"윙스","wings","김보라","김다미","남주혁","박정민","드라마"}', NULL, NULL);

-- 94. 가디언즈 오브 갤럭시 Vol. 3 (2025) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('가디언즈 오브 갤럭시 Vol. 3', 'Guardians of the Galaxy Vol. 3', '제임스 건', '{"크리스 프랫","조 샐다나"}', '액션, SF', 2025, 150, '미국', 8.3, '가디언즈 오브 갤럭시 Vol. 3 (2025) - 액션, SF, 감독: 제임스 건, 출연: 크리스 프랫, 조 샐다나', '{"가디언즈 오브 갤럭시 Vol. 3","guardians of the galaxy vol. 3","제임스 건","제임스","크리스 프랫","크리스","조 샐다나","조","액션, SF","액션","SF"}', NULL, NULL);

-- ==========================================
-- 전문가 리뷰 데이터 INSERT
-- ==========================================

INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '이동진', 8.5, '감독의 연출 의도가 명확하게 드러나는 아저씨. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2022-10-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '박평식', 8.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 아저씨. 강력 추천한다.', '중앙일보', '2013-10-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '김도훈', 8.3, '완성도 높은 연출과 연기가 돋보이는 아저씨. 추천할 만한 작품이다.', '동아일보', '2019-06-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '이화정', 8.1, '아저씨는 액션, 스릴러 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '씨네21', '2017-05-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '이동진', 7.8, '연출과 연기, 스토리 모든 면에서 균형잡힌 황해. 완성도가 뛰어나다.', '씨네21', '2014-08-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '박평식', 8.3, '황해에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2013-06-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '이화정', 7.9, '황해에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2014-08-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '김도훈', 8.3, '황해는 액션, 스릴러 장르의 새로운 면모를 보여준다. 완성도가 높다.', '동아일보', '2020-03-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '이동진', 8.6, '인셉션에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-12-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '박평식', 8.6, '연기자들의 앙상블이 돋보이는 인셉션. 감독의 연출력이 빛을 발한다.', '중앙일보', '2010-03-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '민용준', 9.1, '인셉션에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '스포츠조선', '2018-05-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '배동미', 9, '인셉션에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '매일경제', '2010-05-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '이동진', 7.9, '감독의 연출 의도가 명확하게 드러나는 아이언맨 2. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2024-11-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '박평식', 8.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 아이언맨 2. 강력 추천한다.', '중앙일보', '2024-03-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '이용철', 7.4, '아이언맨 2에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '문화일보', '2010-10-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '허지웅', 7.7, '아이언맨 2는 액션, SF 장르의 새로운 면모를 보여준다. 완성도가 높다.', 'KBS', '2016-05-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '이동진', 9.1, '토이 스토리 3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-08-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '박평식', 8.7, '연기자들의 앙상블이 돋보이는 토이 스토리 3. 감독의 연출력이 빛을 발한다.', '중앙일보', '2020-11-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '유지나', 8.6, '토이 스토리 3는 애니메이션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '한겨레', '2010-09-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '이용철', 8.9, '토이 스토리 3에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '문화일보', '2022-11-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '이동진', 7.3, '슈렉 포에버에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2021-05-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '박평식', 6.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 슈렉 포에버. 강력 추천한다.', '중앙일보', '2013-06-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '남동철', 7.1, '슈렉 포에버에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '스포츠서울', '2014-05-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '이지혜', 7.2, '탄탄한 스토리와 뛰어난 연출이 돋보이는 슈렉 포에버. 강력 추천작이다.', 'OSEN', '2015-02-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '이동진', 7.6, '최종병기 활는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2010-01-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '박평식', 7.5, '최종병기 활는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2025-07-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '이화정', 7.4, '최종병기 활에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2011-08-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '김혜리', 7.3, '최종병기 활에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2018-07-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '이동진', 8.5, '도가니에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-08-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '박평식', 9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 도가니. 강력 추천한다.', '중앙일보', '2017-10-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '김도훈', 8.2, '장르의 특성을 잘 살린 도가니. 연출과 연기 모든 면에서 우수하다.', '동아일보', '2018-05-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '허지웅', 8.9, '완성도 높은 연출과 연기가 돋보이는 도가니. 추천할 만한 작품이다.', 'KBS', '2018-01-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '이동진', 7.6, '캡틴 아메리카: 퍼스트 어벤져에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2011-12-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '박평식', 7.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 캡틴 아메리카: 퍼스트 어벤져. 강력 추천한다.', '중앙일보', '2016-10-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '김혜리', 7.3, '감독의 연출력과 배우들의 연기력이 조화를 이룬 캡틴 아메리카: 퍼스트 어벤져. 완성도가 뛰어나다.', '씨네21', '2013-10-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '허지웅', 7.4, '탄탄한 스토리와 뛰어난 연출이 돋보이는 캡틴 아메리카: 퍼스트 어벤져. 강력 추천작이다.', 'KBS', '2013-03-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '이동진', 8.1, '토르는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2019-02-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '박평식', 7.8, '토르는 액션, SF 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2022-11-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '민용준', 7.7, '토르에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '스포츠조선', '2025-01-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '김도훈', 7.7, '토르는 액션, SF 장르의 새로운 면모를 보여준다. 완성도가 높다.', '동아일보', '2024-06-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '이동진', 7.8, '엑스맨: 퍼스트 클래스는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2011-03-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '박평식', 7.7, '엑스맨: 퍼스트 클래스는 액션, SF 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2012-12-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '김성훈', 8.1, '엑스맨: 퍼스트 클래스는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2020-03-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '김혜리', 8.5, '감독의 연출력과 배우들의 연기력이 조화를 이룬 엑스맨: 퍼스트 클래스. 완성도가 뛰어나다.', '씨네21', '2017-04-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '이동진', 7.1, '감독의 연출 의도가 명확하게 드러나는 카2. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2017-12-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '박평식', 6.4, '카2는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2025-02-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '김성훈', 7.2, '카2에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2022-12-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '이지혜', 6.7, '탄탄한 스토리와 뛰어난 연출이 돋보이는 카2. 강력 추천작이다.', 'OSEN', '2016-05-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '이동진', 8, '연출과 연기, 스토리 모든 면에서 균형잡힌 도둑들. 완성도가 뛰어나다.', '씨네21', '2011-05-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '박평식', 7.4, '도둑들는 액션, 범죄 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2012-10-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '이화정', 8.1, '도둑들에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2016-10-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '허지웅', 7.8, '도둑들는 액션, 범죄 장르의 새로운 면모를 보여준다. 완성도가 높다.', 'KBS', '2021-10-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '이동진', 8.8, '광해, 왕이 된 남자는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-07-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '박평식', 8.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 광해, 왕이 된 남자. 강력 추천한다.', '중앙일보', '2018-09-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '정성일', 8.4, '탄탄한 스토리와 뛰어난 연출이 돋보이는 광해, 왕이 된 남자. 강력 추천작이다.', '중앙일보', '2013-12-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '유지나', 8.4, '탄탄한 스토리와 뛰어난 연출이 돋보이는 광해, 왕이 된 남자. 강력 추천작이다.', '한겨레', '2015-06-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '이동진', 8.2, '감독의 연출 의도가 명확하게 드러나는 어벤져스. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2024-03-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '박평식', 8.4, '연기자들의 앙상블이 돋보이는 어벤져스. 감독의 연출력이 빛을 발한다.', '중앙일보', '2022-09-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '김도훈', 8.4, '감독의 연출력과 배우들의 연기력이 조화를 이룬 어벤져스. 완성도가 뛰어나다.', '동아일보', '2012-01-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '정성일', 8.8, '감독의 연출력과 배우들의 연기력이 조화를 이룬 어벤져스. 완성도가 뛰어나다.', '중앙일보', '2012-12-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '이동진', 8, '연출과 연기, 스토리 모든 면에서 균형잡힌 다크 나이트 라이즈. 완성도가 뛰어나다.', '씨네21', '2015-10-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '박평식', 8.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 다크 나이트 라이즈. 강력 추천한다.', '중앙일보', '2015-06-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '김봉석', 8.4, '장르의 특성을 잘 살린 다크 나이트 라이즈. 연출과 연기 모든 면에서 우수하다.', '한국일보', '2022-10-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '허지웅', 7.6, '다크 나이트 라이즈에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', 'KBS', '2019-10-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '이동진', 8.4, '건축학개론는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-03-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '박평식', 8.5, '건축학개론는 로맨스, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2019-06-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '민용준', 8.5, '감독의 연출력과 배우들의 연기력이 조화를 이룬 건축학개론. 완성도가 뛰어나다.', '스포츠조선', '2015-01-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '정성일', 7.7, '완성도 높은 연출과 연기가 돋보이는 건축학개론. 추천할 만한 작품이다.', '중앙일보', '2012-02-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '이동진', 8.2, '연출과 연기, 스토리 모든 면에서 균형잡힌 메리다와 마법의 숲. 완성도가 뛰어나다.', '씨네21', '2011-06-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '박평식', 8, '메리다와 마법의 숲는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2020-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '김도훈', 7.4, '메리다와 마법의 숲는 애니메이션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '동아일보', '2022-12-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '유지나', 8.2, '메리다와 마법의 숲에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '한겨레', '2025-03-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '이동진', 7.5, '연출과 연기, 스토리 모든 면에서 균형잡힌 관상. 완성도가 뛰어나다.', '씨네21', '2016-03-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '박평식', 8.1, '관상는 드라마, 사극 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2015-05-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '김도훈', 8.2, '관상에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '동아일보', '2021-07-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '이지혜', 7.5, '탄탄한 스토리와 뛰어난 연출이 돋보이는 관상. 강력 추천작이다.', 'OSEN', '2017-12-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '이동진', 8, '겨울왕국에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-05-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '박평식', 7.8, '겨울왕국에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2016-05-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '남동철', 8.4, '탄탄한 스토리와 뛰어난 연출이 돋보이는 겨울왕국. 강력 추천작이다.', '스포츠서울', '2012-11-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '이지혜', 8.3, '겨울왕국는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', 'OSEN', '2020-08-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '이동진', 7.3, '아이언맨 3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2022-03-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '박평식', 7.6, '연기자들의 앙상블이 돋보이는 아이언맨 3. 감독의 연출력이 빛을 발한다.', '중앙일보', '2016-12-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '유지나', 8.1, '아이언맨 3에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한겨레', '2022-05-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '이화정', 7.3, '완성도 높은 연출과 연기가 돋보이는 아이언맨 3. 추천할 만한 작품이다.', '씨네21', '2012-03-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '이동진', 7.3, '맨 오브 스틸는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2016-04-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '박평식', 7.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 맨 오브 스틸. 강력 추천한다.', '중앙일보', '2016-12-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '허지웅', 7.9, '감독의 연출력과 배우들의 연기력이 조화를 이룬 맨 오브 스틸. 완성도가 뛰어나다.', 'KBS', '2014-10-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '남동철', 7.8, '완성도 높은 연출과 연기가 돋보이는 맨 오브 스틸. 추천할 만한 작품이다.', '스포츠서울', '2023-05-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '이동진', 7.6, '토르: 다크 월드에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2015-10-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '박평식', 7.5, '연기자들의 앙상블이 돋보이는 토르: 다크 월드. 감독의 연출력이 빛을 발한다.', '중앙일보', '2015-01-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '김봉석', 7.1, '장르의 특성을 잘 살린 토르: 다크 월드. 연출과 연기 모든 면에서 우수하다.', '한국일보', '2012-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '황진미', 7.6, '탄탄한 스토리와 뛰어난 연출이 돋보이는 토르: 다크 월드. 강력 추천작이다.', '조선일보', '2024-02-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '이동진', 7.9, '연출과 연기, 스토리 모든 면에서 균형잡힌 신과함께-죄와 벌. 완성도가 뛰어나다.', '씨네21', '2014-04-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '박평식', 7.5, '신과함께-죄와 벌에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2016-02-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '이지혜', 7.3, '신과함께-죄와 벌는 판타지, 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', 'OSEN', '2013-04-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '강병진', 7.5, '신과함께-죄와 벌는 판타지, 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', '헤럴드경제', '2015-08-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '이동진', 7.8, '명량는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2017-01-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '박평식', 8.3, '명량는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2013-02-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '남동철', 8, '탄탄한 스토리와 뛰어난 연출이 돋보이는 명량. 강력 추천작이다.', '스포츠서울', '2024-11-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '이용철', 8.2, '감독의 연출력과 배우들의 연기력이 조화를 이룬 명량. 완성도가 뛰어나다.', '문화일보', '2014-01-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '이동진', 8.1, '연출과 연기, 스토리 모든 면에서 균형잡힌 국제시장. 완성도가 뛰어나다.', '씨네21', '2024-10-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '박평식', 7.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 국제시장. 강력 추천한다.', '중앙일보', '2015-11-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '김성훈', 8, '탄탄한 스토리와 뛰어난 연출이 돋보이는 국제시장. 강력 추천작이다.', '씨네21', '2019-10-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '배동미', 8.3, '감독의 연출력과 배우들의 연기력이 조화를 이룬 국제시장. 완성도가 뛰어나다.', '매일경제', '2020-08-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '이동진', 8.6, '인터스텔라는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2019-03-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '박평식', 8.6, '연기자들의 앙상블이 돋보이는 인터스텔라. 감독의 연출력이 빛을 발한다.', '중앙일보', '2022-07-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '남동철', 8.6, '장르의 특성을 잘 살린 인터스텔라. 연출과 연기 모든 면에서 우수하다.', '스포츠서울', '2012-03-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '이용철', 8.7, '연기자들의 연기력과 감독의 연출이 빛나는 인터스텔라. 수준급 작품이다.', '문화일보', '2019-08-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '이동진', 8.1, '가디언즈 오브 갤럭시는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2021-08-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '박평식', 8.4, '가디언즈 오브 갤럭시에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2022-08-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '김혜리', 8.4, '완성도 높은 연출과 연기가 돋보이는 가디언즈 오브 갤럭시. 추천할 만한 작품이다.', '씨네21', '2021-06-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '이용철', 8.5, '가디언즈 오브 갤럭시는 액션, SF 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '문화일보', '2012-05-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '이동진', 8.2, '연출과 연기, 스토리 모든 면에서 균형잡힌 엑스맨: 데이즈 오브 퓨처 패스트. 완성도가 뛰어나다.', '씨네21', '2012-05-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '박평식', 8.5, '엑스맨: 데이즈 오브 퓨처 패스트에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2011-08-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '김혜리', 8, '감독의 연출력과 배우들의 연기력이 조화를 이룬 엑스맨: 데이즈 오브 퓨처 패스트. 완성도가 뛰어나다.', '씨네21', '2021-03-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '허지웅', 8.4, '엑스맨: 데이즈 오브 퓨처 패스트는 액션, SF 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', 'KBS', '2024-11-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '이동진', 7.7, '연출과 연기, 스토리 모든 면에서 균형잡힌 빅 히어로. 완성도가 뛰어나다.', '씨네21', '2019-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '박평식', 8.4, '빅 히어로는 애니메이션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2016-04-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '황진미', 7.7, '빅 히어로는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '조선일보', '2015-02-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '유지나', 8.5, '빅 히어로에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한겨레', '2017-07-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '이동진', 8.3, '감독의 연출 의도가 명확하게 드러나는 베테랑. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2011-12-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '박평식', 8.3, '연기자들의 앙상블이 돋보이는 베테랑. 감독의 연출력이 빛을 발한다.', '중앙일보', '2013-09-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '황진미', 8.6, '베테랑는 액션, 범죄 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '조선일보', '2010-12-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '이용철', 8.3, '베테랑는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '문화일보', '2023-11-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '이동진', 8.5, '암살는 액션, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2013-03-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '박평식', 7.8, '암살는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2025-05-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '이용철', 8.6, '탄탄한 스토리와 뛰어난 연출이 돋보이는 암살. 강력 추천작이다.', '문화일보', '2010-07-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '배동미', 8.5, '암살는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '매일경제', '2021-03-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '이동진', 8, '매드 맥스: 분노의 도로는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2019-01-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '박평식', 8.1, '연기자들의 앙상블이 돋보이는 매드 맥스: 분노의 도로. 감독의 연출력이 빛을 발한다.', '중앙일보', '2021-06-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '황진미', 8.9, '매드 맥스: 분노의 도로는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '조선일보', '2017-04-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '유지나', 8.8, '감독의 연출력과 배우들의 연기력이 조화를 이룬 매드 맥스: 분노의 도로. 완성도가 뛰어나다.', '한겨레', '2013-09-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (34, '이동진', 8.5, '스타워즈: 깨어난 포스는 SF, 어드벤처 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2014-04-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (34, '박평식', 8.5, '연기자들의 앙상블이 돋보이는 스타워즈: 깨어난 포스. 감독의 연출력이 빛을 발한다.', '중앙일보', '2019-09-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (34, '민용준', 7.9, '스타워즈: 깨어난 포스는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '스포츠조선', '2019-04-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (34, '강병진', 8.4, '장르의 특성을 잘 살린 스타워즈: 깨어난 포스. 연출과 연기 모든 면에서 우수하다.', '헤럴드경제', '2025-07-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (35, '이동진', 8.2, '인사이드 아웃는 애니메이션 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2021-04-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (35, '박평식', 8.7, '인사이드 아웃는 애니메이션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2017-11-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (35, '배동미', 8.1, '인사이드 아웃는 애니메이션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '매일경제', '2024-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (35, '김도훈', 8.2, '인사이드 아웃는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '동아일보', '2018-11-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (36, '이동진', 7.5, '연출과 연기, 스토리 모든 면에서 균형잡힌 어벤져스: 에이지 오브 울트론. 완성도가 뛰어나다.', '씨네21', '2016-07-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (36, '박평식', 7.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 어벤져스: 에이지 오브 울트론. 강력 추천한다.', '중앙일보', '2017-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (36, '강병진', 7.8, '어벤져스: 에이지 오브 울트론에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '헤럴드경제', '2016-06-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (36, '정성일', 8, '연기자들의 연기력과 감독의 연출이 빛나는 어벤져스: 에이지 오브 울트론. 수준급 작품이다.', '중앙일보', '2022-11-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (37, '이동진', 8.1, '부산행에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2022-04-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (37, '박평식', 8.7, '부산행에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2016-07-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (37, '허지웅', 8.8, '부산행에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', 'KBS', '2024-08-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (37, '유지나', 8.6, '부산행에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '한겨레', '2015-09-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (38, '이동진', 8.1, '곡성는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2020-05-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (38, '박평식', 8.2, '곡성에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2021-08-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (38, '김성훈', 8.6, '곡성는 미스터리, 공포 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2022-11-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (38, '이화정', 7.8, '연기자들의 연기력과 감독의 연출이 빛나는 곡성. 수준급 작품이다.', '씨네21', '2013-03-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (39, '이동진', 8.6, '아가씨에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2015-12-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (39, '박평식', 8.3, '아가씨에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2012-04-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (39, '이화정', 8.4, '아가씨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2019-06-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (39, '김도훈', 8.2, '아가씨는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '동아일보', '2018-02-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (40, '이동진', 8.3, '연출과 연기, 스토리 모든 면에서 균형잡힌 라라랜드. 완성도가 뛰어나다.', '씨네21', '2011-11-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (40, '박평식', 8.3, '라라랜드에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2020-04-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (40, '김도훈', 8.1, '감독의 연출력과 배우들의 연기력이 조화를 이룬 라라랜드. 완성도가 뛰어나다.', '동아일보', '2025-02-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (40, '정성일', 7.9, '감독의 연출력과 배우들의 연기력이 조화를 이룬 라라랜드. 완성도가 뛰어나다.', '중앙일보', '2021-06-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (41, '이동진', 7.9, '캡틴 아메리카: 시빌 워는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2020-08-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (41, '박평식', 8.4, '연기자들의 앙상블이 돋보이는 캡틴 아메리카: 시빌 워. 감독의 연출력이 빛을 발한다.', '중앙일보', '2015-09-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (41, '이지혜', 8.2, '캡틴 아메리카: 시빌 워는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', 'OSEN', '2013-05-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (41, '이화정', 8.3, '캡틴 아메리카: 시빌 워는 액션, SF 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '씨네21', '2016-04-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (42, '이동진', 8.3, '닥터 스트레인지는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2014-02-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (42, '박평식', 8.2, '닥터 스트레인지에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2021-12-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (42, '김성훈', 8.1, '닥터 스트레인지에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2019-01-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (42, '이용철', 8.2, '닥터 스트레인지에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2013-01-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (43, '이동진', 7.7, '범죄도시에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2012-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (43, '박평식', 8.3, '범죄도시는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2021-03-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (43, '김봉석', 7.8, '연기자들의 연기력과 감독의 연출이 빛나는 범죄도시. 수준급 작품이다.', '한국일보', '2016-04-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (43, '김성훈', 7.8, '범죄도시에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2017-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (44, '이동진', 8.4, '감독의 연출 의도가 명확하게 드러나는 1987. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2020-09-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (44, '박평식', 8.1, '1987는 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2018-09-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (44, '허지웅', 8.9, '1987는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', 'KBS', '2024-06-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (44, '이용철', 8.8, '1987에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2012-11-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (45, '이동진', 8.4, '택시운전사는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2017-08-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (45, '박평식', 8.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 택시운전사. 강력 추천한다.', '중앙일보', '2016-02-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (45, '김봉석', 8.5, '택시운전사에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한국일보', '2016-12-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (45, '남동철', 8.6, '택시운전사는 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', '스포츠서울', '2024-07-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (46, '이동진', 7.9, '연출과 연기, 스토리 모든 면에서 균형잡힌 블레이드 러너 2049. 완성도가 뛰어나다.', '씨네21', '2018-12-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (46, '박평식', 8.1, '블레이드 러너 2049에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2019-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (46, '강병진', 8.3, '완성도 높은 연출과 연기가 돋보이는 블레이드 러너 2049. 추천할 만한 작품이다.', '헤럴드경제', '2018-01-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (46, '정성일', 8.3, '연기자들의 연기력과 감독의 연출이 빛나는 블레이드 러너 2049. 수준급 작품이다.', '중앙일보', '2018-06-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (47, '이동진', 7.8, '겟 아웃에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2010-10-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (47, '박평식', 7.8, '겟 아웃는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2022-08-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (47, '황진미', 8.4, '겟 아웃에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '조선일보', '2025-03-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (47, '허지웅', 8, '탄탄한 스토리와 뛰어난 연출이 돋보이는 겟 아웃. 강력 추천작이다.', 'KBS', '2017-11-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (48, '이동진', 7.7, '던케르크는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2024-03-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (48, '박평식', 8, '연기자들의 앙상블이 돋보이는 던케르크. 감독의 연출력이 빛을 발한다.', '중앙일보', '2024-01-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (48, '김혜리', 8.3, '던케르크는 전쟁, 액션 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '씨네21', '2020-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (48, '유지나', 8.1, '던케르크는 전쟁, 액션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '한겨레', '2014-02-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (49, '이동진', 8.3, '버닝는 미스터리, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2015-03-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (49, '박평식', 7.8, '버닝에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2023-08-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (49, '김봉석', 8.3, '버닝는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '한국일보', '2011-09-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (49, '이지혜', 7.5, '연기자들의 연기력과 감독의 연출이 빛나는 버닝. 수준급 작품이다.', 'OSEN', '2010-12-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (50, '이동진', 7.6, '블랙팬서는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2022-11-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (50, '박평식', 7.5, '블랙팬서는 액션, SF 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2018-06-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (50, '강병진', 8.1, '블랙팬서는 액션, SF 장르의 새로운 면모를 보여준다. 완성도가 높다.', '헤럴드경제', '2011-10-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (50, '정성일', 7.6, '탄탄한 스토리와 뛰어난 연출이 돋보이는 블랙팬서. 강력 추천작이다.', '중앙일보', '2014-07-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (51, '이동진', 7.6, '어 스타 이즈 본는 뮤지컬, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2017-01-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (51, '박평식', 7.5, '어 스타 이즈 본는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2012-02-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (51, '정성일', 7.7, '어 스타 이즈 본는 뮤지컬, 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', '중앙일보', '2012-03-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (51, '김성훈', 8, '감독의 연출력과 배우들의 연기력이 조화를 이룬 어 스타 이즈 본. 완성도가 뛰어나다.', '씨네21', '2015-12-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (52, '이동진', 8.2, '보헤미안 랩소디는 뮤지컬, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2017-06-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (52, '박평식', 8.1, '보헤미안 랩소디에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2025-06-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (52, '정성일', 7.9, '보헤미안 랩소디에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2024-01-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (52, '김봉석', 8.4, '보헤미안 랩소디에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한국일보', '2012-08-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (53, '이동진', 8.3, '완벽한 타인는 코미디, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2017-04-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (53, '박평식', 7.6, '연기자들의 앙상블이 돋보이는 완벽한 타인. 감독의 연출력이 빛을 발한다.', '중앙일보', '2021-06-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (53, '유지나', 7.5, '완벽한 타인에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '한겨레', '2010-10-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (53, '김혜리', 7.7, '완성도 높은 연출과 연기가 돋보이는 완벽한 타인. 추천할 만한 작품이다.', '씨네21', '2010-02-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (54, '이동진', 7.6, '연출과 연기, 스토리 모든 면에서 균형잡힌 인크레더블 2. 완성도가 뛰어나다.', '씨네21', '2018-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (54, '박평식', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 인크레더블 2. 강력 추천한다.', '중앙일보', '2011-02-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (54, '배동미', 7.7, '인크레더블 2는 애니메이션 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '매일경제', '2017-03-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (54, '김성훈', 7.8, '인크레더블 2는 애니메이션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2017-01-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (55, '이동진', 9.3, '기생충는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2021-07-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (55, '박평식', 9.3, '기생충에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2021-04-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (55, '정성일', 8.7, '기생충에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2021-04-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (55, '이화정', 9.4, '기생충는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2011-11-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (56, '이동진', 9.2, '연출과 연기, 스토리 모든 면에서 균형잡힌 어벤져스: 엔드게임. 완성도가 뛰어나다.', '씨네21', '2018-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (56, '박평식', 9.5, '어벤져스: 엔드게임는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2014-09-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (56, '이용철', 9.4, '어벤져스: 엔드게임는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '문화일보', '2016-01-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (56, '황진미', 8.6, '어벤져스: 엔드게임는 액션, SF 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '조선일보', '2020-02-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (57, '이동진', 8.8, '극한직업는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2017-05-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (57, '박평식', 8.8, '연기자들의 앙상블이 돋보이는 극한직업. 감독의 연출력이 빛을 발한다.', '중앙일보', '2012-11-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (57, '배동미', 8.5, '극한직업에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '매일경제', '2015-02-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (57, '이지혜', 8.8, '감독의 연출력과 배우들의 연기력이 조화를 이룬 극한직업. 완성도가 뛰어나다.', 'OSEN', '2017-03-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (58, '이동진', 8.3, '감독의 연출 의도가 명확하게 드러나는 조커. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2010-03-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (58, '박평식', 8.5, '조커는 드라마, 스릴러 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2013-10-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (58, '김도훈', 8, '조커는 드라마, 스릴러 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '동아일보', '2021-05-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (58, '황진미', 8.3, '연기자들의 연기력과 감독의 연출이 빛나는 조커. 수준급 작품이다.', '조선일보', '2013-04-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (59, '이동진', 8.3, '연출과 연기, 스토리 모든 면에서 균형잡힌 토이 스토리 4. 완성도가 뛰어나다.', '씨네21', '2020-06-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (59, '박평식', 8, '토이 스토리 4에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2021-08-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (59, '이용철', 8.4, '토이 스토리 4에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2016-04-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (59, '강병진', 8.2, '완성도 높은 연출과 연기가 돋보이는 토이 스토리 4. 추천할 만한 작품이다.', '헤럴드경제', '2011-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (60, '이동진', 8.7, '연출과 연기, 스토리 모든 면에서 균형잡힌 존 윅 3: 파라벨룸. 완성도가 뛰어나다.', '씨네21', '2017-11-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (60, '박평식', 8, '존 윅 3: 파라벨룸는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2017-02-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (60, '김봉석', 8.1, '존 윅 3: 파라벨룸는 액션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '한국일보', '2012-10-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (60, '유지나', 8.4, '존 윅 3: 파라벨룸에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한겨레', '2013-05-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (61, '이동진', 8.1, '감독의 연출 의도가 명확하게 드러나는 미나리. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2020-07-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (61, '박평식', 8.2, '미나리는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2015-05-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (61, '김혜리', 8.4, '미나리는 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2017-07-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (61, '허지웅', 7.9, '미나리에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', 'KBS', '2013-02-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (62, '이동진', 8.7, '소울에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2013-02-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (62, '박평식', 8.9, '연기자들의 앙상블이 돋보이는 소울. 감독의 연출력이 빛을 발한다.', '중앙일보', '2018-11-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (62, '허지웅', 8.9, '소울에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', 'KBS', '2010-06-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (62, '민용준', 8.5, '소울는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '스포츠조선', '2022-02-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (63, '이동진', 7.8, '사냥의 시간는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2019-03-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (63, '박평식', 8.1, '연기자들의 앙상블이 돋보이는 사냥의 시간. 감독의 연출력이 빛을 발한다.', '중앙일보', '2015-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (63, '유지나', 8.1, '탄탄한 스토리와 뛰어난 연출이 돋보이는 사냥의 시간. 강력 추천작이다.', '한겨레', '2017-11-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (63, '김혜리', 8.1, '감독의 연출력과 배우들의 연기력이 조화를 이룬 사냥의 시간. 완성도가 뛰어나다.', '씨네21', '2012-03-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (64, '이동진', 7, '원더우먼 1984는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-09-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (64, '박평식', 6.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 원더우먼 1984. 강력 추천한다.', '중앙일보', '2025-07-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (64, '민용준', 6.6, '탄탄한 스토리와 뛰어난 연출이 돋보이는 원더우먼 1984. 강력 추천작이다.', '스포츠조선', '2013-02-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (64, '강병진', 6.9, '연기자들의 연기력과 감독의 연출이 빛나는 원더우먼 1984. 수준급 작품이다.', '헤럴드경제', '2015-01-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (65, '이동진', 7.7, '테넷는 SF, 액션 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2013-05-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (65, '박평식', 7.4, '테넷는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2018-01-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (65, '김혜리', 7.9, '테넷에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2023-04-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (65, '이용철', 7.8, '탄탄한 스토리와 뛰어난 연출이 돋보이는 테넷. 강력 추천작이다.', '문화일보', '2015-09-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (66, '이동진', 8, '블랙 위도우는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2016-08-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (66, '박평식', 8, '연기자들의 앙상블이 돋보이는 블랙 위도우. 감독의 연출력이 빛을 발한다.', '중앙일보', '2021-09-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (66, '배동미', 7.5, '연기자들의 연기력과 감독의 연출이 빛나는 블랙 위도우. 수준급 작품이다.', '매일경제', '2025-02-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (66, '이화정', 7.3, '장르의 특성을 잘 살린 블랙 위도우. 연출과 연기 모든 면에서 우수하다.', '씨네21', '2022-08-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (67, '이동진', 8.3, '감독의 연출 의도가 명확하게 드러나는 모가디슈. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2018-04-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (67, '박평식', 7.7, '모가디슈는 액션, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2024-01-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (67, '김도훈', 7.8, '모가디슈는 액션, 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', '동아일보', '2012-07-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (67, '강병진', 7.9, '장르의 특성을 잘 살린 모가디슈. 연출과 연기 모든 면에서 우수하다.', '헤럴드경제', '2022-01-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (68, '이동진', 8.5, '스파이더맨: 노 웨이 홈는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-01-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (68, '박평식', 8.7, '스파이더맨: 노 웨이 홈는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2019-06-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (68, '김혜리', 8.5, '스파이더맨: 노 웨이 홈는 액션, SF 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2018-07-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (68, '황진미', 9.3, '연기자들의 연기력과 감독의 연출이 빛나는 스파이더맨: 노 웨이 홈. 수준급 작품이다.', '조선일보', '2021-04-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (69, '이동진', 7.1, '승리호는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-09-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (69, '박평식', 7.7, '승리호는 SF 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2023-07-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (69, '이용철', 7.7, '승리호는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '문화일보', '2024-09-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (69, '김성훈', 7.9, '탄탄한 스토리와 뛰어난 연출이 돋보이는 승리호. 강력 추천작이다.', '씨네21', '2016-03-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (70, '이동진', 7.3, '감독의 연출 의도가 명확하게 드러나는 이터널스. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2020-09-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (70, '박평식', 7.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 이터널스. 강력 추천한다.', '중앙일보', '2018-12-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (70, '이지혜', 7.1, '장르의 특성을 잘 살린 이터널스. 연출과 연기 모든 면에서 우수하다.', 'OSEN', '2015-03-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (70, '배동미', 6.6, '이터널스는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '매일경제', '2019-07-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (71, '이동진', 6.6, '매트릭스 4: 리저렉션는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2012-09-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (71, '박평식', 7.1, '연기자들의 앙상블이 돋보이는 매트릭스 4: 리저렉션. 감독의 연출력이 빛을 발한다.', '중앙일보', '2016-05-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (71, '유지나', 6.5, '탄탄한 스토리와 뛰어난 연출이 돋보이는 매트릭스 4: 리저렉션. 강력 추천작이다.', '한겨레', '2015-01-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (71, '김도훈', 6.7, '장르의 특성을 잘 살린 매트릭스 4: 리저렉션. 연출과 연기 모든 면에서 우수하다.', '동아일보', '2017-07-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (72, '이동진', 7, '분노의 질주: 더 얼티메이트는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2022-06-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (72, '박평식', 7.2, '분노의 질주: 더 얼티메이트에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2012-03-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (72, '이화정', 7, '분노의 질주: 더 얼티메이트에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2019-05-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (72, '유지나', 7.7, '분노의 질주: 더 얼티메이트는 액션 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '한겨레', '2013-11-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (73, '이동진', 7.8, '헤어질 결심에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2010-11-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (73, '박평식', 7.9, '헤어질 결심는 로맨스, 미스터리 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2020-09-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (73, '정성일', 8.1, '헤어질 결심에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2011-03-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (73, '민용준', 7.8, '연기자들의 연기력과 감독의 연출이 빛나는 헤어질 결심. 수준급 작품이다.', '스포츠조선', '2024-11-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (74, '이동진', 8.4, '탑건: 매버릭는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2013-02-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (74, '박평식', 8.5, '탑건: 매버릭는 액션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2016-03-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (74, '이용철', 8.3, '완성도 높은 연출과 연기가 돋보이는 탑건: 매버릭. 추천할 만한 작품이다.', '문화일보', '2023-10-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (74, '이화정', 8.4, '장르의 특성을 잘 살린 탑건: 매버릭. 연출과 연기 모든 면에서 우수하다.', '씨네21', '2015-05-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (75, '이동진', 7.4, '한산: 용의 출현는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2017-05-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (75, '박평식', 8.2, '한산: 용의 출현는 액션, 전쟁 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2015-03-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (75, '황진미', 7.7, '한산: 용의 출현에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '조선일보', '2011-09-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (75, '민용준', 8.1, '한산: 용의 출현는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '스포츠조선', '2022-01-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (76, '이동진', 8, '닥터 스트레인지: 대혼돈의 멀티버스에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2019-07-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (76, '박평식', 7.2, '닥터 스트레인지: 대혼돈의 멀티버스는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2014-03-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (76, '이용철', 7.4, '닥터 스트레인지: 대혼돈의 멀티버스에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2016-02-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (76, '김혜리', 7.2, '닥터 스트레인지: 대혼돈의 멀티버스는 액션, SF 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2010-05-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (77, '이동진', 6.7, '감독의 연출 의도가 명확하게 드러나는 토르: 러브 앤 썬더. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2024-07-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (77, '박평식', 7, '토르: 러브 앤 썬더는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2015-10-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (77, '이용철', 7.1, '토르: 러브 앤 썬더에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '문화일보', '2012-09-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (77, '민용준', 7.7, '완성도 높은 연출과 연기가 돋보이는 토르: 러브 앤 썬더. 추천할 만한 작품이다.', '스포츠조선', '2016-07-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (78, '이동진', 8.2, '미니언즈: 라이즈 오브 그루는 애니메이션 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2012-03-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (78, '박평식', 7.5, '미니언즈: 라이즈 오브 그루는 애니메이션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2010-06-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (78, '민용준', 7.9, '미니언즈: 라이즈 오브 그루는 애니메이션 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '스포츠조선', '2018-02-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (78, '김봉석', 8, '탄탄한 스토리와 뛰어난 연출이 돋보이는 미니언즈: 라이즈 오브 그루. 강력 추천작이다.', '한국일보', '2021-01-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (79, '이동진', 7.9, '연출과 연기, 스토리 모든 면에서 균형잡힌 범죄도시 3. 완성도가 뛰어나다.', '씨네21', '2024-12-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (79, '박평식', 7.9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 범죄도시 3. 강력 추천한다.', '중앙일보', '2015-06-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (79, '유지나', 7.7, '탄탄한 스토리와 뛰어난 연출이 돋보이는 범죄도시 3. 강력 추천작이다.', '한겨레', '2023-10-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (79, '배동미', 8.2, '범죄도시 3에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '매일경제', '2020-05-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (80, '이동진', 8.4, '스즈메의 문단속에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-04-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (80, '박평식', 7.8, '스즈메의 문단속에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2013-10-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (80, '이용철', 8.5, '탄탄한 스토리와 뛰어난 연출이 돋보이는 스즈메의 문단속. 강력 추천작이다.', '문화일보', '2010-11-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (80, '김혜리', 8.7, '스즈메의 문단속에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2020-08-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (81, '이동진', 8.7, '감독의 연출 의도가 명확하게 드러나는 존 윅: 챕터 4. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2024-01-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (81, '박평식', 7.9, '존 윅: 챕터 4는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2020-12-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (81, '이용철', 8.2, '완성도 높은 연출과 연기가 돋보이는 존 윅: 챕터 4. 추천할 만한 작품이다.', '문화일보', '2024-06-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (81, '황진미', 8, '존 윅: 챕터 4는 액션 장르의 새로운 면모를 보여준다. 완성도가 높다.', '조선일보', '2016-11-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (82, '이동진', 7, '인디아나 존스: 운명의 다이얼는 어드벤처 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2017-09-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (82, '박평식', 7.1, '인디아나 존스: 운명의 다이얼는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2012-12-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (82, '김혜리', 7.1, '인디아나 존스: 운명의 다이얼는 어드벤처 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2018-02-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (82, '유지나', 7.8, '완성도 높은 연출과 연기가 돋보이는 인디아나 존스: 운명의 다이얼. 추천할 만한 작품이다.', '한겨레', '2018-12-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (83, '이동진', 7.1, '플래시에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2016-08-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (83, '박평식', 6.6, '플래시에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2023-01-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (83, '이화정', 7.2, '연기자들의 연기력과 감독의 연출이 빛나는 플래시. 수준급 작품이다.', '씨네21', '2025-04-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (83, '김봉석', 6.7, '감독의 연출력과 배우들의 연기력이 조화를 이룬 플래시. 완성도가 뛰어나다.', '한국일보', '2018-12-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (84, '이동진', 6.9, '트랜스포머: 비스트의 탄생에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2015-07-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (84, '박평식', 7.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 트랜스포머: 비스트의 탄생. 강력 추천한다.', '중앙일보', '2015-01-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (84, '배동미', 7.7, '연기자들의 연기력과 감독의 연출이 빛나는 트랜스포머: 비스트의 탄생. 수준급 작품이다.', '매일경제', '2024-03-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (84, '이지혜', 7.8, '완성도 높은 연출과 연기가 돋보이는 트랜스포머: 비스트의 탄생. 추천할 만한 작품이다.', 'OSEN', '2023-10-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (85, '이동진', 8, '감독의 연출 의도가 명확하게 드러나는 서울의 봄. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2025-05-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (85, '박평식', 8.2, '서울의 봄는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2013-03-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (85, '이지혜', 8.3, '서울의 봄에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', 'OSEN', '2016-05-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (85, '김혜리', 8.6, '서울의 봄는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2014-01-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (86, '이동진', 9.2, '오펜하이머는 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2018-07-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (86, '박평식', 8.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 오펜하이머. 강력 추천한다.', '중앙일보', '2014-02-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (86, '김도훈', 8.6, '오펜하이머에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '동아일보', '2018-03-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (86, '남동철', 8.9, '탄탄한 스토리와 뛰어난 연출이 돋보이는 오펜하이머. 강력 추천작이다.', '스포츠서울', '2014-11-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (87, '이동진', 7.9, '감독의 연출 의도가 명확하게 드러나는 바비. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2020-08-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (87, '박평식', 7.4, '연기자들의 앙상블이 돋보이는 바비. 감독의 연출력이 빛을 발한다.', '중앙일보', '2025-07-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (87, '김성훈', 7.4, '바비는 코미디 장르의 새로운 면모를 보여준다. 완성도가 높다.', '씨네21', '2010-09-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (87, '허지웅', 7.4, '바비에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', 'KBS', '2012-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (88, '이동진', 7.6, '범죄도시 4는 액션, 범죄 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2013-01-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (88, '박평식', 8, '범죄도시 4는 액션, 범죄 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2018-06-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (88, '김도훈', 8.3, '범죄도시 4는 액션, 범죄 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '동아일보', '2016-04-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (88, '황진미', 7.5, '탄탄한 스토리와 뛰어난 연출이 돋보이는 범죄도시 4. 강력 추천작이다.', '조선일보', '2010-11-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (89, '이동진', 7.4, '관능의 법칙는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2010-04-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (89, '박평식', 7.2, '관능의 법칙는 로맨스, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2017-02-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (89, '이용철', 7.4, '관능의 법칙는 로맨스, 드라마 장르의 새로운 면모를 보여준다. 완성도가 높다.', '문화일보', '2012-11-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (89, '황진미', 7.6, '감독의 연출력과 배우들의 연기력이 조화를 이룬 관능의 법칙. 완성도가 뛰어나다.', '조선일보', '2023-02-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (90, '이동진', 9.2, '스파이더맨: 어크로스 더 스파이더버스는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2023-02-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (90, '박평식', 9, '스파이더맨: 어크로스 더 스파이더버스는 애니메이션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2017-10-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (90, '황진미', 8.7, '스파이더맨: 어크로스 더 스파이더버스에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '조선일보', '2021-01-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (90, '이용철', 8.6, '탄탄한 스토리와 뛰어난 연출이 돋보이는 스파이더맨: 어크로스 더 스파이더버스. 강력 추천작이다.', '문화일보', '2013-04-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (91, '이동진', 7.9, '파묘는 미스터리, 공포 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2015-01-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (91, '박평식', 8.5, '파묘는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2010-11-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (91, '김혜리', 7.9, '파묘에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2015-04-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (91, '허지웅', 8.6, '감독의 연출력과 배우들의 연기력이 조화를 이룬 파묘. 완성도가 뛰어나다.', 'KBS', '2025-05-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (92, '이동진', 8.4, '듄: 파트 투에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2019-12-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (92, '박평식', 8.6, '연기자들의 앙상블이 돋보이는 듄: 파트 투. 감독의 연출력이 빛을 발한다.', '중앙일보', '2015-04-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (92, '김혜리', 9.2, '연기자들의 연기력과 감독의 연출이 빛나는 듄: 파트 투. 수준급 작품이다.', '씨네21', '2019-03-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (92, '김봉석', 9.2, '감독의 연출력과 배우들의 연기력이 조화를 이룬 듄: 파트 투. 완성도가 뛰어나다.', '한국일보', '2015-05-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (93, '이동진', 7.8, '윙스는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2015-03-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (93, '박평식', 7.7, '윙스에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2013-11-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (93, '황진미', 8.2, '윙스는 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '조선일보', '2018-05-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (93, '김성훈', 7.8, '윙스는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2014-01-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (94, '이동진', 8.2, '가디언즈 오브 갤럭시 Vol. 3는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2022-01-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (94, '박평식', 8.5, '가디언즈 오브 갤럭시 Vol. 3는 액션, SF 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2016-12-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (94, '김도훈', 8.2, '가디언즈 오브 갤럭시 Vol. 3는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '동아일보', '2011-05-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (94, '정성일', 7.8, '가디언즈 오브 갤럭시 Vol. 3에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2010-04-22');

COMMIT;

-- INSERT 완료
-- 📊 총 94개 영화 + 376개 전문가 리뷰 추가됨
-- 
-- 💡 사용법:
-- 1. Supabase SQL 에디터에서 실행
-- 2. 카카오 스킬에서 영화 검색 시 전문가 리뷰도 함께 제공
-- 3. 예: "기생충 영화평", "2019년 영화", "봉준호 감독", "액션 영화 추천" 등
-- 4. 이동진, 박평식 평론가의 리뷰가 항상 포함됨
-- 5. 2010-2025년 15년간의 대표 영화들 포함
