-- 기존 movies 테이블 구조에 맞는 영화 데이터 INSERT 문
-- 생성일시: 2025. 7. 26. 오전 2:45:52
-- 총 영화 수: 66개
-- 데이터 소스: 엄선된 인기 영화 리스트 (한국/해외)

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

-- 영화 데이터 INSERT (중복 방지)
BEGIN;

-- 1. 기생충 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('기생충', 'Parasite', '봉준호', '{"송강호","이선균","조여정","최우식","박소담"}', '드라마, 스릴러, 코미디', 2019, 132, '한국', 8.9, '기생충 (2019) - 드라마, 스릴러, 코미디. 감독: 봉준호, 출연: 송강호, 이선균, 조여정', '{"기생충","Parasite","봉준호","송강호","이선균","조여정","드라마","스릴러","코미디"}', NULL, NULL);

-- 2. 미나리 (2020)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미나리', 'Minari', '정이삭', '{"스티븐 연","한예리","윤여정","앨런 김"}', '드라마', 2020, 115, '미국', 8.2, '미나리 (2020) - 드라마. 감독: 정이삭, 출연: 스티븐 연, 한예리, 윤여정', '{"미나리","Minari","정이삭","스티븐 연","한예리","윤여정","드라마"}', NULL, NULL);

-- 3. 부산행 (2016)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('부산행', 'Train to Busan', '연상호', '{"공유","정유미","마동석","김수안"}', '액션, 스릴러', 2016, 118, '한국', 8.3, '부산행 (2016) - 액션, 스릴러. 감독: 연상호, 출연: 공유, 정유미, 마동석', '{"부산행","Train to Busan","연상호","공유","정유미","마동석","액션","스릴러"}', NULL, NULL);

-- 4. 범죄도시 (2017)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시', 'The Outlaws', '강윤성', '{"마동석","윤계상","조재윤"}', '액션, 범죄', 2017, 121, '한국', 8.1, '범죄도시 (2017) - 액션, 범죄. 감독: 강윤성, 출연: 마동석, 윤계상, 조재윤', '{"범죄도시","The Outlaws","강윤성","마동석","윤계상","조재윤","액션","범죄"}', NULL, NULL);

-- 5. 극한직업 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('극한직업', 'Extreme Job', '이병헌', '{"류승룡","이하늬","진선규","이동휘"}', '코미디, 액션', 2019, 111, '한국', 8.4, '극한직업 (2019) - 코미디, 액션. 감독: 이병헌, 출연: 류승룡, 이하늬, 진선규', '{"극한직업","Extreme Job","이병헌","류승룡","이하늬","진선규","코미디","액션"}', NULL, NULL);

-- 6. 명량 (2014)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('명량', 'The Admiral: Roaring Currents', '김한민', '{"최민식","류승룡","조진웅"}', '액션, 전쟁', 2014, 128, '한국', 8, '명량 (2014) - 액션, 전쟁. 감독: 김한민, 출연: 최민식, 류승룡, 조진웅', '{"명량","The Admiral: Roaring Currents","김한민","최민식","류승룡","조진웅","액션","전쟁"}', NULL, NULL);

-- 7. 국제시장 (2014)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('국제시장', 'Ode to My Father', '윤제균', '{"황정민","김윤진","오달수"}', '드라마', 2014, 126, '한국', 8.1, '국제시장 (2014) - 드라마. 감독: 윤제균, 출연: 황정민, 김윤진, 오달수', '{"국제시장","Ode to My Father","윤제균","황정민","김윤진","오달수","드라마"}', NULL, NULL);

-- 8. 베테랑 (2015)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('베테랑', 'Veteran', '류승완', '{"황정민","유아인","유해진"}', '액션, 범죄', 2015, 123, '한국', 8.2, '베테랑 (2015) - 액션, 범죄. 감독: 류승완, 출연: 황정민, 유아인, 유해진', '{"베테랑","Veteran","류승완","황정민","유아인","유해진","액션","범죄"}', NULL, NULL);

-- 9. 암살 (2015)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('암살', 'Assassination', '최동훈', '{"전지현","이정재","하정우"}', '액션, 드라마', 2015, 139, '한국', 8.3, '암살 (2015) - 액션, 드라마. 감독: 최동훈, 출연: 전지현, 이정재, 하정우', '{"암살","Assassination","최동훈","전지현","이정재","하정우","액션","드라마"}', NULL, NULL);

