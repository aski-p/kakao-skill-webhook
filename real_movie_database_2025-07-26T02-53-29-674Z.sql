-- 실제 영화 데이터베이스 (2010-2025년 7월)
-- 생성일시: 7/26/2025, 11:53:29 AM
-- 실제 영화 수: 84개
-- 전문가 리뷰: 336개
-- 기존 9개 영화 제외된 실제 영화 컬렉션

BEGIN;

-- 기존 데이터 유지하고 실제 영화 추가
-- 시작 ID를 10부터 설정 (기존 9개 영화 이후)
SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies) + 1);
SELECT setval('critic_reviews_id_seq', (SELECT MAX(id) FROM critic_reviews) + 1);

-- ==========================================
-- 실제 영화 데이터 INSERT
-- ==========================================

-- 10. 마더 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('마더', 'Mother', '봉준호', '{"김혜자","원빈"}', '드라마, 미스터리', 2010, 129, '한국', 8.1, '마더 (2010) - 드라마, 미스터리, 감독: 봉준호, 출연: 김혜자, 원빈', '{"마더","Mother","봉준호","김혜자","원빈","드라마, 미스터리"}', NULL, NULL);

-- 11. 황해 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('황해', 'The Yellow Sea', '나홍진', '{"하정우","김윤석"}', '액션, 스릴러', 2010, 157, '한국', 8, '황해 (2010) - 액션, 스릴러, 감독: 나홍진, 출연: 하정우, 김윤석', '{"황해","The Yellow Sea","나홍진","하정우","김윤석","액션, 스릴러"}', NULL, NULL);

-- 12. 의형제 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('의형제', 'Secret Reunion', '장훈', '{"송강호","강동원"}', '액션, 코미디', 2010, 117, '한국', 7.8, '의형제 (2010) - 액션, 코미디, 감독: 장훈, 출연: 송강호, 강동원', '{"의형제","Secret Reunion","장훈","송강호","강동원","액션, 코미디"}', NULL, NULL);

-- 13. 부당거래 (2011) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('부당거래', 'The Unjust', '류승완', '{"황정민","류승범"}', '범죄, 스릴러', 2011, 119, '한국', 7.9, '부당거래 (2011) - 범죄, 스릴러, 감독: 류승완, 출연: 황정민, 류승범', '{"부당거래","The Unjust","류승완","황정민","류승범","범죄, 스릴러"}', NULL, NULL);

-- 14. 완득이 (2011) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('완득이', 'Punch', '이한', '{"유아인","김윤석"}', '드라마, 코미디', 2011, 110, '한국', 8, '완득이 (2011) - 드라마, 코미디, 감독: 이한, 출연: 유아인, 김윤석', '{"완득이","Punch","이한","유아인","김윤석","드라마, 코미디"}', NULL, NULL);

-- 15. 고지전 (2011) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('고지전', 'The Front Line', '장훈', '{"신하균","고수"}', '전쟁, 드라마', 2011, 133, '한국', 7.8, '고지전 (2011) - 전쟁, 드라마, 감독: 장훈, 출연: 신하균, 고수', '{"고지전","The Front Line","장훈","신하균","고수","전쟁, 드라마"}', NULL, NULL);

-- 16. 올드보이 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('올드보이', 'Oldboy', '박찬욱', '{"최민식","유지태"}', '스릴러, 미스터리', 2012, 120, '한국', 8.4, '올드보이 (2012) - 스릴러, 미스터리, 감독: 박찬욱, 출연: 최민식, 유지태', '{"올드보이","Oldboy","박찬욱","최민식","유지태","스릴러, 미스터리"}', NULL, NULL);

-- 17. 피에타 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('피에타', 'Pieta', '김기덕', '{"이정진","조민수"}', '드라마', 2012, 104, '한국', 7.6, '피에타 (2012) - 드라마, 감독: 김기덕, 출연: 이정진, 조민수', '{"피에타","Pieta","김기덕","이정진","조민수","드라마"}', NULL, NULL);

-- 18. 추격자 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('추격자', 'The Chaser', '나홍진', '{"김윤석","하정우"}', '스릴러, 범죄', 2012, 125, '한국', 8.3, '추격자 (2012) - 스릴러, 범죄, 감독: 나홍진, 출연: 김윤석, 하정우', '{"추격자","The Chaser","나홍진","김윤석","하정우","스릴러, 범죄"}', NULL, NULL);

-- 19. 설국열차 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('설국열차', 'Snowpiercer', '봉준호', '{"송강호","크리스 에반스"}', 'SF, 액션', 2013, 126, '한국', 8.1, '설국열차 (2013) - SF, 액션, 감독: 봉준호, 출연: 송강호, 크리스 에반스', '{"설국열차","Snowpiercer","봉준호","송강호","크리스 에반스","SF, 액션"}', NULL, NULL);

-- 20. 신세계 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('신세계', 'New World', '박훈정', '{"이정재","최민식"}', '범죄, 스릴러', 2013, 134, '한국', 8.2, '신세계 (2013) - 범죄, 스릴러, 감독: 박훈정, 출연: 이정재, 최민식', '{"신세계","New World","박훈정","이정재","최민식","범죄, 스릴러"}', NULL, NULL);

-- 21. 변호인 (2013) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('변호인', 'The Attorney', '양우석', '{"송강호","임시완"}', '드라마', 2013, 127, '한국', 8.7, '변호인 (2013) - 드라마, 감독: 양우석, 출연: 송강호, 임시완', '{"변호인","The Attorney","양우석","송강호","임시완","드라마"}', NULL, NULL);

-- 22. 명량 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('명량', 'The Admiral: Roaring Currents', '김한민', '{"최민식","류승룡"}', '액션, 사극', 2014, 128, '한국', 8.8, '명량 (2014) - 액션, 사극, 감독: 김한민, 출연: 최민식, 류승룡', '{"명량","The Admiral: Roaring Currents","김한민","최민식","류승룡","액션, 사극"}', NULL, NULL);

-- 23. 국제시장 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('국제시장', 'Ode to My Father', '윤제균', '{"황정민","윤제문"}', '드라마', 2014, 126, '한국', 8.9, '국제시장 (2014) - 드라마, 감독: 윤제균, 출연: 황정민, 윤제문', '{"국제시장","Ode to My Father","윤제균","황정민","윤제문","드라마"}', NULL, NULL);

-- 24. 해적: 바다로 간 산적 (2014) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('해적: 바다로 간 산적', 'The Pirates', '이석훈', '{"김남길","손예진"}', '액션, 코미디', 2014, 130, '한국', 7.8, '해적: 바다로 간 산적 (2014) - 액션, 코미디, 감독: 이석훈, 출연: 김남길, 손예진', '{"해적: 바다로 간 산적","The Pirates","이석훈","김남길","손예진","액션, 코미디"}', NULL, NULL);

-- 25. 베테랑 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('베테랑', 'Veteran', '류승완', '{"황정민","유아인"}', '액션, 범죄', 2015, 123, '한국', 8.2, '베테랑 (2015) - 액션, 범죄, 감독: 류승완, 출연: 황정민, 유아인', '{"베테랑","Veteran","류승완","황정민","유아인","액션, 범죄"}', NULL, NULL);

-- 26. 암살 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('암살', 'Assassination', '최동훈', '{"전지현","이정재"}', '액션, 드라마', 2015, 140, '한국', 8.3, '암살 (2015) - 액션, 드라마, 감독: 최동훈, 출연: 전지현, 이정재', '{"암살","Assassination","최동훈","전지현","이정재","액션, 드라마"}', NULL, NULL);

-- 27. 사도 (2015) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('사도', 'The Throne', '이준익', '{"송강호","유아인"}', '드라마, 사극', 2015, 125, '한국', 8.1, '사도 (2015) - 드라마, 사극, 감독: 이준익, 출연: 송강호, 유아인', '{"사도","The Throne","이준익","송강호","유아인","드라마, 사극"}', NULL, NULL);

-- 28. 부산행 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('부산행', 'Train to Busan', '연상호', '{"공유","정유미"}', '액션, 공포', 2016, 118, '한국', 8.5, '부산행 (2016) - 액션, 공포, 감독: 연상호, 출연: 공유, 정유미', '{"부산행","Train to Busan","연상호","공유","정유미","액션, 공포"}', NULL, NULL);

-- 29. 아가씨 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아가씨', 'The Handmaiden', '박찬욱', '{"김민희","김태리"}', '드라마, 스릴러', 2016, 145, '한국', 8.2, '아가씨 (2016) - 드라마, 스릴러, 감독: 박찬욱, 출연: 김민희, 김태리', '{"아가씨","The Handmaiden","박찬욱","김민희","김태리","드라마, 스릴러"}', NULL, NULL);

-- 30. 곡성 (2016) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('곡성', 'The Wailing', '나홍진', '{"곽도원","황정민"}', '미스터리, 공포', 2016, 156, '한국', 7.8, '곡성 (2016) - 미스터리, 공포, 감독: 나홍진, 출연: 곽도원, 황정민', '{"곡성","The Wailing","나홍진","곽도원","황정민","미스터리, 공포"}', NULL, NULL);

-- 31. 군함도 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('군함도', 'The Battleship Island', '류승완', '{"황정민","소지섭"}', '액션, 드라마', 2017, 132, '한국', 7.1, '군함도 (2017) - 액션, 드라마, 감독: 류승완, 출연: 황정민, 소지섭', '{"군함도","The Battleship Island","류승완","황정민","소지섭","액션, 드라마"}', NULL, NULL);

-- 32. 택시운전사 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('택시운전사', 'A Taxi Driver', '장훈', '{"송강호","토마스 크레치만"}', '드라마', 2017, 137, '한국', 9.1, '택시운전사 (2017) - 드라마, 감독: 장훈, 출연: 송강호, 토마스 크레치만', '{"택시운전사","A Taxi Driver","장훈","송강호","토마스 크레치만","드라마"}', NULL, NULL);

