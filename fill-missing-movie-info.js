// 네이버 검색 API로 비어있는 감독과 출연진 정보 채우기
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

class MovieInfoFiller {
    constructor() {
        this.clientId = process.env.NAVER_CLIENT_ID || '99hDav0SfKtmPXLljc1U';
        this.clientSecret = process.env.NAVER_CLIENT_SECRET || '7ahplkzCS0';
        this.delay = 200; // 0.2초 간격
        this.batchSize = 50;
        this.processedCount = 0;
        this.updatedCount = 0;
        this.failedCount = 0;
        this.skipCount = 0;
    }

    async delayMs(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async searchNaverMovie(title, year) {
        try {
            // URL 인코딩 처리
            const encodedTitle = encodeURIComponent(title);
            
            const response = await axios.get(`https://openapi.naver.com/v1/search/movie.json?query=${encodedTitle}&display=10`, {
                headers: {
                    'X-Naver-Client-Id': this.clientId,
                    'X-Naver-Client-Secret': this.clientSecret,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            if (response.data && response.data.items && response.data.items.length > 0) {
                // 가장 유사한 영화 찾기
                for (const item of response.data.items) {
                    const movieYear = parseInt(item.pubDate);
                    const cleanTitle = item.title.replace(/<[^>]*>/g, '').trim();
                    
                    // 제목이 비슷하고 연도가 비슷한 경우
                    if (this.isSimilarTitle(title, cleanTitle) && 
                        (!year || Math.abs(movieYear - year) <= 3)) {
                        
                        return {
                            title: cleanTitle,
                            director: this.cleanText(item.director),
                            actor: this.cleanText(item.actor),
                            pubDate: movieYear,
                            userRating: parseFloat(item.userRating) || 0
                        };
                    }
                }
                
                // 정확한 매치가 없으면 첫 번째 결과 사용
                const firstItem = response.data.items[0];
                return {
                    title: firstItem.title.replace(/<[^>]*>/g, '').trim(),
                    director: this.cleanText(firstItem.director),
                    actor: this.cleanText(firstItem.actor),
                    pubDate: parseInt(firstItem.pubDate),
                    userRating: parseFloat(firstItem.userRating) || 0
                };
            }
        } catch (error) {
            if (error.response?.status === 429) {
                console.log(`   ⚠️ API 제한, 잠시 대기...`);
                await this.delayMs(2000); // 2초 대기
                return await this.searchNaverMovie(title, year); // 재시도
            }
            console.log(`   ⚠️ 네이버 검색 실패: ${error.message}`);
        }
        return null;
    }

    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/\|/g, ', ') // | 를 , 로 변경
            .trim();
    }

    isSimilarTitle(title1, title2) {
        const clean1 = title1.toLowerCase().replace(/[^a-z가-힣0-9]/g, '');
        const clean2 = title2.toLowerCase().replace(/[^a-z가-힣0-9]/g, '');
        
        // 완전 일치
        if (clean1 === clean2) return true;
        
        // 포함 관계 (한쪽이 다른 쪽을 포함)
        if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
        
        // 유사도 계산 (단순 비교)
        const longer = clean1.length > clean2.length ? clean1 : clean2;
        const shorter = clean1.length > clean2.length ? clean2 : clean1;
        const editDistance = this.levenshteinDistance(longer, shorter);
        const similarity = (longer.length - editDistance) / longer.length;
        
        return similarity > 0.7; // 70% 이상 유사도
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

    parseActors(actorString) {
        if (!actorString) return [];
        
        return actorString
            .split(',')
            .map(actor => actor.trim())
            .filter(actor => actor.length > 0)
            .slice(0, 5); // 최대 5명만
    }

    async updateMovieInfo(movie) {
        const emptyDirector = !movie.director || movie.director.trim() === '' || movie.director === '알수 없음';
        const emptyCast = !movie.cast_members || movie.cast_members.length === 0 || 
                         (Array.isArray(movie.cast_members) && movie.cast_members.some(cast => cast === '알수 없음'));

        if (!emptyDirector && !emptyCast) {
            this.skipCount++;
            return false; // 이미 정보가 있음
        }

        console.log(`🎬 [${this.processedCount + 1}] ${movie.title} 정보 업데이트 중...`);
        console.log(`   📋 현재 - 감독: ${movie.director || '없음'}, 출연: ${movie.cast_members ? movie.cast_members.join(', ') : '없음'}`);

        // 네이버에서 영화 검색
        const naverMovie = await this.searchNaverMovie(movie.title, movie.release_year);
        
        if (!naverMovie) {
            console.log(`   ❌ 네이버에서 찾을 수 없음`);
            this.failedCount++;
            return false;
        }

        console.log(`   ✅ 네이버 정보 발견: ${naverMovie.title} (${naverMovie.pubDate})`);
        console.log(`   📋 네이버 - 감독: ${naverMovie.director}, 출연: ${naverMovie.actor}`);

        // 업데이트할 데이터 준비
        const updateData = {};
        
        if (emptyDirector && naverMovie.director) {
            updateData.director = naverMovie.director;
        }
        
        if (emptyCast && naverMovie.actor) {
            updateData.cast_members = this.parseActors(naverMovie.actor);
        }

        // 추가로 평점도 업데이트 (더 정확한 정보가 있는 경우)
        if (naverMovie.userRating > 0 && (!movie.naver_rating || movie.naver_rating === 0)) {
            updateData.naver_rating = naverMovie.userRating;
        }

        // 개봉년도 수정 (더 정확한 정보가 있는 경우)
        if (naverMovie.pubDate && naverMovie.pubDate > 1900 && 
            (!movie.release_year || Math.abs(movie.release_year - naverMovie.pubDate) > 1)) {
            updateData.release_year = naverMovie.pubDate;
        }

        if (Object.keys(updateData).length === 0) {
            console.log(`   ⚠️ 업데이트할 새로운 정보가 없음`);
            this.skipCount++;
            return false;
        }

        // 데이터베이스 업데이트
        const { error } = await supabase
            .from('movies')
            .update(updateData)
            .eq('id', movie.id);

        if (error) {
            console.log(`   ❌ DB 업데이트 실패:`, error.message);
            this.failedCount++;
            return false;
        }

        console.log(`   ✅ 업데이트 완료!`);
        console.log(`   📝 새 정보 - 감독: ${updateData.director || movie.director}, 출연: ${updateData.cast_members ? updateData.cast_members.join(', ') : (movie.cast_members ? movie.cast_members.join(', ') : '없음')}`);
        
        this.updatedCount++;
        return true;
    }

    async loadMoviesWithMissingInfo() {
        console.log('📋 정보가 비어있는 영화들 로드 중...');
        
        const { data, error } = await supabase
            .from('movies')
            .select('id, title, director, cast_members, release_year, naver_rating')
            .or('director.is.null,director.eq.,cast_members.is.null,cast_members.eq.{}')
            .order('id', { ascending: true })
            .limit(1000); // 처음 1000개만

        if (error) {
            console.log('❌ 영화 목록 로드 실패:', error.message);
            return [];
        }

        // 필터링: 감독이나 출연진이 비어있거나 "알수 없음"인 영화들
        const filteredMovies = data.filter(movie => {
            const emptyDirector = !movie.director || movie.director.trim() === '' || movie.director === '알수 없음';
            const emptyCast = !movie.cast_members || movie.cast_members.length === 0 || 
                             (Array.isArray(movie.cast_members) && movie.cast_members.some(cast => cast === '알수 없음'));
            return emptyDirector || emptyCast;
        });

        console.log(`✅ ${filteredMovies.length}개 영화가 정보 업데이트 필요`);
        return filteredMovies;
    }

    async run() {
        const startTime = Date.now();
        
        console.log('🚀 영화 정보 자동 채우기 시작...');
        console.log('📝 네이버 검색 API로 감독과 출연진 정보를 찾아서 업데이트합니다.\n');
        
        const movies = await this.loadMoviesWithMissingInfo();
        if (movies.length === 0) {
            console.log('✅ 모든 영화의 정보가 이미 채워져 있습니다!');
            return;
        }

        console.log(`📊 총 ${movies.length}개 영화 정보 업데이트 예정\n`);
        
        // 배치 단위로 처리
        for (let i = 0; i < movies.length; i += this.batchSize) {
            const batch = movies.slice(i, i + this.batchSize);
            
            console.log(`📦 배치 ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(movies.length/this.batchSize)} 처리 중...`);
            
            for (const movie of batch) {
                try {
                    await this.updateMovieInfo(movie);
                    this.processedCount++;
                    
                    // 진행률 표시
                    const progress = Math.round((this.processedCount / movies.length) * 100);
                    console.log(`📈 진행률: ${this.processedCount}/${movies.length} (${progress}%)\n`);
                    
                    await this.delayMs(this.delay);
                    
                } catch (error) {
                    console.log(`❌ ${movie.title} 처리 중 오류:`, error.message);
                    this.failedCount++;
                    this.processedCount++;
                }
            }
            
            console.log(`✅ 배치 ${Math.floor(i/this.batchSize) + 1} 완료\n`);
        }
        
        // 최종 통계
        const { count: totalMovies } = await supabase
            .from('movies')
            .select('*', { count: 'exact', head: true });

        // 아직 비어있는 영화 수 확인
        const { data: stillEmpty } = await supabase
            .from('movies')
            .select('id')
            .or('director.is.null,director.eq.,cast_members.is.null,cast_members.eq.{}');

        const remainingEmpty = stillEmpty ? stillEmpty.filter(movie => {
            const emptyDirector = !movie.director || movie.director.trim() === '' || movie.director === '알수 없음';
            const emptyCast = !movie.cast_members || movie.cast_members.length === 0;
            return emptyDirector || emptyCast;
        }).length : 0;
        
        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(1);
        
        console.log('='.repeat(70));
        console.log('🎉 영화 정보 자동 채우기 완료!');
        console.log('='.repeat(70));
        console.log(`⏱️ 총 실행 시간: ${totalTime}분`);
        console.log(`🎬 전체 영화 수: ${totalMovies}개`);
        console.log(`✅ 성공적으로 업데이트: ${this.updatedCount}개`);
        console.log(`⚠️ 업데이트 실패: ${this.failedCount}개`);
        console.log(`⏭️ 이미 정보가 있어서 스킵: ${this.skipCount}개`);
        console.log(`📊 성공률: ${Math.round((this.updatedCount / this.processedCount) * 100)}%`);
        console.log(`🔍 아직 정보가 비어있는 영화: ${remainingEmpty}개`);
        console.log('\n💡 네이버에서 찾은 정확한 감독과 출연진 정보로 업데이트되었습니다!');
        console.log('🔍 이제 "파묘 감독", "기생충 출연진" 등을 정확하게 확인할 수 있습니다.');
    }
}

// 실행
const filler = new MovieInfoFiller();
filler.run().catch(console.error);