-- 10. 도둑들 (2012)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('도둑들', 'The Thieves', '최동훈', '{"김윤석","김혜수","이정재"}', '액션, 범죄', 2012, 135, '한국', 7.8, '도둑들 (2012) - 액션, 범죄. 감독: 최동훈, 출연: 김윤석, 김혜수, 이정재', '{"도둑들","The Thieves","최동훈","김윤석","김혜수","이정재","액션","범죄"}', NULL, NULL);

-- 11. 광해, 왕이 된 남자 (2012)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('광해, 왕이 된 남자', 'Masquerade', '추창민', '{"이병헌","류승룡","한효주"}', '드라마, 사극', 2012, 131, '한국', 8.4, '광해, 왕이 된 남자 (2012) - 드라마, 사극. 감독: 추창민, 출연: 이병헌, 류승룡, 한효주', '{"광해, 왕이 된 남자","Masquerade","추창민","이병헌","류승룡","한효주","드라마","사극"}', NULL, NULL);

-- 12. 왕의 남자 (2005)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('왕의 남자', 'The King and the Clown', '이준익', '{"감우성","이준기","정진영"}', '드라마, 사극', 2005, 119, '한국', 8.2, '왕의 남자 (2005) - 드라마, 사극. 감독: 이준익, 출연: 감우성, 이준기, 정진영', '{"왕의 남자","The King and the Clown","이준익","감우성","이준기","정진영","드라마","사극"}', NULL, NULL);

-- 13. 실미도 (2003)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('실미도', 'Silmido', '강우석', '{"설경구","안성기","허준호"}', '액션, 드라마', 2003, 135, '한국', 7.9, '실미도 (2003) - 액션, 드라마. 감독: 강우석, 출연: 설경구, 안성기, 허준호', '{"실미도","Silmido","강우석","설경구","안성기","허준호","액션","드라마"}', NULL, NULL);

-- 14. 태극기 휘날리며 (2004)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('태극기 휘날리며', 'Taegukgi', '강제규', '{"장동건","원빈","이은주"}', '전쟁, 드라마', 2004, 140, '한국', 8.1, '태극기 휘날리며 (2004) - 전쟁, 드라마. 감독: 강제규, 출연: 장동건, 원빈, 이은주', '{"태극기 휘날리며","Taegukgi","강제규","장동건","원빈","이은주","전쟁","드라마"}', NULL, NULL);

-- 15. 친구 (2001)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('친구', 'Friend', '곽경택', '{"유오성","장동건","서태화"}', '드라마, 범죄', 2001, 113, '한국', 8, '친구 (2001) - 드라마, 범죄. 감독: 곽경택, 출연: 유오성, 장동건, 서태화', '{"친구","Friend","곽경택","유오성","장동건","서태화","드라마","범죄"}', NULL, NULL);

-- 16. 올드보이 (2003)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('올드보이', 'Oldboy', '박찬욱', '{"최민식","유지태","강혜정"}', '스릴러, 미스터리', 2003, 120, '한국', 8.4, '올드보이 (2003) - 스릴러, 미스터리. 감독: 박찬욱, 출연: 최민식, 유지태, 강혜정', '{"올드보이","Oldboy","박찬욱","최민식","유지태","강혜정","스릴러","미스터리"}', NULL, NULL);

-- 17. 살인의 추억 (2003)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('살인의 추억', 'Memories of Murder', '봉준호', '{"송강호","김상경","박해일"}', '범죄, 드라마', 2003, 131, '한국', 8.6, '살인의 추억 (2003) - 범죄, 드라마. 감독: 봉준호, 출연: 송강호, 김상경, 박해일', '{"살인의 추억","Memories of Murder","봉준호","송강호","김상경","박해일","범죄","드라마"}', NULL, NULL);

-- 18. 괴물 (2006)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('괴물', 'The Host', '봉준호', '{"송강호","변희봉","박해일"}', 'SF, 액션', 2006, 120, '한국', 8.2, '괴물 (2006) - SF, 액션. 감독: 봉준호, 출연: 송강호, 변희봉, 박해일', '{"괴물","The Host","봉준호","송강호","변희봉","박해일","SF","액션"}', NULL, NULL);

-- 19. 추격자 (2008)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('추격자', 'The Chaser', '나홍진', '{"김윤석","하정우","서영희"}', '스릴러, 범죄', 2008, 125, '한국', 8.3, '추격자 (2008) - 스릴러, 범죄. 감독: 나홍진, 출연: 김윤석, 하정우, 서영희', '{"추격자","The Chaser","나홍진","김윤석","하정우","서영희","스릴러","범죄"}', NULL, NULL);

