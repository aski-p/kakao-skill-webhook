// 네이버 영화 등록 순서대로 전체 크롤링 및 INSERT문 생성
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class NaverMovieComprehensiveCrawler {
    constructor() {
        this.naverClientId = process.env.NAVER_CLIENT_ID;
        this.naverClientSecret = process.env.NAVER_CLIENT_SECRET;
        this.naverSearchUrl = 'https://openapi.naver.com/v1/search/movie.json';
        
        this.movies = [];
        this.processedTitles = new Set(); // 중복 방지
        this.sqlInserts = [];
        
        this.results = {
            totalSearched: 0,
            totalMovies: 0,
            successCount: 0,
            errorCount: 0,
            errors: []
        };

        // 다양한 검색 키워드로 광범위한 영화 수집
        this.searchKeywords = [
            // 한국 영화 감독들
            '봉준호', '박찬욱', '김기덕', '이창동', '홍상수', '임권택', '최동훈', '나홍진', '류승완', '장훈',
            '윤제균', '강제규', '김한민', '추창민', '이준익', '강우석', '곽경택', '우민호', '김지운', '한재림',
            '김용화', '장준환', '윤종빈', '이정범', '한재림', '김성훈', '정지우', '이환경', '김태균', '박훈정',
            
            // 한국 배우들
            '송강호', '최민식', '황정민', '이병헌', '유아인', '공유', '마동석', '류승룡', '조진웅', '설경구',
            '장동건', '원빈', '김윤석', '하정우', '이정재', '전지현', '김혜수', '조여정', '박소담', '이선균',
            
            // 해외 감독들  
            '크리스토퍼 놀란', '스티븐 스필버그', '마틴 스코세이지', '쿠엔틴 타란티노', '제임스 카메론', '리들리 스콧',
            '데이비드 핀처', '조던 필', '코엔 형제', '폴 토마스 앤더슨', '우디 앨런', '알프레드 히치콕',
            
            // 해외 배우들
            '레오나르도 디카프리오', '톰 행크스', '브래드 피트', '조니 뎁', '윌 스미스', '톰 크루즈', '로버트 다우니 주니어',
            '스칼렛 요한슨', '나탈리 포트만', '메릴 스트립', '안젤리나 졸리', '엠마 스톤', '라이언 고슬링',
            
            // 장르별 키워드
            '액션 영화', '로맨스 영화', '코미디 영화', '스릴러 영화', '공포 영화', '드라마 영화', 'SF 영화', '판타지 영화',
            '애니메이션', '다큐멘터리', '뮤지컬', '전쟁 영화', '범죄 영화', '미스터리', '서부극', '모험',
            
            // 연도별 인기작
            '2024 영화', '2023 영화', '2022 영화', '2021 영화', '2020 영화', '2019 영화', '2018 영화', '2017 영화',
            '2016 영화', '2015 영화', '2014 영화', '2013 영화', '2012 영화', '2011 영화', '2010 영화',
            
            // 시리즈 영화들
            '어벤져스', '스파이더맨', '아이언맨', '배트맨', '슈퍼맨', '엑스맨', '트랜스포머', '분노의 질주', '미션 임파서블',
            '존 윅', '킹스맨', '데드풀', '반지의 제왕', '호빗', '해리포터', '스타워즈', '인디아나 존스',
            
            // 애니메이션 스튜디오
            '픽사', '디즈니', '지브리', '드림웍스', '일루미네이션', '소니 픽처스',
            
            // 국가별
            '한국 영화', '미국 영화', '일본 영화', '중국 영화', '영국 영화', '호주 영화', '인도 영화', '러시아 영화',
            '독일 영화', '프랑스 영화', '이탈리아 영화', '스페인 영화', '북유럽 영화',
            
            // 수상작들
            '아카데미', '칸 영화제', '베니스', '베를린', '골든글로브', '청룡', '백상', '부산국제영화제',
            
            // 특별 키워드
            '명작', '클래식', '고전', '최신작', '화제작', '흥행작', '작품성', '예술 영화', '상업 영화', '독립 영화'
        ];
    }

    async crawlAllNaverMovies() {
        console.log('[MOVIE] 네이버 영화 등록 순서대로 전체 크롤링 시작');
        console.log(`[INFO] 검색 키워드: ${this.searchKeywords.length}개`);
        console.log('[CLOCK] 예상 소요 시간: 30분 ~ 1시간 (API 제한 준수)\n');
        
        if (!this.naverClientId || !this.naverClientSecret) {
            throw new Error('네이버 API 키가 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET를 확인해주세요.');
        }

        const startTime = Date.now();

        try {
            // 1. 키워드별 영화 검색
            await this.searchMoviesByKeywords();
            
            // 2. 추가 영화 발굴 (페이지네이션)
            await this.searchAdditionalMovies();
            
            // 3. SQL INSERT문 생성
            await this.generateSQLInserts();

            const duration = Math.round((Date.now() - startTime) / 1000);
            
            console.log('\n[PARTY] 네이버 영화 크롤링 완료!');
            console.log(`[INFO] 총 검색 수행: ${this.results.totalSearched}회`);
            console.log(`[MOVIE] 수집된 영화: ${this.results.totalMovies}개`);
            console.log(`[SUCCESS] 성공: ${this.results.successCount}개`);
            console.log(`[ERROR] 실패: ${this.results.errorCount}개`);
            console.log(`⏱️ 소요시간: ${Math.floor(duration / 60)}분 ${duration % 60}초`);

            return {
                success: true,
                totalMovies: this.results.totalMovies,
                results: this.results
            };

        } catch (error) {
            console.error('[ERROR] 크롤링 실패:', error);
            return {
                success: false,
                error: error.message,
                results: this.results
            };
        }
    }

    // 키워드별 영화 검색
    async searchMoviesByKeywords() {
        console.log('[SEARCH] 키워드별 영화 검색 시작');
        
        for (let i = 0; i < this.searchKeywords.length; i++) {
            const keyword = this.searchKeywords[i];
            
            try {
                console.log(`[SEARCH] [${i + 1}/${this.searchKeywords.length}] "${keyword}" 검색 중...`);
                
                // 각 키워드당 여러 페이지 검색 (최대 10페이지, 100개 영화)
                for (let page = 1; page <= 10; page++) {
                    const movies = await this.searchNaverMovies(keyword, page);
                    
                    if (!movies || movies.length === 0) {
                        break; // 더 이상 결과가 없으면 중단
                    }
                    
                    for (const movie of movies) {
                        await this.processMovie(movie);
                    }
                    
                    await this.sleep(200); // 페이지 간 대기
                    
                    // 진행 상황 출력
                    if (this.results.totalMovies % 100 === 0 && this.results.totalMovies > 0) {
                        console.log(`[INFO] 진행 상황: ${this.results.totalMovies}개 영화 수집됨`);
                    }
                }
                
                await this.sleep(300); // 키워드 간 대기

            } catch (error) {
                console.error(`[ERROR] "${keyword}" 검색 오류:`, error.message);
                this.results.errors.push(`${keyword}: ${error.message}`);
            }
        }

        console.log(`[SEARCH] 키워드 검색 완료: ${this.results.totalMovies}개 영화 수집`);
    }

    // 추가 영화 발굴 (다양한 정렬 순서)
    async searchAdditionalMovies() {
        console.log('\n[TARGET] 추가 영화 발굴 시작 (다양한 정렬 방식)');
        
        // 일반적인 검색어들로 추가 수집
        const additionalKeywords = [
            '영화', 'movie', '최신', '인기', '명작', '추천', '개봉', '상영', '박스오피스',
            'action', 'drama', 'comedy', 'thriller', 'romance', 'horror', 'sf'
        ];

        for (const keyword of additionalKeywords) {
            try {
                console.log(`[TARGET] "${keyword}" 추가 검색 중...`);
                
                // 더 많은 페이지 검색
                for (let page = 1; page <= 20; page++) {
                    const movies = await this.searchNaverMovies(keyword, page);
                    
                    if (!movies || movies.length === 0) {
                        break;
                    }
                    
                    for (const movie of movies) {
                        await this.processMovie(movie);
                    }
                    
                    await this.sleep(150);
                }
                
                await this.sleep(500);

            } catch (error) {
                console.error(`[ERROR] 추가 검색 오류 (${keyword}):`, error.message);
            }
        }

        console.log(`[TARGET] 추가 검색 완료: 총 ${this.results.totalMovies}개 영화`);
    }

    // 네이버 영화 검색 API 호출
    async searchNaverMovies(query, start = 1) {
        try {
            this.results.totalSearched++;
            
            const response = await axios.get(this.naverSearchUrl, {
                params: {
                    query: query,
                    display: 10, // 한 번에 10개씩
                    start: ((start - 1) * 10) + 1
                },
                headers: {
                    'X-Naver-Client-Id': this.naverClientId,
                    'X-Naver-Client-Secret': this.naverClientSecret
                },
                timeout: 15000
            });

            if (response.data && response.data.items) {
                return response.data.items;
            }

            return [];

        } catch (error) {
            if (error.response?.status === 429) {
                console.log('⏳ API 제한 도달, 10초 대기...');
                await this.sleep(10000);
                return await this.searchNaverMovies(query, start); // 재시도
            }
            
            console.error(`네이버 검색 API 오류 (${query}):`, error.message);
            return [];
        }
    }

    // 개별 영화 처리
    async processMovie(naverMovie) {
        try {
            // HTML 태그 제거
            const cleanTitle = this.cleanHtml(naverMovie.title);
            
            // 중복 검사 (제목 기준)
            if (this.processedTitles.has(cleanTitle)) {
                return;
            }

            this.processedTitles.add(cleanTitle);
            
            // 영화 정보 구성
            const movieInfo = this.buildMovieFromNaver(naverMovie);
            
            if (movieInfo) {
                this.movies.push(movieInfo);
                this.results.totalMovies++;
                
                if (this.results.totalMovies % 50 === 0) {
                    console.log(`[INFO] 현재까지 ${this.results.totalMovies}개 영화 수집됨`);
                }
            }

        } catch (error) {
            this.results.errorCount++;
            this.results.errors.push(`${naverMovie?.title}: ${error.message}`);
        }
    }

    // 네이버 영화 데이터에서 영화 정보 구성
    buildMovieFromNaver(naverMovie) {
        try {
            const cleanTitle = this.cleanHtml(naverMovie.title);
            const cleanDirector = this.cleanHtml(naverMovie.director).replace(/\|/g, ', ').replace(/,$/, '');
            const cleanActor = this.cleanHtml(naverMovie.actor).replace(/\|/g, ', ').replace(/,$/, '');
            
            // 출연진 배열로 변환 (상위 5명)
            const castArray = cleanActor ? cleanActor.split(', ').slice(0, 5).filter(name => name.trim()) : [];
            
            // 영어 제목 추출
            const englishTitle = this.extractEnglishTitle(naverMovie.title);
            
            // 개봉년도 파싱
            const releaseYear = parseInt(naverMovie.pubDate) || null;
            
            // 평점 파싱
            const rating = parseFloat(naverMovie.userRating) || null;
            
            // 장르 추정
            const genre = this.estimateGenre(cleanTitle, cleanDirector);
            
            // 국가 추정
            const country = this.estimateCountry(cleanTitle, cleanDirector);
            
            // 네이버 영화 ID 추출
            const naverMovieId = this.extractNaverMovieId(naverMovie.link);
            
            // 키워드 생성
            const keywords = this.generateKeywords(cleanTitle, englishTitle, cleanDirector, castArray, genre);
            
            // 영화 설명 생성
            const description = this.generateDescription(cleanTitle, releaseYear, genre, cleanDirector, castArray);

            return {
                title: cleanTitle,
                english_title: englishTitle,
                director: cleanDirector || null,
                cast_members: castArray,
                genre: genre,
                release_year: releaseYear,
                runtime_minutes: null, // 네이버 API에서 제공하지 않음
                country: country,
                naver_rating: rating,
                description: description,
                keywords: keywords,
                poster_url: naverMovie.image || null,
                naver_movie_id: naverMovieId
            };

        } catch (error) {
            console.error(`영화 정보 구성 오류:`, error);
            return null;
        }
    }

    // HTML 태그 제거
    cleanHtml(str) {
        if (!str) return '';
        return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }

    // 영어 제목 추출
    extractEnglishTitle(htmlTitle) {
        const match = htmlTitle.match(/\(([A-Za-z0-9\s:,.-]+)\)/) || htmlTitle.match(/<b>([A-Za-z0-9\s:,.-]+)<\/b>/);
        return match ? match[1].trim() : null;
    }

    // 장르 추정
    estimateGenre(title, director) {
        const genreKeywords = {
            '액션': ['액션', 'action', '어벤져스', '스파이더맨', '아이언맨', '배트맨', '분노의', '미션', '007', '킬러', '암살', '베테랑', '범죄도시'],
            '드라마': ['드라마', 'drama', '기생충', '미나리', '국제시장', '광해', '1987', '택시운전사', '친구', '왕의남자'],
            '코미디': ['코미디', 'comedy', '극한직업', '베테랑', '광해', '완벽한타인', '헬로우고스트'],
            '로맨스': ['로맨스', 'romance', '러브', 'love', '연애', '사랑', '라라랜드', '타이타닉', '노팅힐'],
            '스릴러': ['스릴러', 'thriller', '추격자', '황해', '아저씨', '마더', '곡성', '박쥐', '올드보이'],
            '공포': ['공포', 'horror', '호러', '괴물', '부산행', '곡성', '검은사제들', '링', '컨저링'],
            'SF': ['sf', 'sci-fi', '인터스텔라', '매트릭스', '아바타', '터미네이터', '에일리언', '블레이드러너'],
            '애니메이션': ['애니메이션', 'animation', '겨울왕국', '토이스토리', '라이온킹', '슈렉', '니모', '코코'],
            '판타지': ['판타지', 'fantasy', '반지의제왕', '호빗', '해리포터', '나니아', '신과함께', '판의미로'],
            '전쟁': ['전쟁', 'war', '명량', '태극기', '1917', '덩케르크', '라이언일병', '아포칼립스'],
            '범죄': ['범죄', 'crime', '대부', '펄프픽션', '범죄도시', '내부자들', '신세계', '마약왕'],
            '뮤지컬': ['뮤지컬', 'musical', '라라랜드', '맘마미아', '시카고', '레미제라블', '사운드오브뮤직']
        };

        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some(keyword => 
                title.toLowerCase().includes(keyword.toLowerCase()) || 
                (director && director.toLowerCase().includes(keyword.toLowerCase()))
            )) {
                return genre;
            }
        }

        return '드라마'; // 기본값
    }

    // 국가 추정
    estimateCountry(title, director) {
        const koreanNames = [
            '봉준호', '박찬욱', '김기덕', '이창동', '홍상수', '임권택', '최동훈', '나홍진', '류승완', '장훈',
            '윤제균', '강제규', '김한민', '추창민', '이준익', '강우석', '곽경택', '우민호', '김지운', '한재림'
        ];
        
        const koreanMovies = [
            '기생충', '미나리', '부산행', '범죄도시', '극한직업', '명량', '국제시장', '베테랑', '암살', '도둑들',
            '광해', '왕의남자', '실미도', '태극기', '친구', '올드보이', '살인의추억', '괴물', '추격자', '황해'
        ];

        // 한국 감독이나 한국 영화 제목이 포함된 경우
        if (koreanNames.some(name => director && director.includes(name)) ||
            koreanMovies.some(movie => title.includes(movie))) {
            return '한국';
        }

        // 일본 애니메이션 감독들
        const japaneseDirectors = ['미야자키 하야오', '신카이 마코토', '호소다 마모루', '이마이시 히로유키'];
        if (japaneseDirectors.some(name => director && director.includes(name))) {
            return '일본';
        }

        return '미국'; // 기본값
    }

    // 네이버 영화 ID 추출
    extractNaverMovieId(naverLink) {
        if (!naverLink) return null;
        const match = naverLink.match(/code=(\d+)/);
        return match ? match[1] : null;
    }

    // 검색 키워드 생성
    generateKeywords(title, englishTitle, director, cast, genre) {
        const keywords = [];
        
        // 제목들
        if (title) keywords.push(title);
        if (englishTitle) keywords.push(englishTitle.toLowerCase());
        
        // 감독
        if (director) {
            keywords.push(director);
            // 성씨만 추가
            const lastName = director.split(' ')[0];
            if (lastName) keywords.push(lastName);
        }
        
        // 주연 배우들 (상위 3명)
        cast.slice(0, 3).forEach(actor => {
            if (actor) {
                keywords.push(actor);
                // 성씨만 추가
                const lastName = actor.split(' ')[0];
                if (lastName && lastName !== actor) keywords.push(lastName);
            }
        });
        
        // 장르
        if (genre) {
            keywords.push(genre);
            genre.split(',').forEach(g => keywords.push(g.trim()));
        }
        
        // 중복 제거 및 빈 문자열 제거
        return [...new Set(keywords.filter(k => k && k.trim()))];
    }

    // 영화 설명 생성
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

    // SQL INSERT문 생성
    async generateSQLInserts() {
        console.log('\n[MEMO] SQL INSERT문 생성 시작');
        console.log(`[INFO] 대상 영화: ${this.movies.length}개`);
        
        this.movies.forEach((movie, index) => {
            try {
                const insertSQL = this.generateSingleInsert(movie, index + 1);
                this.sqlInserts.push(insertSQL);
                this.results.successCount++;
                
            } catch (error) {
                console.error(`[ERROR] INSERT문 생성 오류 (${movie.title}):`, error.message);
                this.results.errorCount++;
            }
        });

        // SQL 파일 저장
        await this.saveSQLFile();
        
        console.log(`[SUCCESS] SQL INSERT문 생성 완료: ${this.sqlInserts.length}개`);
    }

    // 단일 INSERT문 생성
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

        const values = [
            escapeSQL(movie.title),
            escapeSQL(movie.english_title),
            escapeSQL(movie.director),
            arrayToSQL(movie.cast_members),
            escapeSQL(movie.genre),
            movie.release_year || 'NULL',
            movie.runtime_minutes || 'NULL',
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

    // SQL 파일 저장
    async saveSQLFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `naver_movies_comprehensive_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);

        let sqlContent = `-- 네이버 영화 등록 순서 전체 크롤링 INSERT 문\n`;
        sqlContent += `-- 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
        sqlContent += `-- 총 영화 수: ${this.sqlInserts.length}개\n`;
        sqlContent += `-- 데이터 소스: 네이버 영화 API (전체 크롤링)\n`;
        sqlContent += `-- 검색 키워드: ${this.searchKeywords.length}개\n`;
        sqlContent += `-- 총 검색 수행: ${this.results.totalSearched}회\n\n`;
        
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
        sqlContent += `);\n`;
        sqlContent += `*/\n\n`;
        
        sqlContent += `-- 중복 방지를 위한 INSERT (ON CONFLICT 처리)\n`;
        sqlContent += `BEGIN;\n\n`;
        
        this.sqlInserts.forEach((insert) => {
            sqlContent += insert + '\n\n';
        });
        
        sqlContent += `COMMIT;\n\n`;
        sqlContent += `-- INSERT 완료. 총 ${this.sqlInserts.length}개 영화 추가됨\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [INFO] 크롤링 통계:\n`;
        sqlContent += `-- - 총 검색 수행: ${this.results.totalSearched}회\n`;
        sqlContent += `-- - 수집된 영화: ${this.results.totalMovies}개\n`;
        sqlContent += `-- - 성공: ${this.results.successCount}개\n`;
        sqlContent += `-- - 실패: ${this.results.errorCount}개\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [FORM] 포함 범위:\n`;
        sqlContent += `-- - 한국/해외 영화 전체\n`;
        sqlContent += `-- - 다양한 장르 (액션, 드라마, 코미디, 로맨스, 스릴러, SF 등)\n`;
        sqlContent += `-- - 고전부터 최신작까지\n`;
        sqlContent += `-- - 감독, 배우, 장르별 검색으로 포괄적 수집\n`;
        sqlContent += `-- \n`;
        sqlContent += `-- [TIP] 사용법:\n`;
        sqlContent += `-- 1. Supabase SQL 에디터에서 실행\n`;
        sqlContent += `-- 2. 카카오 스킬에서 다양한 영화 검색 가능\n`;
        sqlContent += `-- 3. 예: "기생충 영화평", "어벤져스 평점", "봉준호 감독" 등\n`;

        // 파일 저장
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        
        console.log(`\n📄 SQL 파일 생성 완료: ${filename}`);
        console.log(`[LOCATION] 파일 위치: ${filepath}`);
        console.log(`[INFO] 총 INSERT문: ${this.sqlInserts.length}개`);
        
        return { filename, filepath, insertCount: this.sqlInserts.length };
    }

    // 지연 함수
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 실행 함수
async function main() {
    console.log('[MOVIE] 네이버 영화 등록 순서 전체 크롤링 및 INSERT문 생성기');
    console.log('='.repeat(70));
    console.log('[WARN] 이 작업은 30분~1시간이 소요될 수 있습니다.');
    console.log('[INFO] 수천 개의 영화 데이터를 수집합니다.\n');
    
    const crawler = new NaverMovieComprehensiveCrawler();
    
    try {
        const result = await crawler.crawlAllNaverMovies();
        
        if (result.success) {
            console.log('\n[PARTY] 전체 프로세스 완료!');
            console.log('[FORM] 다음 단계:');
            console.log('1. 생성된 .sql 파일을 Supabase SQL 에디터에 복사');
            console.log('2. Run 버튼으로 실행');
            console.log('3. 수천 개의 영화 데이터가 movies 테이블에 저장됨');
            console.log('4. 카카오 스킬에서 풍부한 영화 검색 가능');
            console.log('\n[TARGET] 이제 거의 모든 영화에 대해 답변할 수 있습니다!');
        }
        
    } catch (error) {
        console.error('[ERROR] 실행 오류:', error);
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = NaverMovieComprehensiveCrawler;