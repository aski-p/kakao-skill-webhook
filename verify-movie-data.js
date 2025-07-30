// 수집된 한국 영화 데이터 검증 스크립트
const fs = require('fs');

class MovieDataVerifier {
    constructor() {
        this.movies = [];
        this.statistics = {
            total: 0,
            withDirector: 0,
            withCast: 0,
            withGenre: 0,
            withYear: 0,
            unique: 0
        };
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

    // JSON 파일 로드
    loadMovieData(filename) {
        try {
            if (!fs.existsSync(filename)) {
                this.log(`파일을 찾을 수 없습니다: ${filename}`, 'error');
                return false;
            }

            const data = fs.readFileSync(filename, 'utf8');
            const parsed = JSON.parse(data);
            
            this.movies = parsed.movies;
            this.log(`${filename}에서 ${this.movies.length}개 영화 데이터 로드`, 'success');
            return true;
        } catch (error) {
            this.log(`파일 로드 실패: ${error.message}`, 'error');
            return false;
        }
    }

    // 데이터 분석
    analyzeData() {
        this.log('영화 데이터 분석 시작...');

        const uniqueTitles = new Set();
        
        this.movies.forEach(movie => {
            this.statistics.total++;
            
            if (movie.director) this.statistics.withDirector++;
            if (movie.cast_members && movie.cast_members.length > 0) this.statistics.withCast++;
            if (movie.genre) this.statistics.withGenre++;
            if (movie.release_year) this.statistics.withYear++;
            
            uniqueTitles.add(movie.title);
        });

        this.statistics.unique = uniqueTitles.size;
    }

    // 특정 영화 상세 정보 출력
    showMovieDetails(title) {
        const movie = this.movies.find(m => 
            m.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(m.title.toLowerCase())
        );

        if (movie) {
            this.log(`\n[MOVIE] "${movie.title}" 상세 정보:`, 'success');
            console.log(`   [TV] 영어 제목: ${movie.english_title || '없음'}`);
            console.log(`   [DRAMA] 감독: ${movie.director || '정보 없음'}`);
            console.log(`   [BUSTSINSILHOUETTE] 출연진: ${movie.cast_members ? movie.cast_members.slice(0, 5).join(', ') : '정보 없음'}`);
            console.log(`   [FUN] 장르: ${movie.genre} (한국어: ${movie.genres_korean || '없음'})`);
            console.log(`   [TOMORROW] 개봉년도: ${movie.release_year || '정보 없음'}`);
            console.log(`   ⏱️ 상영시간: ${movie.runtime_minutes ? movie.runtime_minutes + '분' : '정보 없음'}`);
            console.log(`   [UNDERAGE] 관람등급: ${movie.watch_grade || '정보 없음'}`);
            console.log(`   🎞️ KOFIC 코드: ${movie.kofic_movie_code || '없음'}`);
            console.log(`   [MEMO] 설명: ${movie.description || '없음'}`);
            console.log(`   [LABEL] 키워드: ${movie.keywords ? movie.keywords.slice(0, 5).join(', ') : '없음'}`);
            return movie;
        } else {
            this.log(`"${title}" 영화를 찾을 수 없습니다`, 'warning');
            return null;
        }
    }

    // 주요 한국 영화들 검증
    verifyKeyMovies() {
        this.log('\n주요 한국 영화 검증:');
        
        const keyMovies = [
            '야당', '발레리나', '파묘', '서울의 봄', '범죄도시3',
            '콘크리트 유토피아', '밀수', '노량', '웅남이', '보호자'
        ];

        keyMovies.forEach(title => {
            const movie = this.showMovieDetails(title);
            console.log(''); // 빈 줄 추가
        });
    }

    // 통계 출력
    showStatistics() {
        this.log('\n========== 데이터 통계 ==========');
        console.log(`[INFO] 총 영화 수: ${this.statistics.total}개`);
        console.log(`[MOVIE] 고유 영화 수: ${this.statistics.unique}개`);
        console.log(`[DRAMA] 감독 정보 있음: ${this.statistics.withDirector}개 (${(this.statistics.withDirector/this.statistics.total*100).toFixed(1)}%)`);
        console.log(`[BUSTSINSILHOUETTE] 출연진 정보 있음: ${this.statistics.withCast}개 (${(this.statistics.withCast/this.statistics.total*100).toFixed(1)}%)`);
        console.log(`[FUN] 장르 정보 있음: ${this.statistics.withGenre}개 (${(this.statistics.withGenre/this.statistics.total*100).toFixed(1)}%)`);
        console.log(`[TOMORROW] 개봉년도 있음: ${this.statistics.withYear}개 (${(this.statistics.withYear/this.statistics.total*100).toFixed(1)}%)`);
    }

    // 메인 실행
    run() {
        this.log('한국 영화 데이터 검증 시작');
        
        // 1. 데이터 로드
        const filename = 'korean_movies_update_20250729.json';
        if (!this.loadMovieData(filename)) {
            return;
        }

        // 2. 데이터 분석
        this.analyzeData();

        // 3. 통계 출력
        this.showStatistics();

        // 4. 주요 영화 검증
        this.verifyKeyMovies();

        this.log('\n데이터 검증 완료!', 'success');
    }
}

// 스크립트 실행
if (require.main === module) {
    const verifier = new MovieDataVerifier();
    verifier.run();
}

module.exports = MovieDataVerifier;