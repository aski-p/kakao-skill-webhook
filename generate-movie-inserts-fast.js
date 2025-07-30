// 기존 테이블 구조에 맞는 대용량 영화 INSERT문 생성기
const fs = require('fs');
const path = require('path');

class FastMovieInsertsGenerator {
    constructor() {
        // 인기 영화 데이터 (한국 + 해외)
        this.movieDatabase = [
            // 한국 영화들
            { title: '기생충', english: 'Parasite', director: '봉준호', cast: ['송강호', '이선균', '조여정', '최우식', '박소담'], genre: '드라마, 스릴러, 코미디', year: 2019, runtime: 132, rating: 8.9, country: '한국' },
            { title: '미나리', english: 'Minari', director: '정이삭', cast: ['스티븐 연', '한예리', '윤여정', '앨런 김'], genre: '드라마', year: 2020, runtime: 115, rating: 8.2, country: '미국' },
            { title: '부산행', english: 'Train to Busan', director: '연상호', cast: ['공유', '정유미', '마동석', '김수안'], genre: '액션, 스릴러', year: 2016, runtime: 118, rating: 8.3, country: '한국' },
            { title: '범죄도시', english: 'The Outlaws', director: '강윤성', cast: ['마동석', '윤계상', '조재윤'], genre: '액션, 범죄', year: 2017, runtime: 121, rating: 8.1, country: '한국' },
            { title: '극한직업', english: 'Extreme Job', director: '이병헌', cast: ['류승룡', '이하늬', '진선규', '이동휘'], genre: '코미디, 액션', year: 2019, runtime: 111, rating: 8.4, country: '한국' },
            { title: '명량', english: 'The Admiral: Roaring Currents', director: '김한민', cast: ['최민식', '류승룡', '조진웅'], genre: '액션, 전쟁', year: 2014, runtime: 128, rating: 8.0, country: '한국' },
            { title: '국제시장', english: 'Ode to My Father', director: '윤제균', cast: ['황정민', '김윤진', '오달수'], genre: '드라마', year: 2014, runtime: 126, rating: 8.1, country: '한국' },
            { title: '베테랑', english: 'Veteran', director: '류승완', cast: ['황정민', '유아인', '유해진'], genre: '액션, 범죄', year: 2015, runtime: 123, rating: 8.2, country: '한국' },
            { title: '암살', english: 'Assassination', director: '최동훈', cast: ['전지현', '이정재', '하정우'], genre: '액션, 드라마', year: 2015, runtime: 139, rating: 8.3, country: '한국' },
            { title: '도둑들', english: 'The Thieves', director: '최동훈', cast: ['김윤석', '김혜수', '이정재'], genre: '액션, 범죄', year: 2012, runtime: 135, rating: 7.8, country: '한국' },
            { title: '광해, 왕이 된 남자', english: 'Masquerade', director: '추창민', cast: ['이병헌', '류승룡', '한효주'], genre: '드라마, 사극', year: 2012, runtime: 131, rating: 8.4, country: '한국' },
            { title: '왕의 남자', english: 'The King and the Clown', director: '이준익', cast: ['감우성', '이준기', '정진영'], genre: '드라마, 사극', year: 2005, runtime: 119, rating: 8.2, country: '한국' },
            { title: '실미도', english: 'Silmido', director: '강우석', cast: ['설경구', '안성기', '허준호'], genre: '액션, 드라마', year: 2003, runtime: 135, rating: 7.9, country: '한국' },
            { title: '태극기 휘날리며', english: 'Taegukgi', director: '강제규', cast: ['장동건', '원빈', '이은주'], genre: '전쟁, 드라마', year: 2004, runtime: 140, rating: 8.1, country: '한국' },
            { title: '친구', english: 'Friend', director: '곽경택', cast: ['유오성', '장동건', '서태화'], genre: '드라마, 범죄', year: 2001, runtime: 113, rating: 8.0, country: '한국' },
            { title: '올드보이', english: 'Oldboy', director: '박찬욱', cast: ['최민식', '유지태', '강혜정'], genre: '스릴러, 미스터리', year: 2003, runtime: 120, rating: 8.4, country: '한국' },
            { title: '살인의 추억', english: 'Memories of Murder', director: '봉준호', cast: ['송강호', '김상경', '박해일'], genre: '범죄, 드라마', year: 2003, runtime: 131, rating: 8.6, country: '한국' },
            { title: '괴물', english: 'The Host', director: '봉준호', cast: ['송강호', '변희봉', '박해일'], genre: 'SF, 액션', year: 2006, runtime: 120, rating: 8.2, country: '한국' },
            { title: '추격자', english: 'The Chaser', director: '나홍진', cast: ['김윤석', '하정우', '서영희'], genre: '스릴러, 범죄', year: 2008, runtime: 125, rating: 8.3, country: '한국' },
            { title: '황해', english: 'The Yellow Sea', director: '나홍진', cast: ['하정우', '김윤석', '조성하'], genre: '액션, 스릴러', year: 2010, runtime: 157, rating: 8.0, country: '한국' },
            { title: '아저씨', english: 'The Man from Nowhere', director: '이정범', cast: ['원빈', '김새론', '김희원'], genre: '액션, 스릴러', year: 2010, runtime: 119, rating: 8.5, country: '한국' },
            { title: '마더', english: 'Mother', director: '봉준호', cast: ['김혜자', '원빈', '진구'], genre: '드라마, 미스터리', year: 2009, runtime: 129, rating: 8.1, country: '한국' },
            { title: '박쥐', english: 'Thirst', director: '박찬욱', cast: ['송강호', '김옥빈', '신하균'], genre: '스릴러, 공포', year: 2009, runtime: 134, rating: 7.9, country: '한국' },
            { title: '내부자들', english: 'The Insiders', director: '우민호', cast: ['이병헌', '조승우', '백윤식'], genre: '범죄, 드라마', year: 2015, runtime: 130, rating: 8.1, country: '한국' },
            { title: '밀정', english: 'The Age of Shadows', director: '김지운', cast: ['송강호', '공유', '한지민'], genre: '액션, 스릴러', year: 2016, runtime: 140, rating: 8.0, country: '한국' },
            { title: '관상', english: 'The Face Reader', director: '한재림', cast: ['송강호', '이정재', '백윤식'], genre: '드라마, 사극', year: 2013, runtime: 139, rating: 7.8, country: '한국' },
            { title: '신과함께-죄와 벌', english: 'Along with the Gods: The Two Worlds', director: '김용화', cast: ['하정우', '차태현', '주지훈'], genre: '판타지, 드라마', year: 2017, runtime: 139, rating: 7.6, country: '한국' },
            { title: '택시운전사', english: 'A Taxi Driver', director: '장훈', cast: ['송강호', '토마스 크레치만', '유해진'], genre: '드라마, 액션', year: 2017, runtime: 137, rating: 8.3, country: '한국' },
            { title: '1987', english: '1987: When the Day Comes', director: '장준환', cast: ['김윤석', '하정우', '유해진'], genre: '드라마', year: 2017, runtime: 129, rating: 8.5, country: '한국' },
            { title: '공작', english: 'The Spy Gone North', director: '윤종빈', cast: ['황정민', '이성민', '조진웅'], genre: '스릴러, 드라마', year: 2018, runtime: 137, rating: 8.2, country: '한국' },
            { title: '마약왕', english: 'The Drug King', director: '우민호', cast: ['송강호', '조정석', '배두나'], genre: '범죄, 드라마', year: 2018, runtime: 139, rating: 7.9, country: '한국' },

            // 해외 영화들
            { title: '어벤져스: 엔드게임', english: 'Avengers: Endgame', director: '안소니 루소, 조 루소', cast: ['로버트 다우니 주니어', '크리스 에반스', '마크 러팔로'], genre: '액션, SF', year: 2019, runtime: 181, rating: 9.0, country: '미국' },
            { title: '아이언맨', english: 'Iron Man', director: '존 파브로', cast: ['로버트 다우니 주니어', '테런스 하워드', '제프 브리지스'], genre: '액션, SF', year: 2008, runtime: 126, rating: 8.1, country: '미국' },
            { title: '스파이더맨: 노 웨이 홈', english: 'Spider-Man: No Way Home', director: '존 와츠', cast: ['톰 홀랜드', '젠데이아', '베네딕트 컴버배치'], genre: '액션, SF', year: 2021, runtime: 148, rating: 8.8, country: '미국' },
            { title: '다크 나이트', english: 'The Dark Knight', director: '크리스토퍼 놀란', cast: ['크리스찬 베일', '히스 레저', '아론 에크하트'], genre: '액션, 범죄', year: 2008, runtime: 152, rating: 9.1, country: '미국' },
            { title: '조커', english: 'Joker', director: '토드 필립스', cast: ['호아킨 피닉스', '로버트 드 니로', '제이디 비츠'], genre: '드라마, 스릴러', year: 2019, runtime: 122, rating: 8.2, country: '미국' },
            { title: '인터스텔라', english: 'Interstellar', director: '크리스토퍼 놀란', cast: ['매튜 맥커너히', '앤 해서웨이', '제시카 차스테인'], genre: 'SF, 드라마', year: 2014, runtime: 169, rating: 9.0, country: '미국' },
            { title: '인셉션', english: 'Inception', director: '크리스토퍼 놀란', cast: ['레오나르도 디카프리오', '마리옹 코티야르', '톰 하디'], genre: 'SF, 액션', year: 2010, runtime: 148, rating: 8.8, country: '미국' },
            { title: '타이타닉', english: 'Titanic', director: '제임스 카메론', cast: ['레오나르도 디카프리오', '케이트 윈슬렛'], genre: '로맨스, 드라마', year: 1997, runtime: 194, rating: 8.6, country: '미국' },
            { title: '아바타', english: 'Avatar', director: '제임스 카메론', cast: ['샘 워싱턴', '조 샐다나', '시고니 위버'], genre: 'SF, 액션', year: 2009, runtime: 162, rating: 8.3, country: '미국' },
            { title: '탑건: 매버릭', english: 'Top Gun: Maverick', director: '조제프 코신스키', cast: ['톰 크루즈', '마일즈 텔러', '제니퍼 코넬리'], genre: '액션, 드라마', year: 2022, runtime: 131, rating: 8.7, country: '미국' },
            { title: '미션 임파서블: 폴아웃', english: 'Mission: Impossible - Fallout', director: '크리스토퍼 맥쿼리', cast: ['톰 크루즈', '헨리 카빌', '빙 레임스'], genre: '액션, 스릴러', year: 2018, runtime: 147, rating: 8.4, country: '미국' },
            { title: '분노의 질주: 더 얼티메이트', english: 'Fast & Furious 6', director: '저스틴 린', cast: ['빈 디젤', '폴 워커', '드웨인 존슨'], genre: '액션', year: 2013, runtime: 130, rating: 7.9, country: '미국' },
            { title: '겨울왕국', english: 'Frozen', director: '크리스 벅, 제니퍼 리', cast: ['크리스틴 벨', '이디나 멘젤', '조나단 그로프'], genre: '애니메이션, 뮤지컬', year: 2013, runtime: 102, rating: 8.3, country: '미국' },
            { title: '토이 스토리 4', english: 'Toy Story 4', director: '조시 쿨리', cast: ['톰 행크스', '팀 앨런', '애니 포츠'], genre: '애니메이션', year: 2019, runtime: 100, rating: 8.1, country: '미국' },
            { title: '라이온 킹', english: 'The Lion King', director: '존 파브로', cast: ['도널드 글로버', '비욘세', '세스 로건'], genre: '애니메이션', year: 2019, runtime: 118, rating: 7.8, country: '미국' },
            { title: '라라랜드', english: 'La La Land', director: '데이미언 차젤리', cast: ['라이언 고슬링', '엠마 스톤'], genre: '뮤지컬, 로맨스', year: 2016, runtime: 128, rating: 8.3, country: '미국' },
            { title: '조조 래빗', english: 'Jojo Rabbit', director: '타이카 와이티티', cast: ['로만 그리핀 데이비스', '톰슨 맥켄지', '스칼렛 요한슨'], genre: '코미디, 드라마', year: 2019, runtime: 108, rating: 8.1, country: '미국' },
            { title: '원스 어폰 어 타임 인 할리우드', english: 'Once Upon a Time in Hollywood', director: '쿠엔틴 타란티노', cast: ['레오나르도 디카프리오', '브래드 피트', '마고 로비'], genre: '드라마', year: 2019, runtime: 161, rating: 7.9, country: '미국' },
            { title: '1917', english: '1917', director: '샘 멘데스', cast: ['조지 맥케이', '딘 찰스 채프먼'], genre: '전쟁, 드라마', year: 2019, runtime: 119, rating: 8.5, country: '영국' },
            { title: '포드 v 페라리', english: 'Ford v Ferrari', director: '제임스 맨골드', cast: ['맷 데이먼', '크리스찬 베일'], genre: '드라마, 액션', year: 2019, runtime: 152, rating: 8.2, country: '미국' },
            { title: '매트릭스', english: 'The Matrix', director: '라나 워쇼스키, 릴리 워쇼스키', cast: ['키아누 리브스', '로렌스 피시번', '캐리 앤 모스'], genre: 'SF, 액션', year: 1999, runtime: 136, rating: 8.7, country: '미국' },
            { title: '터미네이터 2: 심판의 날', english: 'Terminator 2: Judgment Day', director: '제임스 카메론', cast: ['아놀드 슈왈제네거', '린다 해밀턴'], genre: 'SF, 액션', year: 1991, runtime: 137, rating: 8.9, country: '미국' },
            { title: '에일리언', english: 'Alien', director: '리들리 스콧', cast: ['시고니 위버', '톰 스케릿'], genre: 'SF, 공포', year: 1979, runtime: 117, rating: 8.4, country: '미국' },
            { title: '블레이드 러너 2049', english: 'Blade Runner 2049', director: '드니 빌뇌브', cast: ['라이언 고슬링', '해리슨 포드'], genre: 'SF, 드라마', year: 2017, runtime: 164, rating: 8.1, country: '미국' },
            { title: '덩케르크', english: 'Dunkirk', director: '크리스토퍼 놀란', cast: ['피온 화이트헤드', '톰 글린 카니'], genre: '전쟁, 액션', year: 2017, runtime: 106, rating: 8.0, country: '영국' },
            { title: '글래디에이터', english: 'Gladiator', director: '리들리 스콧', cast: ['러셀 크로우', '호아킨 피닉스'], genre: '액션, 드라마', year: 2000, runtime: 155, rating: 8.5, country: '미국' },
            { title: '포레스트 검프', english: 'Forrest Gump', director: '로버트 저메키스', cast: ['톰 행크스', '로빈 라이트'], genre: '드라마', year: 1994, runtime: 142, rating: 8.8, country: '미국' },
            { title: '쇼생크 탈출', english: 'The Shawshank Redemption', director: '프랭크 다라본트', cast: ['팀 로빈스', '모건 프리먼'], genre: '드라마', year: 1994, runtime: 142, rating: 9.3, country: '미국' },
            { title: '펄프 픽션', english: 'Pulp Fiction', director: '쿠엔틴 타란티노', cast: ['존 트라볼타', '사무엘 L. 잭슨', '우마 서먼'], genre: '범죄', year: 1994, runtime: 154, rating: 8.6, country: '미국' },
            { title: '시민 케인', english: 'Citizen Kane', director: '오슨 웰스', cast: ['오슨 웰스', '조셉 코튼'], genre: '드라마', year: 1941, runtime: 119, rating: 8.7, country: '미국' },
            { title: '카사블랑카', english: 'Casablanca', director: '마이클 커티즈', cast: ['험프리 보가트', '잉그리드 버그만'], genre: '로맨스, 드라마', year: 1942, runtime: 102, rating: 8.9, country: '미국' },
            { title: '12명의 성난 사람들', english: '12 Angry Men', director: '시드니 루멧', cast: ['헨리 폰다', '리 J. 콥'], genre: '드라마', year: 1957, runtime: 96, rating: 8.8, country: '미국' },
            { title: '대부', english: 'The Godfather', director: '프랜시스 포드 코폴라', cast: ['말론 브란도', '알 파치노'], genre: '범죄, 드라마', year: 1972, runtime: 175, rating: 9.2, country: '미국' },
            { title: '대부 2', english: 'The Godfather Part II', director: '프랜시스 포드 코폴라', cast: ['알 파치노', '로버트 드 니로'], genre: '범죄, 드라마', year: 1974, runtime: 202, rating: 9.1, country: '미국' },
            { title: '캐스트 어웨이', english: 'Cast Away', director: '로버트 저메키스', cast: ['톰 행크스', '헬렌 헌트'], genre: '드라마', year: 2000, runtime: 143, rating: 8.1, country: '미국' }
        ];

        this.sqlInserts = [];
    }

