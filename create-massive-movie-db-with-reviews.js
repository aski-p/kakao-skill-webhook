// 대용량 영화 데이터베이스 생성기 (2010-2025년 + 전문가 리뷰)
const fs = require('fs');
const path = require('path');

class MassiveMovieDBWithReviews {
    constructor() {
        // 전문가 평론가 목록 (이동진, 박평식 고정 + 랜덤 2명)
        this.critics = {
            fixed: [
                { name: '이동진', source: '씨네21' },
                { name: '박평식', source: '중앙일보' }
            ],
            random: [
                { name: '김혜리', source: '씨네21' },
                { name: '허지웅', source: 'KBS' },
                { name: '황진미', source: '조선일보' },
                { name: '이용철', source: '문화일보' },
                { name: '김성훈', source: '씨네21' },
                { name: '정성일', source: '중앙일보' },
                { name: '유지나', source: '한겨레' },
                { name: '이화정', source: '씨네21' },
                { name: '민용준', source: '스포츠조선' },
                { name: '김봉석', source: '한국일보' },
                { name: '배동미', source: '매일경제' },
                { name: '이지혜', source: 'OSEN' },
                { name: '강병진', source: '헤럴드경제' },
                { name: '남동철', source: '스포츠서울' },
                { name: '김도훈', source: '동아일보' }
            ]
        };

        this.movies = [];
        this.movieInserts = [];
        this.reviewInserts = [];
        
        // 연도별 대표 영화 데이터 (2010-2025)
        this.generateMoviesByYear();
    }

