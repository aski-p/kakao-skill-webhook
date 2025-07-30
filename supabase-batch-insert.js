// Supabase 배치 인서트 스크립트
// 30,448개 영화 + 121,792개 리뷰를 안전하게 나누어서 인서트

const fs = require('fs');
const path = require('path');

// Supabase 환경 변수 확인
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[ERROR] Supabase 환경 변수가 설정되지 않았습니다:');
    console.log('SUPABASE_URL:', SUPABASE_URL ? '설정됨' : '미설정');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '미설정');
    console.log('\n[TIP] 환경 변수 설정 방법:');
    console.log('export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
}

// Supabase 클라이언트 설정
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class SupabaseBatchInserter {
    constructor() {
        this.sqlFile = 'massive_real_movie_database_2025-07-26T02-57-36-081Z.sql';
        this.batchSize = 100; // 배치당 레코드 수
        this.maxRetries = 3;
        this.delayBetweenBatches = 500; // 배치 간 대기 시간 (ms)
        
        this.stats = {
            moviesInserted: 0,
            reviewsInserted: 0,
            totalMovies: 0,
            totalReviews: 0,
            errors: []
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async connectToSupabase() {
        console.log('[ELECTRIC] Supabase 연결 테스트...');
        
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.log('[ERROR] Supabase 연결 실패:', error.message);
                return false;
            }
            
            console.log('[SUCCESS] Supabase 연결 성공');
            console.log(`[INFO] 현재 movies 테이블 레코드 수: ${data?.length || 0}`);
            return true;
        } catch (err) {
            console.log('[ERROR] Supabase 연결 오류:', err.message);
            return false;
        }
    }

    parseSqlFile() {
        console.log('📄 SQL 파일 파싱 시작...');
        
        if (!fs.existsSync(this.sqlFile)) {
            throw new Error(`SQL 파일을 찾을 수 없습니다: ${this.sqlFile}`);
        }
        
        const sqlContent = fs.readFileSync(this.sqlFile, 'utf8');
        
        // 영화 데이터 추출
        const movieInserts = this.extractMovieInserts(sqlContent);
        const reviewInserts = this.extractReviewInserts(sqlContent);
        
        this.stats.totalMovies = movieInserts.length;
        this.stats.totalReviews = reviewInserts.length;
        
        console.log(`[INFO] 파싱 완료:`);
        console.log(`   영화: ${this.stats.totalMovies}개`);
        console.log(`   리뷰: ${this.stats.totalReviews}개`);
        
        return { movieInserts, reviewInserts };
    }

    extractMovieInserts(sqlContent) {
        console.log('[MOVIE] 영화 데이터 추출 중...');
        
        // INSERT INTO movies 문 찾기
        const movieRegex = /INSERT INTO movies \([^)]+\) VALUES\s*([^;]+);/g;
        const movies = [];
        let match;
        
        while ((match = movieRegex.exec(sqlContent)) !== null) {
            const valuesStr = match[1];
            // 배열 형태의 VALUES 파싱
            const valuesMatches = valuesStr.match(/\([^)]+\)/g);
            
            if (valuesMatches) {
                valuesMatches.forEach(valueStr => {
                    try {
                        const movie = this.parseMovieValues(valueStr);
                        if (movie) movies.push(movie);
                    } catch (err) {
                        console.log('[WARN] 영화 데이터 파싱 오류:', err.message);
                    }
                });
            }
        }
        
        return movies;
    }

    parseMovieValues(valueStr) {
        // (id, title, director, cast, genre, release_year, rating, ...) 형태 파싱
        const cleanStr = valueStr.slice(1, -1); // 괄호 제거
        const values = this.parseValues(cleanStr);
        
        if (values.length >= 8) {
            return {
                id: parseInt(values[0]),
                title: this.cleanString(values[1]),
                director: this.cleanString(values[2]),
                cast: Array.isArray(values[3]) ? values[3] : [this.cleanString(values[3])],
                genre: this.cleanString(values[4]),
                release_year: parseInt(values[5]),
                rating: parseFloat(values[6]),
                country: this.cleanString(values[7])
            };
        }
        
        return null;
    }

    extractReviewInserts(sqlContent) {
        console.log('[MEMO] 리뷰 데이터 추출 중...');
        
        const reviewRegex = /INSERT INTO critic_reviews \([^)]+\) VALUES\s*([^;]+);/g;
        const reviews = [];
        let match;
        
        while ((match = reviewRegex.exec(sqlContent)) !== null) {
            const valuesStr = match[1];
            const valuesMatches = valuesStr.match(/\([^)]+\)/g);
            
            if (valuesMatches) {
                valuesMatches.forEach(valueStr => {
                    try {
                        const review = this.parseReviewValues(valueStr);
                        if (review) reviews.push(review);
                    } catch (err) {
                        console.log('[WARN] 리뷰 데이터 파싱 오류:', err.message);
                    }
                });
            }
        }
        
        return reviews;
    }

    parseReviewValues(valueStr) {
        const cleanStr = valueStr.slice(1, -1);
        const values = this.parseValues(cleanStr);
        
        if (values.length >= 5) {
            return {
                id: parseInt(values[0]),
                movie_id: parseInt(values[1]),
                critic_name: this.cleanString(values[2]),
                review_text: this.cleanString(values[3]),
                rating: parseFloat(values[4]),
                source: this.cleanString(values[5]) || 'Unknown'
            };
        }
        
        return null;
    }

    parseValues(str) {
        // SQL VALUES를 JavaScript 배열로 파싱 (간단한 구현)
        const values = [];
        let current = '';
        let inString = false;
        let inArray = false;
        let depth = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            
            if (char === "'" && str[i-1] !== '\\') {
                inString = !inString;
                current += char;
            } else if (char === '{' && !inString) {
                inArray = true;
                depth++;
                current += char;
            } else if (char === '}' && !inString) {
                depth--;
                if (depth === 0) inArray = false;
                current += char;
            } else if (char === ',' && !inString && !inArray) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            values.push(current.trim());
        }
        
        return values;
    }

    cleanString(str) {
        if (!str) return '';
        return str.replace(/^'|'$/g, '').replace(/\\\'/g, "'");
    }

    async insertMoviesBatch(movies, startIndex = 0) {
        const batch = movies.slice(startIndex, startIndex + this.batchSize);
        if (batch.length === 0) return true;
        
        console.log(`[MOVIE] 영화 배치 인서트: ${startIndex + 1}-${startIndex + batch.length}/${movies.length}`);
        
        try {
            const { data, error } = await supabase
                .from('movies')
                .insert(batch)
                .select('id');
            
            if (error) {
                console.log(`[ERROR] 영화 배치 인서트 실패:`, error.message);
                this.stats.errors.push(`Movies ${startIndex}-${startIndex + batch.length}: ${error.message}`);
                return false;
            }
            
            this.stats.moviesInserted += batch.length;
            console.log(`[SUCCESS] 영화 ${batch.length}개 인서트 성공 (총 ${this.stats.moviesInserted}/${this.stats.totalMovies})`);
            
            await this.delay(this.delayBetweenBatches);
            return true;
            
        } catch (err) {
            console.log(`[ERROR] 영화 배치 인서트 오류:`, err.message);
            this.stats.errors.push(`Movies ${startIndex}-${startIndex + batch.length}: ${err.message}`);
            return false;
        }
    }

    async insertReviewsBatch(reviews, startIndex = 0) {
        const batch = reviews.slice(startIndex, startIndex + this.batchSize);
        if (batch.length === 0) return true;
        
        console.log(`[MEMO] 리뷰 배치 인서트: ${startIndex + 1}-${startIndex + batch.length}/${reviews.length}`);
        
        try {
            const { data, error } = await supabase
                .from('critic_reviews')
                .insert(batch)
                .select('id');
            
            if (error) {
                console.log(`[ERROR] 리뷰 배치 인서트 실패:`, error.message);
                this.stats.errors.push(`Reviews ${startIndex}-${startIndex + batch.length}: ${error.message}`);
                return false;
            }
            
            this.stats.reviewsInserted += batch.length;
            console.log(`[SUCCESS] 리뷰 ${batch.length}개 인서트 성공 (총 ${this.stats.reviewsInserted}/${this.stats.totalReviews})`);
            
            await this.delay(this.delayBetweenBatches);
            return true;
            
        } catch (err) {
            console.log(`[ERROR] 리뷰 배치 인서트 오류:`, err.message);
            this.stats.errors.push(`Reviews ${startIndex}-${startIndex + batch.length}: ${err.message}`);
            return false;
        }
    }

    async run() {
        console.log('🚀 Supabase 배치 인서트 시작...');
        console.log(`[INFO] 설정: 배치 크기 ${this.batchSize}, 대기 시간 ${this.delayBetweenBatches}ms`);
        
        // 1. Supabase 연결 확인
        const connected = await this.connectToSupabase();
        if (!connected) {
            console.log('[ERROR] Supabase 연결 실패로 인해 프로세스를 중단합니다.');
            return;
        }
        
        // 2. SQL 파일 파싱
        const { movieInserts, reviewInserts } = this.parseSqlFile();
        
        // 3. 영화 데이터 배치 인서트
        console.log('\n[MOVIE] 영화 데이터 배치 인서트 시작...');
        for (let i = 0; i < movieInserts.length; i += this.batchSize) {
            const success = await this.insertMoviesBatch(movieInserts, i);
            if (!success && this.maxRetries === 0) {
                console.log('[ERROR] 최대 재시도 횟수 초과로 영화 인서트를 중단합니다.');
                break;
            }
        }
        
        // 4. 리뷰 데이터 배치 인서트
        console.log('\n[MEMO] 리뷰 데이터 배치 인서트 시작...');
        for (let i = 0; i < reviewInserts.length; i += this.batchSize) {
            const success = await this.insertReviewsBatch(reviewInserts, i);
            if (!success && this.maxRetries === 0) {
                console.log('[ERROR] 최대 재시도 횟수 초과로 리뷰 인서트를 중단합니다.');
                break;
            }
        }
        
        // 5. 결과 리포트
        this.printReport();
    }

    printReport() {
        console.log('\n' + '='.repeat(50));
        console.log('[INFO] 배치 인서트 완료 리포트');
        console.log('='.repeat(50));
        console.log(`[MOVIE] 영화: ${this.stats.moviesInserted}/${this.stats.totalMovies} (${((this.stats.moviesInserted/this.stats.totalMovies)*100).toFixed(1)}%)`);
        console.log(`[MEMO] 리뷰: ${this.stats.reviewsInserted}/${this.stats.totalReviews} (${((this.stats.reviewsInserted/this.stats.totalReviews)*100).toFixed(1)}%)`);
        console.log(`[ERROR] 오류: ${this.stats.errors.length}개`);
        
        if (this.stats.errors.length > 0) {
            console.log('\n[ERROR] 오류 상세:');
            this.stats.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.stats.moviesInserted === this.stats.totalMovies && 
            this.stats.reviewsInserted === this.stats.totalReviews) {
            console.log('\n[PARTY] 모든 데이터가 성공적으로 인서트되었습니다!');
        } else {
            console.log('\n[WARN] 일부 데이터 인서트가 실패했습니다. 로그를 확인해주세요.');
        }
    }
}

// 실행
async function main() {
    const inserter = new SupabaseBatchInserter();
    await inserter.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SupabaseBatchInserter;