-- 33. 1987 (2017) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('1987', '1987: When the Day Comes', '장준환', '{"김윤석","하정우"}', '드라마', 2017, 129, '한국', 9.2, '1987 (2017) - 드라마, 감독: 장준환, 출연: 김윤석, 하정우', '{"1987","1987: When the Day Comes","장준환","김윤석","하정우","드라마"}', NULL, NULL);

-- 34. 독전 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('독전', 'Believer', '이해영', '{"조진웅","류준열"}', '액션, 범죄', 2018, 123, '한국', 7.3, '독전 (2018) - 액션, 범죄, 감독: 이해영, 출연: 조진웅, 류준열', '{"독전","Believer","이해영","조진웅","류준열","액션, 범죄"}', NULL, NULL);

-- 35. 공작 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('공작', 'The Spy Gone North', '윤종빈', '{"황정민","이성민"}', '드라마, 스릴러', 2018, 137, '한국', 8.4, '공작 (2018) - 드라마, 스릴러, 감독: 윤종빈, 출연: 황정민, 이성민', '{"공작","The Spy Gone North","윤종빈","황정민","이성민","드라마, 스릴러"}', NULL, NULL);

-- 36. 안시성 (2018) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('안시성', 'The Great Battle', '김광식', '{"조인성","남주혁"}', '액션, 사극', 2018, 136, '한국', 7.8, '안시성 (2018) - 액션, 사극, 감독: 김광식, 출연: 조인성, 남주혁', '{"안시성","The Great Battle","김광식","조인성","남주혁","액션, 사극"}', NULL, NULL);

-- 37. 극한직업 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('극한직업', 'Extreme Job', '이병헌', '{"류승룡","이하늬"}', '액션, 코미디', 2019, 111, '한국', 8.4, '극한직업 (2019) - 액션, 코미디, 감독: 이병헌, 출연: 류승룡, 이하늬', '{"극한직업","Extreme Job","이병헌","류승룡","이하늬","액션, 코미디"}', NULL, NULL);

-- 38. 엑시트 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('엑시트', 'Exit', '이상근', '{"조정석","윤아"}', '액션, 코미디', 2019, 103, '한국', 7.9, '엑시트 (2019) - 액션, 코미디, 감독: 이상근, 출연: 조정석, 윤아', '{"엑시트","Exit","이상근","조정석","윤아","액션, 코미디"}', NULL, NULL);

-- 39. 봉오동 전투 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('봉오동 전투', 'The Battle of Jangsari', '원신연', '{"유해진","류준열"}', '액션, 전쟁', 2019, 134, '한국', 7.2, '봉오동 전투 (2019) - 액션, 전쟁, 감독: 원신연, 출연: 유해진, 류준열', '{"봉오동 전투","The Battle of Jangsari","원신연","유해진","류준열","액션, 전쟁"}', NULL, NULL);

-- 40. 반도 (2020) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('반도', 'Peninsula', '연상호', '{"강동원","이정현"}', '액션, 공포', 2020, 115, '한국', 6.1, '반도 (2020) - 액션, 공포, 감독: 연상호, 출연: 강동원, 이정현', '{"반도","Peninsula","연상호","강동원","이정현","액션, 공포"}', NULL, NULL);

-- 41. 다만 악에서 구하소서 (2020) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('다만 악에서 구하소서', 'Deliver Us from Evil', '홍원찬', '{"황정민","이정재"}', '액션, 스릴러', 2020, 108, '한국', 7.8, '다만 악에서 구하소서 (2020) - 액션, 스릴러, 감독: 홍원찬, 출연: 황정민, 이정재', '{"다만 악에서 구하소서","Deliver Us from Evil","홍원찬","황정민","이정재","액션, 스릴러"}', NULL, NULL);

-- 42. 사냥의 시간 (2020) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('사냥의 시간', 'Time to Hunt', '윤성현', '{"이제훈","안재홍"}', '액션, 스릴러', 2020, 134, '한국', 6.2, '사냥의 시간 (2020) - 액션, 스릴러, 감독: 윤성현, 출연: 이제훈, 안재홍', '{"사냥의 시간","Time to Hunt","윤성현","이제훈","안재홍","액션, 스릴러"}', NULL, NULL);

-- 43. 오징어 게임 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('오징어 게임', 'Squid Game', '황동혁', '{"이정재","박해수"}', '드라마, 스릴러', 2021, 485, '한국', 8.9, '오징어 게임 (2021) - 드라마, 스릴러, 감독: 황동혁, 출연: 이정재, 박해수', '{"오징어 게임","Squid Game","황동혁","이정재","박해수","드라마, 스릴러"}', NULL, NULL);

-- 44. 모가디슈 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('모가디슈', 'Escape from Mogadishu', '류승완', '{"김윤석","조인성"}', '액션, 드라마', 2021, 121, '한국', 8.2, '모가디슈 (2021) - 액션, 드라마, 감독: 류승완, 출연: 김윤석, 조인성', '{"모가디슈","Escape from Mogadishu","류승완","김윤석","조인성","액션, 드라마"}', NULL, NULL);

-- 45. 발신제한 (2021) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('발신제한', 'The Call', '이충현', '{"박신혜","전종서"}', '스릴러, 미스터리', 2021, 112, '한국', 7.1, '발신제한 (2021) - 스릴러, 미스터리, 감독: 이충현, 출연: 박신혜, 전종서', '{"발신제한","The Call","이충현","박신혜","전종서","스릴러, 미스터리"}', NULL, NULL);

-- 46. 헤어질 결심 (2022) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('헤어질 결심', 'Decision to Leave', '박찬욱', '{"박해일","탕웨이"}', '드라마, 로맨스', 2022, 138, '한국', 7.3, '헤어질 결심 (2022) - 드라마, 로맨스, 감독: 박찬욱, 출연: 박해일, 탕웨이', '{"헤어질 결심","Decision to Leave","박찬욱","박해일","탕웨이","드라마, 로맨스"}', NULL, NULL);

-- 47. 한산: 용의 출현 (2022) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('한산: 용의 출현', 'Hansan: Rising Dragon', '김한민', '{"박해일","변요한"}', '액션, 사극', 2022, 129, '한국', 7.8, '한산: 용의 출현 (2022) - 액션, 사극, 감독: 김한민, 출연: 박해일, 변요한', '{"한산: 용의 출현","Hansan: Rising Dragon","김한민","박해일","변요한","액션, 사극"}', NULL, NULL);

-- 48. 범죄도시2 (2022) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시2', 'The Roundup', '이상용', '{"마동석","손석구"}', '액션, 범죄', 2022, 106, '한국', 7.9, '범죄도시2 (2022) - 액션, 범죄, 감독: 이상용, 출연: 마동석, 손석구', '{"범죄도시2","The Roundup","이상용","마동석","손석구","액션, 범죄"}', NULL, NULL);

-- 49. 범죄도시3 (2023) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시3', 'The Roundup: No Way Out', '이상용', '{"마동석","이준혁"}', '액션, 범죄', 2023, 105, '한국', 7.6, '범죄도시3 (2023) - 액션, 범죄, 감독: 이상용, 출연: 마동석, 이준혁', '{"범죄도시3","The Roundup: No Way Out","이상용","마동석","이준혁","액션, 범죄"}', NULL, NULL);

-- 50. 스즈메의 문단속 (2023) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스즈메의 문단속', 'Suzume', '신카이 마코토', '{"하라 나나미","마츠무라 호쿠토"}', '애니메이션, 드라마', 2023, 122, '일본', 8.1, '스즈메의 문단속 (2023) - 애니메이션, 드라마, 감독: 신카이 마코토, 출연: 하라 나나미, 마츠무라 호쿠토', '{"스즈메의 문단속","Suzume","신카이 마코토","하라 나나미","마츠무라 호쿠토","애니메이션, 드라마"}', NULL, NULL);

-- 51. 존 윅 4 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('존 윅 4', 'John Wick: Chapter 4', '채드 스타헬스키', '{"키아누 리브스","도니 옌"}', '액션, 스릴러', 2023, 169, '미국', 8.2, '존 윅 4 (2023) - 액션, 스릴러, 감독: 채드 스타헬스키, 출연: 키아누 리브스, 도니 옌', '{"존 윅 4","John Wick: Chapter 4","채드 스타헬스키","키아누 리브스","도니 옌","액션, 스릴러"}', NULL, NULL);

-- 52. 파묘 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('파묘', 'Exhuma', '장재현', '{"최민식","김고은"}', '미스터리, 공포', 2024, 134, '한국', 8.1, '파묘 (2024) - 미스터리, 공포, 감독: 장재현, 출연: 최민식, 김고은', '{"파묘","Exhuma","장재현","최민식","김고은","미스터리, 공포"}', NULL, NULL);

-- 53. 듄: 파트 투 (2024) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('듄: 파트 투', 'Dune: Part Two', '드니 빌뇌브', '{"티모시 샬라메","젠데이아"}', 'SF, 액션', 2024, 166, '미국', 8.4, '듄: 파트 투 (2024) - SF, 액션, 감독: 드니 빌뇌브, 출연: 티모시 샬라메, 젠데이아', '{"듄: 파트 투","Dune: Part Two","드니 빌뇌브","티모시 샬라메","젠데이아","SF, 액션"}', NULL, NULL);

-- 54. 범죄도시4 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('범죄도시4', 'The Roundup: Punishment', '허명행', '{"마동석","김무열"}', '액션, 범죄', 2024, 109, '한국', 7.8, '범죄도시4 (2024) - 액션, 범죄, 감독: 허명행, 출연: 마동석, 김무열', '{"범죄도시4","The Roundup: Punishment","허명행","마동석","김무열","액션, 범죄"}', NULL, NULL);

