-- 대용량 영화 데이터베이스 INSERT 문 (기존 테이블 구조 맞춤)
-- 생성일시: 2025. 7. 26. 오전 2:49:52
-- 총 영화 수: 110개
-- 데이터 소스: 한국/해외 인기 영화 + 클래식 명작

-- 기존 테이블 구조 (참고용)
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
*/

-- 국가별 영화 수:
-- - 한국: 40개
-- - 미국: 60개
-- - 호주: 1개
-- - 뉴질랜드: 1개
-- - 영국: 5개
-- - 일본: 3개

-- 중복 방지를 위한 INSERT (제목+연도 기준)
BEGIN;

-- 1. 기생충 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('기생충', 'Parasite', '봉준호', '{"송강호","이선균","조여정","최우식","박소담"}', '드라마, 스릴러, 코미디', 2019, 132, '한국', 8.9, '기생충 (2019) - 드라마, 스릴러, 코미디. 감독: 봉준호, 출연: 송강호, 이선균, 조여정', '{"기생충","Parasite","봉준호","송강호","이선균","조여정","드라마","스릴러","코미디"}', NULL, NULL);

-- 2. 미나리 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미나리', 'Minari', '정이삭', '{"스티븐 연","한예리","윤여정","앨런 김"}', '드라마', 2020, 115, '미국', 8.2, '미나리 (2020) - 드라마. 감독: 정이삭, 출연: 스티븐 연, 한예리, 윤여정', '{"미나리","Minari","정이삭","스티븐 연","한예리","윤여정","드라마"}', NULL, NULL);

-- 3. 부산행 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('부산행', 'Train to Busan', '연상호', '{"공유","정유미","마동석","김수안"}', '액션, 스릴러', 2016, 118, '한국', 8.3, '부산행 (2016) - 액션, 스릴러. 감독: 연상호, 출연: 공유, 정유미, 마동석', '{"부산행","Train to Busan","연상호","공유","정유미","마동석","액션","스릴러"}', NULL, NULL);

-- 4. 범죄도시 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시', 'The Outlaws', '강윤성', '{"마동석","윤계상","조재윤"}', '액션, 범죄', 2017, 121, '한국', 8.1, '범죄도시 (2017) - 액션, 범죄. 감독: 강윤성, 출연: 마동석, 윤계상, 조재윤', '{"범죄도시","The Outlaws","강윤성","마동석","윤계상","조재윤","액션","범죄"}', NULL, NULL);

-- 5. 극한직업 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('극한직업', 'Extreme Job', '이병헌', '{"류승룡","이하늬","진선규","이동휘"}', '코미디, 액션', 2019, 111, '한국', 8.4, '극한직업 (2019) - 코미디, 액션. 감독: 이병헌, 출연: 류승룡, 이하늬, 진선규', '{"극한직업","Extreme Job","이병헌","류승룡","이하늬","진선규","코미디","액션"}', NULL, NULL);

-- 6. 명량 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('명량', 'The Admiral: Roaring Currents', '김한민', '{"최민식","류승룡","조진웅"}', '액션, 전쟁', 2014, 128, '한국', 8, '명량 (2014) - 액션, 전쟁. 감독: 김한민, 출연: 최민식, 류승룡, 조진웅', '{"명량","The Admiral: Roaring Currents","김한민","최민식","류승룡","조진웅","액션","전쟁"}', NULL, NULL);

-- 7. 국제시장 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('국제시장', 'Ode to My Father', '윤제균', '{"황정민","김윤진","오달수"}', '드라마', 2014, 126, '한국', 8.1, '국제시장 (2014) - 드라마. 감독: 윤제균, 출연: 황정민, 김윤진, 오달수', '{"국제시장","Ode to My Father","윤제균","황정민","김윤진","오달수","드라마"}', NULL, NULL);

-- 8. 베테랑 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('베테랑', 'Veteran', '류승완', '{"황정민","유아인","유해진"}', '액션, 범죄', 2015, 123, '한국', 8.2, '베테랑 (2015) - 액션, 범죄. 감독: 류승완, 출연: 황정민, 유아인, 유해진', '{"베테랑","Veteran","류승완","황정민","유아인","유해진","액션","범죄"}', NULL, NULL);

-- 9. 암살 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('암살', 'Assassination', '최동훈', '{"전지현","이정재","하정우"}', '액션, 드라마', 2015, 139, '한국', 8.3, '암살 (2015) - 액션, 드라마. 감독: 최동훈, 출연: 전지현, 이정재, 하정우', '{"암살","Assassination","최동훈","전지현","이정재","하정우","액션","드라마"}', NULL, NULL);

-- 10. 도둑들 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('도둑들', 'The Thieves', '최동훈', '{"김윤석","김혜수","이정재"}', '액션, 범죄', 2012, 135, '한국', 7.8, '도둑들 (2012) - 액션, 범죄. 감독: 최동훈, 출연: 김윤석, 김혜수, 이정재', '{"도둑들","The Thieves","최동훈","김윤석","김혜수","이정재","액션","범죄"}', NULL, NULL);

-- 11. 광해, 왕이 된 남자 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('광해, 왕이 된 남자', 'Masquerade', '추창민', '{"이병헌","류승룡","한효주"}', '드라마, 사극', 2012, 131, '한국', 8.4, '광해, 왕이 된 남자 (2012) - 드라마, 사극. 감독: 추창민, 출연: 이병헌, 류승룡, 한효주', '{"광해, 왕이 된 남자","Masquerade","추창민","이병헌","류승룡","한효주","드라마","사극"}', NULL, NULL);

-- 12. 왕의 남자 (2005) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('왕의 남자', 'The King and the Clown', '이준익', '{"감우성","이준기","정진영"}', '드라마, 사극', 2005, 119, '한국', 8.2, '왕의 남자 (2005) - 드라마, 사극. 감독: 이준익, 출연: 감우성, 이준기, 정진영', '{"왕의 남자","The King and the Clown","이준익","감우성","이준기","정진영","드라마","사극"}', NULL, NULL);

-- 13. 실미도 (2003) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('실미도', 'Silmido', '강우석', '{"설경구","안성기","허준호"}', '액션, 드라마', 2003, 135, '한국', 7.9, '실미도 (2003) - 액션, 드라마. 감독: 강우석, 출연: 설경구, 안성기, 허준호', '{"실미도","Silmido","강우석","설경구","안성기","허준호","액션","드라마"}', NULL, NULL);

-- 14. 태극기 휘날리며 (2004) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('태극기 휘날리며', 'Taegukgi', '강제규', '{"장동건","원빈","이은주"}', '전쟁, 드라마', 2004, 140, '한국', 8.1, '태극기 휘날리며 (2004) - 전쟁, 드라마. 감독: 강제규, 출연: 장동건, 원빈, 이은주', '{"태극기 휘날리며","Taegukgi","강제규","장동건","원빈","이은주","전쟁","드라마"}', NULL, NULL);

-- 15. 친구 (2001) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('친구', 'Friend', '곽경택', '{"유오성","장동건","서태화"}', '드라마, 범죄', 2001, 113, '한국', 8, '친구 (2001) - 드라마, 범죄. 감독: 곽경택, 출연: 유오성, 장동건, 서태화', '{"친구","Friend","곽경택","유오성","장동건","서태화","드라마","범죄"}', NULL, NULL);

