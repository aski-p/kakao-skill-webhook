// 네이버 크롤링으로 영화 데이터 수집 후 SQL INSERT문 생성
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class MovieInsertGenerator {
    constructor() {
        this.clientId = process.env.NAVER_CLIENT_ID;
        this.clientSecret = process.env.NAVER_CLIENT_SECRET;
        
        // 인기 영화 리스트 - 한국/해외 영화 포함
        this.movieList = [
            // 한국 영화
            '기생충', '미나리', '버닝', '아가씨', '곡성', '부산행', '범죄도시', '극한직업',
            '명량', '국제시장', '베테랑', '암살', '도둑들', '광해', '왕의 남자', '실미도',
            '태극기 휘날리며', '친구', '올드보이', '살인의 추억', '괴물', '추격자', '황해',
            '아저씨', '마더', '박쥐', '내부자들', '밀정', '관상', '신과함께', '택시운전사',
            '1987', '공작', '마약왕', '극장판 귀멸의 칼날', '모가디슈', '승리호', '사냥의 시간',
            
            // 해외 영화  
            '어벤져스', '아이언맨', '스파이더맨', '배트맨', '조커', '인터스텔라', '인셉션',
            '타이타닉', '아바타', '스타워즈', '해리포터', '반지의 제왕', '다크 나이트',
            '겨울왕국', '토이 스토리', '라이온 킹', '미녀와 야수', '알라딘', '모아나',
            '탑건 매버릭', '미션 임파서블', '분노의 질주', '트랜스포머', '쥬라기 공원',
            '라라랜드', '조조 래빗', '원스 어폰 어 타임 인 할리우드', '1917', '포드 v 페라리',
            '블랙팬서', '캡틴 마블', '토르', '닥터 스트레인지', '가디언즈 오브 갤럭시',
            '데드풀', '울버린', 'X-멘', '판타스틱 비스트', '원더우먼', '아쿠아맨',
            '샤잠', '플래시', '슈퍼맨', '매트릭스', '터미네이터', '에일리언', '프레데터'
        ];
        
        this.sqlInserts = [];
        this.results = {
            totalProcessed: 0,
            successCount: 0,
            errorCount: 0,
            errors: []
        };
    }

    async generateMovieInserts() {
        console.log('🎬 네이버 API로 영화 데이터 수집 및 INSERT문 생성 시작\n');
        console.log(`📊 대상 영화: ${this.movieList.length}개`);
        
        if (!this.clientId || !this.clientSecret) {
            console.log('❌ 네이버 API 키가 없어서 샘플 데이터로 진행합니다.');
            return this.generateSampleInserts();
        }

        const startTime = Date.now();

        for (const movieTitle of this.movieList) {
            try {
                console.log(`🔍 "${movieTitle}" 검색 중...`);
                
                const movieData = await this.searchNaverMovie(movieTitle);
                
                if (movieData) {
                    const insertSQL = this.generateInsertSQL(movieData);
                    this.sqlInserts.push(insertSQL);
                    
                    console.log(`✅ "${movieData.title}" SQL 생성 완료`);
                    this.results.successCount++;
                } else {
                    console.log(`⚠️ "${movieTitle}" 검색 결과 없음`);
                    this.results.errorCount++;
                    this.results.errors.push(`${movieTitle}: 검색 결과 없음`);
                }
                
                this.results.totalProcessed++;
                
                // API 제한 준수 (초당 10회)
                await new Promise(resolve => setTimeout(resolve, 120));
                
            } catch (error) {
                console.error(`❌ "${movieTitle}" 처리 오류:`, error.message);
                this.results.errorCount++;
                this.results.errors.push(`${movieTitle}: ${error.message}`);
                this.results.totalProcessed++;
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log('\n🎉 영화 데이터 수집 완료!');
        console.log(`📊 총 처리: ${this.results.totalProcessed}개`);
        console.log(`✅ 성공: ${this.results.successCount}개`);
        console.log(`❌ 실패: ${this.results.errorCount}개`);
        console.log(`⏱️ 소요시간: ${duration}초`);

        // SQL 파일 생성
        await this.generateSQLFile();
        
        return {
            success: true,
            totalInserts: this.sqlInserts.length,
            results: this.results
        };
    }

    async searchNaverMovie(title) {
        try {
            const response = await axios.get('https://openapi.naver.com/v1/search/movie.json', {
                params: {
                    query: title,
                    display: 1,
                    start: 1
                },
                headers: {
                    'X-Naver-Client-Id': this.clientId,
                    'X-Naver-Client-Secret': this.clientSecret
                },
                timeout: 10000
            });

            if (response.data.items && response.data.items.length > 0) {
                return this.processMovieData(response.data.items[0]);
            }

            return null;

        } catch (error) {
            console.error(`네이버 검색 오류 (${title}):`, error.message);
            return null;
        }
    }

    processMovieData(item) {
        // HTML 태그 제거 및 데이터 정리
        const cleanTitle = item.title.replace(/<\/?[^>]+(>|$)/g, '').trim();
        const cleanDirector = item.director ? item.director.replace(/\|/g, ', ').replace(/,$/, '').trim() : '';
        const cleanActor = item.actor ? item.actor.replace(/\|/g, ', ').replace(/,$/, '').trim() : '';
        
        // 장르 추정 (제목이나 설명 기반)
        let genre = this.estimateGenre(cleanTitle, cleanDirector);

        return {
            title: cleanTitle,
            title_english: this.extractEnglishTitle(item.title),
            director: cleanDirector || null,
            cast: cleanActor || null,
            genre: genre,
            release_year: item.pubDate ? parseInt(item.pubDate) : null,
            release_date: null,
            running_time: null,
            rating: null,
            country: this.estimateCountry(cleanTitle, cleanDirector),
            production_company: null,
            plot_summary: this.generatePlotSummary(cleanTitle, cleanDirector, cleanActor),
            poster_image: item.image || null,
            naver_rating: item.userRating ? parseFloat(item.userRating) : null,
            critic_score: null,
            audience_score: item.userRating ? parseFloat(item.userRating) : null,
            data_source: 'naver_api',
            naver_link: item.link || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    estimateGenre(title, director) {
        const actionKeywords = ['어벤져스', '아이언맨', '배트맨', '스파이더맨', '미션', '분노', '트랜스포머'];
        const dramaKeywords = ['기생충', '미나리', '라라랜드', '타이타닉', '친구'];
        const comedyKeywords = ['극한직업', '베테랑', '광해'];
        const thrillerKeywords = ['곡성', '추격자', '황해', '조커', '다크 나이트'];
        const animationKeywords = ['겨울왕국', '토이 스토리', '라이온 킹'];
        const horrorKeywords = ['부산행', '곡성'];
        const romanceKeywords = ['라라랜드', '타이타닉'];

        if (actionKeywords.some(keyword => title.includes(keyword))) return '액션';
        if (thrillerKeywords.some(keyword => title.includes(keyword))) return '스릴러';
        if (comedyKeywords.some(keyword => title.includes(keyword))) return '코미디';
        if (animationKeywords.some(keyword => title.includes(keyword))) return '애니메이션';
        if (horrorKeywords.some(keyword => title.includes(keyword))) return '공포';
        if (romanceKeywords.some(keyword => title.includes(keyword))) return '로맨스';
        if (dramaKeywords.some(keyword => title.includes(keyword))) return '드라마';
        
        return '드라마'; // 기본값
    }

    estimateCountry(title, director) {
        const koreanNames = ['봉준호', '박찬욱', '김기덕', '이창동', '홍상수', '임권택'];
        const koreanMovies = ['기생충', '미나리', '버닝', '부산행', '범죄도시', '극한직업', '명량'];
        
        if (koreanMovies.some(movie => title.includes(movie)) || 
            koreanNames.some(name => director && director.includes(name))) {
            return '한국';
        }
        
        return '미국'; // 기본값
    }

    extractEnglishTitle(htmlTitle) {
        // HTML에서 영어 제목 추출 시도
        const match = htmlTitle.match(/\(([A-Za-z0-9\s:]+)\)/);
        return match ? match[1] : null;
    }

    generatePlotSummary(title, director, cast) {
        let summary = `${title}`;
        
        if (director) {
            summary += ` - 감독: ${director}`;
        }
        
        if (cast) {
            const mainCast = cast.split(', ').slice(0, 3).join(', ');
            summary += `, 출연: ${mainCast}`;
        }
        
        return summary;
    }

    generateInsertSQL(movieData) {
        // SQL 안전한 문자열 이스케이프
        const escapeSQL = (str) => {
            if (str === null || str === undefined) return 'NULL';
            return `'${str.toString().replace(/'/g, "''")}'`;
        };

        const values = [
            escapeSQL(movieData.title),
            escapeSQL(movieData.title_english),
            escapeSQL(movieData.director),
            escapeSQL(movieData.cast),
            escapeSQL(movieData.genre),
            movieData.release_year || 'NULL',
            escapeSQL(movieData.release_date),
            movieData.running_time || 'NULL',
            escapeSQL(movieData.rating),
            escapeSQL(movieData.country),
            escapeSQL(movieData.production_company),
            escapeSQL(movieData.plot_summary),
            escapeSQL(movieData.poster_image),
            movieData.naver_rating || 'NULL',
            movieData.critic_score || 'NULL',
            movieData.audience_score || 'NULL',
            escapeSQL(movieData.data_source),
            escapeSQL(movieData.naver_link),
            escapeSQL(movieData.created_at),
            escapeSQL(movieData.updated_at)
        ];

        return `INSERT INTO movies (title, title_english, director, cast, genre, release_year, release_date, running_time, rating, country, production_company, plot_summary, poster_image, naver_rating, critic_score, audience_score, data_source, naver_link, created_at, updated_at) VALUES (${values.join(', ')});`;
    }

    async generateSQLFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `movie_inserts_${timestamp}.sql`;
        const filepath = path.join(__dirname, filename);

        let sqlContent = `-- 영화 데이터베이스 INSERT 문\n`;
        sqlContent += `-- 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
        sqlContent += `-- 총 영화 수: ${this.sqlInserts.length}개\n`;
        sqlContent += `-- 데이터 소스: 네이버 영화 API\n\n`;
        
        sqlContent += `-- movies 테이블이 없는 경우 생성\n`;
        sqlContent += this.getCreateTableSQL() + '\n\n';
        
        sqlContent += `-- 영화 데이터 INSERT\n`;
        sqlContent += `BEGIN;\n\n`;
        
        this.sqlInserts.forEach((insert, index) => {
            sqlContent += `-- ${index + 1}. 영화 데이터\n`;
            sqlContent += insert + '\n\n';
        });
        
        sqlContent += `COMMIT;\n\n`;
        sqlContent += `-- INSERT 완료. 총 ${this.sqlInserts.length}개 영화 추가됨\n`;

        // 파일 저장
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        
        console.log(`\n📄 SQL 파일 생성 완료: ${filename}`);
        console.log(`📍 파일 위치: ${filepath}`);
        console.log(`📊 총 INSERT문: ${this.sqlInserts.length}개`);
        
        // 간단한 텍스트 파일도 생성
        const txtFilename = `movie_inserts_${timestamp}.txt`;
        const txtFilepath = path.join(__dirname, txtFilename);
        fs.writeFileSync(txtFilepath, sqlContent, 'utf8');
        
        console.log(`📄 TXT 파일도 생성: ${txtFilename}`);
        
        return { sqlFile: filename, txtFile: txtFilename, insertCount: this.sqlInserts.length };
    }

    getCreateTableSQL() {
        return `CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_english VARCHAR(255),
    director VARCHAR(255),
    cast TEXT,
    genre VARCHAR(100),
    release_year INTEGER,
    release_date DATE,
    running_time INTEGER,
    rating VARCHAR(20),
    country VARCHAR(100),
    production_company VARCHAR(255),
    plot_summary TEXT,
    poster_image TEXT,
    naver_rating DECIMAL(3,1),
    critic_score DECIMAL(3,1),
    audience_score DECIMAL(3,1),
    data_source VARCHAR(50) DEFAULT 'naver_api',
    naver_link TEXT,
    kofic_movie_code VARCHAR(20),
    box_office_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;
    }

    // API 키가 없을 때 샘플 데이터 생성
    generateSampleInserts() {
        console.log('📝 샘플 영화 데이터로 INSERT문 생성');
        
        const sampleMovies = [
            {
                title: '기생충',
                title_english: 'Parasite',
                director: '봉준호',
                cast: '송강호, 이선균, 조여정, 최우식, 박소담',
                genre: '드라마',
                release_year: 2019,
                country: '한국',
                plot_summary: '기생충 - 감독: 봉준호, 출연: 송강호, 이선균, 조여정',
                naver_rating: 8.5,
                audience_score: 8.5,
                data_source: 'sample_data'
            },
            {
                title: '어벤져스: 엔드게임',
                title_english: 'Avengers: Endgame',
                director: '안소니 루소, 조 루소',
                cast: '로버트 다우니 주니어, 크리스 에반스, 마크 러팔로',
                genre: '액션',
                release_year: 2019,
                country: '미국',
                plot_summary: '어벤져스: 엔드게임 - 감독: 안소니 루소, 조 루소, 출연: 로버트 다우니 주니어, 크리스 에반스, 마크 러팔로',
                naver_rating: 9.0,
                audience_score: 9.0,
                data_source: 'sample_data'
            },
            {
                title: '탑건: 매버릭',
                title_english: 'Top Gun: Maverick',
                director: '조셉 코신스키',
                cast: '톰 크루즈, 마일즈 텔러, 제니퍼 코넬리',
                genre: '액션',
                release_year: 2022,
                country: '미국',
                plot_summary: '탑건: 매버릭 - 감독: 조셉 코신스키, 출연: 톰 크루즈, 마일즈 텔러, 제니퍼 코넬리',
                naver_rating: 8.7,
                audience_score: 8.7,
                data_source: 'sample_data'
            }
        ];

        sampleMovies.forEach(movie => {
            const insertSQL = this.generateInsertSQL({
                ...movie,
                title_english: movie.title_english,
                release_date: null,
                running_time: null,
                rating: null,
                production_company: null,
                poster_image: null,
                critic_score: null,
                naver_link: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            
            this.sqlInserts.push(insertSQL);
        });

        this.results.successCount = sampleMovies.length;
        this.results.totalProcessed = sampleMovies.length;

        return this.generateSQLFile();
    }
}

// 실행 함수
async function main() {
    console.log('🎬 영화 데이터 수집 및 SQL INSERT문 생성기');
    console.log('='.repeat(50));
    
    const generator = new MovieInsertGenerator();
    
    try {
        const result = await generator.generateMovieInserts();
        
        if (result.success) {
            console.log('\n🎉 SQL 파일 생성 완료!');
            console.log('📋 사용 방법:');
            console.log('1. 생성된 .sql 파일을 Supabase SQL 에디터에 복사');
            console.log('2. 또는 Railway에서 직접 실행');
            console.log('3. 또는 PostgreSQL 클라이언트에서 실행');
        }
        
    } catch (error) {
        console.error('❌ 실행 오류:', error);
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = MovieInsertGenerator;