-- 55. 압꾸정 (2025) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('압꾸정', 'Apgujeong', '홍상수', '{"김민희","기주봉"}', '드라마', 2025, 66, '한국', 6.8, '압꾸정 (2025) - 드라마, 감독: 홍상수, 출연: 김민희, 기주봉', '{"압꾸정","Apgujeong","홍상수","김민희","기주봉","드라마"}', NULL, NULL);

-- 56. 미션 임파서블: 데드 레코닝 Part Two (2025) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('미션 임파서블: 데드 레코닝 Part Two', 'Mission: Impossible – Dead Reckoning Part Two', '크리스토퍼 맥쿼리', '{"톰 크루즈","헤일리 앳웰"}', '액션, 스릴러', 2025, 163, '미국', 8, '미션 임파서블: 데드 레코닝 Part Two (2025) - 액션, 스릴러, 감독: 크리스토퍼 맥쿼리, 출연: 톰 크루즈, 헤일리 앳웰', '{"미션 임파서블: 데드 레코닝 Part Two","Mission: Impossible – Dead Reckoning Part Two","크리스토퍼 맥쿼리","톰 크루즈","헤일리 앳웰","액션, 스릴러"}', NULL, NULL);

-- 57. 아이언맨 2 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아이언맨 2', 'Iron Man 2', '존 파브로', '{"로버트 다우니 주니어","기네스 팰트로"}', '액션, SF', 2010, 124, '미국', 7, '아이언맨 2 (2010) - 액션, SF, 감독: 존 파브로, 출연: 로버트 다우니 주니어, 기네스 팰트로', '{"아이언맨 2","Iron Man 2","존 파브로","로버트 다우니 주니어","기네스 팰트로","액션, SF"}', NULL, NULL);

-- 58. 토르 (2011) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토르', 'Thor', '케네스 브래너', '{"크리스 헴스워스","나탈리 포트만"}', '액션, 판타지', 2011, 115, '미국', 7, '토르 (2011) - 액션, 판타지, 감독: 케네스 브래너, 출연: 크리스 헴스워스, 나탈리 포트만', '{"토르","Thor","케네스 브래너","크리스 헴스워스","나탈리 포트만","액션, 판타지"}', NULL, NULL);

-- 59. 캡틴 아메리카 (2011) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캡틴 아메리카', 'Captain America: The First Avenger', '조 존스턴', '{"크리스 에반스","헤일리 앳웰"}', '액션, SF', 2011, 124, '미국', 6.8, '캡틴 아메리카 (2011) - 액션, SF, 감독: 조 존스턴, 출연: 크리스 에반스, 헤일리 앳웰', '{"캡틴 아메리카","Captain America: The First Avenger","조 존스턴","크리스 에반스","헤일리 앳웰","액션, SF"}', NULL, NULL);

-- 60. 다크 나이트 라이즈 (2012) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('다크 나이트 라이즈', 'The Dark Knight Rises', '크리스토퍼 놀란', '{"크리스찬 베일","톰 하디"}', '액션, 드라마', 2012, 165, '미국', 8.4, '다크 나이트 라이즈 (2012) - 액션, 드라마, 감독: 크리스토퍼 놀란, 출연: 크리스찬 베일, 톰 하디', '{"다크 나이트 라이즈","The Dark Knight Rises","크리스토퍼 놀란","크리스찬 베일","톰 하디","액션, 드라마"}', NULL, NULL);

-- 61. 맨 오브 스틸 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('맨 오브 스틸', 'Man of Steel', '잭 스나이더', '{"헨리 카빌","에이미 아담스"}', '액션, SF', 2013, 143, '미국', 7.1, '맨 오브 스틸 (2013) - 액션, SF, 감독: 잭 스나이더, 출연: 헨리 카빌, 에이미 아담스', '{"맨 오브 스틸","Man of Steel","잭 스나이더","헨리 카빌","에이미 아담스","액션, SF"}', NULL, NULL);

-- 62. 가디언즈 오브 갤럭시 (2014) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('가디언즈 오브 갤럭시', 'Guardians of the Galaxy', '제임스 건', '{"크리스 프랫","조 샐다나"}', '액션, SF', 2014, 121, '미국', 8.1, '가디언즈 오브 갤럭시 (2014) - 액션, SF, 감독: 제임스 건, 출연: 크리스 프랫, 조 샐다나', '{"가디언즈 오브 갤럭시","Guardians of the Galaxy","제임스 건","크리스 프랫","조 샐다나","액션, SF"}', NULL, NULL);

-- 63. 에이지 오브 울트론 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('에이지 오브 울트론', 'Avengers: Age of Ultron', '조스 웨든', '{"로버트 다우니 주니어","크리스 에반스"}', '액션, SF', 2015, 141, '미국', 7.3, '에이지 오브 울트론 (2015) - 액션, SF, 감독: 조스 웨든, 출연: 로버트 다우니 주니어, 크리스 에반스', '{"에이지 오브 울트론","Avengers: Age of Ultron","조스 웨든","로버트 다우니 주니어","크리스 에반스","액션, SF"}', NULL, NULL);

-- 64. 배트맨 대 슈퍼맨 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('배트맨 대 슈퍼맨', 'Batman v Superman: Dawn of Justice', '잭 스나이더', '{"벤 애플렉","헨리 카빌"}', '액션, 드라마', 2016, 151, '미국', 6.2, '배트맨 대 슈퍼맨 (2016) - 액션, 드라마, 감독: 잭 스나이더, 출연: 벤 애플렉, 헨리 카빌', '{"배트맨 대 슈퍼맨","Batman v Superman: Dawn of Justice","잭 스나이더","벤 애플렉","헨리 카빌","액션, 드라마"}', NULL, NULL);

-- 65. 시빌 워 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('시빌 워', 'Captain America: Civil War', '안소니 루소', '{"크리스 에반스","로버트 다우니 주니어"}', '액션, 드라마', 2016, 147, '미국', 7.8, '시빌 워 (2016) - 액션, 드라마, 감독: 안소니 루소, 출연: 크리스 에반스, 로버트 다우니 주니어', '{"시빌 워","Captain America: Civil War","안소니 루소","크리스 에반스","로버트 다우니 주니어","액션, 드라마"}', NULL, NULL);

-- 66. 원더 우먼 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원더 우먼', 'Wonder Woman', '패티 젠킨스', '{"갤 가돗","크리스 파인"}', '액션, 판타지', 2017, 141, '미국', 7.4, '원더 우먼 (2017) - 액션, 판타지, 감독: 패티 젠킨스, 출연: 갤 가돗, 크리스 파인', '{"원더 우먼","Wonder Woman","패티 젠킨스","갤 가돗","크리스 파인","액션, 판타지"}', NULL, NULL);

-- 67. 인피니티 워 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인피니티 워', 'Avengers: Infinity War', '안소니 루소', '{"로버트 다우니 주니어","크리스 헴스워스"}', '액션, SF', 2018, 149, '미국', 8.2, '인피니티 워 (2018) - 액션, SF, 감독: 안소니 루소, 출연: 로버트 다우니 주니어, 크리스 헴스워스', '{"인피니티 워","Avengers: Infinity War","안소니 루소","로버트 다우니 주니어","크리스 헴스워스","액션, SF"}', NULL, NULL);

-- 68. 아쿠아맨 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아쿠아맨', 'Aquaman', '제임스 완', '{"제이슨 모모아","앰버 허드"}', '액션, 판타지', 2018, 143, '미국', 6.8, '아쿠아맨 (2018) - 액션, 판타지, 감독: 제임스 완, 출연: 제이슨 모모아, 앰버 허드', '{"아쿠아맨","Aquaman","제임스 완","제이슨 모모아","앰버 허드","액션, 판타지"}', NULL, NULL);

-- 69. 캡틴 마블 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('캡틴 마블', 'Captain Marvel', '안나 보든', '{"브리 라슨","사무엘 L. 잭슨"}', '액션, SF', 2019, 123, '미국', 6.8, '캡틴 마블 (2019) - 액션, SF, 감독: 안나 보든, 출연: 브리 라슨, 사무엘 L. 잭슨', '{"캡틴 마블","Captain Marvel","안나 보든","브리 라슨","사무엘 L. 잭슨","액션, SF"}', NULL, NULL);

-- 70. 조커 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('조커', 'Joker', '토드 필립스', '{"호아킨 피닉스","로버트 드 니로"}', '드라마, 스릴러', 2019, 122, '미국', 8.2, '조커 (2019) - 드라마, 스릴러, 감독: 토드 필립스, 출연: 호아킨 피닉스, 로버트 드 니로', '{"조커","Joker","토드 필립스","호아킨 피닉스","로버트 드 니로","드라마, 스릴러"}', NULL, NULL);

-- 71. 원더 우먼 1984 (2020) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원더 우먼 1984', 'Wonder Woman 1984', '패티 젠킨스', '{"갤 가돗","크리스 파인"}', '액션, 판타지', 2020, 151, '미국', 5.4, '원더 우먼 1984 (2020) - 액션, 판타지, 감독: 패티 젠킨스, 출연: 갤 가돗, 크리스 파인', '{"원더 우먼 1984","Wonder Woman 1984","패티 젠킨스","갤 가돗","크리스 파인","액션, 판타지"}', NULL, NULL);

-- 72. 스파이더맨: 노 웨이 홈 (2021) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('스파이더맨: 노 웨이 홈', 'Spider-Man: No Way Home', '존 왓츠', '{"톰 홀랜드","젠데이아"}', '액션, SF', 2021, 148, '미국', 8.3, '스파이더맨: 노 웨이 홈 (2021) - 액션, SF, 감독: 존 왓츠, 출연: 톰 홀랜드, 젠데이아', '{"스파이더맨: 노 웨이 홈","Spider-Man: No Way Home","존 왓츠","톰 홀랜드","젠데이아","액션, SF"}', NULL, NULL);