    // 기존 테이블 구조에 맞는 INSERT문 생성
    generateInserts() {
        console.log('[MEMO] 기존 테이블 구조에 맞는 INSERT문 생성 시작');
        console.log(`[INFO] 대상 영화: ${this.movieDatabase.length}개`);

        this.movieDatabase.forEach((movie, index) => {
            try {
                const insertSQL = this.generateSingleInsert(movie, index + 1);
                this.sqlInserts.push(insertSQL);
            } catch (error) {
                console.error(`[ERROR] INSERT문 생성 오류 (${movie.title}):`, error.message);
            }
        });

        console.log(`[SUCCESS] INSERT문 생성 완료: ${this.sqlInserts.length}개`);
        return this.sqlInserts;
    }

    // 단일 INSERT문 생성 (기존 테이블 구조에 맞게)
    generateSingleInsert(movie, index) {
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

        // 키워드 생성
        const keywords = [
            movie.title,
            movie.english,
            movie.director,
            ...movie.cast.slice(0, 3), // 주연 배우 3명
            ...movie.genre.split(', ')
        ].filter(Boolean);

        // 영화 설명 생성
        const description = `${movie.title} (${movie.year}) - ${movie.genre}. 감독: ${movie.director}, 출연: ${movie.cast.slice(0, 3).join(', ')}`;

        const values = [
            escapeSQL(movie.title),
            escapeSQL(movie.english),
            escapeSQL(movie.director),
            arrayToSQL(movie.cast),
            escapeSQL(movie.genre),
            movie.year || 'NULL',
            movie.runtime || 'NULL',
            escapeSQL(movie.country),
            movie.rating || 'NULL',
            escapeSQL(description),
            arrayToSQL(keywords),
            'NULL', // poster_url - 추후 보완
            'NULL'  // naver_movie_id - 추후 보완 
        ];

        return `-- ${index}. ${movie.title} (${movie.year})
INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) 
VALUES (${values.join(', ')});`;
    }