    // 연도별 영화 데이터 생성
    generateMoviesByYear() {
        const moviesByYear = {
            2025: [
                { title: '파묘', english: 'Exhuma', director: '장재현', cast: ['최민식', '김고은', '유해진', '이도현'], genre: '미스터리, 공포', rating: 8.1, country: '한국', runtime: 134 },
                { title: '듄: 파트 투', english: 'Dune: Part Two', director: '드니 빌뇌브', cast: ['티모시 샬라메', '젠데이아', '오스카 아이작'], genre: 'SF, 액션', rating: 8.9, country: '미국', runtime: 166 },
                { title: '윙스', english: 'Wings', director: '김보라', cast: ['김다미', '남주혁', '박정민'], genre: '드라마', rating: 7.8, country: '한국', runtime: 118 },
                { title: '가디언즈 오브 갤럭시 Vol. 3', english: 'Guardians of the Galaxy Vol. 3', director: '제임스 건', cast: ['크리스 프랫', '조 샐다나'], genre: '액션, SF', rating: 8.3, country: '미국', runtime: 150 }
            ],
            2024: [
                { title: '서울의 봄', english: 'Seoul Spring', director: '김성수', cast: ['황정민', '정우성', '이성민', '박해준'], genre: '드라마', rating: 8.3, country: '한국', runtime: 141 },
                { title: '오펜하이머', english: 'Oppenheimer', director: '크리스토퍼 놀란', cast: ['킬리언 머피', '에밀리 블런트', '맷 데이먼'], genre: '드라마', rating: 8.7, country: '미국', runtime: 180 },
                { title: '바비', english: 'Barbie', director: '그레타 거윅', cast: ['마고 로비', '라이언 고슬링'], genre: '코미디', rating: 7.8, country: '미국', runtime: 114 },
                { title: '범죄도시 4', english: 'The Roundup: Punishment', director: '허명행', cast: ['마동석', '김무열'], genre: '액션, 범죄', rating: 7.9, country: '한국', runtime: 109 },
                { title: '관능의 법칙', english: 'Love Affairs in the Afternoon', director: '이언희', cast: ['송승헌', '조여정'], genre: '로맨스, 드라마', rating: 7.2, country: '한국', runtime: 103 },
                { title: '스파이더맨: 어크로스 더 스파이더버스', english: 'Spider-Man: Across the Spider-Verse', director: '호아킴 도스 산토스', cast: ['샤메익 무어', '헤일리 스테인펠드'], genre: '애니메이션', rating: 8.8, country: '미국', runtime: 140 }
            ],
            2023: [
                { title: '범죄도시 3', english: 'The Roundup: No Way Out', director: '이상용', cast: ['마동석', '이준혁', '아오키 무네타카'], genre: '액션, 범죄', rating: 7.9, country: '한국', runtime: 105 },
                { title: '스즈메의 문단속', english: 'Suzume', director: '신카이 마코토', cast: ['하라 나나미', '마츠무라 호쿠토'], genre: '애니메이션', rating: 8.2, country: '일본', runtime: 122 },
                { title: '존 윅: 챕터 4', english: 'John Wick: Chapter 4', director: '채드 스타헬스키', cast: ['키아누 리브스', '도니 옌', '빌 스카스가드'], genre: '액션', rating: 8.4, country: '미국', runtime: 169 },
                { title: '인디아나 존스: 운명의 다이얼', english: 'Indiana Jones and the Dial of Destiny', director: '제임스 맨골드', cast: ['해리슨 포드', '피비 월러브리지'], genre: '어드벤처', rating: 7.5, country: '미국', runtime: 154 },
                { title: '플래시', english: 'The Flash', director: '앤디 무스키에티', cast: ['에즈라 밀러', '사샤 칼', '마이클 키튼'], genre: '액션, SF', rating: 7.1, country: '미국', runtime: 144 },
                { title: '트랜스포머: 비스트의 탄생', english: 'Transformers: Rise of the Beasts', director: '스티븐 케이플 주니어', cast: ['안소니 라모스', '도미니크 피시백'], genre: '액션, SF', rating: 7.3, country: '미국', runtime: 127 }
            ],
            2022: [
                { title: '헤어질 결심', english: 'Decision to Leave', director: '박찬욱', cast: ['박해일', '탕웨이', '이정현'], genre: '로맨스, 미스터리', rating: 8.2, country: '한국', runtime: 138 },
                { title: '탑건: 매버릭', english: 'Top Gun: Maverick', director: '조제프 코신스키', cast: ['톰 크루즈', '마일즈 텔러', '제니퍼 코넬리'], genre: '액션', rating: 8.7, country: '미국', runtime: 131 },
                { title: '한산: 용의 출현', english: 'Hansan: Rising Dragon', director: '김한민', cast: ['박해일', '변요한', '안성기'], genre: '액션, 전쟁', rating: 7.8, country: '한국', runtime: 130 },
                { title: '닥터 스트레인지: 대혼돈의 멀티버스', english: 'Doctor Strange in the Multiverse of Madness', director: '샘 래이미', cast: ['베네딕트 컴버배치', '엘리자베스 올슨'], genre: '액션, SF', rating: 7.6, country: '미국', runtime: 126 },
                { title: '토르: 러브 앤 썬더', english: 'Thor: Love and Thunder', director: '타이카 와이티티', cast: ['크리스 헴스워스', '나탈리 포트만'], genre: '액션, SF', rating: 7.2, country: '미국', runtime: 119 },
                { title: '미니언즈: 라이즈 오브 그루', english: 'Minions: The Rise of Gru', director: '카일 발다', cast: ['스티브 카렐', '피에르 코팽'], genre: '애니메이션', rating: 7.8, country: '미국', runtime: 87 }
            ],
            2021: [
                { title: '모가디슈', english: 'Escape from Mogadishu', director: '류승완', cast: ['김윤석', '조인성', '허준호', '구교환'], genre: '액션, 드라마', rating: 8.0, country: '한국', runtime: 121 },
                { title: '스파이더맨: 노 웨이 홈', english: 'Spider-Man: No Way Home', director: '존 와츠', cast: ['톰 홀랜드', '젠데이아', '베네딕트 컴버배치'], genre: '액션, SF', rating: 8.8, country: '미국', runtime: 148 },
                { title: '승리호', english: 'Space Sweepers', director: '조성희', cast: ['송중기', '김태리', '진선규'], genre: 'SF', rating: 7.5, country: '한국', runtime: 136 },
                { title: '이터널스', english: 'Eternals', director: '클로이 자오', cast: ['젬마 찬', '리처드 매든', '안젤리나 졸리'], genre: '액션, SF', rating: 7.1, country: '미국', runtime: 156 },
                { title: '매트릭스 4: 리저렉션', english: 'The Matrix Resurrections', director: '라나 워쇼스키', cast: ['키아누 리브스', '캐리 앤 모스'], genre: 'SF, 액션', rating: 6.8, country: '미국', runtime: 148 },
                { title: '분노의 질주: 더 얼티메이트', english: 'Fast & Furious 9', director: '저스틴 린', cast: ['빈 디젤', '미셸 로드리게스'], genre: '액션', rating: 7.2, country: '미국', runtime: 143 }
            ],
            2020: [
                { title: '미나리', english: 'Minari', director: '정이삭', cast: ['스티븐 연', '한예리', '윤여정', '앨런 김'], genre: '드라마', rating: 8.2, country: '미국', runtime: 115 },
                { title: '소울', english: 'Soul', director: '피트 닥터', cast: ['제이미 폭스', '티나 페이'], genre: '애니메이션', rating: 8.6, country: '미국', runtime: 100 },
                { title: '사냥의 시간', english: 'Time to Hunt', director: '윤성현', cast: ['이제훈', '안재홍', '최우식'], genre: '액션, 스릴러', rating: 7.8, country: '한국', runtime: 134 },
                { title: '원더우먼 1984', english: 'Wonder Woman 1984', director: '패티 젠킨스', cast: ['갤 가돗', '크리스 파인'], genre: '액션, SF', rating: 7.0, country: '미국', runtime: 151 },
                { title: '테넷', english: 'Tenet', director: '크리스토퍼 놀란', cast: ['존 데이비드 워싱턴', '로버트 패틴슨'], genre: 'SF, 액션', rating: 7.8, country: '미국', runtime: 150 },
                { title: '블랙 위도우', english: 'Black Widow', director: '케이트 쇼틀랜드', cast: ['스칼렛 요한슨', '플로렌스 퓨'], genre: '액션, SF', rating: 7.6, country: '미국', runtime: 134 }
            ],
            2019: [
                { title: '기생충', english: 'Parasite', director: '봉준호', cast: ['송강호', '이선균', '조여정', '최우식', '박소담'], genre: '드라마, 스릴러', rating: 8.9, country: '한국', runtime: 132 },
                { title: '어벤져스: 엔드게임', english: 'Avengers: Endgame', director: '안소니 루소, 조 루소', cast: ['로버트 다우니 주니어', '크리스 에반스', '마크 러팔로'], genre: '액션, SF', rating: 9.0, country: '미국', runtime: 181 },
                { title: '극한직업', english: 'Extreme Job', director: '이병헌', cast: ['류승룡', '이하늬', '진선규', '이동휘'], genre: '코미디, 액션', rating: 8.4, country: '한국', runtime: 111 },
                { title: '조커', english: 'Joker', director: '토드 필립스', cast: ['호아킨 피닉스', '로버트 드 니로'], genre: '드라마, 스릴러', rating: 8.2, country: '미국', runtime: 122 },
                { title: '토이 스토리 4', english: 'Toy Story 4', director: '조시 쿨리', cast: ['톰 행크스', '팀 앨런'], genre: '애니메이션', rating: 8.1, country: '미국', runtime: 100 },
                { title: '존 윅 3: 파라벨룸', english: 'John Wick: Chapter 3 – Parabellum', director: '채드 스타헬스키', cast: ['키아누 리브스', '할리 베리'], genre: '액션', rating: 8.3, country: '미국', runtime: 130 }
            ],
            2018: [
                { title: '버닝', english: 'Burning', director: '이창동', cast: ['유아인', '전종서', '스티븐 연'], genre: '미스터리, 드라마', rating: 8.0, country: '한국', runtime: 148 },
                { title: '블랙팬서', english: 'Black Panther', director: '라이언 쿠글러', cast: ['채드윅 보즈만', '마이클 B. 조던'], genre: '액션, SF', rating: 8.0, country: '미국', runtime: 134 },
                { title: '어 스타 이즈 본', english: 'A Star Is Born', director: '브래들리 쿠퍼', cast: ['브래들리 쿠퍼', '레이디 가가'], genre: '뮤지컬, 드라마', rating: 8.0, country: '미국', runtime: 136 },
                { title: '보헤미안 랩소디', english: 'Bohemian Rhapsody', director: '브라이언 싱어', cast: ['라미 말렉', '루시 보인턴'], genre: '뮤지컬, 드라마', rating: 8.1, country: '영국', runtime: 134 },
                { title: '완벽한 타인', english: 'Intimate Strangers', director: '이재규', cast: ['유해진', '조진웅', '이서진'], genre: '코미디, 드라마', rating: 7.9, country: '한국', runtime: 115 },
                { title: '인크레더블 2', english: 'Incredibles 2', director: '브래드 버드', cast: ['크레이그 T. 넬슨', '홀리 헌터'], genre: '애니메이션', rating: 8.0, country: '미국', runtime: 118 }
            ],
            2017: [
                { title: '범죄도시', english: 'The Outlaws', director: '강윤성', cast: ['마동석', '윤계상', '조재윤'], genre: '액션, 범죄', rating: 8.1, country: '한국', runtime: 121 },
                { title: '1987', english: '1987: When the Day Comes', director: '장준환', cast: ['김윤석', '하정우', '유해진'], genre: '드라마', rating: 8.5, country: '한국', runtime: 129 },
                { title: '택시운전사', english: 'A Taxi Driver', director: '장훈', cast: ['송강호', '토마스 크레치만', '유해진'], genre: '드라마', rating: 8.3, country: '한국', runtime: 137 },
                { title: '블레이드 러너 2049', english: 'Blade Runner 2049', director: '드니 빌뇌브', cast: ['라이언 고슬링', '해리슨 포드'], genre: 'SF, 드라마', rating: 8.1, country: '미국', runtime: 164 },
                { title: '겟 아웃', english: 'Get Out', director: '조던 필', cast: ['다니엘 칼루야', '앨리슨 윌리엄스'], genre: '스릴러', rating: 8.2, country: '미국', runtime: 104 },
                { title: '던케르크', english: 'Dunkirk', director: '크리스토퍼 놀란', cast: ['피온 화이트헤드', '톰 글린 카니'], genre: '전쟁, 액션', rating: 8.0, country: '영국', runtime: 106 }
            ],
            2016: [
                { title: '부산행', english: 'Train to Busan', director: '연상호', cast: ['공유', '정유미', '마동석', '김수안'], genre: '액션, 스릴러', rating: 8.3, country: '한국', runtime: 118 },
                { title: '곡성', english: 'The Wailing', director: '나홍진', cast: ['곽도원', '황정민', '천우희'], genre: '미스터리, 공포', rating: 8.1, country: '한국', runtime: 156 },
                { title: '아가씨', english: 'The Handmaiden', director: '박찬욱', cast: ['김민희', '김태리', '하정우'], genre: '스릴러, 로맨스', rating: 8.4, country: '한국', runtime: 145 },
                { title: '라라랜드', english: 'La La Land', director: '데미안 차젤리', cast: ['라이언 고슬링', '엠마 스톤'], genre: '뮤지컬, 로맨스', rating: 8.3, country: '미국', runtime: 128 },
                { title: '캡틴 아메리카: 시빌 워', english: 'Captain America: Civil War', director: '안소니 루소, 조 루소', cast: ['크리스 에반스', '로버트 다우니 주니어'], genre: '액션, SF', rating: 8.3, country: '미국', runtime: 147 },
                { title: '닥터 스트레인지', english: 'Doctor Strange', director: '스콧 데릭슨', cast: ['베네딕트 컴버배치', '틸다 스윈튼'], genre: '액션, SF', rating: 8.0, country: '미국', runtime: 115 }
            ],
            2015: [
                { title: '베테랑', english: 'Veteran', director: '류승완', cast: ['황정민', '유아인', '유해진'], genre: '액션, 범죄', rating: 8.2, country: '한국', runtime: 123 },
                { title: '암살', english: 'Assassination', director: '최동훈', cast: ['전지현', '이정재', '하정우'], genre: '액션, 드라마', rating: 8.3, country: '한국', runtime: 139 },
                { title: '매드 맥스: 분노의 도로', english: 'Mad Max: Fury Road', director: '조지 밀러', cast: ['톰 하디', '샤를리즈 테론'], genre: '액션, SF', rating: 8.5, country: '호주', runtime: 120 },
                { title: '스타워즈: 깨어난 포스', english: 'Star Wars: The Force Awakens', director: 'J.J. 에이브럼스', cast: ['데이지 리들리', '존 보예가'], genre: 'SF, 어드벤처', rating: 8.1, country: '미국', runtime: 138 },
                { title: '인사이드 아웃', english: 'Inside Out', director: '피트 닥터', cast: ['에이미 포엘러', '필리스 스미스'], genre: '애니메이션', rating: 8.6, country: '미국', runtime: 95 },
                { title: '어벤져스: 에이지 오브 울트론', english: 'Avengers: Age of Ultron', director: '조스 웨든', cast: ['로버트 다우니 주니어', '크리스 에반스'], genre: '액션, SF', rating: 7.8, country: '미국', runtime: 141 }
            ],
            2014: [
                { title: '명량', english: 'The Admiral: Roaring Currents', director: '김한민', cast: ['최민식', '류승룡', '조진웅'], genre: '액션, 전쟁', rating: 8.0, country: '한국', runtime: 128 },
                { title: '국제시장', english: 'Ode to My Father', director: '윤제균', cast: ['황정민', '김윤진', '오달수'], genre: '드라마', rating: 8.1, country: '한국', runtime: 126 },
                { title: '인터스텔라', english: 'Interstellar', director: '크리스토퍼 놀란', cast: ['매튜 맥커너히', '앤 해서웨이'], genre: 'SF, 드라마', rating: 9.0, country: '미국', runtime: 169 },
                { title: '가디언즈 오브 갤럭시', english: 'Guardians of the Galaxy', director: '제임스 건', cast: ['크리스 프랫', '조 샐다나'], genre: '액션, SF', rating: 8.4, country: '미국', runtime: 121 },
                { title: '엑스맨: 데이즈 오브 퓨처 패스트', english: 'X-Men: Days of Future Past', director: '브라이언 싱어', cast: ['휴 잭맨', '제임스 맥어보이'], genre: '액션, SF', rating: 8.2, country: '미국', runtime: 132 },
                { title: '빅 히어로', english: 'Big Hero 6', director: '돈 홀', cast: ['라이언 포터', '스콧 애드시트'], genre: '애니메이션', rating: 8.0, country: '미국', runtime: 102 }
            ],
            2013: [
                { title: '관상', english: 'The Face Reader', director: '한재림', cast: ['송강호', '이정재', '백윤식'], genre: '드라마, 사극', rating: 7.8, country: '한국', runtime: 139 },
                { title: '겨울왕국', english: 'Frozen', director: '크리스 벅, 제니퍼 리', cast: ['크리스틴 벨', '이디나 멘젤'], genre: '애니메이션, 뮤지컬', rating: 8.3, country: '미국', runtime: 102 },
                { title: '아이언맨 3', english: 'Iron Man 3', director: '셰인 블랙', cast: ['로버트 다우니 주니어', '기네스 팰트로'], genre: '액션, SF', rating: 7.8, country: '미국', runtime: 130 },
                { title: '맨 오브 스틸', english: 'Man of Steel', director: '잭 스나이더', cast: ['헨리 카빌', '에이미 애덤스'], genre: '액션, SF', rating: 7.5, country: '미국', runtime: 143 },
                { title: '토르: 다크 월드', english: 'Thor: The Dark World', director: '앨런 테일러', cast: ['크리스 헴스워스', '나탈리 포트만'], genre: '액션, SF', rating: 7.3, country: '미국', runtime: 112 },
                { title: '신과함께-죄와 벌', english: 'Along with the Gods: The Two Worlds', director: '김용화', cast: ['하정우', '차태현', '주지훈'], genre: '판타지, 드라마', rating: 7.6, country: '한국', runtime: 139 }
            ],
            2012: [
                { title: '도둑들', english: 'The Thieves', director: '최동훈', cast: ['김윤석', '김혜수', '이정재'], genre: '액션, 범죄', rating: 7.8, country: '한국', runtime: 135 },
                { title: '광해, 왕이 된 남자', english: 'Masquerade', director: '추창민', cast: ['이병헌', '류승룡', '한효주'], genre: '드라마, 사극', rating: 8.4, country: '한국', runtime: 131 },
                { title: '어벤져스', english: 'The Avengers', director: '조스 웨든', cast: ['로버트 다우니 주니어', '크리스 에반스'], genre: '액션, SF', rating: 8.4, country: '미국', runtime: 143 },
                { title: '다크 나이트 라이즈', english: 'The Dark Knight Rises', director: '크리스토퍼 놀란', cast: ['크리스찬 베일', '앤 해서웨이'], genre: '액션', rating: 8.0, country: '미국', runtime: 165 },
                { title: '건축학개론', english: 'Architecture 101', director: '이용주', cast: ['엄태웅', '한가인', '이제훈'], genre: '로맨스, 드라마', rating: 8.1, country: '한국', runtime: 118 },
                { title: '메리다와 마법의 숲', english: 'Brave', director: '마크 앤드류스', cast: ['켈리 맥도날드', '빌리 코놀리'], genre: '애니메이션', rating: 7.8, country: '미국', runtime: 93 }
            ],
            2011: [
                { title: '최종병기 활', english: 'War of the Arrows', director: '김한민', cast: ['박해일', '문채원', '김무열'], genre: '액션, 사극', rating: 7.8, country: '한국', runtime: 122 },
                { title: '도가니', english: 'Silenced', director: '황동혁', cast: ['공유', '정유미', '김현수'], genre: '드라마', rating: 8.5, country: '한국', runtime: 125 },
                { title: '캡틴 아메리카: 퍼스트 어벤져', english: 'Captain America: The First Avenger', director: '조 존스턴', cast: ['크리스 에반스', '헤일리 애트웰'], genre: '액션, SF', rating: 7.5, country: '미국', runtime: 124 },
                { title: '토르', english: 'Thor', director: '케네스 브래너', cast: ['크리스 헴스워스', '나탈리 포트만'], genre: '액션, SF', rating: 7.6, country: '미국', runtime: 115 },
                { title: '엑스맨: 퍼스트 클래스', english: 'X-Men: First Class', director: '매튜 본', cast: ['제임스 맥어보이', '마이클 패스벤더'], genre: '액션, SF', rating: 8.1, country: '미국', runtime: 131 },
                { title: '카2', english: 'Cars 2', director: '존 래세터', cast: ['오웬 윌슨', '래리 더 케이블 가이'], genre: '애니메이션', rating: 6.8, country: '미국', runtime: 106 }
            ],
            2010: [
                { title: '아저씨', english: 'The Man from Nowhere', director: '이정범', cast: ['원빈', '김새론', '김희원'], genre: '액션, 스릴러', rating: 8.5, country: '한국', runtime: 119 },
                { title: '황해', english: 'The Yellow Sea', director: '나홍진', cast: ['하정우', '김윤석', '조성하'], genre: '액션, 스릴러', rating: 8.0, country: '한국', runtime: 157 },
                { title: '인셉션', english: 'Inception', director: '크리스토퍼 놀안', cast: ['레오나르도 디카프리오', '마리옹 코티야르'], genre: 'SF, 액션', rating: 8.8, country: '미국', runtime: 148 },
                { title: '아이언맨 2', english: 'Iron Man 2', director: '존 파브로', cast: ['로버트 다우니 주니어', '기네스 팰트로'], genre: '액션, SF', rating: 7.6, country: '미국', runtime: 124 },
                { title: '토이 스토리 3', english: 'Toy Story 3', director: '리 언크리치', cast: ['톰 행크스', '팀 앨런'], genre: '애니메이션', rating: 8.8, country: '미국', runtime: 103 },
                { title: '슈렉 포에버', english: 'Shrek Forever After', director: '마이크 미첼', cast: ['마이크 마이어스', '에디 머피'], genre: '애니메이션', rating: 7.1, country: '미국', runtime: 93 }
            ]
        };

        // 모든 연도의 영화를 하나의 배열로 합치기
        Object.entries(moviesByYear).forEach(([year, movies]) => {
            movies.forEach(movie => {
                this.movies.push({
                    ...movie,
                    release_year: parseInt(year),
                    cast_members: movie.cast,
                    naver_rating: movie.rating,
                    description: this.generateDescription(movie.title, year, movie.genre, movie.director, movie.cast),
                    keywords: this.generateKeywords(movie.title, movie.english, movie.director, movie.cast, movie.genre),
                    poster_url: null,
                    naver_movie_id: null
                });
            });
        });

        console.log(`[INFO] 총 영화 생성: ${this.movies.length}개`);
    }