-- 16. 올드보이 (2003) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('올드보이', 'Oldboy', '박찬욱', '{"최민식","유지태","강혜정"}', '스릴러, 미스터리', 2003, 120, '한국', 8.4, '올드보이 (2003) - 스릴러, 미스터리. 감독: 박찬욱, 출연: 최민식, 유지태, 강혜정', '{"올드보이","Oldboy","박찬욱","최민식","유지태","강혜정","스릴러","미스터리"}', NULL, NULL);

-- 17. 살인의 추억 (2003) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('살인의 추억', 'Memories of Murder', '봉준호', '{"송강호","김상경","박해일"}', '범죄, 드라마', 2003, 131, '한국', 8.6, '살인의 추억 (2003) - 범죄, 드라마. 감독: 봉준호, 출연: 송강호, 김상경, 박해일', '{"살인의 추억","Memories of Murder","봉준호","송강호","김상경","박해일","범죄","드라마"}', NULL, NULL);

-- 18. 괴물 (2006) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('괴물', 'The Host', '봉준호', '{"송강호","변희봉","박해일"}', 'SF, 액션', 2006, 120, '한국', 8.2, '괴물 (2006) - SF, 액션. 감독: 봉준호, 출연: 송강호, 변희봉, 박해일', '{"괴물","The Host","봉준호","송강호","변희봉","박해일","SF","액션"}', NULL, NULL);

-- 19. 추격자 (2008) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('추격자', 'The Chaser', '나홍진', '{"김윤석","하정우","서영희"}', '스릴러, 범죄', 2008, 125, '한국', 8.3, '추격자 (2008) - 스릴러, 범죄. 감독: 나홍진, 출연: 김윤석, 하정우, 서영희', '{"추격자","The Chaser","나홍진","김윤석","하정우","서영희","스릴러","범죄"}', NULL, NULL);

-- 20. 황해 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('황해', 'The Yellow Sea', '나홍진', '{"하정우","김윤석","조성하"}', '액션, 스릴러', 2010, 157, '한국', 8, '황해 (2010) - 액션, 스릴러. 감독: 나홍진, 출연: 하정우, 김윤석, 조성하', '{"황해","The Yellow Sea","나홍진","하정우","김윤석","조성하","액션","스릴러"}', NULL, NULL);

-- 21. 아저씨 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아저씨', 'The Man from Nowhere', '이정범', '{"원빈","김새론","김희원"}', '액션, 스릴러', 2010, 119, '한국', 8.5, '아저씨 (2010) - 액션, 스릴러. 감독: 이정범, 출연: 원빈, 김새론, 김희원', '{"아저씨","The Man from Nowhere","이정범","원빈","김새론","김희원","액션","스릴러"}', NULL, NULL);

-- 22. 마더 (2009) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('마더', 'Mother', '봉준호', '{"김혜자","원빈","진구"}', '드라마, 미스터리', 2009, 129, '한국', 8.1, '마더 (2009) - 드라마, 미스터리. 감독: 봉준호, 출연: 김혜자, 원빈, 진구', '{"마더","Mother","봉준호","김혜자","원빈","진구","드라마","미스터리"}', NULL, NULL);

-- 23. 박쥐 (2009) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('박쥐', 'Thirst', '박찬욱', '{"송강호","김옥빈","신하균"}', '스릴러, 공포', 2009, 134, '한국', 7.9, '박쥐 (2009) - 스릴러, 공포. 감독: 박찬욱, 출연: 송강호, 김옥빈, 신하균', '{"박쥐","Thirst","박찬욱","송강호","김옥빈","신하균","스릴러","공포"}', NULL, NULL);

-- 24. 내부자들 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('내부자들', 'The Insiders', '우민호', '{"이병헌","조승우","백윤식"}', '범죄, 드라마', 2015, 130, '한국', 8.1, '내부자들 (2015) - 범죄, 드라마. 감독: 우민호, 출연: 이병헌, 조승우, 백윤식', '{"내부자들","The Insiders","우민호","이병헌","조승우","백윤식","범죄","드라마"}', NULL, NULL);

-- 25. 밀정 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('밀정', 'The Age of Shadows', '김지운', '{"송강호","공유","한지민"}', '액션, 스릴러', 2016, 140, '한국', 8, '밀정 (2016) - 액션, 스릴러. 감독: 김지운, 출연: 송강호, 공유, 한지민', '{"밀정","The Age of Shadows","김지운","송강호","공유","한지민","액션","스릴러"}', NULL, NULL);

-- 26. 관상 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('관상', 'The Face Reader', '한재림', '{"송강호","이정재","백윤식"}', '드라마, 사극', 2013, 139, '한국', 7.8, '관상 (2013) - 드라마, 사극. 감독: 한재림, 출연: 송강호, 이정재, 백윤식', '{"관상","The Face Reader","한재림","송강호","이정재","백윤식","드라마","사극"}', NULL, NULL);

-- 27. 신과함께-죄와 벌 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('신과함께-죄와 벌', 'Along with the Gods: The Two Worlds', '김용화', '{"하정우","차태현","주지훈"}', '판타지, 드라마', 2017, 139, '한국', 7.6, '신과함께-죄와 벌 (2017) - 판타지, 드라마. 감독: 김용화, 출연: 하정우, 차태현, 주지훈', '{"신과함께-죄와 벌","Along with the Gods: The Two Worlds","김용화","하정우","차태현","주지훈","판타지","드라마"}', NULL, NULL);

-- 28. 택시운전사 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('택시운전사', 'A Taxi Driver', '장훈', '{"송강호","토마스 크레치만","유해진"}', '드라마, 액션', 2017, 137, '한국', 8.3, '택시운전사 (2017) - 드라마, 액션. 감독: 장훈, 출연: 송강호, 토마스 크레치만, 유해진', '{"택시운전사","A Taxi Driver","장훈","송강호","토마스 크레치만","유해진","드라마","액션"}', NULL, NULL);

-- 29. 1987 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1987', '1987: When the Day Comes', '장준환', '{"김윤석","하정우","유해진"}', '드라마', 2017, 129, '한국', 8.5, '1987 (2017) - 드라마. 감독: 장준환, 출연: 김윤석, 하정우, 유해진', '{"1987","1987: When the Day Comes","장준환","김윤석","하정우","유해진","드라마"}', NULL, NULL);

-- 30. 공작 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('공작', 'The Spy Gone North', '윤종빈', '{"황정민","이성민","조진웅"}', '스릴러, 드라마', 2018, 137, '한국', 8.2, '공작 (2018) - 스릴러, 드라마. 감독: 윤종빈, 출연: 황정민, 이성민, 조진웅', '{"공작","The Spy Gone North","윤종빈","황정민","이성민","조진웅","스릴러","드라마"}', NULL, NULL);

-- 31. 어벤져스: 엔드게임 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스: 엔드게임', 'Avengers: Endgame', '안소니 루소, 조 루소', '{"로버트 다우니 주니어","크리스 에반스","마크 러팔로"}', '액션, SF', 2019, 181, '미국', 9, '어벤져스: 엔드게임 (2019) - 액션, SF. 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스, 마크 러팔로', '{"어벤져스: 엔드게임","Avengers: Endgame","안소니 루소, 조 루소","로버트 다우니 주니어","크리스 에반스","마크 러팔로","액션","SF"}', NULL, NULL);

-- 32. 아이언맨 (2008) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아이언맨', 'Iron Man', '존 파브로', '{"로버트 다우니 주니어","테런스 하워드","제프 브리지스"}', '액션, SF', 2008, 126, '미국', 8.1, '아이언맨 (2008) - 액션, SF. 감독: 존 파브로, 출연: 로버트 다우니 주니어, 테런스 하워드, 제프 브리지스', '{"아이언맨","Iron Man","존 파브로","로버트 다우니 주니어","테런스 하워드","제프 브리지스","액션","SF"}', NULL, NULL);