    // SQL 파일 저장
    async saveSQLFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `movies_insert_existing_table_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);

        let sqlContent = `-- 기존 movies 테이블 구조에 맞는 영화 데이터 INSERT 문\n`;
        sqlContent += `-- 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
        sqlContent += `-- 총 영화 수: ${this.sqlInserts.length}개\n`;
        sqlContent += `-- 데이터 소스: 엄선된 인기 영화 리스트 (한국/해외)\n\n`;
        
        sqlContent += `-- 기존 테이블 구조 (참고용)\n`;
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
        sqlContent += `);\n`;
        sqlContent += `*/\n\n`;
        
        sqlContent += `-- 영화 데이터 INSERT (중복 방지)\n`;
        sqlContent += `BEGIN;\n\n`;
        
        this.sqlInserts.forEach((insert) => {
            sqlContent += insert + '\n\n';
        });
        
        sqlContent += `COMMIT;\n\n`;
        sqlContent += `-- INSERT 완료. 총 ${this.sqlInserts.length}개 영화 추가됨\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [INFO] 포함된 영화:\n`;
        sqlContent += `-- - 한국 영화: 기생충, 부산행, 범죄도시, 극한직업, 올드보이, 살인의 추억 등\n`;
        sqlContent += `-- - 해외 영화: 어벤져스, 다크나이트, 인터스텔라, 쇼생크탈출, 대부 등\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [FORM] 데이터 완성도:\n`;
        sqlContent += `-- - 제목, 감독, 출연진, 장르, 개봉년도, 러닝타임 포함\n`;
        sqlContent += `-- - 평점 데이터 (7.6~9.3 범위)\n`;
        sqlContent += `-- - 검색 키워드 배열 (제목, 감독, 배우, 장르)\n`;
        sqlContent += `-- - 상세 설명 자동 생성\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [TIP] 사용법:\n`;
        sqlContent += `-- 1. Supabase SQL 에디터에서 실행\n`;
        sqlContent += `-- 2. 카카오 스킬에서 "영화제목 + 영화평/평점" 형태로 테스트\n`;
        sqlContent += `-- 3. 예: "기생충 영화평", "어벤져스 평점", "인터스텔라 리뷰"\n`;