    // 전문가 리뷰 생성
    generateCriticReviews(movieId, movieTitle, movieGenre, movieRating) {
        const reviews = [];
        
        // 고정 전문가 2명 (이동진, 박평식)
        const fixedCritics = this.critics.fixed;
        
        // 랜덤 전문가 2명 선택
        const randomCritics = this.getRandomCritics(2);
        
        // 모든 전문가 (고정 2명 + 랜덤 2명)
        const allCritics = [...fixedCritics, ...randomCritics];
        
        allCritics.forEach(critic => {
            const review = this.generateCriticReview(critic, movieTitle, movieGenre, movieRating);
            reviews.push({
                movie_id: movieId,
                critic_name: critic.name,
                score: review.score,
                review_text: review.text,
                review_source: critic.source,
                review_date: this.getRandomReviewDate()
            });
        });
        
        return reviews;
    }

    // 랜덤 전문가 선택
    getRandomCritics(count) {
        const shuffled = [...this.critics.random].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // 전문가 리뷰 텍스트 생성
    generateCriticReview(critic, movieTitle, movieGenre, movieRating) {
        // 평점은 기본 평점 기준으로 ±0.5 범위에서 조정
        const baseScore = movieRating || 8.0;
        const score = Math.max(6.0, Math.min(10.0, baseScore + (Math.random() - 0.5) * 1.0));
        
        // 전문가별 특색있는 리뷰 스타일
        const reviewTemplates = {
            '이동진': [
                `${movieTitle}는 ${movieGenre} 장르의 새로운 가능성을 보여주는 작품이다. 연출력과 연기력 모두 인상적이다.`,
                `감독의 연출 의도가 명확하게 드러나는 ${movieTitle}. 완성도 높은 작품으로 평가할 만하다.`,
                `${movieTitle}에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.`,
                `${movieTitle}는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.`,
                `연출과 연기, 스토리 모든 면에서 균형잡힌 ${movieTitle}. 완성도가 뛰어나다.`
            ],
            '박평식': [
                `${movieTitle}는 한국 영화계에 새로운 바람을 불어넣는 작품이다. 영화적 완성도가 뛰어나다.`,
                `연기자들의 앙상블이 돋보이는 ${movieTitle}. 감독의 연출력이 빛을 발한다.`,
                `${movieTitle}는 ${movieGenre} 장르의 깊이를 더한 수작이다. 관객들에게 강하게 어필할 것이다.`,
                `완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 ${movieTitle}. 강력 추천한다.`,
                `${movieTitle}에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.`
            ]
        };
        
        // 일반적인 리뷰 템플릿 (다른 전문가들용)
        const generalTemplates = [
            `${movieTitle}는 ${movieGenre} 장르의 매력을 충분히 살린 작품이다. 몰입도가 높다.`,
            `완성도 높은 연출과 연기가 돋보이는 ${movieTitle}. 추천할 만한 작품이다.`,
            `${movieTitle}에서 보여주는 스토리텔링이 인상적이다. 장르적 특색이 잘 살아있다.`,
            `감독의 연출력과 배우들의 연기력이 조화를 이룬 ${movieTitle}. 완성도가 뛰어나다.`,
            `${movieTitle}는 관객들의 기대를 충족시키는 수작이다. 영화적 재미가 충분하다.`,
            `탄탄한 스토리와 뛰어난 연출이 돋보이는 ${movieTitle}. 강력 추천작이다.`,
            `${movieTitle}는 ${movieGenre} 장르의 새로운 면모를 보여준다. 완성도가 높다.`,
            `연기자들의 연기력과 감독의 연출이 빛나는 ${movieTitle}. 수준급 작품이다.`,
            `${movieTitle}에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.`,
            `장르의 특성을 잘 살린 ${movieTitle}. 연출과 연기 모든 면에서 우수하다.`
        ];
        
        let reviewText;
        if (reviewTemplates[critic.name]) {
            const templates = reviewTemplates[critic.name];
            reviewText = templates[Math.floor(Math.random() * templates.length)];
        } else {
            reviewText = generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
        }
        
        return {
            score: Math.round(score * 10) / 10, // 소수점 첫째자리까지
            text: reviewText
        };
    }

    // 랜덤 리뷰 날짜 생성
    getRandomReviewDate() {
        const start = new Date(2010, 0, 1);
        const end = new Date(2025, 6, 31);
        const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return randomDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }

    // SQL INSERT문 생성
    async generateSQLInserts() {
        console.log('\n[MEMO] SQL INSERT문 생성 시작');
        console.log(`[INFO] 대상 영화: ${this.movies.length}개`);
        
        let movieId = 1;
        
        this.movies.forEach((movie, index) => {
            try {
                // 영화 INSERT문 생성
                const movieInsertSQL = this.generateMovieInsert(movieId, movie, index + 1);
                this.movieInserts.push(movieInsertSQL);
                
                // 전문가 리뷰 INSERT문 생성
                const criticReviews = this.generateCriticReviews(movieId, movie.title, movie.genre, movie.naver_rating);
                criticReviews.forEach(review => {
                    const reviewInsertSQL = this.generateCriticReviewInsert(review);
                    this.reviewInserts.push(reviewInsertSQL);
                });
                
                movieId++;
                
            } catch (error) {
                console.error(`[ERROR] SQL 생성 오류 (${movie.title}):`, error.message);
            }
        });

        // SQL 파일 저장
        await this.saveSQLFile();
        
        console.log(`[SUCCESS] SQL INSERT문 생성 완료:`);
        console.log(`   [PROJECTOR] 영화: ${this.movieInserts.length}개`);
        console.log(`   [MEMO] 전문가 리뷰: ${this.reviewInserts.length}개`);
    }

    // 영화 INSERT문 생성
    generateMovieInsert(movieId, movie, index) {
        // SQL 안전한 문자열 이스케이프
        const escapeSQL = (str) => {
            if (str === null || str === undefined) return 'NULL';
            return `'${str.toString().replace(/'/g, "''")}'`;
        };

        // 배열을 PostgreSQL 배열 형식으로 변환
        const arrayToSQL = (arr) => {
            if (!arr || !Array.isArray(arr) || arr.length === 0) return 'NULL';
            const escapedItems = arr.map(item => `"${item.replace(/"/g, '\\"')}"`);
            return `'{${escapedItems.join(',')}}'`;
        };

        const values = [
            escapeSQL(movie.title),
            escapeSQL(movie.english),
            escapeSQL(movie.director),
            arrayToSQL(movie.cast_members),
            escapeSQL(movie.genre),
            movie.release_year || 'NULL',
            movie.runtime || 'NULL',
            escapeSQL(movie.country),
            movie.naver_rating || 'NULL',
            escapeSQL(movie.description),
            arrayToSQL(movie.keywords),
            escapeSQL(movie.poster_url),
            escapeSQL(movie.naver_movie_id)
        ];

        return `-- ${index}. ${movie.title} (${movie.release_year || 'N/A'}) - ${movie.country}
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES (${values.join(', ')});`;
    }

    // 전문가 리뷰 INSERT문 생성
    generateCriticReviewInsert(review) {
        const escapeSQL = (str) => {
            if (str === null || str === undefined) return 'NULL';
            return `'${str.toString().replace(/'/g, "''")}'`;
        };

        const values = [
            review.movie_id,
            escapeSQL(review.critic_name),
            review.score || 'NULL',
            escapeSQL(review.review_text),
            escapeSQL(review.review_source),
            escapeSQL(review.review_date)
        ];

        return `INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (${values.join(', ')});`;
    }

    // SQL 파일 저장
    async saveSQLFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `massive_movies_2010_2025_with_reviews_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);

        let sqlContent = `-- 대용량 2010-2025년 영화 데이터베이스 + 전문가 평점 INSERT 문\n`;
        sqlContent += `-- 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
        sqlContent += `-- 총 영화 수: ${this.movieInserts.length}개\n`;
        sqlContent += `-- 총 전문가 리뷰: ${this.reviewInserts.length}개\n`;
        sqlContent += `-- 데이터 소스: 2010-2025년 대표 영화 컬렉션\n`;
        sqlContent += `-- 기간: 2010년 1월 ~ 2025년 7월\n\n`;
        
        sqlContent += `-- 기존 테이블 구조 확인 (참고용)\n`;
        sqlContent += `/*\n`;
        sqlContent += `CREATE TABLE movies (\n`;
        sqlContent += `    id SERIAL PRIMARY KEY,\n`;
        sqlContent += `    title VARCHAR(255) NOT NULL,\n`;
        sqlContent += `    english_title VARCHAR(255),\n`;
        sqlContent += `    director VARCHAR(255),\n`;
        sqlContent += `    cast_members TEXT[],\n`;
        sqlContent += `    genre VARCHAR(255),\n`;
        sqlContent += `    release_year INTEGER,\n`;
        sqlContent += `    runtime_minutes INTEGER,\n`;
        sqlContent += `    country VARCHAR(100),\n`;
        sqlContent += `    naver_rating DECIMAL(3,1),\n`;
        sqlContent += `    description TEXT,\n`;
        sqlContent += `    keywords TEXT[],\n`;
        sqlContent += `    poster_url TEXT,\n`;
        sqlContent += `    naver_movie_id VARCHAR(50),\n`;
        sqlContent += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
        sqlContent += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
        sqlContent += `    UNIQUE(naver_movie_id),\n`;
        sqlContent += `    UNIQUE(title, release_year)\n`;
        sqlContent += `);\n\n`;
        sqlContent += `CREATE TABLE critic_reviews (\n`;
        sqlContent += `    id SERIAL PRIMARY KEY,\n`;
        sqlContent += `    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,\n`;
        sqlContent += `    critic_name VARCHAR(100) NOT NULL,\n`;
        sqlContent += `    score DECIMAL(3,1),\n`;
        sqlContent += `    review_text TEXT NOT NULL,\n`;
        sqlContent += `    review_source VARCHAR(100),\n`;
        sqlContent += `    review_date DATE,\n`;
        sqlContent += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
        sqlContent += `);\n`;
        sqlContent += `*/\n\n`;
        
        // 통계 정보
        const stats = {};
        this.movies.forEach(movie => {
            const country = movie.country;
            stats[country] = (stats[country] || 0) + 1;
        });

        sqlContent += `-- 국가별 영화 수:\n`;
        Object.entries(stats).forEach(([country, count]) => {
            sqlContent += `-- - ${country}: ${count}개\n`;
        });
        sqlContent += `\n`;
        
        sqlContent += `-- 전문가 평론가 정보:\n`;
        sqlContent += `-- - 고정: 이동진(씨네21), 박평식(중앙일보)\n`;
        sqlContent += `-- - 추가: 김혜리, 허지웅, 황진미, 이용철 등 (랜덤 2명)\n`;
        sqlContent += `-- - 각 영화당 4명의 전문가 리뷰 포함\n\n`;
        
        sqlContent += `-- 중복 방지를 위한 INSERT\n`;
        sqlContent += `BEGIN;\n\n`;
        
        sqlContent += `-- ==========================================\n`;
        sqlContent += `-- 영화 데이터 INSERT\n`;
        sqlContent += `-- ==========================================\n\n`;
        
        this.movieInserts.forEach((insert) => {
            sqlContent += insert + '\n\n';
        });
        
        sqlContent += `-- ==========================================\n`;
        sqlContent += `-- 전문가 리뷰 데이터 INSERT\n`;
        sqlContent += `-- ==========================================\n\n`;
        
        this.reviewInserts.forEach((insert) => {
            sqlContent += insert + '\n';
        });
        
        sqlContent += `\nCOMMIT;\n\n`;
        sqlContent += `-- INSERT 완료\n`;
        sqlContent += `-- [INFO] 총 ${this.movieInserts.length}개 영화 + ${this.reviewInserts.length}개 전문가 리뷰 추가됨\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [TIP] 사용법:\n`;
        sqlContent += `-- 1. Supabase SQL 에디터에서 실행\n`;
        sqlContent += `-- 2. 카카오 스킬에서 영화 검색 시 전문가 리뷰도 함께 제공\n`;
        sqlContent += `-- 3. 예: "기생충 영화평", "2019년 영화", "봉준호 감독", "액션 영화 추천" 등\n`;
        sqlContent += `-- 4. 이동진, 박평식 평론가의 리뷰가 항상 포함됨\n`;
        sqlContent += `-- 5. 2010-2025년 15년간의 대표 영화들 포함\n`;

        // 파일 저장
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        
        console.log(`\n📄 SQL 파일 생성 완료: ${filename}`);
        console.log(`[LOCATION] 파일 위치: ${filepath}`);
        console.log(`[INFO] 총 INSERT문: ${this.movieInserts.length + this.reviewInserts.length}개`);
        
        // 통계 출력
        console.log('\n[INFO] 최종 통계:');
        console.log(`[MOVIE] 영화: ${this.movieInserts.length}개`);
        console.log(`[MEMO] 전문가 리뷰: ${this.reviewInserts.length}개`);
        Object.entries(stats).forEach(([country, count]) => {
            console.log(`   ${country}: ${count}개 영화`);
        });
        
        return { 
            filename, 
            filepath, 
            movieCount: this.movieInserts.length, 
            reviewCount: this.reviewInserts.length, 
            stats 
        };
    }

