// 기존 movies 테이블의 영화 데이터를 네이버 API로 보강하는 스크립트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class MovieDataEnhancer {
    constructor() {
        // Supabase 설정
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // 네이버 API 설정
        this.naverClientId = process.env.NAVER_CLIENT_ID;
        this.naverClientSecret = process.env.NAVER_CLIENT_SECRET;
        
        if (!this.naverClientId || !this.naverClientSecret) {
            throw new Error('네이버 API 키가 설정되지 않았습니다.');
        }
        
        console.log('🚀 영화 데이터 보강 도구 초기화 완료');
    }
    
    // 네이버 영화 API로 영화 정보 검색
    async searchNaverMovie(title) {
        try {
            console.log(`🔍 네이버 API에서 "${title}" 검색 중...`);
            
            // 여러 검색어 시도
            const searchQueries = [
                title,
                `${title} 영화`,
                `${title} 2025`,
                `${title} movie`
            ];
            
            for (const query of searchQueries) {
                try {
                    const response = await axios.get('https://openapi.naver.com/v1/search/movie.json', {
                        params: {
                            query: query,
                            display: 10,
                            start: 1
                        },
                        headers: {
                            'X-Naver-Client-Id': this.naverClientId,
                            'X-Naver-Client-Secret': this.naverClientSecret,
                            'User-Agent': 'MovieDataEnhancer/1.0'
                        },
                        timeout: 10000
                    });
                    
                    const items = response.data.items;
                    if (items && items.length > 0) {
                        console.log(`✅ "${query}" 검색어로 ${items.length}개 결과 발견`);
                        
                        // 결과 디버깅
                        items.forEach((item, index) => {
                            console.log(`  ${index + 1}. ${item.title.replace(/<[^>]*>/g, '')} (${item.pubDate}) - 평점: ${item.userRating}`);
                        });
                        
                        // 가장 관련성 높은 결과 선택
                        const bestMatch = this.findBestMatch(title, items);
                        
                        if (bestMatch) {
                            console.log(`✅ "${title}" → "${bestMatch.title.replace(/<[^>]*>/g, '')}" 매칭 성공`);
                            return this.parseNaverMovieData(bestMatch);
                        }
                    }
                } catch (apiError) {
                    console.log(`⚠️ "${query}" 검색 실패: ${apiError.response?.status || apiError.message}`);
                    continue;
                }
            }
            
            console.log(`❌ 모든 검색어로 "${title}" 결과 없음`);
            return null;
            
        } catch (error) {
            console.error(`❌ 네이버 API 오류 (${title}):`, error.message);
            return null;
        }
    }
    
    // 제목 유사도 기준으로 최적 매칭 찾기
    findBestMatch(searchTitle, items) {
        let bestMatch = null;
        let bestScore = 0;
        
        for (const item of items) {
            const itemTitle = item.title.replace(/<[^>]*>/g, '').trim();
            const score = this.calculateSimilarity(searchTitle, itemTitle);
            
            if (score > bestScore && score > 0.3) { // 최소 30% 유사도
                bestScore = score;
                bestMatch = item;
            }
        }
        
        return bestMatch;
    }
    
    // 문자열 유사도 계산 (간단한 Levenshtein distance 기반)
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    // Levenshtein distance 계산
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
    
    // 네이버 영화 데이터 파싱
    parseNaverMovieData(naverItem) {
        return {
            title: naverItem.title.replace(/<[^>]*>/g, '').trim(),
            director: naverItem.director.replace(/<[^>]*>/g, '').trim(),
            cast_members: naverItem.actor.replace(/<[^>]*>/g, '').split('|').map(actor => actor.trim()).filter(actor => actor),
            naver_rating: naverItem.userRating && naverItem.userRating !== '0.00' ? parseFloat(naverItem.userRating) : null,
            release_year: naverItem.pubDate ? parseInt(naverItem.pubDate) : null,
            poster_url: naverItem.image || null,
            naver_movie_id: naverItem.link ? naverItem.link.split('code=')[1] : null
        };
    }
    
    // Supabase에서 보강이 필요한 영화들 가져오기
    async getMoviesNeedingEnhancement() {
        try {
            console.log('📊 보강이 필요한 영화 목록 조회 중...');
            
            const { data: movies, error } = await this.supabase
                .from('movies')
                .select('id, title, director, cast_members, naver_rating, release_year')
                .or('cast_members.is.null,naver_rating.is.null,release_year.is.null')
                .limit(50); // 한 번에 50개씩 처리
            
            if (error) {
                throw error;
            }
            
            console.log(`📋 총 ${movies.length}개 영화가 보강 필요`);
            return movies || [];
            
        } catch (error) {
            console.error('❌ 영화 목록 조회 오류:', error.message);
            return [];
        }
    }
    
    // 영화 데이터 업데이트
    async updateMovieData(movieId, enhancedData) {
        try {
            const updateData = {};
            
            // null이 아닌 데이터만 업데이트
            if (enhancedData.director && enhancedData.director !== '') {
                updateData.director = enhancedData.director;
            }
            if (enhancedData.cast_members && enhancedData.cast_members.length > 0) {
                updateData.cast_members = enhancedData.cast_members;
            }
            if (enhancedData.naver_rating !== null) {
                updateData.naver_rating = enhancedData.naver_rating;
            }
            if (enhancedData.release_year !== null) {
                updateData.release_year = enhancedData.release_year;
            }
            if (enhancedData.poster_url) {
                updateData.poster_url = enhancedData.poster_url;
            }
            if (enhancedData.naver_movie_id) {
                updateData.naver_movie_id = enhancedData.naver_movie_id;
            }
            
            updateData.updated_at = new Date().toISOString();
            
            const { error } = await this.supabase
                .from('movies')
                .update(updateData)
                .eq('id', movieId);
            
            if (error) {
                throw error;
            }
            
            console.log(`✅ 영화 ID ${movieId} 업데이트 완료`);
            return true;
            
        } catch (error) {
            console.error(`❌ 영화 ID ${movieId} 업데이트 오류:`, error.message);
            return false;
        }
    }
    
    // 메인 실행 함수
    async enhance() {
        try {
            console.log('🎬 영화 데이터 보강 시작!');
            console.log('=' .repeat(50));
            
            // 보강이 필요한 영화 목록 가져오기
            const movies = await this.getMoviesNeedingEnhancement();
            
            if (movies.length === 0) {
                console.log('✅ 모든 영화 데이터가 이미 완성되어 있습니다!');
                return;
            }
            
            let successCount = 0;
            let failCount = 0;
            
            for (let i = 0; i < movies.length; i++) {
                const movie = movies[i];
                
                console.log(`\n[${i + 1}/${movies.length}] 처리 중: "${movie.title}"`);
                
                // 네이버 API에서 영화 정보 검색
                const enhancedData = await this.searchNaverMovie(movie.title);
                
                if (enhancedData) {
                    // 데이터베이스 업데이트
                    const success = await this.updateMovieData(movie.id, enhancedData);
                    
                    if (success) {
                        successCount++;
                        
                        // 업데이트된 정보 요약 출력
                        const updates = [];
                        if (enhancedData.director) updates.push(`감독: ${enhancedData.director}`);
                        if (enhancedData.cast_members?.length > 0) updates.push(`출연: ${enhancedData.cast_members.slice(0, 3).join(', ')}`);
                        if (enhancedData.naver_rating) updates.push(`평점: ${enhancedData.naver_rating}/10`);
                        if (enhancedData.release_year) updates.push(`개봉: ${enhancedData.release_year}`);
                        
                        console.log(`   💫 업데이트: ${updates.join(', ')}`);
                    } else {
                        failCount++;
                    }
                } else {
                    console.log(`   ⚠️ "${movie.title}" 정보를 찾을 수 없음`);
                    failCount++;
                }
                
                // API 요청 간격 (네이버 API 제한 고려)
                if (i < movies.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기
                }
            }
            
            console.log('\n' + '='.repeat(50));
            console.log('🎉 영화 데이터 보강 완료!');
            console.log(`✅ 성공: ${successCount}개`);
            console.log(`❌ 실패: ${failCount}개`);
            console.log(`📊 처리율: ${Math.round((successCount / movies.length) * 100)}%`);
            
        } catch (error) {
            console.error('❌ 전체 프로세스 오류:', error.message);
            console.error('스택 트레이스:', error.stack);
        }
    }
    
    // 특정 영화만 보강 (테스트용)
    async enhanceSpecificMovie(movieTitle) {
        try {
            console.log(`🎯 "${movieTitle}" 영화 데이터 보강 시작`);
            
            // 데이터베이스에서 해당 영화 찾기
            const { data: movies, error } = await this.supabase
                .from('movies')
                .select('*')
                .ilike('title', `%${movieTitle}%`)
                .limit(1);
                
            if (error) throw error;
            
            if (!movies || movies.length === 0) {
                console.log(`❌ "${movieTitle}" 영화를 데이터베이스에서 찾을 수 없습니다.`);
                return;
            }
            
            const movie = movies[0];
            console.log(`📋 기존 데이터: ${JSON.stringify(movie, null, 2)}`);
            
            // 네이버 API에서 정보 검색
            const enhancedData = await this.searchNaverMovie(movie.title);
            
            if (enhancedData) {
                console.log(`📋 네이버 데이터: ${JSON.stringify(enhancedData, null, 2)}`);
                
                // 업데이트 실행
                const success = await this.updateMovieData(movie.id, enhancedData);
                
                if (success) {
                    console.log(`✅ "${movieTitle}" 보강 완료!`);
                } else {
                    console.log(`❌ "${movieTitle}" 업데이트 실패`);
                }
            } else {
                console.log(`❌ "${movieTitle}" 네이버에서 정보 찾을 수 없음`);
            }
            
        } catch (error) {
            console.error('❌ 특정 영화 보강 오류:', error.message);
        }
    }
}

// CLI 실행부
async function main() {
    const enhancer = new MovieDataEnhancer();
    
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === '--movie') {
        // 특정 영화 보강
        const movieTitle = args[1];
        if (!movieTitle) {
            console.log('사용법: node enhance-movie-data.js --movie "영화제목"');
            return;
        }
        await enhancer.enhanceSpecificMovie(movieTitle);
    } else {
        // 전체 보강
        await enhancer.enhance();
    }
}

// 스크립트 직접 실행 시
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 실행 오류:', error);
        process.exit(1);
    });
}

module.exports = MovieDataEnhancer;