-- 33. 스파이더맨: 노 웨이 홈 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스파이더맨: 노 웨이 홈', 'Spider-Man: No Way Home', '존 와츠', '{"톰 홀랜드","젠데이아","베네딕트 컴버배치"}', '액션, SF', 2021, 148, '미국', 8.8, '스파이더맨: 노 웨이 홈 (2021) - 액션, SF. 감독: 존 와츠, 출연: 톰 홀랜드, 젠데이아, 베네딕트 컴버배치', '{"스파이더맨: 노 웨이 홈","Spider-Man: No Way Home","존 와츠","톰 홀랜드","젠데이아","베네딕트 컴버배치","액션","SF"}', NULL, NULL);

-- 34. 다크 나이트 (2008) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('다크 나이트', 'The Dark Knight', '크리스토퍼 놀란', '{"크리스찬 베일","히스 레저","아론 에크하트"}', '액션, 범죄', 2008, 152, '미국', 9.1, '다크 나이트 (2008) - 액션, 범죄. 감독: 크리스토퍼 놀란, 출연: 크리스찬 베일, 히스 레저, 아론 에크하트', '{"다크 나이트","The Dark Knight","크리스토퍼 놀란","크리스찬 베일","히스 레저","아론 에크하트","액션","범죄"}', NULL, NULL);

-- 35. 탑건: 매버릭 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('탑건: 매버릭', 'Top Gun: Maverick', '조제프 코신스키', '{"톰 크루즈","마일즈 텔러","제니퍼 코넬리"}', '액션, 드라마', 2022, 131, '미국', 8.7, '탑건: 매버릭 (2022) - 액션, 드라마. 감독: 조제프 코신스키, 출연: 톰 크루즈, 마일즈 텔러, 제니퍼 코넬리', '{"탑건: 매버릭","Top Gun: Maverick","조제프 코신스키","톰 크루즈","마일즈 텔러","제니퍼 코넬리","액션","드라마"}', NULL, NULL);

-- 36. 미션 임파서블: 폴아웃 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미션 임파서블: 폴아웃', 'Mission: Impossible - Fallout', '크리스토퍼 맥쿼리', '{"톰 크루즈","헨리 카빌","빙 레임스"}', '액션, 스릴러', 2018, 147, '미국', 8.4, '미션 임파서블: 폴아웃 (2018) - 액션, 스릴러. 감독: 크리스토퍼 맥쿼리, 출연: 톰 크루즈, 헨리 카빌, 빙 레임스', '{"미션 임파서블: 폴아웃","Mission: Impossible - Fallout","크리스토퍼 맥쿼리","톰 크루즈","헨리 카빌","빙 레임스","액션","스릴러"}', NULL, NULL);

-- 37. 분노의 질주: 더 얼티메이트 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('분노의 질주: 더 얼티메이트', 'Fast & Furious 6', '저스틴 린', '{"빈 디젤","폴 워커","드웨인 존슨"}', '액션', 2013, 130, '미국', 7.9, '분노의 질주: 더 얼티메이트 (2013) - 액션. 감독: 저스틴 린, 출연: 빈 디젤, 폴 워커, 드웨인 존슨', '{"분노의 질주: 더 얼티메이트","Fast & Furious 6","저스틴 린","빈 디젤","폴 워커","드웨인 존슨","액션"}', NULL, NULL);

-- 38. 존 윅 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('존 윅', 'John Wick', '채드 스타헬스키', '{"키아누 리브스","마이클 나이퀴스트","알피 앨런"}', '액션, 스릴러', 2014, 101, '미국', 8.2, '존 윅 (2014) - 액션, 스릴러. 감독: 채드 스타헬스키, 출연: 키아누 리브스, 마이클 나이퀴스트, 알피 앨런', '{"존 윅","John Wick","채드 스타헬스키","키아누 리브스","마이클 나이퀴스트","알피 앨런","액션","스릴러"}', NULL, NULL);

-- 39. 매드 맥스: 분노의 도로 (2015) - 호주
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('매드 맥스: 분노의 도로', 'Mad Max: Fury Road', '조지 밀러', '{"톰 하디","샤를리즈 테론","니콜라스 홀트"}', '액션, SF', 2015, 120, '호주', 8.5, '매드 맥스: 분노의 도로 (2015) - 액션, SF. 감독: 조지 밀러, 출연: 톰 하디, 샤를리즈 테론, 니콜라스 홀트', '{"매드 맥스: 분노의 도로","Mad Max: Fury Road","조지 밀러","톰 하디","샤를리즈 테론","니콜라스 홀트","액션","SF"}', NULL, NULL);

-- 40. 글래디에이터 (2000) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('글래디에이터', 'Gladiator', '리들리 스콧', '{"러셀 크로우","호아킨 피닉스"}', '액션, 드라마', 2000, 155, '미국', 8.5, '글래디에이터 (2000) - 액션, 드라마. 감독: 리들리 스콧, 출연: 러셀 크로우, 호아킨 피닉스', '{"글래디에이터","Gladiator","리들리 스콧","러셀 크로우","호아킨 피닉스","액션","드라마"}', NULL, NULL);

-- 41. 인터스텔라 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인터스텔라', 'Interstellar', '크리스토퍼 놀란', '{"매튜 맥커너히","앤 해서웨이","제시카 차스테인"}', 'SF, 드라마', 2014, 169, '미국', 9, '인터스텔라 (2014) - SF, 드라마. 감독: 크리스토퍼 놀란, 출연: 매튜 맥커너히, 앤 해서웨이, 제시카 차스테인', '{"인터스텔라","Interstellar","크리스토퍼 놀란","매튜 맥커너히","앤 해서웨이","제시카 차스테인","SF","드라마"}', NULL, NULL);

-- 42. 인셉션 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인셉션', 'Inception', '크리스토퍼 놀란', '{"레오나르도 디카프리오","마리옹 코티야르","톰 하디"}', 'SF, 액션', 2010, 148, '미국', 8.8, '인셉션 (2010) - SF, 액션. 감독: 크리스토퍼 놀란, 출연: 레오나르도 디카프리오, 마리옹 코티야르, 톰 하디', '{"인셉션","Inception","크리스토퍼 놀란","레오나르도 디카프리오","마리옹 코티야르","톰 하디","SF","액션"}', NULL, NULL);

-- 43. 아바타 (2009) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아바타', 'Avatar', '제임스 카메론', '{"샘 워싱턴","조 샐다나","시고니 위버"}', 'SF, 액션', 2009, 162, '미국', 8.3, '아바타 (2009) - SF, 액션. 감독: 제임스 카메론, 출연: 샘 워싱턴, 조 샐다나, 시고니 위버', '{"아바타","Avatar","제임스 카메론","샘 워싱턴","조 샐다나","시고니 위버","SF","액션"}', NULL, NULL);

-- 44. 매트릭스 (1999) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('매트릭스', 'The Matrix', '라나 워쇼스키, 릴리 워쇼스키', '{"키아누 리브스","로렌스 피시번","캐리 앤 모스"}', 'SF, 액션', 1999, 136, '미국', 8.7, '매트릭스 (1999) - SF, 액션. 감독: 라나 워쇼스키, 릴리 워쇼스키, 출연: 키아누 리브스, 로렌스 피시번, 캐리 앤 모스', '{"매트릭스","The Matrix","라나 워쇼스키, 릴리 워쇼스키","키아누 리브스","로렌스 피시번","캐리 앤 모스","SF","액션"}', NULL, NULL);