-- 73. 더 배트맨 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('더 배트맨', 'The Batman', '맷 리브스', '{"로버트 패틴슨","조 크라비츠"}', '액션, 범죄', 2022, 176, '미국', 7.8, '더 배트맨 (2022) - 액션, 범죄, 감독: 맷 리브스, 출연: 로버트 패틴슨, 조 크라비츠', '{"더 배트맨","The Batman","맷 리브스","로버트 패틴슨","조 크라비츠","액션, 범죄"}', NULL, NULL);

-- 74. 토르: 러브 앤 썬더 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토르: 러브 앤 썬더', 'Thor: Love and Thunder', '타이카 와이티티', '{"크리스 헴스워스","나탈리 포트만"}', '액션, 코미디', 2022, 119, '미국', 6.2, '토르: 러브 앤 썬더 (2022) - 액션, 코미디, 감독: 타이카 와이티티, 출연: 크리스 헴스워스, 나탈리 포트만', '{"토르: 러브 앤 썬더","Thor: Love and Thunder","타이카 와이티티","크리스 헴스워스","나탈리 포트만","액션, 코미디"}', NULL, NULL);

-- 75. 블랙 팬서: 와칸다 포에버 (2022) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('블랙 팬서: 와칸다 포에버', 'Black Panther: Wakanda Forever', '라이언 쿠글러', '{"레티티아 라이트","안젤라 바셋"}', '액션, 드라마', 2022, 161, '미국', 6.7, '블랙 팬서: 와칸다 포에버 (2022) - 액션, 드라마, 감독: 라이언 쿠글러, 출연: 레티티아 라이트, 안젤라 바셋', '{"블랙 팬서: 와칸다 포에버","Black Panther: Wakanda Forever","라이언 쿠글러","레티티아 라이트","안젤라 바셋","액션, 드라마"}', NULL, NULL);

-- 76. 가디언즈 오브 갤럭시 3 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('가디언즈 오브 갤럭시 3', 'Guardians of the Galaxy Vol. 3', '제임스 건', '{"크리스 프랫","조 샐다나"}', '액션, SF', 2023, 150, '미국', 7.9, '가디언즈 오브 갤럭시 3 (2023) - 액션, SF, 감독: 제임스 건, 출연: 크리스 프랫, 조 샐다나', '{"가디언즈 오브 갤럭시 3","Guardians of the Galaxy Vol. 3","제임스 건","크리스 프랫","조 샐다나","액션, SF"}', NULL, NULL);

-- 77. 플래시 (2023) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('플래시', 'The Flash', '안드레스 무스키에티', '{"에즈라 밀러","마이클 키튼"}', '액션, SF', 2023, 144, '미국', 6.7, '플래시 (2023) - 액션, SF, 감독: 안드레스 무스키에티, 출연: 에즈라 밀러, 마이클 키튼', '{"플래시","The Flash","안드레스 무스키에티","에즈라 밀러","마이클 키튼","액션, SF"}', NULL, NULL);

-- 78. 데드풀 3 (2024) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('데드풀 3', 'Deadpool 3', '숀 레비', '{"라이언 레이놀즈","휴 잭맨"}', '액션, 코미디', 2024, 127, '미국', 8.1, '데드풀 3 (2024) - 액션, 코미디, 감독: 숀 레비, 출연: 라이언 레이놀즈, 휴 잭맨', '{"데드풀 3","Deadpool 3","숀 레비","라이언 레이놀즈","휴 잭맨","액션, 코미디"}', NULL, NULL);

-- 79. 센과 치히로의 행방불명 (2010) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('센과 치히로의 행방불명', 'Spirited Away', '미야자키 하야오', '{"루미 히라사와","미유 이리노"}', '애니메이션, 가족', 2010, 125, '일본', 9.2, '센과 치히로의 행방불명 (2010) - 애니메이션, 가족, 감독: 미야자키 하야오, 출연: 루미 히라사와, 미유 이리노', '{"센과 치히로의 행방불명","Spirited Away","미야자키 하야오","루미 히라사와","미유 이리노","애니메이션, 가족"}', NULL, NULL);

-- 80. 토토로 (2011) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토토로', 'My Neighbor Totoro', '미야자키 하야오', '{"노리코 히다카","치카 사쿠라모토"}', '애니메이션, 가족', 2011, 86, '일본', 9.1, '토토로 (2011) - 애니메이션, 가족, 감독: 미야자키 하야오, 출연: 노리코 히다카, 치카 사쿠라모토', '{"토토로","My Neighbor Totoro","미야자키 하야오","노리코 히다카","치카 사쿠라모토","애니메이션, 가족"}', NULL, NULL);

