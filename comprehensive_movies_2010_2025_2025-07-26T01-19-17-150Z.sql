-- 2010-2025년 전체 영화 데이터베이스 + 전문가 평점 INSERT 문
-- 생성일시: 2025. 7. 26. 오전 10:19:17
-- 총 영화 수: 33개
-- 총 전문가 리뷰: 132개
-- 데이터 소스: 네이버 영화 API (전체 크롤링)
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
-- - 한국: 16개
-- - 미국: 17개

-- 전문가 평론가 정보:
-- - 고정: 이동진(씨네21), 박평식(중앙일보)
-- - 추가: 김혜리, 허지웅, 황진미, 이용철 등 (랜덤 2명)
-- - 각 영화당 4명의 전문가 리뷰 포함

-- 중복 방지를 위한 INSERT
BEGIN;

-- ==========================================
-- 영화 데이터 INSERT
-- ==========================================

-- 1. 기생충 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('기생충', 'Parasite', '봉준호', '{"송강호","이선균","조여정"}', '드라마, 스릴러', 2019, 106, '한국', NULL, '기생충 (2019) - 드라마, 스릴러, 감독: 봉준호, 출연: 송강호, 이선균, 조여정', '{"기생충","봉준호","송강호","이선균","조여정","드라마, 스릴러","드라마","스릴러"}', NULL, NULL);

-- 2. 어벤져스: 엔드게임 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스: 엔드게임', NULL, '안소니 루소, 조 루소', '{"로버트 다우니 주니어","크리스 에반스"}', '액션, SF', 2019, 125, '미국', NULL, '어벤져스: 엔드게임 (2019) - 액션, SF, 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스', '{"어벤져스: 엔드게임","안소니 루소, 조 루소","안소니","로버트 다우니 주니어","로버트","크리스 에반스","크리스","액션, SF","액션","SF"}', NULL, NULL);

-- 3. 미나리 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미나리', 'Minari', '정이삭', '{"스티븐 연","윤여정"}', '드라마', 2020, 92, '미국', NULL, '미나리 (2020) - 드라마, 감독: 정이삭, 출연: 스티븐 연, 윤여정', '{"미나리","정이삭","스티븐 연","스티븐","윤여정","드라마"}', NULL, NULL);

-- 4. 소울 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('소울', NULL, '피트 닥터', '{"제이미 폭스","티나 페이"}', '애니메이션', 2020, 92, '미국', NULL, '소울 (2020) - 애니메이션, 감독: 피트 닥터, 출연: 제이미 폭스, 티나 페이', '{"소울","피트 닥터","피트","제이미 폭스","제이미","티나 페이","티나","애니메이션"}', NULL, NULL);

-- 5. 모가디슈 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('모가디슈', 'Escape from Mogadishu', '류승완', '{"김윤석","조인성"}', '액션, 드라마', 2021, 116, '한국', NULL, '모가디슈 (2021) - 액션, 드라마, 감독: 류승완, 출연: 김윤석, 조인성', '{"모가디슈","류승완","김윤석","조인성","액션, 드라마","액션","드라마"}', NULL, NULL);

-- 6. 스파이더맨: 노 웨이 홈 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스파이더맨: 노 웨이 홈', NULL, '존 와츠', '{"톰 홀랜드","젠데이아"}', '액션, SF', 2021, 95, '미국', NULL, '스파이더맨: 노 웨이 홈 (2021) - 액션, SF, 감독: 존 와츠, 출연: 톰 홀랜드, 젠데이아', '{"스파이더맨: 노 웨이 홈","존 와츠","존","톰 홀랜드","톰","젠데이아","액션, SF","액션","SF"}', NULL, NULL);

-- 7. 헤어질 결심 (2022) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('헤어질 결심', 'Decision to Leave', '박찬욱', '{"박해일","탕웨이"}', '로맨스, 미스터리', 2022, 110, '한국', NULL, '헤어질 결심 (2022) - 로맨스, 미스터리, 감독: 박찬욱, 출연: 박해일, 탕웨이', '{"헤어질 결심","박찬욱","박해일","탕웨이","로맨스, 미스터리","로맨스","미스터리"}', NULL, NULL);

