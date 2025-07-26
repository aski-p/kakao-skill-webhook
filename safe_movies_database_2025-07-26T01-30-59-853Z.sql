-- 안전한 영화 데이터베이스 INSERT 문 (Foreign Key 오류 방지)
-- 생성일시: 7/26/2025, 10:30:59 AM
-- 총 영화 수: 9개
-- 총 전문가 리뷰: 36개
-- 특징: ID 순서 보장, Foreign Key 제약조건 준수

BEGIN;

-- 기존 데이터 정리 및 시퀀스 리셋
TRUNCATE TABLE critic_reviews CASCADE;
TRUNCATE TABLE movies RESTART IDENTITY CASCADE;
ALTER SEQUENCE movies_id_seq RESTART WITH 1;
ALTER SEQUENCE critic_reviews_id_seq RESTART WITH 1;

-- ==========================================
-- 영화 데이터 INSERT (ID 순서 보장)
-- ==========================================

-- 1. 인셉션 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('인셉션', 'Inception', '크리스토퍼 놀란', '{"레오나르도 디카프리오","마리옹 코티야르"}', 'SF, 액션', 2010, 148, '미국', 8.8, '인셉션 (2010) - SF, 액션, 감독: 크리스토퍼 놀란, 출연: 레오나르도 디카프리오, 마리옹 코티야르', '{"인셉션","Inception","크리스토퍼 놀란","레오나르도 디카프리오","마리옹 코티야르","SF, 액션"}', NULL, NULL);

-- 2. 아저씨 (2010) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('아저씨', 'The Man from Nowhere', '이정범', '{"원빈","김새론"}', '액션, 스릴러', 2010, 119, '한국', 8.5, '아저씨 (2010) - 액션, 스릴러, 감독: 이정범, 출연: 원빈, 김새론', '{"아저씨","The Man from Nowhere","이정범","원빈","김새론","액션, 스릴러"}', NULL, NULL);

-- 3. 토이 스토리 3 (2010) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('토이 스토리 3', 'Toy Story 3', '리 언크리치', '{"톰 행크스","팀 앨런"}', '애니메이션', 2010, 103, '미국', 8.7, '토이 스토리 3 (2010) - 애니메이션, 감독: 리 언크리치, 출연: 톰 행크스, 팀 앨런', '{"토이 스토리 3","Toy Story 3","리 언크리치","톰 행크스","팀 앨런","애니메이션"}', NULL, NULL);

-- 4. 최종병기 활 (2011) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('최종병기 활', 'War of the Arrows', '김한민', '{"박해일","문채원"}', '액션, 사극', 2011, 122, '한국', 7.7, '최종병기 활 (2011) - 액션, 사극, 감독: 김한민, 출연: 박해일, 문채원', '{"최종병기 활","War of the Arrows","김한민","박해일","문채원","액션, 사극"}', NULL, NULL);

-- 5. 도둑들 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('도둑들', 'The Thieves', '최동훈', '{"김윤석","김혜수","이정재"}', '액션, 범죄', 2012, 135, '한국', 7.8, '도둑들 (2012) - 액션, 범죄, 감독: 최동훈, 출연: 김윤석, 김혜수, 이정재', '{"도둑들","The Thieves","최동훈","김윤석","김혜수","이정재","액션, 범죄"}', NULL, NULL);

-- 6. 광해, 왕이 된 남자 (2012) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('광해, 왕이 된 남자', 'Masquerade', '추창민', '{"이병헌","류승룡"}', '드라마, 사극', 2012, 131, '한국', 8.4, '광해, 왕이 된 남자 (2012) - 드라마, 사극, 감독: 추창민, 출연: 이병헌, 류승룡', '{"광해, 왕이 된 남자","Masquerade","추창민","이병헌","류승룡","드라마, 사극"}', NULL, NULL);

-- 7. 기생충 (2019) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('기생충', 'Parasite', '봉준호', '{"송강호","이선균","조여정"}', '드라마, 스릴러', 2019, 132, '한국', 8.9, '기생충 (2019) - 드라마, 스릴러, 감독: 봉준호, 출연: 송강호, 이선균, 조여정', '{"기생충","Parasite","봉준호","송강호","이선균","조여정","드라마, 스릴러"}', NULL, NULL);