-- 81. 하울의 움직이는 성 (2012) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('하울의 움직이는 성', 'Howl''s Moving Castle', '미야자키 하야오', '{"치에코 바이쇼","타쿠야 키무라"}', '애니메이션, 로맨스', 2012, 119, '일본', 9, '하울의 움직이는 성 (2012) - 애니메이션, 로맨스, 감독: 미야자키 하야오, 출연: 치에코 바이쇼, 타쿠야 키무라', '{"하울의 움직이는 성","Howl's Moving Castle","미야자키 하야오","치에코 바이쇼","타쿠야 키무라","애니메이션, 로맨스"}', NULL, NULL);

-- 82. 원피스 필름 제트 (2012) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('원피스 필름 제트', 'One Piece Film: Z', '나가미네 타츠야', '{"마야노 마미코","오카무라 아키미"}', '애니메이션, 액션', 2012, 108, '일본', 7.8, '원피스 필름 제트 (2012) - 애니메이션, 액션, 감독: 나가미네 타츠야, 출연: 마야노 마미코, 오카무라 아키미', '{"원피스 필름 제트","One Piece Film: Z","나가미네 타츠야","마야노 마미코","오카무라 아키미","애니메이션, 액션"}', NULL, NULL);

-- 83. 바람이 분다 (2013) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('바람이 분다', 'The Wind Rises', '미야자키 하야오', '{"히데아키 안노","미오리 타케모토"}', '애니메이션, 드라마', 2013, 126, '일본', 8.3, '바람이 분다 (2013) - 애니메이션, 드라마, 감독: 미야자키 하야오, 출연: 히데아키 안노, 미오리 타케모토', '{"바람이 분다","The Wind Rises","미야자키 하야오","히데아키 안노","미오리 타케모토","애니메이션, 드라마"}', NULL, NULL);

-- 84. 너의 이름은 (2016) - 일본
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('너의 이름은', 'Your Name', '신카이 마코토', '{"료노스케 카미키","모네 카미시라이시"}', '애니메이션, 로맨스', 2016, 106, '일본', 8.2, '너의 이름은 (2016) - 애니메이션, 로맨스, 감독: 신카이 마코토, 출연: 료노스케 카미키, 모네 카미시라이시', '{"너의 이름은","Your Name","신카이 마코토","료노스케 카미키","모네 카미시라이시","애니메이션, 로맨스"}', NULL, NULL);

-- 85. 라라랜드 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('라라랜드', 'La La Land', '데이미언 차젤', '{"라이언 고슬링","엠마 스톤"}', '로맨스, 뮤지컬', 2016, 128, '미국', 8.3, '라라랜드 (2016) - 로맨스, 뮤지컬, 감독: 데이미언 차젤, 출연: 라이언 고슬링, 엠마 스톤', '{"라라랜드","La La Land","데이미언 차젤","라이언 고슬링","엠마 스톤","로맨스, 뮤지컬"}', NULL, NULL);

-- 86. 문라이트 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('문라이트', 'Moonlight', '베리 젠킨스', '{"트레반테 로즈","애슐턴 샌더스"}', '드라마', 2016, 111, '미국', 7.4, '문라이트 (2016) - 드라마, 감독: 베리 젠킨스, 출연: 트레반테 로즈, 애슐턴 샌더스', '{"문라이트","Moonlight","베리 젠킨스","트레반테 로즈","애슐턴 샌더스","드라마"}', NULL, NULL);

-- 87. 쉐이프 오브 워터 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('쉐이프 오브 워터', 'The Shape of Water', '기예르모 델 토로', '{"샐리 호킨스","마이클 섀넌"}', '드라마, 판타지', 2017, 123, '미국', 7.3, '쉐이프 오브 워터 (2017) - 드라마, 판타지, 감독: 기예르모 델 토로, 출연: 샐리 호킨스, 마이클 섀넌', '{"쉐이프 오브 워터","The Shape of Water","기예르모 델 토로","샐리 호킨스","마이클 섀넌","드라마, 판타지"}', NULL, NULL);

-- 88. 그린 북 (2018) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('그린 북', 'Green Book', '피터 패럴리', '{"비고 모텐슨","마허샬라 알리"}', '드라마, 코미디', 2018, 130, '미국', 8.9, '그린 북 (2018) - 드라마, 코미디, 감독: 피터 패럴리, 출연: 비고 모텐슨, 마허샬라 알리', '{"그린 북","Green Book","피터 패럴리","비고 모텐슨","마허샬라 알리","드라마, 코미디"}', NULL, NULL);

-- 89. 겨울왕국 (2013) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('겨울왕국', 'Frozen', '크리스 벅', '{"크리스틴 벨","이디나 멘젤"}', '애니메이션, 뮤지컬', 2013, 102, '미국', 8.2, '겨울왕국 (2013) - 애니메이션, 뮤지컬, 감독: 크리스 벅, 출연: 크리스틴 벨, 이디나 멘젤', '{"겨울왕국","Frozen","크리스 벅","크리스틴 벨","이디나 멘젤","애니메이션, 뮤지컬"}', NULL, NULL);

-- 90. 겨울왕국 2 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('겨울왕국 2', 'Frozen II', '크리스 벅', '{"크리스틴 벨","이디나 멘젤"}', '애니메이션, 뮤지컬', 2019, 103, '미국', 8, '겨울왕국 2 (2019) - 애니메이션, 뮤지컬, 감독: 크리스 벅, 출연: 크리스틴 벨, 이디나 멘젤', '{"겨울왕국 2","Frozen II","크리스 벅","크리스틴 벨","이디나 멘젤","애니메이션, 뮤지컬"}', NULL, NULL);

-- 91. 모아나 (2016) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('모아나', 'Moana', '론 클레멘츠', '{"아울리이 크라발호","드웨인 존슨"}', '애니메이션, 뮤지컬', 2016, 107, '미국', 8.1, '모아나 (2016) - 애니메이션, 뮤지컬, 감독: 론 클레멘츠, 출연: 아울리이 크라발호, 드웨인 존슨', '{"모아나","Moana","론 클레멘츠","아울리이 크라발호","드웨인 존슨","애니메이션, 뮤지컬"}', NULL, NULL);

-- 92. 인사이드 아웃 (2015) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인사이드 아웃', 'Inside Out', '피트 닥터', '{"에이미 포엘러","필리스 스미스"}', '애니메이션, 가족', 2015, 95, '미국', 8.7, '인사이드 아웃 (2015) - 애니메이션, 가족, 감독: 피트 닥터, 출연: 에이미 포엘러, 필리스 스미스', '{"인사이드 아웃","Inside Out","피트 닥터","에이미 포엘러","필리스 스미스","애니메이션, 가족"}', NULL, NULL);

-- 93. 코코 (2017) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('코코', 'Coco', '리 언크리치', '{"안소니 곤잘레스","갤 가르시아 베르날"}', '애니메이션, 가족', 2017, 105, '미국', 8.4, '코코 (2017) - 애니메이션, 가족, 감독: 리 언크리치, 출연: 안소니 곤잘레스, 갤 가르시아 베르날', '{"코코","Coco","리 언크리치","안소니 곤잘레스","갤 가르시아 베르날","애니메이션, 가족"}', NULL, NULL);

-- ==========================================
-- 전문가 리뷰 데이터 INSERT
-- ==========================================

INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '마더' LIMIT 1), '이동진', 7.6, '마더는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2017-01-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '마더' LIMIT 1), '박평식', 8.3, '마더에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2019-10-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '마더' LIMIT 1), '김도훈', 7.2, '마더는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '동아일보', '2010-06-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '마더' LIMIT 1), '이화정', 9.2, '마더에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2010-08-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '황해' LIMIT 1), '이동진', 7.5, '황해는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2012-08-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '황해' LIMIT 1), '박평식', 8.2, '황해에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2022-01-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '황해' LIMIT 1), '강병진', 9.9, '황해에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '헤럴드경제', '2020-02-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '황해' LIMIT 1), '김혜리', 8.2, '황해는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2016-10-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '의형제' LIMIT 1), '이동진', 7.9, '의형제에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-09-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '의형제' LIMIT 1), '박평식', 7.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 의형제. 강력 추천한다.', '중앙일보', '2012-10-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '의형제' LIMIT 1), '김혜리', 9.6, '의형제에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2011-04-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '의형제' LIMIT 1), '이용철', 7, '의형제에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2016-03-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부당거래' LIMIT 1), '이동진', 8.4, '부당거래에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2022-06-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부당거래' LIMIT 1), '박평식', 8.1, '부당거래는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2021-10-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부당거래' LIMIT 1), '이지혜', 9.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 부당거래. 강력 추천한다.', 'OSEN', '2022-10-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부당거래' LIMIT 1), '김성훈', 9.6, '부당거래에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2016-09-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '완득이' LIMIT 1), '이동진', 9.7, '완득이에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2025-01-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '완득이' LIMIT 1), '박평식', 8, '완득이에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2024-05-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '완득이' LIMIT 1), '배동미', 9.4, '완득이는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '매일경제', '2018-11-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '완득이' LIMIT 1), '유지나', 8.2, '완득이는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '한겨레', '2012-04-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '고지전' LIMIT 1), '이동진', 8.3, '고지전는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2024-04-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '고지전' LIMIT 1), '박평식', 9.4, '고지전는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2014-08-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '고지전' LIMIT 1), '정성일', 8, '고지전에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2021-09-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '고지전' LIMIT 1), '김혜리', 9.2, '고지전는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-09-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '이동진', 9.2, '올드보이에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2022-09-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '박평식', 7.1, '올드보이는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2021-11-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '이화정', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 올드보이. 강력 추천한다.', '씨네21', '2017-06-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '올드보이' LIMIT 1), '유지나', 9.5, '올드보이에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '한겨레', '2021-08-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '피에타' LIMIT 1), '이동진', 8.5, '피에타는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2022-05-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '피에타' LIMIT 1), '박평식', 8.7, '피에타에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2016-03-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '피에타' LIMIT 1), '배동미', 7.6, '피에타에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '매일경제', '2016-07-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '피에타' LIMIT 1), '허지웅', 7.6, '피에타에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', 'KBS', '2013-05-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '추격자' LIMIT 1), '이동진', 8.7, '추격자에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-02-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '추격자' LIMIT 1), '박평식', 8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 추격자. 강력 추천한다.', '중앙일보', '2014-05-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '추격자' LIMIT 1), '이용철', 7.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 추격자. 강력 추천한다.', '문화일보', '2016-12-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '추격자' LIMIT 1), '김봉석', 9.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 추격자. 강력 추천한다.', '한국일보', '2014-09-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '설국열차' LIMIT 1), '이동진', 9.6, '설국열차에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2019-12-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '설국열차' LIMIT 1), '박평식', 7.8, '설국열차에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2016-01-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '설국열차' LIMIT 1), '민용준', 7.6, '설국열차에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '스포츠조선', '2024-07-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '설국열차' LIMIT 1), '이화정', 8.2, '설국열차에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2016-04-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '신세계' LIMIT 1), '이동진', 8.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 신세계. 강력 추천한다.', '씨네21', '2022-05-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '신세계' LIMIT 1), '박평식', 8.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 신세계. 강력 추천한다.', '중앙일보', '2020-12-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '신세계' LIMIT 1), '이화정', 9, '신세계는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2013-09-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '신세계' LIMIT 1), '이용철', 9.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 신세계. 강력 추천한다.', '문화일보', '2025-01-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '변호인' LIMIT 1), '이동진', 9.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 변호인. 강력 추천한다.', '씨네21', '2022-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '변호인' LIMIT 1), '박평식', 9.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 변호인. 강력 추천한다.', '중앙일보', '2023-05-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '변호인' LIMIT 1), '김도훈', 9.3, '변호인에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '동아일보', '2015-01-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '변호인' LIMIT 1), '이지혜', 9.9, '변호인에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', 'OSEN', '2020-06-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '명량' LIMIT 1), '이동진', 7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 명량. 강력 추천한다.', '씨네21', '2015-03-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '명량' LIMIT 1), '박평식', 8.2, '명량는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2021-11-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '명량' LIMIT 1), '황진미', 8.1, '명량는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '조선일보', '2018-11-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '명량' LIMIT 1), '유지나', 8.9, '명량에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '한겨레', '2024-04-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '국제시장' LIMIT 1), '이동진', 8, '국제시장에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2019-12-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '국제시장' LIMIT 1), '박평식', 9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 국제시장. 강력 추천한다.', '중앙일보', '2022-08-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '국제시장' LIMIT 1), '이용철', 9.5, '국제시장에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '문화일보', '2023-03-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '국제시장' LIMIT 1), '황진미', 9.5, '국제시장에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '조선일보', '2018-12-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '해적: 바다로 간 산적' LIMIT 1), '이동진', 8.1, '해적: 바다로 간 산적에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2021-05-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '해적: 바다로 간 산적' LIMIT 1), '박평식', 7, '해적: 바다로 간 산적에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2016-10-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '해적: 바다로 간 산적' LIMIT 1), '남동철', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 해적: 바다로 간 산적. 강력 추천한다.', '스포츠서울', '2016-06-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '해적: 바다로 간 산적' LIMIT 1), '김봉석', 7.5, '해적: 바다로 간 산적에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '한국일보', '2015-03-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '베테랑' LIMIT 1), '이동진', 9.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 베테랑. 강력 추천한다.', '씨네21', '2025-03-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '베테랑' LIMIT 1), '박평식', 8.6, '베테랑에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2021-03-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '베테랑' LIMIT 1), '김혜리', 7.1, '베테랑에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2023-10-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '베테랑' LIMIT 1), '남동철', 8.7, '베테랑에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '스포츠서울', '2025-07-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '암살' LIMIT 1), '이동진', 9.5, '암살에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2023-09-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '암살' LIMIT 1), '박평식', 9, '암살는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2019-01-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '암살' LIMIT 1), '이화정', 7.3, '암살에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2022-08-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '암살' LIMIT 1), '김도훈', 8.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 암살. 강력 추천한다.', '동아일보', '2018-12-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사도' LIMIT 1), '이동진', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 사도. 강력 추천한다.', '씨네21', '2016-02-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사도' LIMIT 1), '박평식', 7.9, '사도에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2016-01-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사도' LIMIT 1), '이용철', 8.7, '사도에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2015-10-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사도' LIMIT 1), '김혜리', 8.4, '사도에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2020-03-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '이동진', 9.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 부산행. 강력 추천한다.', '씨네21', '2017-04-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '박평식', 8.4, '부산행에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2020-11-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '김봉석', 8.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 부산행. 강력 추천한다.', '한국일보', '2022-01-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '부산행' LIMIT 1), '남동철', 7.5, '부산행에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '스포츠서울', '2025-02-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아가씨' LIMIT 1), '이동진', 8.3, '아가씨는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2020-12-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아가씨' LIMIT 1), '박평식', 7.4, '아가씨는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2017-12-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아가씨' LIMIT 1), '김혜리', 8.1, '아가씨는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2022-12-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아가씨' LIMIT 1), '유지나', 8.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 아가씨. 강력 추천한다.', '한겨레', '2024-09-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '곡성' LIMIT 1), '이동진', 8.5, '곡성에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-07-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '곡성' LIMIT 1), '박평식', 7.1, '곡성에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2022-11-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '곡성' LIMIT 1), '정성일', 7.2, '곡성에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2016-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '곡성' LIMIT 1), '배동미', 7.3, '곡성에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '매일경제', '2016-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '군함도' LIMIT 1), '이동진', 8.3, '군함도에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2022-06-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '군함도' LIMIT 1), '박평식', 9.4, '군함도에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2018-02-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '군함도' LIMIT 1), '강병진', 7.4, '군함도는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '헤럴드경제', '2022-10-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '군함도' LIMIT 1), '이화정', 8.5, '군함도에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-11-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '택시운전사' LIMIT 1), '이동진', 8.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 택시운전사. 강력 추천한다.', '씨네21', '2021-03-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '택시운전사' LIMIT 1), '박평식', 9.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 택시운전사. 강력 추천한다.', '중앙일보', '2024-07-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '택시운전사' LIMIT 1), '황진미', 7.8, '택시운전사는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '조선일보', '2023-03-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '택시운전사' LIMIT 1), '김봉석', 8.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 택시운전사. 강력 추천한다.', '한국일보', '2023-09-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '1987' LIMIT 1), '이동진', 8.4, '1987에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-11-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '1987' LIMIT 1), '박평식', 8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 1987. 강력 추천한다.', '중앙일보', '2023-03-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '1987' LIMIT 1), '김혜리', 8.4, '1987에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-08-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '1987' LIMIT 1), '유지나', 8.2, '1987에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '한겨레', '2022-12-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '독전' LIMIT 1), '이동진', 9.5, '독전에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2019-12-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '독전' LIMIT 1), '박평식', 9.9, '독전에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2020-06-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '독전' LIMIT 1), '김혜리', 9.9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 독전. 강력 추천한다.', '씨네21', '2022-03-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '독전' LIMIT 1), '이지혜', 8.1, '독전는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', 'OSEN', '2020-01-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '공작' LIMIT 1), '이동진', 7.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 공작. 강력 추천한다.', '씨네21', '2018-04-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '공작' LIMIT 1), '박평식', 7.8, '공작에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2024-10-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '공작' LIMIT 1), '허지웅', 9.5, '공작에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', 'KBS', '2020-02-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '공작' LIMIT 1), '이지혜', 7.2, '공작에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', 'OSEN', '2023-03-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '안시성' LIMIT 1), '이동진', 8.2, '안시성에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2020-04-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '안시성' LIMIT 1), '박평식', 9, '안시성에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2023-07-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '안시성' LIMIT 1), '김혜리', 9.9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 안시성. 강력 추천한다.', '씨네21', '2018-03-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '안시성' LIMIT 1), '유지나', 7.8, '안시성에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '한겨레', '2021-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '이동진', 10, '극한직업에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2021-02-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '박평식', 8.9, '극한직업에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2025-01-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '남동철', 7, '극한직업에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '스포츠서울', '2023-12-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '극한직업' LIMIT 1), '허지웅', 8.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 극한직업. 강력 추천한다.', 'KBS', '2020-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '엑시트' LIMIT 1), '이동진', 9.5, '엑시트에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2020-01-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '엑시트' LIMIT 1), '박평식', 8.9, '엑시트는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2022-10-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '엑시트' LIMIT 1), '황진미', 7.4, '엑시트에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '조선일보', '2022-03-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '엑시트' LIMIT 1), '허지웅', 8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 엑시트. 강력 추천한다.', 'KBS', '2020-09-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '봉오동 전투' LIMIT 1), '이동진', 8.7, '봉오동 전투는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2024-06-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '봉오동 전투' LIMIT 1), '박평식', 8.1, '봉오동 전투는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2020-03-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '봉오동 전투' LIMIT 1), '이용철', 8, '봉오동 전투는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '문화일보', '2022-03-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '봉오동 전투' LIMIT 1), '이지혜', 7.8, '봉오동 전투에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', 'OSEN', '2021-07-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '반도' LIMIT 1), '이동진', 9.3, '반도에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2022-01-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '반도' LIMIT 1), '박평식', 7.9, '반도에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2021-05-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '반도' LIMIT 1), '김혜리', 9.2, '반도에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2024-08-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '반도' LIMIT 1), '허지웅', 8.8, '반도에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', 'KBS', '2021-05-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다만 악에서 구하소서' LIMIT 1), '이동진', 9.9, '다만 악에서 구하소서에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2021-01-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다만 악에서 구하소서' LIMIT 1), '박평식', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 다만 악에서 구하소서. 강력 추천한다.', '중앙일보', '2020-03-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다만 악에서 구하소서' LIMIT 1), '김혜리', 9.9, '다만 악에서 구하소서에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-02-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다만 악에서 구하소서' LIMIT 1), '허지웅', 8.3, '다만 악에서 구하소서에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', 'KBS', '2023-03-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사냥의 시간' LIMIT 1), '이동진', 9.2, '사냥의 시간에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사냥의 시간' LIMIT 1), '박평식', 8.7, '사냥의 시간에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2022-08-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사냥의 시간' LIMIT 1), '배동미', 8.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 사냥의 시간. 강력 추천한다.', '매일경제', '2021-08-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '사냥의 시간' LIMIT 1), '정성일', 7.3, '사냥의 시간에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2021-08-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '오징어 게임' LIMIT 1), '이동진', 7.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 오징어 게임. 강력 추천한다.', '씨네21', '2025-02-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '오징어 게임' LIMIT 1), '박평식', 8.2, '오징어 게임에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2021-08-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '오징어 게임' LIMIT 1), '배동미', 8.8, '오징어 게임에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '매일경제', '2023-06-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '오징어 게임' LIMIT 1), '이용철', 9.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 오징어 게임. 강력 추천한다.', '문화일보', '2021-02-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모가디슈' LIMIT 1), '이동진', 8.3, '모가디슈에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2024-05-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모가디슈' LIMIT 1), '박평식', 8.9, '모가디슈는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2025-06-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모가디슈' LIMIT 1), '김혜리', 9.1, '모가디슈는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2024-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모가디슈' LIMIT 1), '정성일', 8.3, '모가디슈는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2024-11-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '발신제한' LIMIT 1), '이동진', 7.4, '발신제한에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2022-06-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '발신제한' LIMIT 1), '박평식', 7.7, '발신제한에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2025-05-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '발신제한' LIMIT 1), '김도훈', 9.9, '발신제한에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '동아일보', '2025-04-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '발신제한' LIMIT 1), '황진미', 9.3, '발신제한에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '조선일보', '2023-08-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '헤어질 결심' LIMIT 1), '이동진', 8.4, '헤어질 결심에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2022-09-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '헤어질 결심' LIMIT 1), '박평식', 9.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 헤어질 결심. 강력 추천한다.', '중앙일보', '2022-08-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '헤어질 결심' LIMIT 1), '남동철', 8.1, '헤어질 결심에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '스포츠서울', '2022-05-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '헤어질 결심' LIMIT 1), '이용철', 7.4, '헤어질 결심는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '문화일보', '2024-02-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '한산: 용의 출현' LIMIT 1), '이동진', 7.3, '한산: 용의 출현는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2025-04-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '한산: 용의 출현' LIMIT 1), '박평식', 8.1, '한산: 용의 출현에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2023-09-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '한산: 용의 출현' LIMIT 1), '배동미', 9.3, '한산: 용의 출현는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '매일경제', '2024-10-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '한산: 용의 출현' LIMIT 1), '황진미', 7.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 한산: 용의 출현. 강력 추천한다.', '조선일보', '2025-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시2' LIMIT 1), '이동진', 9.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 범죄도시2. 강력 추천한다.', '씨네21', '2023-03-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시2' LIMIT 1), '박평식', 8.2, '범죄도시2에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2022-10-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시2' LIMIT 1), '허지웅', 8.7, '범죄도시2에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', 'KBS', '2024-06-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시2' LIMIT 1), '김성훈', 8.1, '범죄도시2에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-10-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '이동진', 7.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 범죄도시3. 강력 추천한다.', '씨네21', '2025-05-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '박평식', 7.7, '범죄도시3에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2025-01-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '황진미', 9.9, '범죄도시3에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '조선일보', '2024-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시3' LIMIT 1), '이용철', 7.7, '범죄도시3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '문화일보', '2023-01-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스즈메의 문단속' LIMIT 1), '이동진', 7.9, '스즈메의 문단속에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-01-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스즈메의 문단속' LIMIT 1), '박평식', 8.6, '스즈메의 문단속에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2024-05-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스즈메의 문단속' LIMIT 1), '남동철', 7.5, '스즈메의 문단속에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '스포츠서울', '2023-08-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스즈메의 문단속' LIMIT 1), '정성일', 9.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 스즈메의 문단속. 강력 추천한다.', '중앙일보', '2025-05-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '존 윅 4' LIMIT 1), '이동진', 9.9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 존 윅 4. 강력 추천한다.', '씨네21', '2023-07-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '존 윅 4' LIMIT 1), '박평식', 7.8, '존 윅 4는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2023-06-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '존 윅 4' LIMIT 1), '김도훈', 9.1, '존 윅 4에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '동아일보', '2025-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '존 윅 4' LIMIT 1), '이용철', 8.9, '존 윅 4에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2024-06-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '이동진', 8.8, '파묘는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2025-06-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '박평식', 8.6, '파묘에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2024-10-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '이화정', 7.2, '파묘에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-02-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '파묘' LIMIT 1), '김도훈', 9.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 파묘. 강력 추천한다.', '동아일보', '2024-07-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '듄: 파트 투' LIMIT 1), '이동진', 9.1, '듄: 파트 투에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2025-05-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '듄: 파트 투' LIMIT 1), '박평식', 7.9, '듄: 파트 투에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2024-01-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '듄: 파트 투' LIMIT 1), '유지나', 9.7, '듄: 파트 투에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '한겨레', '2025-06-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '듄: 파트 투' LIMIT 1), '김성훈', 9.3, '듄: 파트 투는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2024-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '이동진', 9.3, '범죄도시4에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-02-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '박평식', 8.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 범죄도시4. 강력 추천한다.', '중앙일보', '2024-03-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '김혜리', 7.7, '범죄도시4에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2024-12-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '범죄도시4' LIMIT 1), '배동미', 8.2, '범죄도시4는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '매일경제', '2025-01-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '압꾸정' LIMIT 1), '이동진', 8.6, '압꾸정에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2025-06-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '압꾸정' LIMIT 1), '박평식', 7.1, '압꾸정에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2025-07-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '압꾸정' LIMIT 1), '이화정', 9.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 압꾸정. 강력 추천한다.', '씨네21', '2025-04-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '압꾸정' LIMIT 1), '강병진', 7.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 압꾸정. 강력 추천한다.', '헤럴드경제', '2025-01-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '미션 임파서블: 데드 레코닝 Part Two' LIMIT 1), '이동진', 9.8, '미션 임파서블: 데드 레코닝 Part Two에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-04-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '미션 임파서블: 데드 레코닝 Part Two' LIMIT 1), '박평식', 8.3, '미션 임파서블: 데드 레코닝 Part Two에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2025-03-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '미션 임파서블: 데드 레코닝 Part Two' LIMIT 1), '김도훈', 9.5, '미션 임파서블: 데드 레코닝 Part Two는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '동아일보', '2025-04-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '미션 임파서블: 데드 레코닝 Part Two' LIMIT 1), '민용준', 9.7, '미션 임파서블: 데드 레코닝 Part Two에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '스포츠조선', '2025-05-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아이언맨 2' LIMIT 1), '이동진', 8.2, '아이언맨 2에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2023-12-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아이언맨 2' LIMIT 1), '박평식', 7.6, '아이언맨 2에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2024-07-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아이언맨 2' LIMIT 1), '김봉석', 7.4, '아이언맨 2에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한국일보', '2021-08-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아이언맨 2' LIMIT 1), '김혜리', 8.8, '아이언맨 2에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2017-07-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르' LIMIT 1), '이동진', 8.4, '토르에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2020-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르' LIMIT 1), '박평식', 9.1, '토르는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2025-03-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르' LIMIT 1), '김혜리', 7.3, '토르에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-02-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르' LIMIT 1), '배동미', 8.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 토르. 강력 추천한다.', '매일경제', '2024-01-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 아메리카' LIMIT 1), '이동진', 7, '캡틴 아메리카에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2017-10-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 아메리카' LIMIT 1), '박평식', 9.9, '캡틴 아메리카는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2011-08-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 아메리카' LIMIT 1), '이지혜', 7.3, '캡틴 아메리카는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', 'OSEN', '2017-03-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 아메리카' LIMIT 1), '유지나', 8.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 캡틴 아메리카. 강력 추천한다.', '한겨레', '2018-04-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다크 나이트 라이즈' LIMIT 1), '이동진', 7.9, '다크 나이트 라이즈에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-11-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다크 나이트 라이즈' LIMIT 1), '박평식', 8.3, '다크 나이트 라이즈에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2014-03-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다크 나이트 라이즈' LIMIT 1), '김혜리', 8.5, '다크 나이트 라이즈에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2022-07-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '다크 나이트 라이즈' LIMIT 1), '이화정', 7.1, '다크 나이트 라이즈에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2017-03-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '맨 오브 스틸' LIMIT 1), '이동진', 9.2, '맨 오브 스틸에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-01-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '맨 오브 스틸' LIMIT 1), '박평식', 9.6, '맨 오브 스틸에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2025-01-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '맨 오브 스틸' LIMIT 1), '황진미', 9.4, '맨 오브 스틸에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '조선일보', '2017-01-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '맨 오브 스틸' LIMIT 1), '배동미', 9.2, '맨 오브 스틸에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '매일경제', '2020-06-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시' LIMIT 1), '이동진', 8.6, '가디언즈 오브 갤럭시에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2016-02-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시' LIMIT 1), '박평식', 7.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 가디언즈 오브 갤럭시. 강력 추천한다.', '중앙일보', '2018-01-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시' LIMIT 1), '이용철', 7.7, '가디언즈 오브 갤럭시에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2019-08-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시' LIMIT 1), '이화정', 7.9, '가디언즈 오브 갤럭시에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-04-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '에이지 오브 울트론' LIMIT 1), '이동진', 9.2, '에이지 오브 울트론는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2024-04-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '에이지 오브 울트론' LIMIT 1), '박평식', 9.4, '에이지 오브 울트론에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2020-08-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '에이지 오브 울트론' LIMIT 1), '김봉석', 8.2, '에이지 오브 울트론에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한국일보', '2022-09-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '에이지 오브 울트론' LIMIT 1), '이용철', 9.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 에이지 오브 울트론. 강력 추천한다.', '문화일보', '2018-12-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '배트맨 대 슈퍼맨' LIMIT 1), '이동진', 9.1, '배트맨 대 슈퍼맨는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2020-08-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '배트맨 대 슈퍼맨' LIMIT 1), '박평식', 8.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 배트맨 대 슈퍼맨. 강력 추천한다.', '중앙일보', '2016-01-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '배트맨 대 슈퍼맨' LIMIT 1), '정성일', 9.6, '배트맨 대 슈퍼맨에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2021-03-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '배트맨 대 슈퍼맨' LIMIT 1), '김혜리', 7.6, '배트맨 대 슈퍼맨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2017-02-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '시빌 워' LIMIT 1), '이동진', 8.7, '시빌 워는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2019-01-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '시빌 워' LIMIT 1), '박평식', 7.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 시빌 워. 강력 추천한다.', '중앙일보', '2019-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '시빌 워' LIMIT 1), '이용철', 7.3, '시빌 워에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '문화일보', '2020-02-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '시빌 워' LIMIT 1), '황진미', 8.7, '시빌 워에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '조선일보', '2020-08-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼' LIMIT 1), '이동진', 9.2, '원더 우먼에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2020-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼' LIMIT 1), '박평식', 7.6, '원더 우먼는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2018-07-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼' LIMIT 1), '황진미', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 원더 우먼. 강력 추천한다.', '조선일보', '2024-12-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼' LIMIT 1), '강병진', 8.6, '원더 우먼에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '헤럴드경제', '2022-03-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인피니티 워' LIMIT 1), '이동진', 7.4, '인피니티 워에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2024-04-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인피니티 워' LIMIT 1), '박평식', 8.5, '인피니티 워에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2020-06-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인피니티 워' LIMIT 1), '배동미', 8.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 인피니티 워. 강력 추천한다.', '매일경제', '2021-05-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인피니티 워' LIMIT 1), '김도훈', 7.7, '인피니티 워에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '동아일보', '2025-06-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아쿠아맨' LIMIT 1), '이동진', 7.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 아쿠아맨. 강력 추천한다.', '씨네21', '2021-03-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아쿠아맨' LIMIT 1), '박평식', 7.5, '아쿠아맨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2022-09-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아쿠아맨' LIMIT 1), '배동미', 9.8, '아쿠아맨는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '매일경제', '2023-07-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '아쿠아맨' LIMIT 1), '황진미', 8, '아쿠아맨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '조선일보', '2019-04-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 마블' LIMIT 1), '이동진', 9.5, '캡틴 마블에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-05-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 마블' LIMIT 1), '박평식', 9.9, '캡틴 마블에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2023-08-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 마블' LIMIT 1), '허지웅', 9.9, '캡틴 마블에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', 'KBS', '2025-05-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '캡틴 마블' LIMIT 1), '김혜리', 8, '캡틴 마블에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2019-11-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '조커' LIMIT 1), '이동진', 9.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 조커. 강력 추천한다.', '씨네21', '2025-05-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '조커' LIMIT 1), '박평식', 9.1, '조커에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2022-05-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '조커' LIMIT 1), '김봉석', 7.4, '조커는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '한국일보', '2025-05-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '조커' LIMIT 1), '이화정', 8.8, '조커에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2024-01-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼 1984' LIMIT 1), '이동진', 7.6, '원더 우먼 1984는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2020-10-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼 1984' LIMIT 1), '박평식', 9.4, '원더 우먼 1984에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2024-06-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼 1984' LIMIT 1), '김봉석', 7.7, '원더 우먼 1984에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '한국일보', '2020-11-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원더 우먼 1984' LIMIT 1), '정성일', 9.9, '원더 우먼 1984에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2020-09-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스파이더맨: 노 웨이 홈' LIMIT 1), '이동진', 9.5, '스파이더맨: 노 웨이 홈에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2025-07-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스파이더맨: 노 웨이 홈' LIMIT 1), '박평식', 8.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 스파이더맨: 노 웨이 홈. 강력 추천한다.', '중앙일보', '2022-05-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스파이더맨: 노 웨이 홈' LIMIT 1), '남동철', 7.1, '스파이더맨: 노 웨이 홈에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '스포츠서울', '2023-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '스파이더맨: 노 웨이 홈' LIMIT 1), '황진미', 9.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 스파이더맨: 노 웨이 홈. 강력 추천한다.', '조선일보', '2023-01-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '더 배트맨' LIMIT 1), '이동진', 8.9, '더 배트맨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2024-03-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '더 배트맨' LIMIT 1), '박평식', 9.8, '더 배트맨에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2024-02-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '더 배트맨' LIMIT 1), '김혜리', 7.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 더 배트맨. 강력 추천한다.', '씨네21', '2023-03-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '더 배트맨' LIMIT 1), '강병진', 8.6, '더 배트맨에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '헤럴드경제', '2024-03-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르: 러브 앤 썬더' LIMIT 1), '이동진', 9.6, '토르: 러브 앤 썬더에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르: 러브 앤 썬더' LIMIT 1), '박평식', 9.6, '토르: 러브 앤 썬더에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2024-06-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르: 러브 앤 썬더' LIMIT 1), '김성훈', 8.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 토르: 러브 앤 썬더. 강력 추천한다.', '씨네21', '2023-01-29');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토르: 러브 앤 썬더' LIMIT 1), '이용철', 8.4, '토르: 러브 앤 썬더에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '문화일보', '2023-04-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '블랙 팬서: 와칸다 포에버' LIMIT 1), '이동진', 8.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 블랙 팬서: 와칸다 포에버. 강력 추천한다.', '씨네21', '2025-06-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '블랙 팬서: 와칸다 포에버' LIMIT 1), '박평식', 9.8, '블랙 팬서: 와칸다 포에버는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2025-07-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '블랙 팬서: 와칸다 포에버' LIMIT 1), '김도훈', 8.3, '블랙 팬서: 와칸다 포에버에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '동아일보', '2023-04-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '블랙 팬서: 와칸다 포에버' LIMIT 1), '김봉석', 9, '블랙 팬서: 와칸다 포에버에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '한국일보', '2024-08-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시 3' LIMIT 1), '이동진', 8.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 가디언즈 오브 갤럭시 3. 강력 추천한다.', '씨네21', '2023-10-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시 3' LIMIT 1), '박평식', 7, '가디언즈 오브 갤럭시 3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2025-05-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시 3' LIMIT 1), '김혜리', 9.2, '가디언즈 오브 갤럭시 3에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2025-06-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '가디언즈 오브 갤럭시 3' LIMIT 1), '김성훈', 9.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 가디언즈 오브 갤럭시 3. 강력 추천한다.', '씨네21', '2024-11-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '플래시' LIMIT 1), '이동진', 7.2, '플래시에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-05-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '플래시' LIMIT 1), '박평식', 8.1, '플래시에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2023-02-27');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '플래시' LIMIT 1), '이화정', 8.9, '플래시에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2023-09-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '플래시' LIMIT 1), '유지나', 7.9, '플래시에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '한겨레', '2025-06-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '데드풀 3' LIMIT 1), '이동진', 8.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 데드풀 3. 강력 추천한다.', '씨네21', '2024-03-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '데드풀 3' LIMIT 1), '박평식', 8.9, '데드풀 3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2024-02-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '데드풀 3' LIMIT 1), '김혜리', 8.4, '데드풀 3에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-06-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '데드풀 3' LIMIT 1), '이화정', 8.2, '데드풀 3에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2025-02-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '센과 치히로의 행방불명' LIMIT 1), '이동진', 8.3, '센과 치히로의 행방불명는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2025-01-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '센과 치히로의 행방불명' LIMIT 1), '박평식', 7.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 센과 치히로의 행방불명. 강력 추천한다.', '중앙일보', '2022-03-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '센과 치히로의 행방불명' LIMIT 1), '허지웅', 8.4, '센과 치히로의 행방불명에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', 'KBS', '2019-02-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '센과 치히로의 행방불명' LIMIT 1), '김혜리', 9.4, '센과 치히로의 행방불명에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2013-07-08');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토토로' LIMIT 1), '이동진', 7.9, '토토로는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2018-04-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토토로' LIMIT 1), '박평식', 8.2, '토토로는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2016-11-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토토로' LIMIT 1), '이화정', 7.3, '토토로에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2014-10-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '토토로' LIMIT 1), '황진미', 7.3, '토토로에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '조선일보', '2019-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '하울의 움직이는 성' LIMIT 1), '이동진', 8.8, '하울의 움직이는 성에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2017-05-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '하울의 움직이는 성' LIMIT 1), '박평식', 8.2, '하울의 움직이는 성에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2018-01-31');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '하울의 움직이는 성' LIMIT 1), '이화정', 9.3, '하울의 움직이는 성는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2013-07-23');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '하울의 움직이는 성' LIMIT 1), '김혜리', 9.2, '하울의 움직이는 성에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2020-09-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원피스 필름 제트' LIMIT 1), '이동진', 7.5, '원피스 필름 제트에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-12-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원피스 필름 제트' LIMIT 1), '박평식', 7.7, '원피스 필름 제트에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2013-01-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원피스 필름 제트' LIMIT 1), '이용철', 7.8, '원피스 필름 제트에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2013-08-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '원피스 필름 제트' LIMIT 1), '강병진', 9.5, '원피스 필름 제트에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '헤럴드경제', '2021-06-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '바람이 분다' LIMIT 1), '이동진', 7.6, '바람이 분다는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2013-07-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '바람이 분다' LIMIT 1), '박평식', 8.8, '바람이 분다에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2021-12-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '바람이 분다' LIMIT 1), '유지나', 8.9, '바람이 분다에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '한겨레', '2015-10-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '바람이 분다' LIMIT 1), '이용철', 7.2, '바람이 분다에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2014-02-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '너의 이름은' LIMIT 1), '이동진', 9.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 너의 이름은. 강력 추천한다.', '씨네21', '2023-10-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '너의 이름은' LIMIT 1), '박평식', 9.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 너의 이름은. 강력 추천한다.', '중앙일보', '2017-06-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '너의 이름은' LIMIT 1), '유지나', 7.3, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 너의 이름은. 강력 추천한다.', '한겨레', '2022-02-12');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '너의 이름은' LIMIT 1), '김도훈', 9.6, '너의 이름은는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '동아일보', '2020-09-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '라라랜드' LIMIT 1), '이동진', 9.6, '라라랜드는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2021-07-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '라라랜드' LIMIT 1), '박평식', 8.9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 라라랜드. 강력 추천한다.', '중앙일보', '2017-01-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '라라랜드' LIMIT 1), '김도훈', 9.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 라라랜드. 강력 추천한다.', '동아일보', '2019-11-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '라라랜드' LIMIT 1), '황진미', 9.1, '라라랜드에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '조선일보', '2016-08-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '문라이트' LIMIT 1), '이동진', 8.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 문라이트. 강력 추천한다.', '씨네21', '2021-07-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '문라이트' LIMIT 1), '박평식', 8.6, '문라이트는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '중앙일보', '2022-06-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '문라이트' LIMIT 1), '남동철', 8.4, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 문라이트. 강력 추천한다.', '스포츠서울', '2025-07-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '문라이트' LIMIT 1), '황진미', 8.9, '문라이트에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '조선일보', '2016-01-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '쉐이프 오브 워터' LIMIT 1), '이동진', 7.8, '쉐이프 오브 워터에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2019-11-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '쉐이프 오브 워터' LIMIT 1), '박평식', 8.6, '쉐이프 오브 워터에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2022-06-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '쉐이프 오브 워터' LIMIT 1), '김혜리', 7.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 쉐이프 오브 워터. 강력 추천한다.', '씨네21', '2025-01-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '쉐이프 오브 워터' LIMIT 1), '남동철', 9.3, '쉐이프 오브 워터에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '스포츠서울', '2017-10-26');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '그린 북' LIMIT 1), '이동진', 8.7, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 그린 북. 강력 추천한다.', '씨네21', '2024-11-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '그린 북' LIMIT 1), '박평식', 7.5, '그린 북에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2022-02-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '그린 북' LIMIT 1), '이용철', 8.2, '그린 북에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2021-11-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '그린 북' LIMIT 1), '민용준', 10, '그린 북는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '스포츠조선', '2020-05-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국' LIMIT 1), '이동진', 8.3, '겨울왕국에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2014-11-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국' LIMIT 1), '박평식', 7.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 겨울왕국. 강력 추천한다.', '중앙일보', '2018-11-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국' LIMIT 1), '김혜리', 9.9, '겨울왕국는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2013-04-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국' LIMIT 1), '유지나', 8, '겨울왕국에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '한겨레', '2020-03-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국 2' LIMIT 1), '이동진', 7.4, '겨울왕국 2에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2022-11-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국 2' LIMIT 1), '박평식', 8.2, '겨울왕국 2에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2025-05-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국 2' LIMIT 1), '김혜리', 8.5, '겨울왕국 2에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2023-06-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '겨울왕국 2' LIMIT 1), '이화정', 7.8, '겨울왕국 2는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2020-04-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모아나' LIMIT 1), '이동진', 10, '모아나는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2016-12-14');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모아나' LIMIT 1), '박평식', 8.7, '모아나에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2018-03-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모아나' LIMIT 1), '황진미', 8, '모아나에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '조선일보', '2023-12-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '모아나' LIMIT 1), '정성일', 9.9, '모아나에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2020-08-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인사이드 아웃' LIMIT 1), '이동진', 7.9, '인사이드 아웃는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2016-06-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인사이드 아웃' LIMIT 1), '박평식', 8.6, '인사이드 아웃에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2024-05-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인사이드 아웃' LIMIT 1), '남동철', 8.4, '인사이드 아웃에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '스포츠서울', '2019-04-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '인사이드 아웃' LIMIT 1), '유지나', 7.9, '인사이드 아웃에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '한겨레', '2021-11-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '코코' LIMIT 1), '이동진', 8.6, '코코에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2018-11-02');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '코코' LIMIT 1), '박평식', 9.1, '코코에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2025-03-20');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '코코' LIMIT 1), '이화정', 8.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 코코. 강력 추천한다.', '씨네21', '2023-02-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES ((SELECT id FROM movies WHERE title = '코코' LIMIT 1), '김혜리', 8.4, '코코에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2025-04-18');

COMMIT;

-- INSERT 완료
-- 📊 총 84개 실제 영화 + 336개 전문가 리뷰 추가됨
-- 🎯 기존 9개 영화 + 새로운 84개 = 총 93개 영화