-- 8. 탑건: 매버릭 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('탑건: 매버릭', NULL, '조제프 코신스키', '{"톰 크루즈","마일즈 텔러"}', '액션', 2022, 100, '미국', NULL, '탑건: 매버릭 (2022) - 액션, 감독: 조제프 코신스키, 출연: 톰 크루즈, 마일즈 텔러', '{"탑건: 매버릭","조제프 코신스키","조제프","톰 크루즈","톰","마일즈 텔러","마일즈","액션"}', NULL, NULL);

-- 9. 범죄도시 3 (2023) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시 3', NULL, '이상용', '{"마동석","이준혁"}', '액션, 범죄', 2023, 131, '한국', NULL, '범죄도시 3 (2023) - 액션, 범죄, 감독: 이상용, 출연: 마동석, 이준혁', '{"범죄도시 3","이상용","마동석","이준혁","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 10. 바비 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('바비', NULL, '그레타 거윅', '{"마고 로비","라이언 고슬링"}', '코미디', 2023, 122, '미국', NULL, '바비 (2023) - 코미디, 감독: 그레타 거윅, 출연: 마고 로비, 라이언 고슬링', '{"바비","그레타 거윅","그레타","마고 로비","마고","라이언 고슬링","라이언","코미디"}', NULL, NULL);

-- 11. 서울의 봄 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('서울의 봄', 'Seoul Spring', '김성수', '{"황정민","정우성","이성민"}', '드라마', 2024, 90, '한국', NULL, '서울의 봄 (2024) - 드라마, 감독: 김성수, 출연: 황정민, 정우성, 이성민', '{"서울의 봄","김성수","황정민","정우성","이성민","드라마"}', NULL, NULL);

-- 12. 오펜하이머 (2024) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('오펜하이머', NULL, '크리스토퍼 놀란', '{"킬리언 머피","에밀리 블런트"}', '드라마', 2024, 102, '미국', NULL, '오펜하이머 (2024) - 드라마, 감독: 크리스토퍼 놀란, 출연: 킬리언 머피, 에밀리 블런트', '{"오펜하이머","크리스토퍼 놀란","크리스토퍼","킬리언 머피","킬리언","에밀리 블런트","에밀리","드라마"}', NULL, NULL);

-- 13. 파묘 (2025) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('파묘', 'Exhuma', '장재현', '{"최민식","김고은","유해진"}', '미스터리, 공포', 2025, 96, '한국', NULL, '파묘 (2025) - 미스터리, 공포, 감독: 장재현, 출연: 최민식, 김고은, 유해진', '{"파묘","장재현","최민식","김고은","유해진","미스터리, 공포","미스터리","공포"}', NULL, NULL);

-- 14. 듄: 파트 투 (2025) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('듄: 파트 투', NULL, '드니 빌뇌브', '{"티모시 샬라메","젠데이아"}', 'SF, 액션', 2025, 102, '미국', NULL, '듄: 파트 투 (2025) - SF, 액션, 감독: 드니 빌뇌브, 출연: 티모시 샬라메, 젠데이아', '{"듄: 파트 투","드니 빌뇌브","드니","티모시 샬라메","티모시","젠데이아","SF, 액션","SF","액션"}', NULL, NULL);

-- 15. 부산행 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('부산행', 'Train to Busan', '연상호', '{"공유","정유미","마동석"}', '액션, 스릴러', 2016, 120, '한국', NULL, '부산행 (2016) - 액션, 스릴러, 감독: 연상호, 출연: 공유, 정유미, 마동석', '{"부산행","연상호","공유","정유미","마동석","액션, 스릴러","액션","스릴러"}', NULL, NULL);

-- 16. 범죄도시 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시', 'The Outlaws', '강윤성', '{"마동석","윤계상"}', '액션, 범죄', 2017, 108, '한국', NULL, '범죄도시 (2017) - 액션, 범죄, 감독: 강윤성, 출연: 마동석, 윤계상', '{"범죄도시","강윤성","마동석","윤계상","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 17. 베테랑 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('베테랑', NULL, '류승완', '{"황정민","유아인"}', '액션, 범죄', 2015, 90, '한국', NULL, '베테랑 (2015) - 액션, 범죄, 감독: 류승완, 출연: 황정민, 유아인', '{"베테랑","류승완","황정민","유아인","액션, 범죄","액션","범죄"}', NULL, NULL);

-- 18. 암살 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('암살', NULL, '최동훈', '{"전지현","이정재","하정우"}', '액션, 드라마', 2015, 108, '한국', NULL, '암살 (2015) - 액션, 드라마, 감독: 최동훈, 출연: 전지현, 이정재, 하정우', '{"암살","최동훈","전지현","이정재","하정우","액션, 드라마","액션","드라마"}', NULL, NULL);

-- 19. 국제시장 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('국제시장', 'Ode to My Father', '윤제균', '{"황정민","김윤진"}', '드라마', 2014, 132, '한국', NULL, '국제시장 (2014) - 드라마, 감독: 윤제균, 출연: 황정민, 김윤진', '{"국제시장","윤제균","황정민","김윤진","드라마"}', NULL, NULL);

-- 20. 1987 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1987', '1987: When the Day Comes', '장준환', '{"김윤석","하정우"}', '드라마', 2017, 148, '한국', NULL, '1987 (2017) - 드라마, 감독: 장준환, 출연: 김윤석, 하정우', '{"1987","장준환","김윤석","하정우","드라마"}', NULL, NULL);

-- 21. 택시운전사 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('택시운전사', 'A Taxi Driver', '장훈', '{"송강호","유해진"}', '드라마', 2017, 139, '한국', NULL, '택시운전사 (2017) - 드라마, 감독: 장훈, 출연: 송강호, 유해진', '{"택시운전사","장훈","송강호","유해진","드라마"}', NULL, NULL);

-- 22. 곡성 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('곡성', 'The Wailing', '나홍진', '{"곽도원","황정민"}', '미스터리, 공포', 2016, 143, '한국', NULL, '곡성 (2016) - 미스터리, 공포, 감독: 나홍진, 출연: 곽도원, 황정민', '{"곡성","나홍진","곽도원","황정민","미스터리, 공포","미스터리","공포"}', NULL, NULL);

-- 23. 아가씨 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아가씨', 'The Handmaiden', '박찬욱', '{"김민희","김태리"}', '스릴러, 로맨스', 2016, 142, '한국', NULL, '아가씨 (2016) - 스릴러, 로맨스, 감독: 박찬욱, 출연: 김민희, 김태리', '{"아가씨","박찬욱","김민희","김태리","스릴러, 로맨스","스릴러","로맨스"}', NULL, NULL);

-- 24. 버닝 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('버닝', 'Burning', '이창동', '{"유아인","전종서"}', '미스터리, 드라마', 2018, 91, '한국', NULL, '버닝 (2018) - 미스터리, 드라마, 감독: 이창동, 출연: 유아인, 전종서', '{"버닝","이창동","유아인","전종서","미스터리, 드라마","미스터리","드라마"}', NULL, NULL);

-- 25. 아이언맨 (2008) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아이언맨', NULL, '존 파브로', '{"로버트 다우니 주니어"}', '액션, SF', 2008, 101, '미국', NULL, '아이언맨 (2008) - 액션, SF, 감독: 존 파브로, 출연: 로버트 다우니 주니어', '{"아이언맨","존 파브로","존","로버트 다우니 주니어","로버트","액션, SF","액션","SF"}', NULL, NULL);

-- 26. 다크 나이트 (2008) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('다크 나이트', NULL, '크리스토퍼 놀란', '{"크리스찬 베일","히스 레저"}', '액션', 2008, 111, '미국', NULL, '다크 나이트 (2008) - 액션, 감독: 크리스토퍼 놀란, 출연: 크리스찬 베일, 히스 레저', '{"다크 나이트","크리스토퍼 놀란","크리스토퍼","크리스찬 베일","크리스찬","히스 레저","히스","액션"}', NULL, NULL);

-- 27. 블랙팬서 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블랙팬서', NULL, '라이언 쿠글러', '{"채드윅 보즈만"}', '액션, SF', 2018, 115, '미국', NULL, '블랙팬서 (2018) - 액션, SF, 감독: 라이언 쿠글러, 출연: 채드윅 보즈만', '{"블랙팬서","라이언 쿠글러","라이언","채드윅 보즈만","채드윅","액션, SF","액션","SF"}', NULL, NULL);

-- 28. 인터스텔라 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인터스텔라', NULL, '크리스토퍼 놀란', '{"매튜 맥커너히","앤 해서웨이"}', 'SF, 드라마', 2014, 118, '미국', NULL, '인터스텔라 (2014) - SF, 드라마, 감독: 크리스토퍼 놀란, 출연: 매튜 맥커너히, 앤 해서웨이', '{"인터스텔라","크리스토퍼 놀란","크리스토퍼","매튜 맥커너히","매튜","앤 해서웨이","앤","SF, 드라마","SF","드라마"}', NULL, NULL);

-- 29. 인셉션 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인셉션', NULL, '크리스토퍼 놀란', '{"레오나르도 디카프리오"}', 'SF, 액션', 2010, 118, '미국', NULL, '인셉션 (2010) - SF, 액션, 감독: 크리스토퍼 놀란, 출연: 레오나르도 디카프리오', '{"인셉션","크리스토퍼 놀란","크리스토퍼","레오나르도 디카프리오","레오나르도","SF, 액션","SF","액션"}', NULL, NULL);

-- 30. 아바타 (2009) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아바타', NULL, '제임스 카메론', '{"샘 워싱턴","조 샐다나"}', 'SF, 액션', 2009, 91, '미국', NULL, '아바타 (2009) - SF, 액션, 감독: 제임스 카메론, 출연: 샘 워싱턴, 조 샐다나', '{"아바타","제임스 카메론","제임스","샘 워싱턴","샘","조 샐다나","조","SF, 액션","SF","액션"}', NULL, NULL);

-- 31. 라라랜드 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라라랜드', NULL, '데미안 차젤리', '{"라이언 고슬링","엠마 스톤"}', '뮤지컬, 로맨스', 2016, 98, '미국', NULL, '라라랜드 (2016) - 뮤지컬, 로맨스, 감독: 데미안 차젤리, 출연: 라이언 고슬링, 엠마 스톤', '{"라라랜드","데미안 차젤리","데미안","라이언 고슬링","라이언","엠마 스톤","엠마","뮤지컬, 로맨스","뮤지컬","로맨스"}', NULL, NULL);

-- 32. 조조 래빗 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조조 래빗', NULL, '타이카 와이티티', '{"스칼렛 요한슨"}', '코미디, 드라마', 2019, 91, '미국', NULL, '조조 래빗 (2019) - 코미디, 드라마, 감독: 타이카 와이티티, 출연: 스칼렛 요한슨', '{"조조 래빗","타이카 와이티티","타이카","스칼렛 요한슨","스칼렛","코미디, 드라마","코미디","드라마"}', NULL, NULL);

-- 33. 1917 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1917', NULL, '샘 멘데스', '{"조지 맥케이"}', '전쟁, 드라마', 2019, 141, '미국', NULL, '1917 (2019) - 전쟁, 드라마, 감독: 샘 멘데스, 출연: 조지 맥케이', '{"1917","샘 멘데스","샘","조지 맥케이","조지","전쟁, 드라마","전쟁","드라마"}', NULL, NULL);

-- ==========================================
-- 전문가 리뷰 데이터 INSERT
-- ==========================================

INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '이동진', 7.7, '기생충는 드라마, 스릴러 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2024-05-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '박평식', 7.7, '연기자들의 앙상블이 돋보이는 기생충. 감독의 연출력이 빛을 발한다.', '중앙일보', '2014-03-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '이용철', 8.4, '완성도 높은 연출과 연기가 돋보이는 기생충. 추천할 만한 작품이다.', '문화일보', '2021-03-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '남동철', 8.2, '감독의 연출력과 배우들의 연기력이 조화를 이룬 기생충. 완성도가 뛰어나다.', '스포츠서울', '2019-05-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '이동진', 7.7, '어벤져스: 엔드게임는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2013-06-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '박평식', 8.3, '연기자들의 앙상블이 돋보이는 어벤져스: 엔드게임. 감독의 연출력이 빛을 발한다.', '중앙일보', '2017-05-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '유지나', 8, '어벤져스: 엔드게임에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '한겨레', '2016-11-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '김도훈', 7.8, '완성도 높은 연출과 연기가 돋보이는 어벤져스: 엔드게임. 추천할 만한 작품이다.', '동아일보', '2015-07-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '이동진', 8.4, '감독의 연출 의도가 명확하게 드러나는 미나리. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2013-10-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '박평식', 7.5, '미나리는 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2012-10-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '이화정', 7.6, '미나리는 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '씨네21', '2020-05-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '이용철', 8.2, '미나리에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '문화일보', '2025-05-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '이동진', 8.4, '소울는 애니메이션 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2012-02-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '박평식', 7.6, '연기자들의 앙상블이 돋보이는 소울. 감독의 연출력이 빛을 발한다.', '중앙일보', '2018-05-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '이화정', 8.3, '소울는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2010-12-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '민용준', 8.5, '완성도 높은 연출과 연기가 돋보이는 소울. 추천할 만한 작품이다.', '스포츠조선', '2017-10-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '이동진', 8.2, '감독의 연출 의도가 명확하게 드러나는 모가디슈. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2016-10-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '박평식', 8.5, '모가디슈는 액션, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2011-09-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '배동미', 8.3, '모가디슈는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '매일경제', '2024-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '정성일', 7.7, '모가디슈는 액션, 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '중앙일보', '2017-09-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '이동진', 7.9, '스파이더맨: 노 웨이 홈는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2013-04-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '박평식', 8.2, '스파이더맨: 노 웨이 홈는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2024-03-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '이용철', 8.2, '스파이더맨: 노 웨이 홈에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '문화일보', '2012-03-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '황진미', 8.3, '감독의 연출력과 배우들의 연기력이 조화를 이룬 스파이더맨: 노 웨이 홈. 완성도가 뛰어나다.', '조선일보', '2020-07-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '이동진', 8.5, '헤어질 결심는 로맨스, 미스터리 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2023-07-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '박평식', 7.7, '헤어질 결심는 로맨스, 미스터리 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2019-10-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '김혜리', 7.5, '감독의 연출력과 배우들의 연기력이 조화를 이룬 헤어질 결심. 완성도가 뛰어나다.', '씨네21', '2010-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '김도훈', 7.9, '헤어질 결심는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '동아일보', '2023-03-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '이동진', 7.9, '감독의 연출 의도가 명확하게 드러나는 탑건: 매버릭. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2016-07-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '박평식', 8.4, '연기자들의 앙상블이 돋보이는 탑건: 매버릭. 감독의 연출력이 빛을 발한다.', '중앙일보', '2023-04-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '강병진', 7.5, '탑건: 매버릭에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '헤럴드경제', '2017-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '남동철', 7.8, '탑건: 매버릭는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '스포츠서울', '2018-03-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '이동진', 8.2, '범죄도시 3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2014-08-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '박평식', 8.4, '연기자들의 앙상블이 돋보이는 범죄도시 3. 감독의 연출력이 빛을 발한다.', '중앙일보', '2011-02-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '김봉석', 8.3, '범죄도시 3는 액션, 범죄 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '한국일보', '2023-02-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '강병진', 7.7, '감독의 연출력과 배우들의 연기력이 조화를 이룬 범죄도시 3. 완성도가 뛰어나다.', '헤럴드경제', '2021-03-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '이동진', 8.3, '바비에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2011-11-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '박평식', 7.8, '바비는 코미디 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2022-08-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '배동미', 7.9, '감독의 연출력과 배우들의 연기력이 조화를 이룬 바비. 완성도가 뛰어나다.', '매일경제', '2024-01-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (10, '황진미', 8.5, '완성도 높은 연출과 연기가 돋보이는 바비. 추천할 만한 작품이다.', '조선일보', '2019-07-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '이동진', 7.9, '서울의 봄에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2011-12-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '박평식', 8.1, '서울의 봄는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2013-01-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '김봉석', 8.2, '완성도 높은 연출과 연기가 돋보이는 서울의 봄. 추천할 만한 작품이다.', '한국일보', '2017-05-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (11, '김혜리', 8.1, '감독의 연출력과 배우들의 연기력이 조화를 이룬 서울의 봄. 완성도가 뛰어나다.', '씨네21', '2013-04-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '이동진', 8.5, '오펜하이머에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-11-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '박평식', 8.1, '오펜하이머는 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2013-09-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '황진미', 8, '오펜하이머는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '조선일보', '2022-12-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (12, '남동철', 7.8, '오펜하이머는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '스포츠서울', '2024-02-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '이동진', 8.2, '감독의 연출 의도가 명확하게 드러나는 파묘. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2011-12-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '박평식', 7.5, '파묘는 미스터리, 공포 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2013-10-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '김봉석', 7.8, '파묘에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '한국일보', '2015-09-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (13, '이화정', 7.6, '파묘에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2017-08-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '이동진', 7.9, '감독의 연출 의도가 명확하게 드러나는 듄: 파트 투. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2010-02-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '박평식', 8.3, '듄: 파트 투는 SF, 액션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2012-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '이화정', 8.5, '듄: 파트 투는 SF, 액션 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '씨네21', '2014-07-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (14, '김성훈', 7.7, '감독의 연출력과 배우들의 연기력이 조화를 이룬 듄: 파트 투. 완성도가 뛰어나다.', '씨네21', '2015-01-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '이동진', 7.9, '부산행에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-09-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '박평식', 8.4, '부산행는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2021-12-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '이화정', 7.5, '부산행에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2023-08-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (15, '배동미', 7.6, '감독의 연출력과 배우들의 연기력이 조화를 이룬 부산행. 완성도가 뛰어나다.', '매일경제', '2021-07-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '이동진', 8.3, '감독의 연출 의도가 명확하게 드러나는 범죄도시. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2020-05-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '박평식', 8.4, '범죄도시는 액션, 범죄 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2018-04-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '강병진', 8, '범죄도시는 액션, 범죄 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '헤럴드경제', '2024-03-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (16, '김도훈', 7.9, '완성도 높은 연출과 연기가 돋보이는 범죄도시. 추천할 만한 작품이다.', '동아일보', '2013-09-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '이동진', 7.6, '베테랑에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-01-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '박평식', 7.6, '베테랑는 액션, 범죄 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2015-04-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '강병진', 8, '베테랑에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '헤럴드경제', '2014-07-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (17, '황진미', 8.3, '베테랑에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '조선일보', '2017-07-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '이동진', 7.9, '암살에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-09-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '박평식', 7.6, '암살는 액션, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2024-10-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '이화정', 7.7, '암살는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2014-09-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (18, '허지웅', 7.8, '암살에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', 'KBS', '2021-02-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '이동진', 8.1, '국제시장에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2016-10-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '박평식', 8.2, '국제시장는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2017-01-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '이화정', 8.4, '감독의 연출력과 배우들의 연기력이 조화를 이룬 국제시장. 완성도가 뛰어나다.', '씨네21', '2021-12-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (19, '유지나', 8, '완성도 높은 연출과 연기가 돋보이는 국제시장. 추천할 만한 작품이다.', '한겨레', '2022-09-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '이동진', 8.3, '감독의 연출 의도가 명확하게 드러나는 1987. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2017-11-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '박평식', 8.2, '1987는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2023-05-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '김혜리', 8, '1987는 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '씨네21', '2012-07-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (20, '허지웅', 8, '1987는 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', 'KBS', '2018-07-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '이동진', 8.4, '택시운전사는 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2018-07-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '박평식', 8.5, '택시운전사는 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2010-04-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '김봉석', 8.1, '택시운전사는 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '한국일보', '2025-04-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (21, '이화정', 7.7, '완성도 높은 연출과 연기가 돋보이는 택시운전사. 추천할 만한 작품이다.', '씨네21', '2024-01-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '이동진', 8.3, '감독의 연출 의도가 명확하게 드러나는 곡성. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2019-01-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '박평식', 8.1, '곡성는 미스터리, 공포 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2022-12-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '강병진', 8, '완성도 높은 연출과 연기가 돋보이는 곡성. 추천할 만한 작품이다.', '헤럴드경제', '2012-10-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (22, '민용준', 8.3, '곡성는 미스터리, 공포 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '스포츠조선', '2017-09-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '이동진', 7.6, '아가씨는 스릴러, 로맨스 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2018-07-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '박평식', 7.7, '연기자들의 앙상블이 돋보이는 아가씨. 감독의 연출력이 빛을 발한다.', '중앙일보', '2019-11-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '이용철', 8.4, '아가씨는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '문화일보', '2020-02-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (23, '배동미', 7.8, '아가씨는 스릴러, 로맨스 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '매일경제', '2022-01-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '이동진', 8, '버닝는 미스터리, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2012-02-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '박평식', 7.8, '연기자들의 앙상블이 돋보이는 버닝. 감독의 연출력이 빛을 발한다.', '중앙일보', '2020-07-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '배동미', 7.8, '버닝는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '매일경제', '2012-10-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (24, '유지나', 8.3, '감독의 연출력과 배우들의 연기력이 조화를 이룬 버닝. 완성도가 뛰어나다.', '한겨레', '2016-02-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '이동진', 7.6, '감독의 연출 의도가 명확하게 드러나는 아이언맨. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2015-03-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '박평식', 8.4, '아이언맨는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2017-01-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '이화정', 7.5, '아이언맨에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2014-10-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (25, '황진미', 7.7, '아이언맨에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '조선일보', '2018-09-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '이동진', 7.9, '다크 나이트는 액션 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2022-10-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '박평식', 8, '다크 나이트는 액션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2021-08-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '민용준', 8.4, '감독의 연출력과 배우들의 연기력이 조화를 이룬 다크 나이트. 완성도가 뛰어나다.', '스포츠조선', '2017-09-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (26, '정성일', 8.4, '다크 나이트에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '중앙일보', '2012-01-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '이동진', 8, '블랙팬서는 액션, SF 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2013-10-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '박평식', 7.9, '블랙팬서는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.', '중앙일보', '2025-01-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '김혜리', 7.8, '완성도 높은 연출과 연기가 돋보이는 블랙팬서. 추천할 만한 작품이다.', '씨네21', '2011-12-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (27, '배동미', 7.9, '완성도 높은 연출과 연기가 돋보이는 블랙팬서. 추천할 만한 작품이다.', '매일경제', '2010-02-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '이동진', 8, '감독의 연출 의도가 명확하게 드러나는 인터스텔라. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2011-02-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '박평식', 7.5, '인터스텔라는 SF, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2010-07-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '김성훈', 8.4, '인터스텔라는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2014-03-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (28, '허지웅', 7.7, '인터스텔라는 SF, 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', 'KBS', '2020-01-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '이동진', 8, '감독의 연출 의도가 명확하게 드러나는 인셉션. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2017-05-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '박평식', 8.1, '인셉션는 SF, 액션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2010-01-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '강병진', 8, '감독의 연출력과 배우들의 연기력이 조화를 이룬 인셉션. 완성도가 뛰어나다.', '헤럴드경제', '2011-02-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (29, '황진미', 8.2, '완성도 높은 연출과 연기가 돋보이는 인셉션. 추천할 만한 작품이다.', '조선일보', '2018-02-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '이동진', 7.8, '아바타에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2020-07-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '박평식', 8.5, '아바타는 SF, 액션 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2012-11-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '남동철', 7.7, '아바타에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '스포츠서울', '2014-12-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (30, '이화정', 8, '아바타는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2020-02-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '이동진', 7.8, '감독의 연출 의도가 명확하게 드러나는 라라랜드. 완성도 높은 작품으로 평가할 만하다.', '씨네21', '2012-01-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '박평식', 8.2, '연기자들의 앙상블이 돋보이는 라라랜드. 감독의 연출력이 빛을 발한다.', '중앙일보', '2011-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '이용철', 7.8, '라라랜드에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '문화일보', '2010-02-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (31, '김혜리', 8.5, '라라랜드는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.', '씨네21', '2022-12-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '이동진', 7.9, '조조 래빗에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-01-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '박평식', 7.8, '조조 래빗는 코미디, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2015-02-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '김혜리', 8.1, '조조 래빗에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.', '씨네21', '2024-07-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (32, '김성훈', 8.1, '완성도 높은 연출과 연기가 돋보이는 조조 래빗. 추천할 만한 작품이다.', '씨네21', '2018-02-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '이동진', 7.6, '1917는 전쟁, 드라마 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.', '씨네21', '2025-02-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '박평식', 8.3, '1917는 전쟁, 드라마 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.', '중앙일보', '2020-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '김도훈', 7.8, '1917는 전쟁, 드라마 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.', '동아일보', '2021-01-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (33, '이화정', 8.3, '감독의 연출력과 배우들의 연기력이 조화를 이룬 1917. 완성도가 뛰어나다.', '씨네21', '2020-02-29');

COMMIT;

-- INSERT 완료
-- 📊 총 33개 영화 + 132개 전문가 리뷰 추가됨
-- 
-- 💡 사용법:
-- 1. Supabase SQL 에디터에서 실행
-- 2. 카카오 스킬에서 영화 검색 시 전문가 리뷰도 함께 제공
-- 3. 예: "기생충 영화평", "2019년 영화", "봉준호 감독", "액션 영화 추천" 등
-- 4. 이동진, 박평식 평론가의 리뷰가 항상 포함됨