        // 파일 저장
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        
        console.log(`\n📄 SQL 파일 생성 완료: ${filename}`);
        console.log(`[LOCATION] 파일 위치: ${filepath}`);
        console.log(`[INFO] 총 INSERT문: ${this.sqlInserts.length}개`);
        
        return { filename, filepath, insertCount: this.sqlInserts.length };
    }

    async run() {
        console.log('[MOVIE] 기존 테이블 구조 맞춤형 영화 INSERT문 생성기');
        console.log('='.repeat(60));
        
        try {
            // INSERT문 생성
            this.generateInserts();
            
            // SQL 파일 저장
            const result = await this.saveSQLFile();
            
            console.log('\n[PARTY] 완료!');
            console.log('[FORM] 다음 단계:');
            console.log('1. 생성된 .sql 파일을 Supabase SQL 에디터에 복사');
            console.log('2. Run 버튼으로 실행');
            console.log('3. 기존 테이블 구조에 영화 데이터 저장');
            console.log('4. 카카오 스킬에서 영화 검색 테스트');
            
            return result;
            
        } catch (error) {
            console.error('[ERROR] 실행 오류:', error);
            throw error;
        }
    }
}

// 실행
async function main() {
    const generator = new FastMovieInsertsGenerator();
    await generator.run();
}

if (require.main === module) {
    main();
}

module.exports = FastMovieInsertsGenerator;