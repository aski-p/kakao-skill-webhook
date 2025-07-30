// KOFIC 수집 데이터를 Supabase에 업데이트하는 스크립트 (새 연결 정보)
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 새로운 Supabase 연결 정보
const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

class UpdatedDatabaseMovieUpdater {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { 
                autoRefreshToken: false, 
                persistSession: false 
            }
        });
        this.insertedCount = 0;
        this.updatedCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
    }

    // Supabase 연결 테스트
    async testConnection() {
        try {
            console.log('[TOOL] Supabase 연결 테스트 중...');
            
            const { data, error, count } = await this.supabase
                .from('movies')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.error('[ERROR] 연결 실패:', error.message);
                return false;
            }
            
            console.log('[SUCCESS] Supabase 연결 성공!');
            console.log(`[INFO] 현재 movies 테이블 레코드 수: ${count || 0}개`);
            return true;
            
        } catch (err) {
            console.error('[ERROR] 연결 테스트 오류:', err.message);
            return false;
        }
    }

    // JSON 파일에서 영화 데이터 로드
    loadMovieData(filename) {
        try {
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            console.log(`📄 ${filename} 파일 로드 완료`);
            console.log(`[INFO] 총 ${data.total_movies}개 영화 데이터 발견\n`);
            return data.movies;
        } catch (error) {
            console.error('[ERROR] JSON 파일 로드 실패:', error.message);
            return [];
        }
    }

    // 제목 유사도 계산
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const normalize = (str) => str.replace(/\s+/g, '').toLowerCase();
        const norm1 = normalize(str1);
        const norm2 = normalize(str2);
        
        if (norm1 === norm2) return 1.0;
        if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
        
        return this.levenshteinSimilarity(norm1, norm2);
    }

    // 레벤슈타인 거리 기반 유사도
    levenshteinSimilarity(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
    }

    // 기존 영화와 매칭
    async findMatchingMovie(newMovie) {
        try {
            // 정확한 제목 매칭 시도
            const { data: exactMatch, error: exactError } = await this.supabase
                .from('movies')
                .select('*')
                .eq('title', newMovie.title)
                .limit(1);

            if (exactError) {
                console.error('정확한 매칭 검색 오류:', exactError.message);
                throw exactError;
            }

            if (exactMatch && exactMatch.length > 0) {
                return { match: exactMatch[0], similarity: 1.0, type: 'exact' };
            }

            // 유사 제목 검색 (제한된 수만 조회)
            const { data: recentMovies, error: recentError } = await this.supabase
                .from('movies')
                .select('id, title, release_year')
                .not('title', 'is', null)
                .order('created_at', { ascending: false })
                .limit(500); // 최근 500개만 조회

            if (recentError) {
                console.error('유사 매칭 검색 오류:', recentError.message);
                throw recentError;
            }

            let bestMatch = null;
            let bestSimilarity = 0;

            for (const movie of recentMovies) {
                const similarity = this.calculateSimilarity(newMovie.title, movie.title);
                
                if (similarity > bestSimilarity && similarity >= 0.8) {
                    if (newMovie.release_year && movie.release_year) {
                        const yearDiff = Math.abs(newMovie.release_year - movie.release_year);
                        if (yearDiff <= 1) {
                            bestMatch = movie;
                            bestSimilarity = similarity;
                        }
                    } else {
                        bestMatch = movie;
                        bestSimilarity = similarity;
                    }
                }
            }

            if (bestMatch && bestSimilarity >= 0.8) {
                const { data: fullMovie, error: fullError } = await this.supabase
                    .from('movies')
                    .select('*')
                    .eq('id', bestMatch.id)
                    .single();

                if (fullError) throw fullError;

                return { 
                    match: fullMovie, 
                    similarity: bestSimilarity, 
                    type: 'similar' 
                };
            }

            return null;

        } catch (error) {
            console.error(`[ERROR] 매칭 검색 실패 (${newMovie.title}):`, error.message);
            return null;
        }
    }

    // 영화 데이터 업데이트
    async updateMovie(movieId, updateData) {
        try {
            const { error } = await this.supabase
                .from('movies')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', movieId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`[ERROR] 영화 업데이트 실패 (ID: ${movieId}):`, error.message);
            return false;
        }
    }

    // 새 영화 삽입
    async insertMovie(movieData) {
        try {
            const { data, error } = await this.supabase
                .from('movies')
                .insert([movieData])
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error(`[ERROR] 영화 삽입 실패 (${movieData.title}):`, error.message);
            return null;
        }
    }

    // 영화 데이터 처리
    async processMovie(movie) {
        console.log(`\n[SEARCH] 처리 중: "${movie.title}" (${movie.release_year || '연도미상'})`);

        // 기존 영화와 매칭 시도
        const matchResult = await this.findMatchingMovie(movie);

        if (matchResult) {
            const { match, similarity, type } = matchResult;
            console.log(`[TARGET] 매칭 발견: "${match.title}" (유사도: ${(similarity * 100).toFixed(1)}%, 타입: ${type})`);

            // 기존 데이터와 비교하여 업데이트할 필드 결정
            const updateData = {};
            let hasUpdates = false;

            // 감독 정보 업데이트
            if (movie.director && (!match.director || match.director !== movie.director)) {
                updateData.director = movie.director;
                hasUpdates = true;
                console.log(`  [MEMO] 감독 업데이트: ${match.director || '없음'} → ${movie.director}`);
            }

            // 배우 정보 업데이트
            if (movie.cast_members && movie.cast_members.length > 0) {
                const existingCast = match.cast_members || [];
                const newCast = [...new Set([...existingCast, ...movie.cast_members])];
                if (newCast.length > existingCast.length) {
                    updateData.cast_members = newCast;
                    hasUpdates = true;
                    console.log(`  [BUSTSINSILHOUETTE] 배우 정보 업데이트: ${newCast.length}명`);
                }
            }

            // 런타임 정보 업데이트
            if (movie.runtime_minutes && !match.runtime_minutes) {
                updateData.runtime_minutes = movie.runtime_minutes;
                hasUpdates = true;
                console.log(`  ⏱️ 런타임 추가: ${movie.runtime_minutes}분`);
            }

            // 키워드 정보 업데이트
            if (movie.keywords && movie.keywords.length > 0) {
                const existingKeywords = match.keywords || [];
                const newKeywords = [...new Set([...existingKeywords, ...movie.keywords])];
                if (newKeywords.length > existingKeywords.length) {
                    updateData.keywords = newKeywords;
                    hasUpdates = true;
                    console.log(`  [LABEL] 키워드 업데이트: ${newKeywords.length}개`);
                }
            }

            if (hasUpdates) {
                const success = await this.updateMovie(match.id, updateData);
                if (success) {
                    console.log(`[SUCCESS] 업데이트 완료: "${match.title}"`);
                    this.updatedCount++;
                } else {
                    this.errorCount++;
                }
            } else {
                console.log(`⏭️ 업데이트 불필요: "${match.title}"`);
                this.skippedCount++;
            }

        } else {
            // 새 영화 삽입
            console.log(`[INBOX] 신규 영화 추가 시도...`);
            
            const movieId = await this.insertMovie(movie);
            if (movieId) {
                console.log(`[SUCCESS] 신규 추가 완료: "${movie.title}" (ID: ${movieId})`);
                this.insertedCount++;
            } else {
                this.errorCount++;
            }
        }
    }

    // 딜레이 함수
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 메인 실행 함수
    async run(jsonFilename = 'korean_movies_kofic_2025-07-28.json') {
        console.log('🗄️ Supabase 영화 데이터베이스 업데이트 시작 (새 연결 정보)\n');
        console.log(`[LINK] Supabase URL: ${SUPABASE_URL}`);
        console.log(`[KEY] Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 50)}...\n`);
        
        const startTime = Date.now();

        try {
            // 연결 테스트
            const connected = await this.testConnection();
            if (!connected) {
                console.log('[ERROR] Supabase 연결 실패. 종료합니다.');
                return;
            }

            // JSON 파일에서 영화 데이터 로드
            const movies = this.loadMovieData(jsonFilename);
            if (movies.length === 0) {
                console.log('[ERROR] 처리할 영화 데이터가 없습니다.');
                return;
            }

            // 각 영화 처리
            for (let i = 0; i < movies.length; i++) {
                const movie = movies[i];
                console.log(`\n[${i + 1}/${movies.length}] 진행률: ${((i + 1) / movies.length * 100).toFixed(1)}%`);
                
                await this.processMovie(movie);
                
                // API 호출 제한을 위한 딜레이
                await this.delay(300);
            }

            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('\n' + '='.repeat(60));
            console.log('[INFO] 데이터베이스 업데이트 결과');
            console.log('='.repeat(60));
            console.log(`[INBOX] 신규 추가: ${this.insertedCount}개`);
            console.log(`[LOADING] 업데이트: ${this.updatedCount}개`);
            console.log(`⏭️ 변경사항 없음: ${this.skippedCount}개`);
            console.log(`[ERROR] 오류: ${this.errorCount}개`);
            console.log(`⏱️ 총 소요 시간: ${elapsedTime}초`);
            console.log('='.repeat(60));

            if (this.insertedCount + this.updatedCount > 0) {
                console.log('\n[PARTY] 데이터베이스 업데이트 완료!');
                console.log('[LINK] 카카오 스킬에서 업데이트된 영화 정보를 확인할 수 있습니다.');
            } else {
                console.log('\n[TIP] 업데이트할 새로운 정보가 없었습니다.');
            }

        } catch (error) {
            console.error('\n[ERROR] 치명적 오류 발생:', error.message);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const updater = new UpdatedDatabaseMovieUpdater();
    updater.run();
}

module.exports = UpdatedDatabaseMovieUpdater;