-- 45. 터미네이터 2: 심판의 날 (1991) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('터미네이터 2: 심판의 날', 'Terminator 2: Judgment Day', '제임스 카메론', '{"아놀드 슈왈제네거","린다 해밀턴"}', 'SF, 액션', 1991, 137, '미국', 8.9, '터미네이터 2: 심판의 날 (1991) - SF, 액션. 감독: 제임스 카메론, 출연: 아놀드 슈왈제네거, 린다 해밀턴', '{"터미네이터 2: 심판의 날","Terminator 2: Judgment Day","제임스 카메론","아놀드 슈왈제네거","린다 해밀턴","SF","액션"}', NULL, NULL);

-- 46. 에일리언 (1979) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('에일리언', 'Alien', '리들리 스콧', '{"시고니 위버","톰 스케릿"}', 'SF, 공포', 1979, 117, '미국', 8.4, '에일리언 (1979) - SF, 공포. 감독: 리들리 스콧, 출연: 시고니 위버, 톰 스케릿', '{"에일리언","Alien","리들리 스콧","시고니 위버","톰 스케릿","SF","공포"}', NULL, NULL);

-- 47. 블레이드 러너 2049 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블레이드 러너 2049', 'Blade Runner 2049', '드니 빌뇌브', '{"라이언 고슬링","해리슨 포드"}', 'SF, 드라마', 2017, 164, '미국', 8.1, '블레이드 러너 2049 (2017) - SF, 드라마. 감독: 드니 빌뇌브, 출연: 라이언 고슬링, 해리슨 포드', '{"블레이드 러너 2049","Blade Runner 2049","드니 빌뇌브","라이언 고슬링","해리슨 포드","SF","드라마"}', NULL, NULL);

-- 48. 스타워즈: 새로운 희망 (1977) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스타워즈: 새로운 희망', 'Star Wars: A New Hope', '조지 루카스', '{"마크 해밀","해리슨 포드","캐리 피셔"}', 'SF, 어드벤처', 1977, 121, '미국', 8.8, '스타워즈: 새로운 희망 (1977) - SF, 어드벤처. 감독: 조지 루카스, 출연: 마크 해밀, 해리슨 포드, 캐리 피셔', '{"스타워즈: 새로운 희망","Star Wars: A New Hope","조지 루카스","마크 해밀","해리슨 포드","캐리 피셔","SF","어드벤처"}', NULL, NULL);

-- 49. 반지의 제왕: 왕의 귀환 (2003) - 뉴질랜드
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('반지의 제왕: 왕의 귀환', 'The Lord of the Rings: The Return of the King', '피터 잭슨', '{"일라이저 우드","비고 모텐슨","이안 맥켈런"}', '판타지, 어드벤처', 2003, 201, '뉴질랜드', 9, '반지의 제왕: 왕의 귀환 (2003) - 판타지, 어드벤처. 감독: 피터 잭슨, 출연: 일라이저 우드, 비고 모텐슨, 이안 맥켈런', '{"반지의 제왕: 왕의 귀환","The Lord of the Rings: The Return of the King","피터 잭슨","일라이저 우드","비고 모텐슨","이안 맥켈런","판타지","어드벤처"}', NULL, NULL);