-- 20. 황해 (2010)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('황해', 'The Yellow Sea', '나홍진', '{"하정우","김윤석","조성하"}', '액션, 스릴러', 2010, 157, '한국', 8, '황해 (2010) - 액션, 스릴러. 감독: 나홍진, 출연: 하정우, 김윤석, 조성하', '{"황해","The Yellow Sea","나홍진","하정우","김윤석","조성하","액션","스릴러"}', NULL, NULL);

-- 21. 아저씨 (2010)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아저씨', 'The Man from Nowhere', '이정범', '{"원빈","김새론","김희원"}', '액션, 스릴러', 2010, 119, '한국', 8.5, '아저씨 (2010) - 액션, 스릴러. 감독: 이정범, 출연: 원빈, 김새론, 김희원', '{"아저씨","The Man from Nowhere","이정범","원빈","김새론","김희원","액션","스릴러"}', NULL, NULL);

-- 22. 마더 (2009)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('마더', 'Mother', '봉준호', '{"김혜자","원빈","진구"}', '드라마, 미스터리', 2009, 129, '한국', 8.1, '마더 (2009) - 드라마, 미스터리. 감독: 봉준호, 출연: 김혜자, 원빈, 진구', '{"마더","Mother","봉준호","김혜자","원빈","진구","드라마","미스터리"}', NULL, NULL);

-- 23. 박쥐 (2009)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('박쥐', 'Thirst', '박찬욱', '{"송강호","김옥빈","신하균"}', '스릴러, 공포', 2009, 134, '한국', 7.9, '박쥐 (2009) - 스릴러, 공포. 감독: 박찬욱, 출연: 송강호, 김옥빈, 신하균', '{"박쥐","Thirst","박찬욱","송강호","김옥빈","신하균","스릴러","공포"}', NULL, NULL);

-- 24. 내부자들 (2015)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('내부자들', 'The Insiders', '우민호', '{"이병헌","조승우","백윤식"}', '범죄, 드라마', 2015, 130, '한국', 8.1, '내부자들 (2015) - 범죄, 드라마. 감독: 우민호, 출연: 이병헌, 조승우, 백윤식', '{"내부자들","The Insiders","우민호","이병헌","조승우","백윤식","범죄","드라마"}', NULL, NULL);

-- 25. 밀정 (2016)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('밀정', 'The Age of Shadows', '김지운', '{"송강호","공유","한지민"}', '액션, 스릴러', 2016, 140, '한국', 8, '밀정 (2016) - 액션, 스릴러. 감독: 김지운, 출연: 송강호, 공유, 한지민', '{"밀정","The Age of Shadows","김지운","송강호","공유","한지민","액션","스릴러"}', NULL, NULL);

-- 26. 관상 (2013)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('관상', 'The Face Reader', '한재림', '{"송강호","이정재","백윤식"}', '드라마, 사극', 2013, 139, '한국', 7.8, '관상 (2013) - 드라마, 사극. 감독: 한재림, 출연: 송강호, 이정재, 백윤식', '{"관상","The Face Reader","한재림","송강호","이정재","백윤식","드라마","사극"}', NULL, NULL);

-- 27. 신과함께-죄와 벌 (2017)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('신과함께-죄와 벌', 'Along with the Gods: The Two Worlds', '김용화', '{"하정우","차태현","주지훈"}', '판타지, 드라마', 2017, 139, '한국', 7.6, '신과함께-죄와 벌 (2017) - 판타지, 드라마. 감독: 김용화, 출연: 하정우, 차태현, 주지훈', '{"신과함께-죄와 벌","Along with the Gods: The Two Worlds","김용화","하정우","차태현","주지훈","판타지","드라마"}', NULL, NULL);

-- 28. 택시운전사 (2017)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('택시운전사', 'A Taxi Driver', '장훈', '{"송강호","토마스 크레치만","유해진"}', '드라마, 액션', 2017, 137, '한국', 8.3, '택시운전사 (2017) - 드라마, 액션. 감독: 장훈, 출연: 송강호, 토마스 크레치만, 유해진', '{"택시운전사","A Taxi Driver","장훈","송강호","토마스 크레치만","유해진","드라마","액션"}', NULL, NULL);

-- 29. 1987 (2017)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1987', '1987: When the Day Comes', '장준환', '{"김윤석","하정우","유해진"}', '드라마', 2017, 129, '한국', 8.5, '1987 (2017) - 드라마. 감독: 장준환, 출연: 김윤석, 하정우, 유해진', '{"1987","1987: When the Day Comes","장준환","김윤석","하정우","유해진","드라마"}', NULL, NULL);

