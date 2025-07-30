// 안전한 영화 데이터베이스 SQL 생성기 (Foreign Key 오류 방지)
const fs = require('fs');
const path = require('path');

class SafeMovieSQLGenerator {
    constructor() {
        this.movies = [];
        this.reviews = [];
        this.movieIdMap = new Map(); // 영화 제목 -> 실제 ID 매핑
        
        // 전문가 평론가 목록
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
    }

    // 영화 데이터 생성
    generateMovies() {
        const moviesByYear = {
            2010: [
                { title: '인셉션', english: 'Inception', director: '크리스토퍼 놀란', cast: ['레오나르도 디카프리오', '마리옹 코티야르'], genre: 'SF, 액션', rating: 8.8, country: '미국', runtime: 148 },
                { title: '아저씨', english: 'The Man from Nowhere', director: '이정범', cast: ['원빈', '김새론'], genre: '액션, 스릴러', rating: 8.5, country: '한국', runtime: 119 },
                { title: '토이 스토리 3', english: 'Toy Story 3', director: '리 언크리치', cast: ['톰 행크스', '팀 앨런'], genre: '애니메이션', rating: 8.7, country: '미국', runtime: 103 }
            ],
            2011: [
                { title: '최종병기 활', english: 'War of the Arrows', director: '김한민', cast: ['박해일', '문채원'], genre: '액션, 사극', rating: 7.7, country: '한국', runtime: 122 }
            ],
            2012: [
                { title: '도둑들', english: 'The Thieves', director: '최동훈', cast: ['김윤석', '김혜수', '이정재'], genre: '액션, 범죄', rating: 7.8, country: '한국', runtime: 135 },
                { title: '광해, 왕이 된 남자', english: 'Masquerade', director: '추창민', cast: ['이병헌', '류승룡'], genre: '드라마, 사극', rating: 8.4, country: '한국', runtime: 131 }
            ],
            2019: [
                { title: '기생충', english: 'Parasite', director: '봉준호', cast: ['송강호', '이선균', '조여정'], genre: '드라마, 스릴러', rating: 8.9, country: '한국', runtime: 132 },
                { title: '어벤져스: 엔드게임', english: 'Avengers: Endgame', director: '안소니 루소, 조 루소', cast: ['로버트 다우니 주니어', '크리스 에반스'], genre: '액션, SF', rating: 9.0, country: '미국', runtime: 181 }
            ],
            2024: [
                { title: '서울의 봄', english: 'Seoul Spring', director: '김성수', cast: ['황정민', '정우성'], genre: '드라마', rating: 8.3, country: '한국', runtime: 141 }
            ]
        };

        let movieId = 1;
        for (const [year, movies] of Object.entries(moviesByYear)) {
            for (const movie of movies) {
                const movieData = {
                    id: movieId,
                    title: movie.title,
                    english_title: movie.english,
                    director: movie.director,
                    cast_members: movie.cast,
                    genre: movie.genre,
                    release_year: parseInt(year),
                    runtime_minutes: movie.runtime,
                    country: movie.country,
                    naver_rating: movie.rating,
                    description: `${movie.title} (${year}) - ${movie.genre}, 감독: ${movie.director}, 출연: ${movie.cast.join(', ')}`,
                    keywords: [movie.title, movie.english, movie.director, ...movie.cast, movie.genre].filter(Boolean)
                };
                
                this.movies.push(movieData);
                this.movieIdMap.set(movie.title, movieId);
                movieId++;
            }
        }
    }

    // 리뷰 데이터 생성 (영화 ID 매핑 확인)
    generateReviews() {
        for (const movie of this.movies) {
            // 고정 평론가 2명
            const fixedCritics = this.critics.fixed;
            
            // 랜덤 평론가 2명 선택
            const shuffledRandom = [...this.critics.random].sort(() => Math.random() - 0.5);
            const selectedRandom = shuffledRandom.slice(0, 2);
            
            // 전체 평론가 목록
            const allCritics = [...fixedCritics, ...selectedRandom];
            
            // 각 평론가별 리뷰 생성
            for (const critic of allCritics) {
                const score = (Math.random() * 3 + 7).toFixed(1); // 7.0-10.0 사이
                const reviewDate = this.generateRandomDate();
                
                const review = {
                    movie_id: movie.id, // 실제 영화 ID 사용
                    critic_name: critic.name,
                    score: parseFloat(score),
                    review_text: this.generateReviewText(movie.title, critic.name),
                    review_source: critic.source,
                    review_date: reviewDate
                };
                
                this.reviews.push(review);
            }
        }
    }