-- 50. 해리포터와 마법사의 돌 (2001) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('해리포터와 마법사의 돌', 'Harry Potter and the Philosopher''s Stone', '크리스 콜럼버스', '{"다니엘 래드클리프","엠마 왓슨","루퍼트 그린트"}', '판타지, 어드벤처', 2001, 152, '영국', 8.1, '해리포터와 마법사의 돌 (2001) - 판타지, 어드벤처. 감독: 크리스 콜럼버스, 출연: 다니엘 래드클리프, 엠마 왓슨, 루퍼트 그린트', '{"해리포터와 마법사의 돌","Harry Potter and the Philosopher's Stone","크리스 콜럼버스","다니엘 래드클리프","엠마 왓슨","루퍼트 그린트","판타지","어드벤처"}', NULL, NULL);

-- 51. 쇼생크 탈출 (1994) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('쇼생크 탈출', 'The Shawshank Redemption', '프랭크 다라본트', '{"팀 로빈스","모건 프리먼"}', '드라마', 1994, 142, '미국', 9.3, '쇼생크 탈출 (1994) - 드라마. 감독: 프랭크 다라본트, 출연: 팀 로빈스, 모건 프리먼', '{"쇼생크 탈출","The Shawshank Redemption","프랭크 다라본트","팀 로빈스","모건 프리먼","드라마"}', NULL, NULL);

-- 52. 포레스트 검프 (1994) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('포레스트 검프', 'Forrest Gump', '로버트 저메키스', '{"톰 행크스","로빈 라이트"}', '드라마', 1994, 142, '미국', 8.8, '포레스트 검프 (1994) - 드라마. 감독: 로버트 저메키스, 출연: 톰 행크스, 로빈 라이트', '{"포레스트 검프","Forrest Gump","로버트 저메키스","톰 행크스","로빈 라이트","드라마"}', NULL, NULL);

-- 53. 타이타닉 (1997) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('타이타닉', 'Titanic', '제임스 카메론', '{"레오나르도 디카프리오","케이트 윈슬렛"}', '로맨스, 드라마', 1997, 194, '미국', 8.6, '타이타닉 (1997) - 로맨스, 드라마. 감독: 제임스 카메론, 출연: 레오나르도 디카프리오, 케이트 윈슬렛', '{"타이타닉","Titanic","제임스 카메론","레오나르도 디카프리오","케이트 윈슬렛","로맨스","드라마"}', NULL, NULL);

-- 54. 라라랜드 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라라랜드', 'La La Land', '데이미언 차젤리', '{"라이언 고슬링","엠마 스톤"}', '뮤지컬, 로맨스', 2016, 128, '미국', 8.3, '라라랜드 (2016) - 뮤지컬, 로맨스. 감독: 데이미언 차젤리, 출연: 라이언 고슬링, 엠마 스톤', '{"라라랜드","La La Land","데이미언 차젤리","라이언 고슬링","엠마 스톤","뮤지컬","로맨스"}', NULL, NULL);

-- 55. 조조 래빗 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조조 래빗', 'Jojo Rabbit', '타이카 와이티티', '{"로만 그리핀 데이비스","톰슨 맥켄지","스칼렛 요한슨"}', '코미디, 드라마', 2019, 108, '미국', 8.1, '조조 래빗 (2019) - 코미디, 드라마. 감독: 타이카 와이티티, 출연: 로만 그리핀 데이비스, 톰슨 맥켄지, 스칼렛 요한슨', '{"조조 래빗","Jojo Rabbit","타이카 와이티티","로만 그리핀 데이비스","톰슨 맥켄지","스칼렛 요한슨","코미디","드라마"}', NULL, NULL);

-- 56. 1917 (2019) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1917', '1917', '샘 멘데스', '{"조지 맥케이","딘 찰스 채프먼"}', '전쟁, 드라마', 2019, 119, '영국', 8.5, '1917 (2019) - 전쟁, 드라마. 감독: 샘 멘데스, 출연: 조지 맥케이, 딘 찰스 채프먼', '{"1917","1917","샘 멘데스","조지 맥케이","딘 찰스 채프먼","전쟁","드라마"}', NULL, NULL);

-- 57. 포드 v 페라리 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('포드 v 페라리', 'Ford v Ferrari', '제임스 맨골드', '{"맷 데이먼","크리스찬 베일"}', '드라마, 액션', 2019, 152, '미국', 8.2, '포드 v 페라리 (2019) - 드라마, 액션. 감독: 제임스 맨골드, 출연: 맷 데이먼, 크리스찬 베일', '{"포드 v 페라리","Ford v Ferrari","제임스 맨골드","맷 데이먼","크리스찬 베일","드라마","액션"}', NULL, NULL);

-- 58. 대부 (1972) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('대부', 'The Godfather', '프랜시스 포드 코폴라', '{"말론 브란도","알 파치노"}', '범죄, 드라마', 1972, 175, '미국', 9.2, '대부 (1972) - 범죄, 드라마. 감독: 프랜시스 포드 코폴라, 출연: 말론 브란도, 알 파치노', '{"대부","The Godfather","프랜시스 포드 코폴라","말론 브란도","알 파치노","범죄","드라마"}', NULL, NULL);

-- 59. 시민 케인 (1941) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('시민 케인', 'Citizen Kane', '오슨 웰스', '{"오슨 웰스","조셉 코튼"}', '드라마', 1941, 119, '미국', 8.7, '시민 케인 (1941) - 드라마. 감독: 오슨 웰스, 출연: 오슨 웰스, 조셉 코튼', '{"시민 케인","Citizen Kane","오슨 웰스","오슨 웰스","조셉 코튼","드라마"}', NULL, NULL);

-- 60. 카사블랑카 (1942) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('카사블랑카', 'Casablanca', '마이클 커티즐', '{"험프리 보가트","잉그리드 버그만"}', '로맨스, 드라마', 1942, 102, '미국', 8.9, '카사블랑카 (1942) - 로맨스, 드라마. 감독: 마이클 커티즐, 출연: 험프리 보가트, 잉그리드 버그만', '{"카사블랑카","Casablanca","마이클 커티즐","험프리 보가트","잉그리드 버그만","로맨스","드라마"}', NULL, NULL);

-- 61. 겨울왕국 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('겨울왕국', 'Frozen', '크리스 벅, 제니퍼 리', '{"크리스틴 벨","이디나 멘젤","조나단 그로프"}', '애니메이션, 뮤지컬', 2013, 102, '미국', 8.3, '겨울왕국 (2013) - 애니메이션, 뮤지컬. 감독: 크리스 벅, 제니퍼 리, 출연: 크리스틴 벨, 이디나 멘젤, 조나단 그로프', '{"겨울왕국","Frozen","크리스 벅, 제니퍼 리","크리스틴 벨","이디나 멘젤","조나단 그로프","애니메이션","뮤지컬"}', NULL, NULL);

-- 62. 토이 스토리 4 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토이 스토리 4', 'Toy Story 4', '조시 쿨리', '{"톰 행크스","팀 앨런","애니 포츠"}', '애니메이션', 2019, 100, '미국', 8.1, '토이 스토리 4 (2019) - 애니메이션. 감독: 조시 쿨리, 출연: 톰 행크스, 팀 앨런, 애니 포츠', '{"토이 스토리 4","Toy Story 4","조시 쿨리","톰 행크스","팀 앨런","애니 포츠","애니메이션"}', NULL, NULL);

-- 63. 라이온 킹 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라이온 킹', 'The Lion King', '존 파브로', '{"도널드 글로버","비욘세","세스 로건"}', '애니메이션', 2019, 118, '미국', 7.8, '라이온 킹 (2019) - 애니메이션. 감독: 존 파브로, 출연: 도널드 글로버, 비욘세, 세스 로건', '{"라이온 킹","The Lion King","존 파브로","도널드 글로버","비욘세","세스 로건","애니메이션"}', NULL, NULL);

-- 64. 코코 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('코코', 'Coco', '리 언크리치', '{"안토니 곤잘레스","가엘 가르시아 베르날"}', '애니메이션', 2017, 105, '미국', 8.7, '코코 (2017) - 애니메이션. 감독: 리 언크리치, 출연: 안토니 곤잘레스, 가엘 가르시아 베르날', '{"코코","Coco","리 언크리치","안토니 곤잘레스","가엘 가르시아 베르날","애니메이션"}', NULL, NULL);

-- 65. 인사이드 아웃 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인사이드 아웃', 'Inside Out', '피트 닥터', '{"에이미 포엘러","필리스 스미스"}', '애니메이션', 2015, 95, '미국', 8.6, '인사이드 아웃 (2015) - 애니메이션. 감독: 피트 닥터, 출연: 에이미 포엘러, 필리스 스미스', '{"인사이드 아웃","Inside Out","피트 닥터","에이미 포엘러","필리스 스미스","애니메이션"}', NULL, NULL);

-- 66. 센과 치히로의 행방불명 (2001) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('센과 치히로의 행방불명', 'Spirited Away', '미야자키 하야오', '{"루미 히이라기","미유 이루노"}', '애니메이션', 2001, 125, '일본', 9, '센과 치히로의 행방불명 (2001) - 애니메이션. 감독: 미야자키 하야오, 출연: 루미 히이라기, 미유 이루노', '{"센과 치히로의 행방불명","Spirited Away","미야자키 하야오","루미 히이라기","미유 이루노","애니메이션"}', NULL, NULL);

-- 67. 하울의 움직이는 성 (2004) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('하울의 움직이는 성', 'Howl''s Moving Castle', '미야자키 하야오', '{"치에코 바이쇼","타쿠야 키무라"}', '애니메이션', 2004, 119, '일본', 8.5, '하울의 움직이는 성 (2004) - 애니메이션. 감독: 미야자키 하야오, 출연: 치에코 바이쇼, 타쿠야 키무라', '{"하울의 움직이는 성","Howl's Moving Castle","미야자키 하야오","치에코 바이쇼","타쿠야 키무라","애니메이션"}', NULL, NULL);

-- 68. 모노노케 히메 (1997) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('모노노케 히메', 'Princess Mononoke', '미야자키 하야오', '{"요지 마츠다","유리코 이시다"}', '애니메이션', 1997, 134, '일본', 8.7, '모노노케 히메 (1997) - 애니메이션. 감독: 미야자키 하야오, 출연: 요지 마츠다, 유리코 이시다', '{"모노노케 히메","Princess Mononoke","미야자키 하야오","요지 마츠다","유리코 이시다","애니메이션"}', NULL, NULL);

-- 69. 슈렉 (2001) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('슈렉', 'Shrek', '앤드류 애덤슨, 비키 젠슨', '{"마이크 마이어스","에디 머피"}', '애니메이션', 2001, 90, '미국', 7.9, '슈렉 (2001) - 애니메이션. 감독: 앤드류 애덤슨, 비키 젠슨, 출연: 마이크 마이어스, 에디 머피', '{"슈렉","Shrek","앤드류 애덤슨, 비키 젠슨","마이크 마이어스","에디 머피","애니메이션"}', NULL, NULL);

-- 70. 니모를 찾아서 (2003) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('니모를 찾아서', 'Finding Nemo', '앤드류 스탠튼', '{"알버트 브룩스","엘런 드제너러스"}', '애니메이션', 2003, 100, '미국', 8.5, '니모를 찾아서 (2003) - 애니메이션. 감독: 앤드류 스탠튼, 출연: 알버트 브룩스, 엘런 드제너러스', '{"니모를 찾아서","Finding Nemo","앤드류 스탠튼","알버트 브룩스","엘런 드제너러스","애니메이션"}', NULL, NULL);

-- 71. 파라사이트 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('파라사이트', 'Parasite', '봉준호', '{"송강호","이선균","조여정"}', '드라마, 스릴러', 2019, 132, '한국', 8.9, '파라사이트 (2019) - 드라마, 스릴러. 감독: 봉준호, 출연: 송강호, 이선균, 조여정', '{"파라사이트","Parasite","봉준호","송강호","이선균","조여정","드라마","스릴러"}', NULL, NULL);

-- 72. 조커 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조커', 'Joker', '토드 필립스', '{"호아킨 피닉스","로버트 드 니로"}', '드라마, 스릴러', 2019, 122, '미국', 8.2, '조커 (2019) - 드라마, 스릴러. 감독: 토드 필립스, 출연: 호아킨 피닉스, 로버트 드 니로', '{"조커","Joker","토드 필립스","호아킨 피닉스","로버트 드 니로","드라마","스릴러"}', NULL, NULL);

-- 73. 원스 어폰 어 타임 인 할리우드 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원스 어폰 어 타임 인 할리우드', 'Once Upon a Time in Hollywood', '쿠엔틴 타란티노', '{"레오나르도 디카프리오","브래드 피트"}', '드라마', 2019, 161, '미국', 7.9, '원스 어폰 어 타임 인 할리우드 (2019) - 드라마. 감독: 쿠엔틴 타란티노, 출연: 레오나르도 디카프리오, 브래드 피트', '{"원스 어폰 어 타임 인 할리우드","Once Upon a Time in Hollywood","쿠엔틴 타란티노","레오나르도 디카프리오","브래드 피트","드라마"}', NULL, NULL);

-- 74. 덩케르크 (2017) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('덩케르크', 'Dunkirk', '크리스토퍼 놀런', '{"피온 화이트헤드","톰 글린 카니"}', '전쟁, 액션', 2017, 106, '영국', 8, '덩케르크 (2017) - 전쟁, 액션. 감독: 크리스토퍼 놀런, 출연: 피온 화이트헤드, 톰 글린 카니', '{"덩케르크","Dunkirk","크리스토퍼 놀런","피온 화이트헤드","톰 글린 카니","전쟁","액션"}', NULL, NULL);

-- 75. 문라이트 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('문라이트', 'Moonlight', '배리 젠킨스', '{"트레반테 로즈","아슈톤 샌더스"}', '드라마', 2016, 111, '미국', 8.4, '문라이트 (2016) - 드라마. 감독: 배리 젠킨스, 출연: 트레반테 로즈, 아슈톤 샌더스', '{"문라이트","Moonlight","배리 젠킨스","트레반테 로즈","아슈톤 샌더스","드라마"}', NULL, NULL);

-- 76. 캐스트 어웨이 (2000) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캐스트 어웨이', 'Cast Away', '로버트 저메키스', '{"톰 행크스","헬렌 헌트"}', '드라마', 2000, 143, '미국', 8.1, '캐스트 어웨이 (2000) - 드라마. 감독: 로버트 저메키스, 출연: 톰 행크스, 헬렌 헌트', '{"캐스트 어웨이","Cast Away","로버트 저메키스","톰 행크스","헬렌 헌트","드라마"}', NULL, NULL);

-- 77. 그린 북 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('그린 북', 'Green Book', '피터 패럴리', '{"비고 모텐슨","마허샬라 알리"}', '드라마', 2018, 130, '미국', 8.3, '그린 북 (2018) - 드라마. 감독: 피터 패럴리, 출연: 비고 모텐슨, 마허샬라 알리', '{"그린 북","Green Book","피터 패럴리","비고 모텐슨","마허샬라 알리","드라마"}', NULL, NULL);

-- 78. 보헤미안 랩소디 (2018) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('보헤미안 랩소디', 'Bohemian Rhapsody', '브라이언 싱어', '{"라미 말렉","루시 보인턴"}', '뮤지컬, 드라마', 2018, 134, '영국', 8.1, '보헤미안 랩소디 (2018) - 뮤지컬, 드라마. 감독: 브라이언 싱어, 출연: 라미 말렉, 루시 보인턴', '{"보헤미안 랩소디","Bohemian Rhapsody","브라이언 싱어","라미 말렉","루시 보인턴","뮤지컬","드라마"}', NULL, NULL);

-- 79. 어 스타 이즈 본 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어 스타 이즈 본', 'A Star Is Born', '브래들리 쿠퍼', '{"브래들리 쿠퍼","레이디 가가"}', '뮤지컬, 드라마', 2018, 136, '미국', 8, '어 스타 이즈 본 (2018) - 뮤지컬, 드라마. 감독: 브래들리 쿠퍼, 출연: 브래들리 쿠퍼, 레이디 가가', '{"어 스타 이즈 본","A Star Is Born","브래들리 쿠퍼","브래들리 쿠퍼","레이디 가가","뮤지컬","드라마"}', NULL, NULL);

-- 80. 블랙팬서 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블랙팬서', 'Black Panther', '라이언 쿠글러', '{"채드윅 보스만","마이클 B. 조던"}', '액션, SF', 2018, 134, '미국', 8, '블랙팬서 (2018) - 액션, SF. 감독: 라이언 쿠글러, 출연: 채드윅 보스만, 마이클 B. 조던', '{"블랙팬서","Black Panther","라이언 쿠글러","채드윅 보스만","마이클 B. 조던","액션","SF"}', NULL, NULL);

-- 81. 펄프 픽션 (1994) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('펄프 픽션', 'Pulp Fiction', '쿠엔틴 타란티노', '{"존 트라볼타","사무엘 L. 잭슨","우마 서먼"}', '범죄', 1994, 154, '미국', 8.6, '펄프 픽션 (1994) - 범죄. 감독: 쿠엔틴 타란티노, 출연: 존 트라볼타, 사무엘 L. 잭슨, 우마 서먼', '{"펄프 픽션","Pulp Fiction","쿠엔틴 타란티노","존 트라볼타","사무엘 L. 잭슨","우마 서먼","범죄"}', NULL, NULL);

-- 82. 12명의 성난 사람들 (1957) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('12명의 성난 사람들', '12 Angry Men', '시드니 루머', '{"헨리 폰다","리 J. 콥"}', '드라마', 1957, 96, '미국', 8.8, '12명의 성난 사람들 (1957) - 드라마. 감독: 시드니 루머, 출연: 헨리 폰다, 리 J. 콥', '{"12명의 성난 사람들","12 Angry Men","시드니 루머","헨리 폰다","리 J. 콥","드라마"}', NULL, NULL);

-- 83. 대부 2 (1974) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('대부 2', 'The Godfather Part II', '프랜시스 포드 코폴라', '{"알 파치노","로버트 드 니로"}', '범죄, 드라마', 1974, 202, '미국', 9.1, '대부 2 (1974) - 범죄, 드라마. 감독: 프랜시스 포드 코폴라, 출연: 알 파치노, 로버트 드 니로', '{"대부 2","The Godfather Part II","프랜시스 포드 코폴라","알 파치노","로버트 드 니로","범죄","드라마"}', NULL, NULL);

-- 84. 굿 윌 헌팅 (1997) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('굿 윌 헌팅', 'Good Will Hunting', '구스 반 산트', '{"로빈 윌리엄스","맷 데이먼"}', '드라마', 1997, 126, '미국', 8.5, '굿 윌 헌팅 (1997) - 드라마. 감독: 구스 반 산트, 출연: 로빈 윌리엄스, 맷 데이먼', '{"굿 윌 헌팅","Good Will Hunting","구스 반 산트","로빈 윌리엄스","맷 데이먼","드라마"}', NULL, NULL);

-- 85. 쿨 핸드 루크 (1967) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('쿨 핸드 루크', 'Cool Hand Luke', '스튜어트 로젠버그', '{"폴 뉴먼","조지 케네디"}', '드라마', 1967, 127, '미국', 8.3, '쿨 핸드 루크 (1967) - 드라마. 감독: 스튜어트 로젠버그, 출연: 폴 뉴먼, 조지 케네디', '{"쿨 핸드 루크","Cool Hand Luke","스튜어트 로젠버그","폴 뉴먼","조지 케네디","드라마"}', NULL, NULL);

-- 86. 택시 드라이버 (1976) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('택시 드라이버', 'Taxi Driver', '마틴 스코세이지', '{"로버트 드 니로","조디 포스터"}', '드라마', 1976, 114, '미국', 8.5, '택시 드라이버 (1976) - 드라마. 감독: 마틴 스코세이지, 출연: 로버트 드 니로, 조디 포스터', '{"택시 드라이버","Taxi Driver","마틴 스코세이지","로버트 드 니로","조디 포스터","드라마"}', NULL, NULL);

-- 87. 치나타운 (1974) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('치나타운', 'Chinatown', '로만 폴란스키', '{"잭 니콜슨","페이 더나웨이"}', '미스터리', 1974, 130, '미국', 8.4, '치나타운 (1974) - 미스터리. 감독: 로만 폴란스키, 출연: 잭 니콜슨, 페이 더나웨이', '{"치나타운","Chinatown","로만 폴란스키","잭 니콜슨","페이 더나웨이","미스터리"}', NULL, NULL);

-- 88. 아라비아의 로렌스 (1962) - 영국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아라비아의 로렌스', 'Lawrence of Arabia', '데이비드 린', '{"피터 오툴","알렉 기네스"}', '어드벤처', 1962, 228, '영국', 8.6, '아라비아의 로렌스 (1962) - 어드벤처. 감독: 데이비드 린, 출연: 피터 오툴, 알렉 기네스', '{"아라비아의 로렌스","Lawrence of Arabia","데이비드 린","피터 오툴","알렉 기네스","어드벤처"}', NULL, NULL);

-- 89. 사이코 (1960) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('사이코', 'Psycho', '알프레드 히치콕', '{"안토니 퍼킨스","자넷 리"}', '스릴러', 1960, 109, '미국', 8.7, '사이코 (1960) - 스릴러. 감독: 알프레드 히치콕, 출연: 안토니 퍼킨스, 자넷 리', '{"사이코","Psycho","알프레드 히치콕","안토니 퍼킨스","자넷 리","스릴러"}', NULL, NULL);

-- 90. 북북서로 진로를 돌려라 (1959) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('북북서로 진로를 돌려라', 'North by Northwest', '알프레드 히치콕', '{"케리 그랜트","에바 마리 세인트"}', '스릴러', 1959, 136, '미국', 8.5, '북북서로 진로를 돌려라 (1959) - 스릴러. 감독: 알프레드 히치콕, 출연: 케리 그랜트, 에바 마리 세인트', '{"북북서로 진로를 돌려라","North by Northwest","알프레드 히치콕","케리 그랜트","에바 마리 세인트","스릴러"}', NULL, NULL);

-- 91. 모가디슈 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('모가디슈', 'Escape from Mogadishu', '류승완', '{"김윤석","조인성","허준호"}', '액션, 드라마', 2021, 141, '한국', 8, '모가디슈 (2021) - 액션, 드라마. 감독: 류승완, 출연: 김윤석, 조인성, 허준호', '{"모가디슈","Escape from Mogadishu","류승완","김윤석","조인성","허준호","액션","드라마"}', NULL, NULL);

-- 92. 승리호 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('승리호', 'Space Sweepers', '조성희', '{"송중기","김태리","진선규"}', 'SF, 액션', 2021, 96, '한국', 7.5, '승리호 (2021) - SF, 액션. 감독: 조성희, 출연: 송중기, 김태리, 진선규', '{"승리호","Space Sweepers","조성희","송중기","김태리","진선규","SF","액션"}', NULL, NULL);

-- 93. 사냥의 시간 (2020) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('사냥의 시간', 'Time to Hunt', '윤성현', '{"이제훈","안재홍","최우식"}', '액션, 스릴러', 2020, 142, '한국', 7.8, '사냥의 시간 (2020) - 액션, 스릴러. 감독: 윤성현, 출연: 이제훈, 안재홍, 최우식', '{"사냥의 시간","Time to Hunt","윤성현","이제훈","안재홍","최우식","액션","스릴러"}', NULL, NULL);

-- 94. 건축학개론 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('건축학개론', 'Architecture 101', '이용주', '{"엄태웅","한가인","이제훈"}', '로맨스, 드라마', 2012, 107, '한국', 8.1, '건축학개론 (2012) - 로맨스, 드라마. 감독: 이용주, 출연: 엄태웅, 한가인, 이제훈', '{"건축학개론","Architecture 101","이용주","엄태웅","한가인","이제훈","로맨스","드라마"}', NULL, NULL);

-- 95. 신세계 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('신세계', 'New World', '박훈정', '{"이정재","최민식","황정민"}', '범죄, 액션', 2013, 139, '한국', 8.5, '신세계 (2013) - 범죄, 액션. 감독: 박훈정, 출연: 이정재, 최민식, 황정민', '{"신세계","New World","박훈정","이정재","최민식","황정민","범죄","액션"}', NULL, NULL);

-- 96. 곡성 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('곡성', 'The Wailing', '나홍진', '{"곽도원","황정민","천우희"}', '미스터리, 공포', 2016, 156, '한국', 8.1, '곡성 (2016) - 미스터리, 공포. 감독: 나홍진, 출연: 곽도원, 황정민, 천우희', '{"곡성","The Wailing","나홍진","곽도원","황정민","천우희","미스터리","공포"}', NULL, NULL);

-- 97. 아가씨 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아가씨', 'The Handmaiden', '박찬욱', '{"김민희","김태리","하정우"}', '스릴러, 로맨스', 2016, 145, '한국', 8.4, '아가씨 (2016) - 스릴러, 로맨스. 감독: 박찬욱, 출연: 김민희, 김태리, 하정우', '{"아가씨","The Handmaiden","박찬욱","김민희","김태리","하정우","스릴러","로맨스"}', NULL, NULL);

-- 98. 버닝 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('버닝', 'Burning', '이창동', '{"유아인","전종서","스티븐 연"}', '미스터리, 드라마', 2018, 148, '한국', 8, '버닝 (2018) - 미스터리, 드라마. 감독: 이창동, 출연: 유아인, 전종서, 스티븐 연', '{"버닝","Burning","이창동","유아인","전종서","스티븐 연","미스터리","드라마"}', NULL, NULL);

-- 99. 남산의 부장들 (2020) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('남산의 부장들', 'The Man Standing Next', '우민호', '{"이병헌","이성민","곽도원"}', '드라마', 2020, 114, '한국', 8.2, '남산의 부장들 (2020) - 드라마. 감독: 우민호, 출연: 이병헌, 이성민, 곽도원', '{"남산의 부장들","The Man Standing Next","우민호","이병헌","이성민","곽도원","드라마"}', NULL, NULL);

-- 100. 완벽한 타인 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('완벽한 타인', 'Intimate Strangers', '이재규', '{"유해진","조진웅","이서진"}', '코미디, 드라마', 2018, 115, '한국', 7.9, '완벽한 타인 (2018) - 코미디, 드라마. 감독: 이재규, 출연: 유해진, 조진웅, 이서진', '{"완벽한 타인","Intimate Strangers","이재규","유해진","조진웅","이서진","코미디","드라마"}', NULL, NULL);

-- 101. 아쿠아맨 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아쿠아맨', 'Aquaman', '제임스 완', '{"제이슨 모모아","앰버 허드"}', '액션, SF', 2018, 141, '미국', 7.5, '아쿠아맨 (2018) - 액션, SF. 감독: 제임스 완, 출연: 제이슨 모모아, 앰버 허드', '{"아쿠아맨","Aquaman","제임스 완","제이슨 모모아","앰버 허드","액션","SF"}', NULL, NULL);

-- 102. 원더 우먼 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원더 우먼', 'Wonder Woman', '패티 젠킨스', '{"갤 가돗","크리스 파인"}', '액션, SF', 2017, 126, '미국', 8, '원더 우먼 (2017) - 액션, SF. 감독: 패티 젠킨스, 출연: 갤 가돗, 크리스 파인', '{"원더 우먼","Wonder Woman","패티 젠킨스","갤 가돗","크리스 파인","액션","SF"}', NULL, NULL);

-- 103. 킹스맨: 시크릿 에이전트 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('킹스맨: 시크릿 에이전트', 'Kingsman: The Secret Service', '매튜 본', '{"태런 에저턴","콜린 퍼스"}', '액션, 코미디', 2014, 134, '미국', 8.2, '킹스맨: 시크릿 에이전트 (2014) - 액션, 코미디. 감독: 매튜 본, 출연: 태런 에저턴, 콜린 퍼스', '{"킹스맨: 시크릿 에이전트","Kingsman: The Secret Service","매튜 본","태런 에저턴","콜린 퍼스","액션","코미디"}', NULL, NULL);

-- 104. 데드풀 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('데드풀', 'Deadpool', '팀 밀러', '{"라이언 레이놀즈","모레나 바카린"}', '액션, 코미디', 2016, 145, '미국', 8.3, '데드풀 (2016) - 액션, 코미디. 감독: 팀 밀러, 출연: 라이언 레이놀즈, 모레나 바카린', '{"데드풀","Deadpool","팀 밀러","라이언 레이놀즈","모레나 바카린","액션","코미디"}', NULL, NULL);

-- 105. 가디언즈 오브 갤럭시 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('가디언즈 오브 갤럭시', 'Guardians of the Galaxy', '제임스 건', '{"크리스 프랫","조 샐다나"}', '액션, SF', 2014, 98, '미국', 8.4, '가디언즈 오브 갤럭시 (2014) - 액션, SF. 감독: 제임스 건, 출연: 크리스 프랫, 조 샐다나', '{"가디언즈 오브 갤럭시","Guardians of the Galaxy","제임스 건","크리스 프랫","조 샐다나","액션","SF"}', NULL, NULL);

-- 106. 닥터 스트레인지 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('닥터 스트레인지', 'Doctor Strange', '스콧 데릭슨', '{"베네딕트 컴버배치","틸다 스윈튼"}', '액션, SF', 2016, 97, '미국', 8, '닥터 스트레인지 (2016) - 액션, SF. 감독: 스콧 데릭슨, 출연: 베네딕트 컴버배치, 틸다 스윈튼', '{"닥터 스트레인지","Doctor Strange","스콧 데릭슨","베네딕트 컴버배치","틸다 스윈튼","액션","SF"}', NULL, NULL);

-- 107. 토르: 라그나로크 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토르: 라그나로크', 'Thor: Ragnarok', '타이카 와이티티', '{"크리스 헴스워스","톰 히들스턴"}', '액션, SF', 2017, 93, '미국', 8.1, '토르: 라그나로크 (2017) - 액션, SF. 감독: 타이카 와이티티, 출연: 크리스 헴스워스, 톰 히들스턴', '{"토르: 라그나로크","Thor: Ragnarok","타이카 와이티티","크리스 헴스워스","톰 히들스턴","액션","SF"}', NULL, NULL);

-- 108. 캡틴 아메리카: 윈터 솔져 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캡틴 아메리카: 윈터 솔져', 'Captain America: The Winter Soldier', '안소니 루소, 조 루소', '{"크리스 에반스","스칼렛 요한슨"}', '액션, SF', 2014, 142, '미국', 8.3, '캡틴 아메리카: 윈터 솔져 (2014) - 액션, SF. 감독: 안소니 루소, 조 루소, 출연: 크리스 에반스, 스칼렛 요한슨', '{"캡틴 아메리카: 윈터 솔져","Captain America: The Winter Soldier","안소니 루소, 조 루소","크리스 에반스","스칼렛 요한슨","액션","SF"}', NULL, NULL);

-- 109. 앤트맨 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('앤트맨', 'Ant-Man', '페이튼 리드', '{"폴 러드","에반젤린 릴리"}', '액션, SF', 2015, 129, '미국', 7.8, '앤트맨 (2015) - 액션, SF. 감독: 페이튼 리드, 출연: 폴 러드, 에반젤린 릴리', '{"앤트맨","Ant-Man","페이튼 리드","폴 러드","에반젤린 릴리","액션","SF"}', NULL, NULL);

-- 110. 블랙 위도우 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블랙 위도우', 'Black Widow', '케이트 쇼틀랜드', '{"스칼렛 요한슨","플로렌스 퓨"}', '액션, SF', 2021, 126, '미국', 7.6, '블랙 위도우 (2021) - 액션, SF. 감독: 케이트 쇼틀랜드, 출연: 스칼렛 요한슨, 플로렌스 퓨', '{"블랙 위도우","Black Widow","케이트 쇼틀랜드","스칼렛 요한슨","플로렌스 퓨","액션","SF"}', NULL, NULL);

COMMIT;

-- INSERT 완료. 총 110개 영화 추가됨
-- 
-- 📊 포함된 영화들:
-- - 한국 영화: 기생충, 부산행, 범죄도시, 극한직업, 올드보이, 살인의추억 등
-- - 할리우드 액션: 어벤져스, 다크나이트, 탑건매버릭, 존윅, 매드맥스 등
-- - SF & 판타지: 인터스텔라, 매트릭스, 아바타, 스타워즈, 반지의제왕 등
-- - 드라마: 쇼생크탈출, 포레스트검프, 타이타닉, 라라랜드, 대부 등
-- - 애니메이션: 겨울왕국, 토이스토리, 센과치히로, 코코, 인사이드아웃 등
-- - 클래식: 펄프픽션, 12명의성난사람들, 굿윌헌팅, 택시드라이버 등
-- 
-- 📋 데이터 완성도:
-- - 제목, 감독, 출연진, 장르, 개봉년도, 러닝타임 포함
-- - 평점 데이터 (7.5~9.3 범위)
-- - 검색 키워드 배열 (제목, 감독, 배우, 장르)
-- - 상세 설명 자동 생성
-- - 국가별 분류 (한국, 미국, 일본, 영국 등)
-- 
-- 💡 사용법:
-- 1. Supabase SQL 에디터에서 실행
-- 2. 카카오 스킬에서 다양한 영화 검색 가능
-- 3. 예: "기생충 영화평", "어벤져스 평점", "봉준호 감독", "액션 영화 추천" 등
-- 4. 장르별, 감독별, 배우별, 연도별 검색 지원