-- 30. 공작 (2018)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('공작', 'The Spy Gone North', '윤종빈', '{"황정민","이성민","조진웅"}', '스릴러, 드라마', 2018, 137, '한국', 8.2, '공작 (2018) - 스릴러, 드라마. 감독: 윤종빈, 출연: 황정민, 이성민, 조진웅', '{"공작","The Spy Gone North","윤종빈","황정민","이성민","조진웅","스릴러","드라마"}', NULL, NULL);

-- 31. 마약왕 (2018)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('마약왕', 'The Drug King', '우민호', '{"송강호","조정석","배두나"}', '범죄, 드라마', 2018, 139, '한국', 7.9, '마약왕 (2018) - 범죄, 드라마. 감독: 우민호, 출연: 송강호, 조정석, 배두나', '{"마약왕","The Drug King","우민호","송강호","조정석","배두나","범죄","드라마"}', NULL, NULL);

-- 32. 어벤져스: 엔드게임 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스: 엔드게임', 'Avengers: Endgame', '안소니 루소, 조 루소', '{"로버트 다우니 주니어","크리스 에반스","마크 러팔로"}', '액션, SF', 2019, 181, '미국', 9, '어벤져스: 엔드게임 (2019) - 액션, SF. 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스, 마크 러팔로', '{"어벤져스: 엔드게임","Avengers: Endgame","안소니 루소, 조 루소","로버트 다우니 주니어","크리스 에반스","마크 러팔로","액션","SF"}', NULL, NULL);

-- 33. 아이언맨 (2008)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아이언맨', 'Iron Man', '존 파브로', '{"로버트 다우니 주니어","테런스 하워드","제프 브리지스"}', '액션, SF', 2008, 126, '미국', 8.1, '아이언맨 (2008) - 액션, SF. 감독: 존 파브로, 출연: 로버트 다우니 주니어, 테런스 하워드, 제프 브리지스', '{"아이언맨","Iron Man","존 파브로","로버트 다우니 주니어","테런스 하워드","제프 브리지스","액션","SF"}', NULL, NULL);

-- 34. 스파이더맨: 노 웨이 홈 (2021)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스파이더맨: 노 웨이 홈', 'Spider-Man: No Way Home', '존 와츠', '{"톰 홀랜드","젠데이아","베네딕트 컴버배치"}', '액션, SF', 2021, 148, '미국', 8.8, '스파이더맨: 노 웨이 홈 (2021) - 액션, SF. 감독: 존 와츠, 출연: 톰 홀랜드, 젠데이아, 베네딕트 컴버배치', '{"스파이더맨: 노 웨이 홈","Spider-Man: No Way Home","존 와츠","톰 홀랜드","젠데이아","베네딕트 컴버배치","액션","SF"}', NULL, NULL);

-- 35. 다크 나이트 (2008)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('다크 나이트', 'The Dark Knight', '크리스토퍼 놀란', '{"크리스찬 베일","히스 레저","아론 에크하트"}', '액션, 범죄', 2008, 152, '미국', 9.1, '다크 나이트 (2008) - 액션, 범죄. 감독: 크리스토퍼 놀란, 출연: 크리스찬 베일, 히스 레저, 아론 에크하트', '{"다크 나이트","The Dark Knight","크리스토퍼 놀란","크리스찬 베일","히스 레저","아론 에크하트","액션","범죄"}', NULL, NULL);

-- 36. 조커 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조커', 'Joker', '토드 필립스', '{"호아킨 피닉스","로버트 드 니로","제이디 비츠"}', '드라마, 스릴러', 2019, 122, '미국', 8.2, '조커 (2019) - 드라마, 스릴러. 감독: 토드 필립스, 출연: 호아킨 피닉스, 로버트 드 니로, 제이디 비츠', '{"조커","Joker","토드 필립스","호아킨 피닉스","로버트 드 니로","제이디 비츠","드라마","스릴러"}', NULL, NULL);

-- 37. 인터스텔라 (2014)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인터스텔라', 'Interstellar', '크리스토퍼 놀란', '{"매튜 맥커너히","앤 해서웨이","제시카 차스테인"}', 'SF, 드라마', 2014, 169, '미국', 9, '인터스텔라 (2014) - SF, 드라마. 감독: 크리스토퍼 놀란, 출연: 매튜 맥커너히, 앤 해서웨이, 제시카 차스테인', '{"인터스텔라","Interstellar","크리스토퍼 놀란","매튜 맥커너히","앤 해서웨이","제시카 차스테인","SF","드라마"}', NULL, NULL);