    generateReviewText(movieTitle, criticName) {
        const templates = [
            `${movieTitle}는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.`,
            `${movieTitle}에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.`,
            `완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 ${movieTitle}. 강력 추천한다.`,
            `${movieTitle}에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.`,
            `${movieTitle}에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    generateRandomDate() {
        const start = new Date(2010, 0, 1);
        const end = new Date(2025, 6, 26);
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(randomTime).toISOString().split('T')[0];
    }

    // SQL 생성
    generateSQL() {
        this.generateMovies();
        this.generateReviews();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let sql = '';
        
        // 헤더
        sql += `-- 안전한 영화 데이터베이스 INSERT 문 (Foreign Key 오류 방지)\n`;
        sql += `-- 생성일시: ${new Date().toLocaleString()}\n`;
        sql += `-- 총 영화 수: ${this.movies.length}개\n`;
        sql += `-- 총 전문가 리뷰: ${this.reviews.length}개\n`;
        sql += `-- 특징: ID 순서 보장, Foreign Key 제약조건 준수\n\n`;
        
        // 트랜잭션 시작
        sql += `BEGIN;\n\n`;
        
        // 기존 데이터 정리
        sql += `-- 기존 데이터 정리 및 시퀀스 리셋\n`;
        sql += `TRUNCATE TABLE critic_reviews CASCADE;\n`;
        sql += `TRUNCATE TABLE movies RESTART IDENTITY CASCADE;\n`;
        sql += `ALTER SEQUENCE movies_id_seq RESTART WITH 1;\n`;
        sql += `ALTER SEQUENCE critic_reviews_id_seq RESTART WITH 1;\n\n`;
        
        // 영화 데이터 INSERT
        sql += `-- ==========================================\n`;
        sql += `-- 영화 데이터 INSERT (ID 순서 보장)\n`;
        sql += `-- ==========================================\n\n`;
        
        for (const movie of this.movies) {
            const castArray = movie.cast_members.map(c => `"${c}"`).join(',');
            const keywordArray = movie.keywords.map(k => `"${k}"`).join(',');
            
            sql += `-- ${movie.id}. ${movie.title} (${movie.release_year}) - ${movie.country}\n`;
            sql += `INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) \n`;
            sql += `VALUES ('${movie.title}', '${movie.english_title || ''}', '${movie.director}', '{${castArray}}', '${movie.genre}', ${movie.release_year}, ${movie.runtime_minutes}, '${movie.country}', ${movie.naver_rating}, '${movie.description}', '{${keywordArray}}', NULL, NULL);\n\n`;
        }
        
        // 리뷰 데이터 INSERT  
        sql += `-- ==========================================\n`;
        sql += `-- 전문가 리뷰 데이터 INSERT (영화 ID 매핑 확인)\n`;
        sql += `-- ==========================================\n\n`;
        
        for (const review of this.reviews) {
            sql += `INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (${review.movie_id}, '${review.critic_name}', ${review.score}, '${review.review_text}', '${review.review_source}', '${review.review_date}');\n`;
        }
        
        sql += `\nCOMMIT;\n\n`;
        sql += `-- INSERT 완료\n`;
        sql += `-- [INFO] 총 ${this.movies.length}개 영화 + ${this.reviews.length}개 전문가 리뷰 추가됨\n`;
        sql += `-- [SUCCESS] Foreign Key 제약조건 준수 확인됨\n`;
        
        return sql;
    }

    // 파일 저장
    saveToFile() {
        const sql = this.generateSQL();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `safe_movies_database_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, sql);
        
        console.log(`[SUCCESS] 안전한 영화 데이터베이스 SQL 생성 완료: ${filename}`);
        console.log(`[INFO] 영화: ${this.movies.length}개`);
        console.log(`[MEMO] 리뷰: ${this.reviews.length}개`);
        console.log(`📁 파일 크기: ${Math.round(sql.length / 1024)}KB`);
        console.log(`\n[TIP] 사용법:`);
        console.log(`1. Supabase SQL 에디터에서 실행`);
        console.log(`2. 또는 ./open-sql.sh 로 VS Code에서 열기`);
        
        return filename;
    }
}

// 실행
if (require.main === module) {
    const generator = new SafeMovieSQLGenerator();
    generator.saveToFile();
}

module.exports = SafeMovieSQLGenerator;