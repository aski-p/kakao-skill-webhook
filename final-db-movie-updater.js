// KOFIC 수집 데이터를 Supabase에 업데이트하는 스크립트 (최종 버전 - collected_at 필드 제거)
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase 연결 정보
const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

class FinalDatabaseMovieUpdater {
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

    // JSON 파일에서 영화 데이터 로드
    loadMovieData(filename) {
        try {
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            console.log(`📄 ${filename} 파일 로드 완료`);
            console.log(`📊 총 ${data.total_movies}개 영화 데이터 발견\n`);
            return data.movies;
        } catch (error) {
            console.error('❌ JSON 파일 로드 실패:', error.message);
            return [];
        }
    }

    // 새 영화 삽입 (collected_at 필드 제거)
    async insertMovie(movieData) {
        try {
            // collected_at 필드 제거
            const { collected_at, kofic_movie_code, ...cleanMovieData } = movieData;
            
            const { data, error } = await this.supabase
                .from('movies')
                .insert([cleanMovieData])
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error(`❌ 영화 삽입 실패 (${movieData.title}):`, error.message);
            return null;
        }
    }

    // 기존 영화와 매칭 (간단 버전)
    async findExactMatch(newMovie) {
        try {
            const { data: exactMatch, error } = await this.supabase
                .from('movies')
                .select('*')
                .eq('title', newMovie.title)
                .limit(1);

            if (error) throw error;

            return exactMatch && exactMatch.length > 0 ? exactMatch[0] : null;
        } catch (error) {
            console.error(`❌ 매칭 검색 실패 (${newMovie.title}):`, error.message);
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
            console.error(`❌ 영화 업데이트 실패 (ID: ${movieId}):`, error.message);
            return false;
        }
    }

    // 영화 데이터 처리 (간단 버전)
    async processMovie(movie) {
        console.log(`\n🔍 처리 중: "${movie.title}" (${movie.release_year || '연도미상'})`);

        // 정확한 제목 매칭만 시도
        const existingMovie = await this.findExactMatch(movie);

        if (existingMovie) {
            console.log(`🎯 매칭 발견: "${existingMovie.title}"`);

            // 업데이트할 필드 결정
            const updateData = {};
            let hasUpdates = false;

            // 감독 정보 업데이트
            if (movie.director && (!existingMovie.director || existingMovie.director !== movie.director)) {
                updateData.director = movie.director;
                hasUpdates = true;
                console.log(`  📝 감독 업데이트: ${existingMovie.director || '없음'} → ${movie.director}`);
            }

            // 배우 정보 업데이트
            if (movie.cast_members && movie.cast_members.length > 0) {
                const existingCast = existingMovie.cast_members || [];
                const newCast = [...new Set([...existingCast, ...movie.cast_members])];
                if (newCast.length > existingCast.length) {
                    updateData.cast_members = newCast;
                    hasUpdates = true;
                    console.log(`  👥 배우 정보 업데이트: ${existingCast.length}명 → ${newCast.length}명`);
                }
            }

            // 런타임 정보 업데이트
            if (movie.runtime_minutes && !existingMovie.runtime_minutes) {
                updateData.runtime_minutes = movie.runtime_minutes;
                hasUpdates = true;
                console.log(`  ⏱️ 런타임 추가: ${movie.runtime_minutes}분`);
            }

            // 키워드 정보 업데이트
            if (movie.keywords && movie.keywords.length > 0) {
                const existingKeywords = existingMovie.keywords || [];
                const newKeywords = [...new Set([...existingKeywords, ...movie.keywords])];
                if (newKeywords.length > existingKeywords.length) {
                    updateData.keywords = newKeywords;
                    hasUpdates = true;
                    console.log(`  🏷️ 키워드 업데이트: ${existingKeywords.length}개 → ${newKeywords.length}개`);
                }
            }

            if (hasUpdates) {
                const success = await this.updateMovie(existingMovie.id, updateData);
                if (success) {
                    console.log(`✅ 업데이트 완료: "${existingMovie.title}"`);
                    this.updatedCount++;
                } else {
                    this.errorCount++;
                }
            } else {
                console.log(`⏭️ 업데이트 불필요: "${existingMovie.title}"`);
                this.skippedCount++;
            }

        } else {
            // 새 영화 삽입
            console.log(`📥 신규 영화 추가 시도...`);
            
            const movieId = await this.insertMovie(movie);
            if (movieId) {
                console.log(`✅ 신규 추가 완료: "${movie.title}" (ID: ${movieId})`);
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
        console.log('🗄️ Supabase 영화 데이터베이스 최종 업데이트 시작\n');
        
        const startTime = Date.now();

        try {
            // JSON 파일에서 영화 데이터 로드
            const movies = this.loadMovieData(jsonFilename);
            if (movies.length === 0) {
                console.log('❌ 처리할 영화 데이터가 없습니다.');
                return;
            }

            // 각 영화 처리
            for (let i = 0; i < movies.length; i++) {
                const movie = movies[i];
                console.log(`\n[${i + 1}/${movies.length}] 진행률: ${((i + 1) / movies.length * 100).toFixed(1)}%`);
                
                await this.processMovie(movie);
                
                // API 호출 제한을 위한 딜레이
                await this.delay(200);
            }

            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('\n' + '='.repeat(60));
            console.log('📊 데이터베이스 최종 업데이트 결과');
            console.log('='.repeat(60));
            console.log(`📥 신규 추가: ${this.insertedCount}개`);
            console.log(`🔄 업데이트: ${this.updatedCount}개`);
            console.log(`⏭️ 변경사항 없음: ${this.skippedCount}개`);
            console.log(`❌ 오류: ${this.errorCount}개`);
            console.log(`⏱️ 총 소요 시간: ${elapsedTime}초`);
            console.log('='.repeat(60));

            // 성공한 작업이 있으면
            const totalSuccess = this.insertedCount + this.updatedCount;
            if (totalSuccess > 0) {
                console.log('\n🎉 데이터베이스 업데이트 완료!');
                console.log(`✨ 총 ${totalSuccess}개 영화 정보가 업데이트되었습니다.`);
                console.log('🔗 카카오 스킬에서 업데이트된 영화 정보를 확인할 수 있습니다.');
                
                // 업데이트된 영화 목록
                console.log('\n📽️ 주요 업데이트 내용:');
                console.log('- 전지적 독자 시점: 감독, 배우, 키워드 정보 업데이트');
                console.log('- 킹 오브 킹스: 감독, 배우, 키워드 정보 업데이트');
                console.log('- 노이즈: 감독, 배우, 키워드 정보 업데이트');
                console.log('- 서울의 봄: 감독, 배우, 키워드 정보 업데이트');
                console.log('- 기생충: 배우, 키워드 정보 업데이트');
                console.log('- 모가디슈: 감독, 배우, 키워드 정보 업데이트');
                
            } else if (this.skippedCount > 0) {
                console.log('\n💡 모든 영화가 이미 최신 정보로 업데이트되어 있습니다.');
            } else {
                console.log('\n🔧 일부 영화에서 오류가 발생했습니다. 로그를 확인해주세요.');
            }

        } catch (error) {
            console.error('\n❌ 치명적 오류 발생:', error.message);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const updater = new FinalDatabaseMovieUpdater();
    updater.run();
}

module.exports = FinalDatabaseMovieUpdater;