-- 38. 인셉션 (2010)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인셉션', 'Inception', '크리스토퍼 놀란', '{"레오나르도 디카프리오","마리옹 코티야르","톰 하디"}', 'SF, 액션', 2010, 148, '미국', 8.8, '인셉션 (2010) - SF, 액션. 감독: 크리스토퍼 놀란, 출연: 레오나르도 디카프리오, 마리옹 코티야르, 톰 하디', '{"인셉션","Inception","크리스토퍼 놀란","레오나르도 디카프리오","마리옹 코티야르","톰 하디","SF","액션"}', NULL, NULL);

-- 39. 타이타닉 (1997)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('타이타닉', 'Titanic', '제임스 카메론', '{"레오나르도 디카프리오","케이트 윈슬렛"}', '로맨스, 드라마', 1997, 194, '미국', 8.6, '타이타닉 (1997) - 로맨스, 드라마. 감독: 제임스 카메론, 출연: 레오나르도 디카프리오, 케이트 윈슬렛', '{"타이타닉","Titanic","제임스 카메론","레오나르도 디카프리오","케이트 윈슬렛","로맨스","드라마"}', NULL, NULL);

-- 40. 아바타 (2009)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아바타', 'Avatar', '제임스 카메론', '{"샘 워싱턴","조 샐다나","시고니 위버"}', 'SF, 액션', 2009, 162, '미국', 8.3, '아바타 (2009) - SF, 액션. 감독: 제임스 카메론, 출연: 샘 워싱턴, 조 샐다나, 시고니 위버', '{"아바타","Avatar","제임스 카메론","샘 워싱턴","조 샐다나","시고니 위버","SF","액션"}', NULL, NULL);

-- 41. 탑건: 매버릭 (2022)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('탑건: 매버릭', 'Top Gun: Maverick', '조제프 코신스키', '{"톰 크루즈","마일즈 텔러","제니퍼 코넬리"}', '액션, 드라마', 2022, 131, '미국', 8.7, '탑건: 매버릭 (2022) - 액션, 드라마. 감독: 조제프 코신스키, 출연: 톰 크루즈, 마일즈 텔러, 제니퍼 코넬리', '{"탑건: 매버릭","Top Gun: Maverick","조제프 코신스키","톰 크루즈","마일즈 텔러","제니퍼 코넬리","액션","드라마"}', NULL, NULL);

-- 42. 미션 임파서블: 폴아웃 (2018)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미션 임파서블: 폴아웃', 'Mission: Impossible - Fallout', '크리스토퍼 맥쿼리', '{"톰 크루즈","헨리 카빌","빙 레임스"}', '액션, 스릴러', 2018, 147, '미국', 8.4, '미션 임파서블: 폴아웃 (2018) - 액션, 스릴러. 감독: 크리스토퍼 맥쿼리, 출연: 톰 크루즈, 헨리 카빌, 빙 레임스', '{"미션 임파서블: 폴아웃","Mission: Impossible - Fallout","크리스토퍼 맥쿼리","톰 크루즈","헨리 카빌","빙 레임스","액션","스릴러"}', NULL, NULL);

-- 43. 분노의 질주: 더 얼티메이트 (2013)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('분노의 질주: 더 얼티메이트', 'Fast & Furious 6', '저스틴 린', '{"빈 디젤","폴 워커","드웨인 존슨"}', '액션', 2013, 130, '미국', 7.9, '분노의 질주: 더 얼티메이트 (2013) - 액션. 감독: 저스틴 린, 출연: 빈 디젤, 폴 워커, 드웨인 존슨', '{"분노의 질주: 더 얼티메이트","Fast & Furious 6","저스틴 린","빈 디젤","폴 워커","드웨인 존슨","액션"}', NULL, NULL);

-- 44. 겨울왕국 (2013)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('겨울왕국', 'Frozen', '크리스 벅, 제니퍼 리', '{"크리스틴 벨","이디나 멘젤","조나단 그로프"}', '애니메이션, 뮤지컬', 2013, 102, '미국', 8.3, '겨울왕국 (2013) - 애니메이션, 뮤지컬. 감독: 크리스 벅, 제니퍼 리, 출연: 크리스틴 벨, 이디나 멘젤, 조나단 그로프', '{"겨울왕국","Frozen","크리스 벅, 제니퍼 리","크리스틴 벨","이디나 멘젤","조나단 그로프","애니메이션","뮤지컬"}', NULL, NULL);

