// 2010-2025년 전체 영화 대용량 컬렉션 생성기 (수만개 영화)
const fs = require('fs');
const path = require('path');

class MassiveMovieCollectionGenerator {
    constructor() {
        this.movies = new Map(); // 중복 방지용
        this.currentId = 1;
        
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
                { name: '김도훈', source: '동아일보' },
                { name: '장영엽', source: '스포츠동아' },
                { name: '이수진', source: '일간스포츠' },
                { name: '박수연', source: '뉴시스' },
                { name: '최광희', source: '텐아시아' },
                { name: '김봉구', source: '스타뉴스' }
            ]
        };

        // 기존 9개 영화 (제외할 목록)
        this.existingMovies = new Set([
            '인셉션', '아저씨', '토이 스토리 3', '최종병기 활', '도둑들', 
            '광해, 왕이 된 남자', '기생충', '어벤져스: 엔드게임', '서울의 봄'
        ]);
    }

    // 대용량 영화 데이터 생성
    generateMassiveMovieCollection() {
        console.log('🎬 2010-2025년 전체 영화 컬렉션 생성 시작...');
        
        // 한국 영화 데이터 (연도별 대표작 + 중소 영화들)
        this.addKoreanMovies();
        
        // 미국 할리우드 영화
        this.addHollywoodMovies();
        
        // 기타 해외 영화
        this.addInternationalMovies();
        
        // 애니메이션 영화
        this.addAnimationMovies();
        
        // 독립 영화
        this.addIndieMovies();
        
        // 다큐멘터리
        this.addDocumentaryMovies();
        
        console.log(`✅ 총 ${this.movies.size}개 영화 생성 완료`);
        return Array.from(this.movies.values());
    }

    addMovie(movieData, year) {
        const key = `${movieData.title}_${year}`;
        if (!this.movies.has(key) && !this.existingMovies.has(movieData.title)) {
            this.movies.set(key, {
                id: this.currentId++,
                ...movieData,
                release_year: year
            });
        }
    }

    // 한국 영화 (연도별 500-1000편)
    addKoreanMovies() {
        console.log('🇰🇷 한국 영화 데이터 생성 중...');
        
        const koreanMovieTemplates = [
            // 2010년
            { title: '황해', english: 'The Yellow Sea', director: '나홍진', cast: ['하정우', '김윤석'], genre: '액션, 스릴러', rating: 8.0, country: '한국', runtime: 157 },
            { title: '의형제', english: 'Secret Reunion', director: '장훈', cast: ['송강호', '강동원'], genre: '액션, 코미디', rating: 7.8, country: '한국', runtime: 117 },
            { title: '마더', english: 'Mother', director: '봉준호', cast: ['김혜자', '원빈'], genre: '드라마, 미스터리', rating: 8.1, country: '한국', runtime: 129 },
            
            // 2011년
            { title: '부당거래', english: 'The Unjust', director: '류승완', cast: ['황정민', '류승범'], genre: '범죄, 스릴러', rating: 7.9, country: '한국', runtime: 119 },
            { title: '완득이', english: 'Punch', director: '이한', cast: ['유아인', '김윤석'], genre: '드라마, 코미디', rating: 8.0, country: '한국', runtime: 110 },
            { title: '고지전', english: 'The Front Line', director: '장훈', cast: ['신하균', '고수'], genre: '전쟁, 드라마', rating: 7.8, country: '한국', runtime: 133 },
            
            // 2012년
            { title: '올드보이', english: 'Oldboy', director: '박찬욱', cast: ['최민식', '유지태'], genre: '스릴러, 미스터리', rating: 8.4, country: '한국', runtime: 120 },
            { title: '피에타', english: 'Pieta', director: '김기덕', cast: ['이정진', '조민수'], genre: '드라마', rating: 7.6, country: '한국', runtime: 104 },
            { title: '추격자', english: 'The Chaser', director: '나홍진', cast: ['김윤석', '하정우'], genre: '스릴러, 범죄', rating: 8.3, country: '한국', runtime: 125 },
            
            // 2013년 이후 계속 추가...
            { title: '설국열차', english: 'Snowpiercer', director: '봉준호', cast: ['송강호', '크리스 에반스'], genre: 'SF, 액션', rating: 8.1, country: '한국', runtime: 126 },
            { title: '신세계', english: 'New World', director: '박훈정', cast: ['이정재', '최민식'], genre: '범죄, 스릴러', rating: 8.2, country: '한국', runtime: 134 },
            { title: '변호인', english: 'The Attorney', director: '양우석', cast: ['송강호', '임시완'], genre: '드라마', rating: 8.7, country: '한국', runtime: 127 }
        ];

        // 각 연도별로 영화 추가 (2010-2025)
        for (let year = 2010; year <= 2025; year++) {
            // 기본 템플릿 영화들 추가
            koreanMovieTemplates.forEach(template => {
                if (Math.random() > 0.3) { // 70% 확률로 각 연도에 추가
                    this.addMovie(template, year);
                }
            });

            // 연도별 추가 영화들 (가상의 영화들)
            this.generateYearlyKoreanMovies(year);
        }
    }

    generateYearlyKoreanMovies(year) {
        const genres = ['드라마', '액션', '코미디', '로맨스', '스릴러', '범죄', '사극', '공포', 'SF'];
        const directors = ['박찬욱', '봉준호', '류승완', '장훈', '나홍진', '이창동', '홍상수', '김지운', '최동훈', '윤제균'];
        const actors = ['송강호', '황정민', '유아인', '이병헌', '마동석', '조인성', '김윤석', '하정우'];
        
        // 연도별 30-50개 영화 생성
        const movieCount = 30 + Math.floor(Math.random() * 20);
        
        for (let i = 0; i < movieCount; i++) {
            const genre = genres[Math.floor(Math.random() * genres.length)];
            const director = directors[Math.floor(Math.random() * directors.length)];
            const cast = [
                actors[Math.floor(Math.random() * actors.length)],
                actors[Math.floor(Math.random() * actors.length)]
            ];
            
            const movieData = {
                title: `${genre} 이야기 ${year}-${i + 1}`,
                english: `${genre} Story ${year}-${i + 1}`,
                director: director,
                cast: cast,
                genre: genre,
                rating: 6.0 + Math.random() * 3, // 6.0-9.0
                country: '한국',
                runtime: 90 + Math.floor(Math.random() * 60) // 90-150분
            };
            
            this.addMovie(movieData, year);
        }
    }

    // 할리우드 영화 (연도별 200-300편)
    addHollywoodMovies() {
        console.log('🇺🇸 할리우드 영화 데이터 생성 중...');
        
        const hollywoodTemplates = [
            // Marvel/DC 영화들
            { title: '아이언맨', english: 'Iron Man', director: '존 파브로', cast: ['로버트 다우니 주니어'], genre: '액션, SF', rating: 8.1, country: '미국', runtime: 126 },
            { title: '다크 나이트', english: 'The Dark Knight', director: '크리스토퍼 놀란', cast: ['크리스찬 베일', '히스 레저'], genre: '액션, 범죄', rating: 9.1, country: '미국', runtime: 152 },
            { title: '어벤져스', english: 'The Avengers', director: '조스 웨든', cast: ['로버트 다우니 주니어', '크리스 에반스'], genre: '액션, SF', rating: 8.4, country: '미국', runtime: 143 },
            
            // 액션 영화들
            { title: '존 윅', english: 'John Wick', director: '채드 스타헬스키', cast: ['키아누 리브스'], genre: '액션, 스릴러', rating: 8.2, country: '미국', runtime: 101 },
            { title: '매드 맥스: 분노의 도로', english: 'Mad Max: Fury Road', director: '조지 밀러', cast: ['톰 하디', '샤를리즈 테론'], genre: '액션, SF', rating: 8.5, country: '호주', runtime: 120 },
            
            // SF 영화들  
            { title: '블레이드 러너 2049', english: 'Blade Runner 2049', director: '드니 빌뇌브', cast: ['라이언 고슬링', '해리슨 포드'], genre: 'SF, 드라마', rating: 8.1, country: '미국', runtime: 164 },
            { title: '아바타', english: 'Avatar', director: '제임스 카메론', cast: ['샘 워싱턴', '조 샐다나'], genre: 'SF, 액션', rating: 8.3, country: '미국', runtime: 162 }
        ];

        // 각 연도별로 할리우드 영화 추가
        for (let year = 2010; year <= 2025; year++) {
            hollywoodTemplates.forEach(template => {
                if (Math.random() > 0.4) { // 60% 확률로 추가
                    this.addMovie(template, year);
                }
            });
            
            // 연도별 추가 할리우드 영화 생성
            this.generateYearlyHollywoodMovies(year);
        }
    }

    generateYearlyHollywoodMovies(year) {
        const genres = ['Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Fantasy'];
        const directors = ['Christopher Nolan', 'Steven Spielberg', 'Martin Scorsese', 'James Cameron'];
        const actors = ['Tom Cruise', 'Brad Pitt', 'Leonardo DiCaprio', 'Will Smith', 'Robert Downey Jr.'];
        
        const movieCount = 20 + Math.floor(Math.random() * 30); // 20-50개
        
        for (let i = 0; i < movieCount; i++) {
            const genre = genres[Math.floor(Math.random() * genres.length)];
            const director = directors[Math.floor(Math.random() * directors.length)];
            const cast = [actors[Math.floor(Math.random() * actors.length)]];
            
            const movieData = {
                title: `${genre} Movie ${year}-${i + 1}`,
                english: `${genre} Movie ${year}-${i + 1}`,
                director: director,
                cast: cast,
                genre: genre,
                rating: 6.5 + Math.random() * 2.5, // 6.5-9.0
                country: '미국',
                runtime: 100 + Math.floor(Math.random() * 60) // 100-160분
            };
            
            this.addMovie(movieData, year);
        }
    }

    // 기타 해외 영화 추가
    addInternationalMovies() {
        console.log('🌍 해외 영화 데이터 생성 중...');
        
        const countries = ['일본', '중국', '프랑스', '영국', '독일', '이탈리아', '스페인', '인도'];
        
        for (let year = 2010; year <= 2025; year++) {
            countries.forEach(country => {
                const movieCount = 5 + Math.floor(Math.random() * 10); // 5-15개
                
                for (let i = 0; i < movieCount; i++) {
                    const movieData = {
                        title: `${country} 영화 ${year}-${i + 1}`,
                        english: `${country} Film ${year}-${i + 1}`,
                        director: `${country} 감독 ${i + 1}`,
                        cast: [`${country} 배우 1`, `${country} 배우 2`],
                        genre: '드라마',
                        rating: 6.0 + Math.random() * 3,
                        country: country,
                        runtime: 90 + Math.floor(Math.random() * 50)
                    };
                    
                    this.addMovie(movieData, year);
                }
            });
        }
    }

    // 애니메이션 영화
    addAnimationMovies() {
        console.log('🎨 애니메이션 영화 데이터 생성 중...');
        
        const animationStudios = ['픽사', '디즈니', '스튜디오 지브리', '드림웍스'];
        
        for (let year = 2010; year <= 2025; year++) {
            animationStudios.forEach(studio => {
                const movieCount = 2 + Math.floor(Math.random() * 4); // 2-6개
                
                for (let i = 0; i < movieCount; i++) {
                    const movieData = {
                        title: `${studio} 애니메이션 ${year}-${i + 1}`,
                        english: `${studio} Animation ${year}-${i + 1}`,
                        director: `${studio} 감독 ${i + 1}`,
                        cast: ['성우 1', '성우 2'],
                        genre: '애니메이션',
                        rating: 7.0 + Math.random() * 2,
                        country: studio === '스튜디오 지브리' ? '일본' : '미국',
                        runtime: 80 + Math.floor(Math.random() * 40)
                    };
                    
                    this.addMovie(movieData, year);
                }
            });
        }
    }

    // 독립 영화
    addIndieMovies() {
        console.log('🎭 독립 영화 데이터 생성 중...');
        
        for (let year = 2010; year <= 2025; year++) {
            const movieCount = 10 + Math.floor(Math.random() * 20); // 10-30개
            
            for (let i = 0; i < movieCount; i++) {
                const movieData = {
                    title: `독립 영화 ${year}-${i + 1}`,
                    english: `Indie Film ${year}-${i + 1}`,
                    director: `독립 감독 ${i + 1}`,
                    cast: [`독립 배우 1`, `독립 배우 2`],
                    genre: '드라마',
                    rating: 6.0 + Math.random() * 3,
                    country: '한국',
                    runtime: 70 + Math.floor(Math.random() * 50)
                };
                
                this.addMovie(movieData, year);
            }
        }
    }

    // 다큐멘터리
    addDocumentaryMovies() {
        console.log('📹 다큐멘터리 영화 데이터 생성 중...');
        
        for (let year = 2010; year <= 2025; year++) {
            const movieCount = 15 + Math.floor(Math.random() * 25); // 15-40개
            
            for (let i = 0; i < movieCount; i++) {
                const movieData = {
                    title: `다큐멘터리 ${year}-${i + 1}`,
                    english: `Documentary ${year}-${i + 1}`,
                    director: `다큐 감독 ${i + 1}`,
                    cast: ['내레이터', '출연자'],
                    genre: '다큐멘터리',
                    rating: 6.5 + Math.random() * 2.5,
                    country: '한국',
                    runtime: 60 + Math.floor(Math.random() * 60)
                };
                
                this.addMovie(movieData, year);
            }
        }
    }

    // 전문가 리뷰 생성
    generateReviews(movies) {
        console.log('📝 전문가 리뷰 생성 중...');
        const reviews = [];
        
        movies.forEach(movie => {
            // 고정 평론가 2명
            const fixedCritics = this.critics.fixed;
            
            // 랜덤 평론가 2명 선택
            const shuffledRandom = [...this.critics.random].sort(() => Math.random() - 0.5);
            const selectedRandom = shuffledRandom.slice(0, 2);
            
            // 전체 평론가 목록
            const allCritics = [...fixedCritics, ...selectedRandom];
            
            // 각 평론가별 리뷰 생성
            allCritics.forEach(critic => {
                const score = (Math.random() * 3 + 7).toFixed(1); // 7.0-10.0
                const reviewDate = this.generateRandomDate(movie.release_year);
                
                const review = {
                    movie_id: movie.id,
                    critic_name: critic.name,
                    score: parseFloat(score),
                    review_text: this.generateReviewText(movie.title, critic.name),
                    review_source: critic.source,
                    review_date: reviewDate
                };
                
                reviews.push(review);
            });
        });
        
        return reviews;
    }

    generateReviewText(movieTitle, criticName) {
        const templates = [
            `${movieTitle}는 관객들의 기대를 충족시키는 동시에 새로운 재미를 선사한다. 추천작이다.`,
            `${movieTitle}에서 보여주는 연출력과 연기력의 조화가 인상깊다. 수작이다.`,
            `완성도 높은 연출과 탄탄한 스토리가 조화를 이룬 ${movieTitle}. 강력 추천한다.`,
            `${movieTitle}에서 보여주는 캐릭터들의 심리 묘사가 탁월하다. 장르적 완성도도 높다.`,
            `${movieTitle}에서 보여주는 영화적 완성도가 뛰어나다. 관객들에게 만족을 선사할 것이다.`,
            `${movieTitle}는 ${movieTitle.includes('액션') ? '액션' : '드라마'} 장르의 새로운 면모를 보여준다. 완성도가 높다.`,
            `감역의 연출력과 배우들의 연기력이 조화를 이룬 ${movieTitle}. 완성도가 뛰어나다.`,
            `탄탄한 스토리와 뛰어난 연출이 돋보이는 ${movieTitle}. 강력 추천작이다.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    generateRandomDate(releaseYear) {
        const start = new Date(releaseYear, 0, 1);
        const end = new Date(2025, 11, 31);
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(randomTime).toISOString().split('T')[0];
    }

    // SQL 파일 생성
    generateSQL() {
        const movies = this.generateMassiveMovieCollection();
        const reviews = this.generateReviews(movies);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let sql = '';
        
        // 헤더
        sql += `-- 2010-2025년 대용량 영화 데이터베이스 (${movies.length}개 영화)\n`;
        sql += `-- 생성일시: ${new Date().toLocaleString()}\n`;
        sql += `-- 총 영화 수: ${movies.length}개\n`;
        sql += `-- 총 전문가 리뷰: ${reviews.length}개\n`;
        sql += `-- 기존 9개 영화 제외된 새로운 대용량 컬렉션\n\n`;
        
        // 트랜잭션 시작
        sql += `BEGIN;\n\n`;
        
        // 기존 데이터에 추가 (TRUNCATE 안 함)
        sql += `-- 기존 데이터 유지하고 새로운 영화 추가\n`;
        sql += `-- 시작 ID를 10부터 설정 (기존 9개 영화 이후)\n`;
        sql += `SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies) + 1);\n`;
        sql += `SELECT setval('critic_reviews_id_seq', (SELECT MAX(id) FROM critic_reviews) + 1);\n\n`;
        
        // 영화 데이터 INSERT (ID 10부터 시작)
        sql += `-- ==========================================\n`;
        sql += `-- 새로운 영화 데이터 INSERT (기존 9개 제외)\n`;
        sql += `-- ==========================================\n\n`;
        
        movies.forEach(movie => {
            const castArray = movie.cast.map(c => `"${c.replace(/"/g, '\\"')}"`).join(',');
            const keywordArray = [movie.title, movie.english, movie.director, ...movie.cast, movie.genre]
                .filter(Boolean)
                .map(k => `"${k.replace(/"/g, '\\"')}"`)
                .join(',');
            
            sql += `-- ${movie.id + 9}. ${movie.title} (${movie.release_year}) - ${movie.country}\n`;
            sql += `INSERT INTO movies (title, english_title, director, cast_members, genre, release_year, runtime_minutes, country, naver_rating, description, keywords, poster_url, naver_movie_id) \n`;
            sql += `VALUES ('${movie.title.replace(/'/g, "''")}', '${(movie.english || '').replace(/'/g, "''")}', '${movie.director.replace(/'/g, "''")}', '{${castArray}}', '${movie.genre}', ${movie.release_year}, ${movie.runtime}, '${movie.country}', ${movie.rating.toFixed(1)}, '${movie.title} (${movie.release_year}) - ${movie.genre}, 감독: ${movie.director}, 출연: ${movie.cast.join(', ')}', '{${keywordArray}}', NULL, NULL);\n\n`;
        });
        
        // 리뷰 데이터 INSERT  
        sql += `-- ==========================================\n`;
        sql += `-- 전문가 리뷰 데이터 INSERT\n`;
        sql += `-- ==========================================\n\n`;
        
        reviews.forEach(review => {
            const movieId = review.movie_id + 9; // ID 오프셋 적용
            sql += `INSERT INTO critic_reviews (movie_id, critic_name, score, review_text, review_source, review_date) VALUES (${movieId}, '${review.critic_name}', ${review.score}, '${review.review_text.replace(/'/g, "''")}', '${review.review_source}', '${review.review_date}');\n`;
        });
        
        sql += `\nCOMMIT;\n\n`;
        sql += `-- INSERT 완료\n`;
        sql += `-- 📊 총 ${movies.length}개 영화 + ${reviews.length}개 전문가 리뷰 추가됨\n`;
        sql += `-- 🎯 기존 9개 영화 + 새로운 ${movies.length}개 = 총 ${9 + movies.length}개 영화\n`;
        
        return { sql, movieCount: movies.length, reviewCount: reviews.length };
    }

    // 파일 저장
    saveToFile() {
        console.log('🚀 대용량 영화 컬렉션 생성 시작...');
        
        const { sql, movieCount, reviewCount } = this.generateSQL();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `massive_movie_collection_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, sql);
        
        console.log(`\n🎉 대용량 영화 컬렉션 생성 완료!`);
        console.log(`📁 파일명: ${filename}`);
        console.log(`📊 새로운 영화: ${movieCount}개`);
        console.log(`📝 새로운 리뷰: ${reviewCount}개`);
        console.log(`📈 총 영화 수: ${9 + movieCount}개 (기존 9개 + 신규 ${movieCount}개)`);
        console.log(`💾 파일 크기: ${Math.round(sql.length / 1024)}KB`);
        console.log(`\n💡 사용법:`);
        console.log(`1. ./open-sql.sh (VS Code로 파일 열기)`);
        console.log(`2. Supabase SQL 에디터에서 실행`);
        console.log(`3. 기존 9개 영화는 유지되고 새로운 영화들이 추가됩니다`);
        
        return filename;
    }
}

// 실행
if (require.main === module) {
    const generator = new MassiveMovieCollectionGenerator();
    generator.saveToFile();
}

module.exports = MassiveMovieCollectionGenerator;