// 직접 Supabase API를 사용한 배치 인서트
// SQL 파일을 파싱해서 JavaScript 객체로 변환 후 인서트

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

class DirectSupabaseInserter {
    constructor() {
        this.sqlFile = 'massive_real_movie_database_2025-07-26T02-57-36-081Z.sql';
        this.batchSize = 100; // 한 번에 인서트할 레코드 수
        this.stats = {
            moviesInserted: 0,
            reviewsInserted: 0,
            errors: []
        };
    }

    async testConnection() {
        console.log('🔌 Supabase 연결 테스트...');
        
        try {
            const { count, error } = await supabase
                .from('movies')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log('❌ 연결 실패:', error.message);
                return false;
            }
            
            console.log('✅ Supabase 연결 성공!');
            console.log('📊 현재 movies 테이블 레코드 수:', count);
            return true;
        } catch (err) {
            console.log('❌ 연결 오류:', err.message);
            return false;
        }
    }

    parseMovieInsertLine(line) {
        // INSERT INTO movies (...) VALUES (...) 파싱
        const valuesMatch = line.match(/VALUES\s*\(([^)]+)\)/);
        if (!valuesMatch) return null;

        const values = this.parseValues(valuesMatch[1]);
        
        return {
            title: this.cleanString(values[0]),
            english_title: this.cleanString(values[1]),
            director: this.cleanString(values[2]),
            cast_members: this.parseArray(values[3]),
            genre: this.cleanString(values[4]),
            release_year: parseInt(values[5]),
            runtime_minutes: parseInt(values[6]),
            country: this.cleanString(values[7]),
            naver_rating: parseFloat(values[8]),
            description: this.cleanString(values[9]),
            keywords: this.parseArray(values[10]),
            poster_url: values[11] === 'NULL' ? null : this.cleanString(values[11]),
            naver_movie_id: values[12] === 'NULL' ? null : parseInt(values[12])
        };
    }

    parseReviewInsertLine(line) {
        // INSERT INTO critic_reviews (...) VALUES (...) 파싱
        const valuesMatch = line.match(/VALUES\s*\(([^)]+)\)/);
        if (!valuesMatch) return null;

        const values = this.parseValues(valuesMatch[1]);
        
        return {
            movie_id: parseInt(values[1]),
            critic_name: this.cleanString(values[2]),
            review_text: this.cleanString(values[3]),
            rating: parseFloat(values[4]),
            source: this.cleanString(values[5]) || 'Unknown'
        };
    }

    parseValues(str) {
        // 간단한 SQL VALUES 파싱
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
        if (!str || str === 'NULL') return null;
        return str.replace(/^'|'$/g, '').replace(/\\\'/g, "'");
    }

    parseArray(str) {
        if (!str || str === 'NULL') return [];
        try {
            // PostgreSQL 배열 형식 {item1,item2} → JSON 배열
            const cleaned = str.replace(/^'?\{/, '[').replace(/\}'?$/, ']').replace(/"/g, '\\"');
            return JSON.parse(cleaned.replace(/([^",\[\]]+)/g, '"$1"'));
        } catch {
            return [str.replace(/^'|'$/g, '')];
        }
    }

    async insertMoviesBatch(movies) {
        if (movies.length === 0) return true;
        
        console.log(`🎬 영화 ${movies.length}개 인서트 중...`);
        
        try {
            const { data, error } = await supabase
                .from('movies')
                .insert(movies)
                .select('id');
            
            if (error) {
                console.log('❌ 영화 인서트 실패:', error.message);
                this.stats.errors.push(`Movies batch: ${error.message}`);
                return false;
            }
            
            this.stats.moviesInserted += movies.length;
            console.log(`✅ 영화 ${movies.length}개 인서트 성공 (총 ${this.stats.moviesInserted}개)`);
            return true;
            
        } catch (err) {
            console.log('❌ 영화 인서트 오류:', err.message);
            this.stats.errors.push(`Movies batch error: ${err.message}`);
            return false;
        }
    }

    async insertReviewsBatch(reviews) {
        if (reviews.length === 0) return true;
        
        console.log(`📝 리뷰 ${reviews.length}개 인서트 중...`);
        
        try {
            const { data, error } = await supabase
                .from('critic_reviews')
                .insert(reviews)
                .select('id');
            
            if (error) {
                console.log('❌ 리뷰 인서트 실패:', error.message);
                this.stats.errors.push(`Reviews batch: ${error.message}`);
                return false;
            }
            
            this.stats.reviewsInserted += reviews.length;
            console.log(`✅ 리뷰 ${reviews.length}개 인서트 성공 (총 ${this.stats.reviewsInserted}개)`);
            return true;
            
        } catch (err) {
            console.log('❌ 리뷰 인서트 오류:', err.message);
            this.stats.errors.push(`Reviews batch error: ${err.message}`);
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async processSQL() {
        console.log('📄 SQL 파일 처리 중...');
        
        if (!fs.existsSync(this.sqlFile)) {
            throw new Error(`SQL 파일을 찾을 수 없습니다: ${this.sqlFile}`);
        }
        
        const sqlContent = fs.readFileSync(this.sqlFile, 'utf8');
        const lines = sqlContent.split('\n');
        
        let movieBatch = [];
        let reviewBatch = [];
        
        console.log('🔄 SQL 파싱 및 배치 인서트 시작...');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            try {
                if (line.startsWith('INSERT INTO movies')) {
                    const movie = this.parseMovieInsertLine(line);
                    if (movie) {
                        movieBatch.push(movie);
                        
                        if (movieBatch.length >= this.batchSize) {
                            await this.insertMoviesBatch(movieBatch);
                            movieBatch = [];
                            await this.delay(500); // 0.5초 대기
                        }
                    }
                } else if (line.startsWith('INSERT INTO critic_reviews')) {
                    const review = this.parseReviewInsertLine(line);
                    if (review) {
                        reviewBatch.push(review);
                        
                        if (reviewBatch.length >= this.batchSize) {
                            await this.insertReviewsBatch(reviewBatch);
                            reviewBatch = [];
                            await this.delay(500); // 0.5초 대기
                        }
                    }
                }
                
                // 진행 상황 출력
                if (i % 10000 === 0 && i > 0) {
                    console.log(`📊 진행 상황: ${i.toLocaleString()}/${lines.length.toLocaleString()} 줄 처리됨`);
                }
                
            } catch (err) {
                console.log(`⚠️ 줄 ${i} 파싱 오류:`, err.message);
            }
        }
        
        // 남은 배치 처리
        if (movieBatch.length > 0) {
            await this.insertMoviesBatch(movieBatch);
        }
        
        if (reviewBatch.length > 0) {
            await this.insertReviewsBatch(reviewBatch);
        }
    }

    async run() {
        console.log('🚀 직접 Supabase API 배치 인서트 시작...');
        
        // 연결 테스트
        const connected = await this.testConnection();
        if (!connected) {
            console.log('❌ Supabase 연결 실패');
            return;
        }
        
        const startTime = Date.now();
        
        try {
            await this.processSQL();
        } catch (err) {
            console.log('❌ 처리 중 오류:', err.message);
        }
        
        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(1);
        
        // 결과 리포트
        console.log('\n' + '='.repeat(50));
        console.log('📊 배치 인서트 완료 리포트');
        console.log('='.repeat(50));
        console.log(`⏱️ 총 실행 시간: ${totalTime}분`);
        console.log(`🎬 영화 인서트: ${this.stats.moviesInserted}개`);
        console.log(`📝 리뷰 인서트: ${this.stats.reviewsInserted}개`);
        console.log(`❌ 오류: ${this.stats.errors.length}개`);
        
        if (this.stats.errors.length > 0) {
            console.log('\n❌ 오류 목록:');
            this.stats.errors.slice(0, 5).forEach(error => console.log(`   ${error}`));
        }
        
        console.log('\n🎉 배치 인서트 완료!');
    }
}

// 실행
const inserter = new DirectSupabaseInserter();
inserter.run().catch(console.error);