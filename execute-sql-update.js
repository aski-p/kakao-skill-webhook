// Supabase SQL 실행 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase 설정
const SUPABASE_URL = 'https://hvzrytkjbplcaotcvmxg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enJ5dGtqYnBsY2FvdGN2bXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM0NDI2NywiZXhwIjoyMDQ3OTIwMjY3fQ.aO9KwfH7kBPmNsYcqQ7qRkSdMJZE9k44IFJMrKRu_h8';

class SQLExecutor {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
    }

    async executeSQLFile(filePath) {
        try {
            console.log(`📄 SQL 파일 읽는 중: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
            }

            const sqlContent = fs.readFileSync(filePath, 'utf8');
            console.log(`📊 SQL 파일 크기: ${sqlContent.length} bytes`);
            
            // SQL을 개별 쿼리로 분할 (BEGIN/COMMIT 제거)
            const queries = this.parseSQL(sqlContent);
            console.log(`🔧 실행할 쿼리 수: ${queries.length}개`);

            let successCount = 0;
            let errorCount = 0;

            console.log('\n🚀 SQL 쿼리 실행 시작...\n');

            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];
                
                if (query.trim() === '') continue;
                
                console.log(`📝 [${i + 1}/${queries.length}] 실행 중...`);
                console.log(`   쿼리: ${query.substring(0, 50)}...`);
                
                try {
                    const { data, error } = await this.supabase.rpc('execute_sql', {
                        sql_query: query
                    });

                    if (error) {
                        // 직접 SQL 실행이 안되면 개별 업데이트로 시도
                        await this.executeIndividualQuery(query);
                    }
                    
                    console.log(`   ✅ 성공`);
                    successCount++;
                    
                } catch (error) {
                    console.log(`   ❌ 실패: ${error.message}`);
                    errorCount++;
                    
                    // 중요한 쿼리는 다시 시도
                    if (query.includes('UPDATE movies')) {
                        console.log(`   🔄 재시도 중...`);
                        try {
                            await this.executeMovieUpdate(query);
                            console.log(`   ✅ 재시도 성공`);
                            successCount++;
                            errorCount--;
                        } catch (retryError) {
                            console.log(`   ❌ 재시도 실패: ${retryError.message}`);
                        }
                    }
                }
                
                // 서버 부하 방지
                await this.delay(100);
            }

            console.log('\n' + '='.repeat(60));
            console.log('🎉 SQL 실행 완료!');
            console.log('='.repeat(60));
            console.log(`✅ 성공: ${successCount}개`);
            console.log(`❌ 실패: ${errorCount}개`);
            console.log(`📊 성공률: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);

            // 업데이트 확인
            await this.verifyUpdates();

        } catch (error) {
            console.log(`❌ SQL 파일 실행 중 오류: ${error.message}`);
        }
    }

    parseSQL(sqlContent) {
        // BEGIN/COMMIT 제거하고 개별 쿼리로 분할
        return sqlContent
            .replace(/^BEGIN;/gm, '')
            .replace(/^COMMIT;/gm, '')
            .split(';')
            .map(query => query.trim())
            .filter(query => query && !query.startsWith('--') && query.length > 10);
    }

    async executeIndividualQuery(query) {
        // UPDATE movies 쿼리 개별 처리
        if (query.includes('UPDATE movies')) {
            return await this.executeMovieUpdate(query);
        }
        
        // INSERT critic_reviews 쿼리 개별 처리
        if (query.includes('INSERT INTO critic_reviews')) {
            return await this.executeReviewInsert(query);
        }
        
        // DELETE 쿼리 개별 처리
        if (query.includes('DELETE FROM critic_reviews')) {
            return await this.executeReviewDelete(query);
        }
    }

    async executeMovieUpdate(query) {
        // UPDATE movies 쿼리에서 정보 추출
        const titleMatch = query.match(/WHERE title = '([^']+)'/);
        const directorMatch = query.match(/director = '([^']+)'/);
        const castMatch = query.match(/cast_members = ARRAY\[([^\]]+)\]/);
        const genreMatch = query.match(/genre = '([^']+)'/);
        const yearMatch = query.match(/release_year = (\d+)/);
        const ratingMatch = query.match(/naver_rating = ([\d.]+)/);
        const descMatch = query.match(/description = '([^']+)'/);

        if (!titleMatch) return;

        const updateData = { updated_at: new Date().toISOString() };

        if (directorMatch) updateData.director = directorMatch[1];
        if (castMatch) {
            const castArray = castMatch[1].split(',').map(item => item.trim().replace(/'/g, ''));
            updateData.cast_members = castArray;
        }
        if (genreMatch) updateData.genre = genreMatch[1];
        if (yearMatch) updateData.release_year = parseInt(yearMatch[1]);
        if (ratingMatch) updateData.naver_rating = parseFloat(ratingMatch[1]);
        if (descMatch) updateData.description = descMatch[1];

        const { error } = await this.supabase
            .from('movies')
            .update(updateData)
            .eq('title', titleMatch[1]);

        if (error) throw error;
    }

    async executeReviewDelete(query) {
        const titleMatch = query.match(/title = '([^']+)'/);
        if (!titleMatch) return;

        // 먼저 영화 ID 찾기
        const { data: movie } = await this.supabase
            .from('movies')
            .select('id')
            .eq('title', titleMatch[1])
            .single();

        if (movie) {
            const { error } = await this.supabase
                .from('critic_reviews')
                .delete()
                .eq('movie_id', movie.id);

            if (error) throw error;
        }
    }

    async executeReviewInsert(query) {
        // INSERT 쿼리에서 리뷰 데이터 추출
        const titleMatch = query.match(/title = '([^']+)'/);
        if (!titleMatch) return;

        // 먼저 영화 ID 찾기
        const { data: movie } = await this.supabase
            .from('movies')
            .select('id')
            .eq('title', titleMatch[1])
            .single();

        if (!movie) return;

        // VALUES 부분에서 리뷰 데이터 추출
        const valuesMatch = query.match(/VALUES\s*(.*)/s);
        if (!valuesMatch) return;

        const reviewsData = [];
        const valueLines = valuesMatch[1].split('\n').filter(line => line.trim().includes('('));

        for (const line of valueLines) {
            const reviewMatch = line.match(/\([^,]*,\s*'([^']+)',\s*'([^']+)',\s*([\d.]+)\)/);
            if (reviewMatch) {
                reviewsData.push({
                    movie_id: movie.id,
                    critic_name: reviewMatch[1],
                    review_text: reviewMatch[2],
                    score: parseFloat(reviewMatch[3])
                });
            }
        }

        if (reviewsData.length > 0) {
            const { error } = await this.supabase
                .from('critic_reviews')
                .insert(reviewsData);

            if (error) throw error;
        }
    }

    async verifyUpdates() {
        console.log('\n🔍 업데이트 결과 확인 중...\n');

        const movies = ['파묘', '기생충', '아마추어', '탑건: 매버릭', '범죄도시4', '서울의 봄', '범죄도시3', '올드보이', '부산행', '극한직업'];

        for (const title of movies) {
            const { data: movie } = await this.supabase
                .from('movies')
                .select('title, director, cast_members, naver_rating')
                .eq('title', title)
                .single();

            const { data: reviews } = await this.supabase
                .from('critic_reviews')
                .select('critic_name, score')
                .eq('movie_id', movie?.id || 0);

            if (movie) {
                console.log(`🎬 ${title}:`);
                console.log(`   감독: ${movie.director || '정보없음'}`);
                console.log(`   출연: ${movie.cast_members?.slice(0, 3).join(', ') || '정보없음'}`);
                console.log(`   평점: ${movie.naver_rating || '정보없음'}`);
                console.log(`   리뷰: ${reviews?.length || 0}개`);
                if (reviews && reviews.length > 0) {
                    console.log(`   예시: ${reviews[0].critic_name} (${reviews[0].score}점)`);
                }
                console.log('');
            }
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 실행
async function main() {
    const executor = new SQLExecutor();
    await executor.executeSQLFile('./movie_batch_update_2025-07-26T15-37-03.sql');
}

main().catch(console.error);