-- 45. 토이 스토리 4 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토이 스토리 4', 'Toy Story 4', '조시 쿨리', '{"톰 행크스","팀 앨런","애니 포츠"}', '애니메이션', 2019, 100, '미국', 8.1, '토이 스토리 4 (2019) - 애니메이션. 감독: 조시 쿨리, 출연: 톰 행크스, 팀 앨런, 애니 포츠', '{"토이 스토리 4","Toy Story 4","조시 쿨리","톰 행크스","팀 앨런","애니 포츠","애니메이션"}', NULL, NULL);

-- 46. 라이온 킹 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라이온 킹', 'The Lion King', '존 파브로', '{"도널드 글로버","비욘세","세스 로건"}', '애니메이션', 2019, 118, '미국', 7.8, '라이온 킹 (2019) - 애니메이션. 감독: 존 파브로, 출연: 도널드 글로버, 비욘세, 세스 로건', '{"라이온 킹","The Lion King","존 파브로","도널드 글로버","비욘세","세스 로건","애니메이션"}', NULL, NULL);

-- 47. 라라랜드 (2016)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라라랜드', 'La La Land', '데이미언 차젤리', '{"라이언 고슬링","엠마 스톤"}', '뮤지컬, 로맨스', 2016, 128, '미국', 8.3, '라라랜드 (2016) - 뮤지컬, 로맨스. 감독: 데이미언 차젤리, 출연: 라이언 고슬링, 엠마 스톤', '{"라라랜드","La La Land","데이미언 차젤리","라이언 고슬링","엠마 스톤","뮤지컬","로맨스"}', NULL, NULL);

-- 48. 조조 래빗 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조조 래빗', 'Jojo Rabbit', '타이카 와이티티', '{"로만 그리핀 데이비스","톰슨 맥켄지","스칼렛 요한슨"}', '코미디, 드라마', 2019, 108, '미국', 8.1, '조조 래빗 (2019) - 코미디, 드라마. 감독: 타이카 와이티티, 출연: 로만 그리핀 데이비스, 톰슨 맥켄지, 스칼렛 요한슨', '{"조조 래빗","Jojo Rabbit","타이카 와이티티","로만 그리핀 데이비스","톰슨 맥켄지","스칼렛 요한슨","코미디","드라마"}', NULL, NULL);

-- 49. 원스 어폰 어 타임 인 할리우드 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원스 어폰 어 타임 인 할리우드', 'Once Upon a Time in Hollywood', '쿠엔틴 타란티노', '{"레오나르도 디카프리오","브래드 피트","마고 로비"}', '드라마', 2019, 161, '미국', 7.9, '원스 어폰 어 타임 인 할리우드 (2019) - 드라마. 감독: 쿠엔틴 타란티노, 출연: 레오나르도 디카프리오, 브래드 피트, 마고 로비', '{"원스 어폰 어 타임 인 할리우드","Once Upon a Time in Hollywood","쿠엔틴 타란티노","레오나르도 디카프리오","브래드 피트","마고 로비","드라마"}', NULL, NULL);

-- 50. 1917 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1917', '1917', '샘 멘데스', '{"조지 맥케이","딘 찰스 채프먼"}', '전쟁, 드라마', 2019, 119, '영국', 8.5, '1917 (2019) - 전쟁, 드라마. 감독: 샘 멘데스, 출연: 조지 맥케이, 딘 찰스 채프먼', '{"1917","1917","샘 멘데스","조지 맥케이","딘 찰스 채프먼","전쟁","드라마"}', NULL, NULL);

-- 51. 포드 v 페라리 (2019)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('포드 v 페라리', 'Ford v Ferrari', '제임스 맨골드', '{"맷 데이먼","크리스찬 베일"}', '드라마, 액션', 2019, 152, '미국', 8.2, '포드 v 페라리 (2019) - 드라마, 액션. 감독: 제임스 맨골드, 출연: 맷 데이먼, 크리스찬 베일', '{"포드 v 페라리","Ford v Ferrari","제임스 맨골드","맷 데이먼","크리스찬 베일","드라마","액션"}', NULL, NULL);