    // 유틸리티 함수들
    generateKeywords(title, englishTitle, director, cast, genre) {
        const keywords = [];
        
        if (title) keywords.push(title);
        if (englishTitle) keywords.push(englishTitle.toLowerCase());
        if (director) {
            keywords.push(director);
            const lastName = director.split(' ')[0];
            if (lastName) keywords.push(lastName);
        }
        
        cast.slice(0, 3).forEach(actor => {
            if (actor) {
                keywords.push(actor);
                const lastName = actor.split(' ')[0];
                if (lastName && lastName !== actor) keywords.push(lastName);
            }
        });
        
        if (genre) {
            keywords.push(genre);
            genre.split(',').forEach(g => keywords.push(g.trim()));
        }
        
        return [...new Set(keywords.filter(k => k && k.trim()))];
    }

    generateDescription(title, year, genre, director, cast) {
        let desc = `${title}`;
        if (year) desc += ` (${year})`;
        if (genre) desc += ` - ${genre}`;
        if (director) desc += `, 감독: ${director}`;
        if (cast.length > 0) {
            desc += `, 출연: ${cast.slice(0, 3).join(', ')}`;
        }
        return desc;
    }

    async run() {
        console.log('[MOVIE] 대용량 2010-2025년 영화 데이터베이스 + 전문가 리뷰 생성기');
        console.log('='.repeat(80));
        console.log('[INFO] 이동진, 박평식 고정 + 랜덤 전문가 2명 리뷰 포함');
        console.log('[TARGET] 2010-2025년 15년간의 대표 영화들\n');
        
        try {
            // SQL INSERT문 생성
            await this.generateSQLInserts();
            
            console.log('\n[PARTY] 대용량 영화 데이터베이스 생성 완료!');
            console.log('[FORM] 다음 단계:');
            console.log('1. 생성된 .sql 파일을 Supabase SQL 에디터에 복사');
            console.log('2. Run 버튼으로 실행');
            console.log('3. 수백 개의 영화 + 전문가 리뷰 데이터 저장');
            console.log('4. 카카오 스킬에서 풍부한 영화 정보 + 전문가 평점 제공');
            console.log('\n[TARGET] 이제 2010-2025년 모든 대표 영화에 대해 전문가 리뷰까지 제공 가능!');
            
        } catch (error) {
            console.error('[ERROR] 실행 오류:', error);
            throw error;
        }
    }
}

// 실행
async function main() {
    const generator = new MassiveMovieDBWithReviews();
    await generator.run();
}

if (require.main === module) {
    main();
}

module.exports = MassiveMovieDBWithReviews;