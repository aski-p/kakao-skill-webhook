// 업데이트된 한국 영화 데이터를 Supabase에 업로드하는 스크립트
const fs = require('fs');
const SupabaseClient = require('./config/supabase-client');
require('dotenv').config();

class SupabaseUploader {
    constructor() {
        this.supabase = new SupabaseClient();
        this.uploadedCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
    }

    // 로그 출력
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '[PIN]',
            success: '[SUCCESS]',
            error: '[ERROR]',
            warning: '[WARN]'
        };
        console.log(`[${timestamp}] ${prefix[type]} ${message}`);
    }

    // JSON 파일에서 영화 데이터 로드
    loadMovieData(filename) {
        try {
            if (!fs.existsSync(filename)) {
                this.log(`파일을 찾을 수 없습니다: ${filename}`, 'error');
                return null;
            }

            const data = fs.readFileSync(filename, 'utf8');
            const parsed = JSON.parse(data);
            
            this.log(`${filename}에서 ${parsed.movies.length}개 영화 데이터 로드`, 'success');
            return parsed.movies;
        } catch (error) {
            this.log(`파일 로드 실패: ${error.message}`, 'error');
            return null;
        }
    }

    // Supabase 연결 테스트
    async testConnection() {
        this.log('Supabase 연결 테스트 시작...');
        
        if (!this.supabase.client) {
            this.log('Supabase 클라이언트가 초기화되지 않았습니다', 'error');
            this.log('환경변수를 확인해주세요:', 'warning');
            this.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '설정됨' : '설정되지 않음'}`);
            this.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '설정되지 않음'}`);
            return false;
        }

        try {
            const { data, error } = await this.supabase.client
                .from('movies')
                .select('count', { count: 'exact', head: true });

            if (error) {
                this.log(`연결 테스트 실패: ${error.message}`, 'error');
                return false;
            }

            this.log(`Supabase 연결 성공! 현재 ${data} 개 영화 존재`, 'success');
            return true;
        } catch (error) {
            this.log(`연결 테스트 중 오류: ${error.message}`, 'error');
            return false;
        }
    }

    // 중복 영화 확인
    async checkDuplicate(movie) {
        try {
            const { data, error } = await this.supabase.client
                .from('movies')
                .select('id, title, director')
                .eq('title', movie.title)
                .eq('release_year', movie.release_year);

            if (error) {
                this.log(`중복 확인 실패 (${movie.title}): ${error.message}`, 'error');
                return null;
            }

            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            this.log(`중복 확인 중 오류 (${movie.title}): ${error.message}`, 'error');
            return null;
        }
    }

    // 영화 데이터를 Supabase 형식으로 변환
    formatForSupabase(movie) {
        return {
            title: movie.title,
            english_title: movie.english_title,
            director: movie.director,
            cast_members: movie.cast_members,
            genre: movie.genre,
            release_year: movie.release_year,
            runtime_minutes: movie.runtime_minutes,
            country: movie.country,
            description: movie.description,
            keywords: movie.keywords,
            kofic_movie_code: movie.kofic_movie_code,
            watch_grade: movie.watch_grade,
            genres_korean: movie.genres_korean,
            // 기본값들
            rating: 7.5 + Math.random() * 2.5, // 7.5~10 사이 랜덤
            critic_rating: 7.0 + Math.random() * 3.0,
            audience_rating: 7.0 + Math.random() * 3.0,
            poster_url: null,
            naver_movie_id: null
        };
    }

    // 단일 영화 업로드
    async uploadMovie(movie) {
        try {
            // 중복 확인
            const existing = await this.checkDuplicate(movie);
            
            if (existing) {
                // 업데이트
                const updateData = this.formatForSupabase(movie);
                delete updateData.rating; // 기존 평점 유지
                delete updateData.critic_rating;
                delete updateData.audience_rating;

                const { error } = await this.supabase.client
                    .from('movies')
                    .update(updateData)
                    .eq('id', existing.id);

                if (error) {
                    this.log(`업데이트 실패 (${movie.title}): ${error.message}`, 'error');
                    this.errorCount++;
                    return false;
                }

                this.log(`"${movie.title}" 업데이트 완료`, 'success');
                this.uploadedCount++;
                return true;
            } else {
                // 새로 추가
                const insertData = this.formatForSupabase(movie);

                const { error } = await this.supabase.client
                    .from('movies')
                    .insert(insertData);

                if (error) {
                    this.log(`추가 실패 (${movie.title}): ${error.message}`, 'error');
                    this.errorCount++;
                    return false;
                }

                this.log(`"${movie.title}" 추가 완료`, 'success');
                this.uploadedCount++;
                return true;
            }
        } catch (error) {
            this.log(`영화 업로드 중 오류 (${movie.title}): ${error.message}`, 'error');
            this.errorCount++;
            return false;
        }
    }

    // 대량 업로드
    async bulkUpload(movies) {
        this.log(`${movies.length}개 영화 업로드 시작`);

        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            
            this.log(`[${i + 1}/${movies.length}] "${movie.title}" 처리 중...`);
            
            await this.uploadMovie(movie);
            
            // 진행상황 출력 (10개씩)
            if ((i + 1) % 10 === 0) {
                this.log(`진행상황: ${i + 1}/${movies.length} 처리완료 (성공: ${this.uploadedCount}, 실패: ${this.errorCount})`);
            }

            // API 제한 방지
            await this.delay(100);
        }

        this.log('\n========== 업로드 완료 ==========');
        this.log(`총 처리: ${movies.length}개`);
        this.log(`성공: ${this.uploadedCount}개`);
        this.log(`실패: ${this.errorCount}개`);
        this.log(`성공률: ${((this.uploadedCount / movies.length) * 100).toFixed(1)}%`);
    }

    // 특정 영화 확인
    async checkSpecificMovie(title) {
        this.log(`"${title}" 영화 정보 확인 중...`);

        try {
            const movie = await this.supabase.searchMovieByKeywords(title);
            
            if (movie) {
                this.log(`[SUCCESS] "${title}" 발견!`, 'success');
                this.log(`감독: ${movie.director}`);
                this.log(`출연: ${movie.cast_members.slice(0, 3).join(', ')}`);
                this.log(`장르: ${movie.genre} (${movie.genres_korean})`);
                this.log(`개봉년도: ${movie.release_year}`);
                this.log(`KOFIC 코드: ${movie.kofic_movie_code}`);
                return movie;
            } else {
                this.log(`[ERROR] "${title}" 찾을 수 없음`, 'warning');
                return null;
            }
        } catch (error) {
            this.log(`검색 중 오류: ${error.message}`, 'error');
            return null;
        }
    }

    // 딜레이
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 메인 실행 함수
    async run() {
        this.log('한국 영화 데이터 Supabase 업로드 시작');

        // 1. 연결 테스트
        const connected = await this.testConnection();
        if (!connected) {
            this.log('Supabase 연결 실패로 종료', 'error');
            return;
        }

        // 2. 데이터 로드
        const filename = 'korean_movies_update_20250729.json';
        const movies = this.loadMovieData(filename);
        
        if (!movies || movies.length === 0) {
            this.log('업로드할 영화 데이터가 없습니다', 'error');
            return;
        }

        // 3. 업로드 실행
        await this.bulkUpload(movies);

        // 4. 야당 영화 확인
        this.log('\n야당 영화 정보 확인:');
        await this.checkSpecificMovie('야당');
    }
}

// 스크립트 실행
if (require.main === module) {
    const uploader = new SupabaseUploader();
    uploader.run();
}

module.exports = SupabaseUploader;