-- 52. 매트릭스 (1999)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('매트릭스', 'The Matrix', '라나 워쇼스키, 릴리 워쇼스키', '{"키아누 리브스","로렌스 피시번","캐리 앤 모스"}', 'SF, 액션', 1999, 136, '미국', 8.7, '매트릭스 (1999) - SF, 액션. 감독: 라나 워쇼스키, 릴리 워쇼스키, 출연: 키아누 리브스, 로렌스 피시번, 캐리 앤 모스', '{"매트릭스","The Matrix","라나 워쇼스키, 릴리 워쇼스키","키아누 리브스","로렌스 피시번","캐리 앤 모스","SF","액션"}', NULL, NULL);

-- 53. 터미네이터 2: 심판의 날 (1991)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('터미네이터 2: 심판의 날', 'Terminator 2: Judgment Day', '제임스 카메론', '{"아놀드 슈왈제네거","린다 해밀턴"}', 'SF, 액션', 1991, 137, '미국', 8.9, '터미네이터 2: 심판의 날 (1991) - SF, 액션. 감독: 제임스 카메론, 출연: 아놀드 슈왈제네거, 린다 해밀턴', '{"터미네이터 2: 심판의 날","Terminator 2: Judgment Day","제임스 카메론","아놀드 슈왈제네거","린다 해밀턴","SF","액션"}', NULL, NULL);

-- 54. 에일리언 (1979)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('에일리언', 'Alien', '리들리 스콧', '{"시고니 위버","톰 스케릿"}', 'SF, 공포', 1979, 117, '미국', 8.4, '에일리언 (1979) - SF, 공포. 감독: 리들리 스콧, 출연: 시고니 위버, 톰 스케릿', '{"에일리언","Alien","리들리 스콧","시고니 위버","톰 스케릿","SF","공포"}', NULL, NULL);

-- 55. 블레이드 러너 2049 (2017)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블레이드 러너 2049', 'Blade Runner 2049', '드니 빌뇌브', '{"라이언 고슬링","해리슨 포드"}', 'SF, 드라마', 2017, 164, '미국', 8.1, '블레이드 러너 2049 (2017) - SF, 드라마. 감독: 드니 빌뇌브, 출연: 라이언 고슬링, 해리슨 포드', '{"블레이드 러너 2049","Blade Runner 2049","드니 빌뇌브","라이언 고슬링","해리슨 포드","SF","드라마"}', NULL, NULL);

-- 56. 덩케르크 (2017)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('덩케르크', 'Dunkirk', '크리스토퍼 놀란', '{"피온 화이트헤드","톰 글린 카니"}', '전쟁, 액션', 2017, 106, '영국', 8, '덩케르크 (2017) - 전쟁, 액션. 감독: 크리스토퍼 놀란, 출연: 피온 화이트헤드, 톰 글린 카니', '{"덩케르크","Dunkirk","크리스토퍼 놀란","피온 화이트헤드","톰 글린 카니","전쟁","액션"}', NULL, NULL);

-- 57. 글래디에이터 (2000)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('글래디에이터', 'Gladiator', '리들리 스콧', '{"러셀 크로우","호아킨 피닉스"}', '액션, 드라마', 2000, 155, '미국', 8.5, '글래디에이터 (2000) - 액션, 드라마. 감독: 리들리 스콧, 출연: 러셀 크로우, 호아킨 피닉스', '{"글래디에이터","Gladiator","리들리 스콧","러셀 크로우","호아킨 피닉스","액션","드라마"}', NULL, NULL);

-- 58. 포레스트 검프 (1994)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('포레스트 검프', 'Forrest Gump', '로버트 저메키스', '{"톰 행크스","로빈 라이트"}', '드라마', 1994, 142, '미국', 8.8, '포레스트 검프 (1994) - 드라마. 감독: 로버트 저메키스, 출연: 톰 행크스, 로빈 라이트', '{"포레스트 검프","Forrest Gump","로버트 저메키스","톰 행크스","로빈 라이트","드라마"}', NULL, NULL);

-- 59. 쇼생크 탈출 (1994)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('쇼생크 탈출', 'The Shawshank Redemption', '프랭크 다라본트', '{"팀 로빈스","모건 프리먼"}', '드라마', 1994, 142, '미국', 9.3, '쇼생크 탈출 (1994) - 드라마. 감독: 프랭크 다라본트, 출연: 팀 로빈스, 모건 프리먼', '{"쇼생크 탈출","The Shawshank Redemption","프랭크 다라본트","팀 로빈스","모건 프리먼","드라마"}', NULL, NULL);

