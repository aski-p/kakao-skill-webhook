// 영화 데이터 비교 및 수정 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase 설정
const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class MovieDataCorrector {
    constructor() {
        this.corrections = [];
        this.newMatches = [];
        this.noMatches = [];
    }

    // 제목 유사도 계산 (문자열 유사도)
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        
        // 완전 일치
        if (s1 === s2) return 1;
        
        // 부분 포함 검사
        if (s1.includes(s2) || s2.includes(s1)) return 0.8;
        
        // 레벤슈타인 거리 기반 유사도
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
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
        
        return matrix[str2.length][str1.length];
    }

    // 캐스트 배열을 문자열로 변환
    formatCastMembers(castData) {
        if (!castData) return '';
        
        if (Array.isArray(castData)) {
            return castData.join(', ');
        }
        
        if (typeof castData === 'string') {
            return castData;
        }
        
        return '';
    }

    // KOFIC 데이터와 DB 데이터 비교 및 수정
    async compareAndCorrect() {
        console.log('🔍 영화 데이터 비교 및 수정 시작...\n');

        // KOFIC 데이터 로드
        const koficFile = 'kofic_recent_movies_20250728.json';
        if (!fs.existsSync(koficFile)) {
            console.error('❌ KOFIC 데이터 파일을 찾을 수 없습니다:', koficFile);
            return;
        }

        const koficData = JSON.parse(fs.readFileSync(koficFile, 'utf8'));
        const koficMovies = koficData.movies;

        console.log(`📊 KOFIC 기준 데이터: ${koficMovies.length}개`);

        // 현재 DB의 모든 한국 영화 조회
        const { data: dbMovies, error } = await supabase
            .from('movies')
            .select('id, title, director, cast_members, country, release_year')
            .or('country.eq.한국,country.eq.Korea,country.ilike.%한국%');

        if (error) {
            console.error('❌ DB 조회 오류:', error);
            return;
        }

        console.log(`📊 DB 한국 영화: ${dbMovies.length}개\n`);

        // 각 KOFIC 영화에 대해 DB에서 매칭 찾기
        for (const koficMovie of koficMovies) {
            console.log(`🎬 "${koficMovie.title}" 매칭 검색 중...`);
            
            let bestMatch = null;
            let bestScore = 0;

            // DB에서 유사한 제목 찾기
            for (const dbMovie of dbMovies) {
                const titleSimilarity = this.calculateSimilarity(koficMovie.title, dbMovie.title);
                
                // 제목 유사도가 0.7 이상이거나 연도가 일치하는 경우
                if (titleSimilarity > bestScore && titleSimilarity >= 0.6) {
                    // 연도 확인 (있는 경우)
                    const yearMatch = !dbMovie.release_year || 
                                    !koficMovie.release_year || 
                                    Math.abs(dbMovie.release_year - koficMovie.release_year) <= 1;
                    
                    if (yearMatch) {
                        bestMatch = dbMovie;
                        bestScore = titleSimilarity;
                    }
                }
            }

            if (bestMatch) {
                console.log(`   ✅ 매칭 발견: "${bestMatch.title}" (유사도: ${(bestScore * 100).toFixed(1)}%)`);
                
                // 데이터 비교 및 수정 필요성 확인
                const needsUpdate = await this.checkAndPrepareUpdate(koficMovie, bestMatch);
                
                if (needsUpdate) {
                    this.corrections.push({
                        kofic: koficMovie,
                        db: bestMatch,
                        similarity: bestScore
                    });
                }
            } else {
                console.log(`   ❌ 매칭 없음`);
                this.noMatches.push(koficMovie);
            }
        }

        // 수정 사항 요약
        console.log('\n📊 분석 결과:');
        console.log('='.repeat(80));
        console.log(`✅ 수정 필요: ${this.corrections.length}개`);
        console.log(`❌ 매칭 없음: ${this.noMatches.length}개`);

        if (this.corrections.length > 0) {
            console.log('\n🔧 수정 필요한 항목들:');
            console.log('='.repeat(80));
            
            this.corrections.forEach((correction, index) => {
                console.log(`\n${index + 1}. "${correction.kofic.title}" (ID: ${correction.db.id})`);
                console.log(`   🎯 KOFIC 감독: "${correction.kofic.director}"`);
                console.log(`   🎯 DB 감독: "${correction.db.director}"`);
                console.log(`   🎯 KOFIC 출연진: "${correction.kofic.cast_members}"`);
                console.log(`   🎯 DB 출연진: "${this.formatCastMembers(correction.db.cast_members)}"`);
            });

            // 업데이트 실행 여부 확인
            console.log('\n❓ 이 데이터들을 KOFIC 정보로 업데이트하시겠습니까?');
            console.log('⚠️  업데이트를 진행하려면 updateDatabase() 메소드를 호출하세요.');
        }

        if (this.noMatches.length > 0) {
            console.log('\n📝 매칭되지 않은 KOFIC 영화들 (새로 추가 가능):');
            console.log('='.repeat(80));
            
            this.noMatches.forEach((movie, index) => {
                console.log(`${index + 1}. "${movie.title}" (${movie.release_year}) - 감독: ${movie.director}`);
            });
        }

        return {
            correctionsNeeded: this.corrections.length,
            newMovies: this.noMatches.length,
            corrections: this.corrections,
            newMatches: this.noMatches
        };
    }

    // 업데이트 필요성 확인
    async checkAndPrepareUpdate(koficMovie, dbMovie) {
        const dbCastString = this.formatCastMembers(dbMovie.cast_members);
        
        // 제목, 감독, 출연진 비교
        const titleDifferent = koficMovie.title !== dbMovie.title;
        const directorDifferent = koficMovie.director !== (dbMovie.director || '');
        const castDifferent = koficMovie.cast_members !== dbCastString;

        return titleDifferent || directorDifferent || castDifferent;
    }

    // 실제 데이터베이스 업데이트 실행
    async updateDatabase() {
        if (this.corrections.length === 0) {
            console.log('❌ 업데이트할 데이터가 없습니다.');
            return;
        }

        console.log(`🚀 ${this.corrections.length}개 영화 데이터 업데이트 시작...\n`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < this.corrections.length; i++) {
            const correction = this.corrections[i];
            
            try {
                console.log(`📝 ${i + 1}/${this.corrections.length}: "${correction.kofic.title}" 업데이트 중...`);

                // 업데이트할 데이터 준비
                const updateData = {
                    title: correction.kofic.title,
                    director: correction.kofic.director,
                    cast_members: correction.kofic.cast_members.split(', '), // 배열로 변환
                    updated_at: new Date().toISOString()
                };

                // Supabase 업데이트
                const { error } = await supabase
                    .from('movies')
                    .update(updateData)
                    .eq('id', correction.db.id);

                if (error) {
                    console.error(`   ❌ 업데이트 실패:`, error.message);
                    failCount++;
                } else {
                    console.log(`   ✅ 업데이트 성공`);
                    console.log(`      - 감독: "${correction.db.director}" → "${correction.kofic.director}"`);
                    console.log(`      - 출연진: 업데이트됨`);
                    successCount++;
                }

            } catch (error) {
                console.error(`   ❌ 오류 발생:`, error.message);
                failCount++;
            }

            // API 호출 제한 준수
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n🎉 업데이트 완료!');
        console.log('='.repeat(50));
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);

        return { success: successCount, failed: failCount };
    }

    // 새 영화 추가
    async addNewMovies() {
        if (this.noMatches.length === 0) {
            console.log('❌ 추가할 새 영화가 없습니다.');
            return;
        }

        console.log(`🎬 ${this.noMatches.length}개 새 영화 추가 시작...\n`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < this.noMatches.length; i++) {
            const movie = this.noMatches[i];
            
            try {
                console.log(`📝 ${i + 1}/${this.noMatches.length}: "${movie.title}" 추가 중...`);

                const newMovieData = {
                    title: movie.title,
                    english_title: movie.title_eng || null,
                    director: movie.director || '알 수 없음',
                    cast_members: movie.cast_members ? movie.cast_members.split(', ') : [],
                    genre: movie.genre,
                    release_year: movie.release_year,
                    runtime_minutes: movie.runtime_minutes,
                    country: movie.country || '한국',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('movies')
                    .insert(newMovieData);

                if (error) {
                    console.error(`   ❌ 추가 실패:`, error.message);
                    failCount++;
                } else {
                    console.log(`   ✅ 추가 성공`);
                    successCount++;
                }

            } catch (error) {
                console.error(`   ❌ 오류 발생:`, error.message);
                failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n🎉 새 영화 추가 완료!');
        console.log('='.repeat(50));
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);

        return { success: successCount, failed: failCount };
    }
}

// 실행
async function main() {
    const corrector = new MovieDataCorrector();
    
    // 1단계: 비교 분석
    console.log('1️⃣ 영화 데이터 비교 분석 중...\n');
    const analysis = await corrector.compareAndCorrect();
    
    if (analysis.correctionsNeeded > 0) {
        console.log('\n2️⃣ 기존 영화 데이터 수정 중...\n');
        await corrector.updateDatabase();
    }
    
    if (analysis.newMovies > 0) {
        console.log('\n3️⃣ 새 영화 데이터 추가 중...\n');
        await corrector.addNewMovies();
    }
    
    console.log('\n🎉 모든 작업 완료!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MovieDataCorrector;