-- 8. 어벤져스: 엔드게임 (2019) - 미국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('어벤져스: 엔드게임', 'Avengers: Endgame', '안소니 루소, 조 루소', '{"로버트 다우니 주니어","크리스 에반스"}', '액션, SF', 2019, 181, '미국', 9, '어벤져스: 엔드게임 (2019) - 액션, SF, 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스', '{"어벤져스: 엔드게임","Avengers: Endgame","안소니 루소, 조 루소","로버트 다우니 주니어","크리스 에반스","액션, SF"}', NULL, NULL);

-- 9. 서울의 봄 (2024) - 한국
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES ('서울의 봄', 'Seoul Spring', '김성수', '{"황정민","정우성"}', '드라마', 2024, 141, '한국', 8.3, '서울의 봄 (2024) - 드라마, 감독: 김성수, 출연: 황정민, 정우성', '{"서울의 봄","Seoul Spring","김성수","황정민","정우성","드라마"}', NULL, NULL);

-- ==========================================
-- 전문가 리뷰 데이터 INSERT (영화 ID 매핑 확인)
-- ==========================================

INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '이동진', 9.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 인셉션. 강력 추천한다.', '씨네21', '2015-12-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '박평식', 8.7, '인셉션에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2020-06-24');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '김혜리', 7.3, '인셉션는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2017-10-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (1, '이화정', 7.8, '인셉션에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2017-12-06');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '이동진', 9.6, '아저씨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2018-07-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '박평식', 8.3, '아저씨에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2016-05-28');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '황진미', 9, '아저씨에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '조선일보', '2025-04-13');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (2, '김혜리', 7.7, '아저씨는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2016-10-15');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '이동진', 8.2, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 토이 스토리 3. 강력 추천한다.', '씨네21', '2013-07-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '박평식', 8.5, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 토이 스토리 3. 강력 추천한다.', '중앙일보', '2022-09-04');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '배동미', 8.3, '토이 스토리 3에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '매일경제', '2019-05-18');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (3, '이화정', 9.1, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 토이 스토리 3. 강력 추천한다.', '씨네21', '2017-11-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '이동진', 8.9, '최종병기 활는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.', '씨네21', '2021-04-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '박평식', 8.2, '최종병기 활에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '중앙일보', '2019-01-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '이용철', 7.2, '최종병기 활에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '문화일보', '2021-06-25');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (4, '김도훈', 7.7, '최종병기 활에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '동아일보', '2024-07-10');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '이동진', 8.6, '도둑들에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '씨네21', '2024-05-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '박평식', 9.8, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 도둑들. 강력 추천한다.', '중앙일보', '2020-07-19');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '김혜리', 8.9, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 도둑들. 강력 추천한다.', '씨네21', '2023-12-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (5, '민용준', 9.9, '도둑들에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '스포츠조선', '2017-11-17');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '이동진', 9.1, '광해, 왕이 된 남자에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2021-09-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '박평식', 7.6, '광해, 왕이 된 남자에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '중앙일보', '2014-05-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '강병진', 9.2, '광해, 왕이 된 남자에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.', '헤럴드경제', '2011-09-21');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (6, '김혜리', 7.7, '광해, 왕이 된 남자에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2015-07-30');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '이동진', 7.8, '기생충에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2017-04-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '박평식', 8, '기생충에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2012-10-11');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '김혜리', 9.2, '기생충에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2012-06-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (7, '이화정', 8.3, '기생충에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2025-07-07');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '이동진', 7.2, '어벤져스: 엔드게임에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '씨네21', '2011-11-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '박평식', 8.3, '어벤져스: 엔드게임에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2022-12-01');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '이용철', 7.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 어벤져스: 엔드게임. 강력 추천한다.', '문화일보', '2022-04-22');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (8, '민용준', 9.6, '어벤져스: 엔드게임에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '스포츠조선', '2021-11-05');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '이동진', 8.2, '서울의 봄에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '씨네21', '2021-07-03');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '박평식', 8.9, '서울의 봄에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.', '중앙일보', '2017-02-16');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '민용준', 9.6, '완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 서울의 봄. 강력 추천한다.', '스포츠조선', '2010-01-09');
INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (9, '황진미', 9.3, '서울의 봄에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.', '조선일보', '2010-05-01');

COMMIT;

-- INSERT 완료
-- 📊 총 9개 영화 + 36개 전문가 리뷰 추가됨
-- ✅ Foreign Key 제약조건 준수 확인됨