-- 60. 펄프 픽션 (1994)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('펄프 픽션', 'Pulp Fiction', '쿠엔틴 타란티노', '{"존 트라볼타","사무엘 L. 잭슨","우마 서먼"}', '범죄', 1994, 154, '미국', 8.6, '펄프 픽션 (1994) - 범죄. 감독: 쿠엔틴 타란티노, 출연: 존 트라볼타, 사무엘 L. 잭슨, 우마 서먼', '{"펄프 픽션","Pulp Fiction","쿠엔틴 타란티노","존 트라볼타","사무엘 L. 잭슨","우마 서먼","범죄"}', NULL, NULL);

-- 61. 시민 케인 (1941)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('시민 케인', 'Citizen Kane', '오슨 웰스', '{"오슨 웰스","조셉 코튼"}', '드라마', 1941, 119, '미국', 8.7, '시민 케인 (1941) - 드라마. 감독: 오슨 웰스, 출연: 오슨 웰스, 조셉 코튼', '{"시민 케인","Citizen Kane","오슨 웰스","오슨 웰스","조셉 코튼","드라마"}', NULL, NULL);

-- 62. 카사블랑카 (1942)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('카사블랑카', 'Casablanca', '마이클 커티즈', '{"험프리 보가트","잉그리드 버그만"}', '로맨스, 드라마', 1942, 102, '미국', 8.9, '카사블랑카 (1942) - 로맨스, 드라마. 감독: 마이클 커티즈, 출연: 험프리 보가트, 잉그리드 버그만', '{"카사블랑카","Casablanca","마이클 커티즈","험프리 보가트","잉그리드 버그만","로맨스","드라마"}', NULL, NULL);

-- 63. 12명의 성난 사람들 (1957)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('12명의 성난 사람들', '12 Angry Men', '시드니 루멧', '{"헨리 폰다","리 J. 콥"}', '드라마', 1957, 96, '미국', 8.8, '12명의 성난 사람들 (1957) - 드라마. 감독: 시드니 루멧, 출연: 헨리 폰다, 리 J. 콥', '{"12명의 성난 사람들","12 Angry Men","시드니 루멧","헨리 폰다","리 J. 콥","드라마"}', NULL, NULL);

-- 64. 대부 (1972)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('대부', 'The Godfather', '프랜시스 포드 코폴라', '{"말론 브란도","알 파치노"}', '범죄, 드라마', 1972, 175, '미국', 9.2, '대부 (1972) - 범죄, 드라마. 감독: 프랜시스 포드 코폴라, 출연: 말론 브란도, 알 파치노', '{"대부","The Godfather","프랜시스 포드 코폴라","말론 브란도","알 파치노","범죄","드라마"}', NULL, NULL);

-- 65. 대부 2 (1974)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('대부 2', 'The Godfather Part II', '프랜시스 포드 코폴라', '{"알 파치노","로버트 드 니로"}', '범죄, 드라마', 1974, 202, '미국', 9.1, '대부 2 (1974) - 범죄, 드라마. 감독: 프랜시스 포드 코폴라, 출연: 알 파치노, 로버트 드 니로', '{"대부 2","The Godfather Part II","프랜시스 포드 코폴라","알 파치노","로버트 드 니로","범죄","드라마"}', NULL, NULL);

-- 66. 캐스트 어웨이 (2000)
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캐스트 어웨이', 'Cast Away', '로버트 저메키스', '{"톰 행크스","헬렌 헌트"}', '드라마', 2000, 143, '미국', 8.1, '캐스트 어웨이 (2000) - 드라마. 감독: 로버트 저메키스, 출연: 톰 행크스, 헬렌 헌트', '{"캐스트 어웨이","Cast Away","로버트 저메키스","톰 행크스","헬렌 헌트","드라마"}', NULL, NULL);

COMMIT;

-- INSERT 완료. 총 66개 영화 추가됨
-- 
-- 📊 포함된 영화:
-- - 한국 영화: 기생충, 부산행, 범죄도시, 극한직업, 올드보이, 살인의 추억 등
-- - 해외 영화: 어벤져스, 다크나이트, 인터스텔라, 쇼생크탈출, 대부 등
-- 
-- 📋 데이터 완성도:
-- - 제목, 감독, 출연진, 장르, 개봉년도, 러닝타임 포함
-- - 평점 데이터 (7.6~9.3 범위)
-- - 검색 키워드 배열 (제목, 감독, 배우, 장르)
-- - 상세 설명 자동 생성
-- 
-- 💡 사용법:
-- 1. Supabase SQL 에디터에서 실행
-- 2. 카카오 스킬에서 "영화제목 + 영화평/평점" 형태로 테스트
-- 3. 예: "기생충 영화평", "어벤져스 평점", "인터스텔라 리뷰"
