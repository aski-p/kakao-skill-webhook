// 전체 데이터베이스 검증 및 잘못된 데이터 식별
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

class ComprehensiveDataVerifier {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // 가짜/잘못된 데이터 패턴들
        this.fakePatterns = {
            directors: [
                // 한국 감독들이 외국 영화 감독으로 잘못 배정된 경우
                '박찬욱', '봉준호', '김지운', '나홍진', '최동훈', '윤종빈', '장준환', 
                '김성훈', '허진호', '김태용', '이준익', '김용화', '강제규', '김한민', 
                '류승완', '곽경택', '강형철', '심성보', '김대승', '이정범', '박흥식'
            ],
            actors: [
                // 한국 배우들이 외국 영화에 잘못 배정된 경우
                '이병헌', '송강호', '최민식', '설경구', '황정민', '조인성', '강동원', 
                '이정재', '박해일', '유아인', '이선균', '김윤석', '하정우', '전지현', 
                '김태희', '김하늘', '손예진', '이나영', '김고은', '박소담', '김옥빈', 
                '유지태', '정우성', '마동석'
            ],
            reviewers: [
                // 가짜 평론가들
                '김영화평론가', '박시네마리뷰', '영화평론가', '네이버 관객1', '네이버 관객2',
                '네이버 관객3', '네이버 관객4', '네이버 관객5', '네이버 관객6', '네이버 관객7'
            ]
        };

        this.problemMovies = [];
        this.totalMovies = 0;
        this.checkedCount = 0;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 영화 제목으로 한국/외국 영화 판단
    isKoreanMovie(title) {
        // 한국어 포함하면 한국 영화
        const hasKorean = /[가-힣]/.test(title);
        
        // 알려진 한국 영화들
        const knownKoreanMovies = [
            '기생충', '파묘', '범죄도시', '아마추어', '발레리나', '서울의 봄', 
            '베테랑', '극한직업', '모가디슈', '한산', '브로커', '헤어질 결심',
            '택시운전사', '신과함께', '아가씨', '곡성', '신세계', '추격자'
        ];
        
        return hasKorean || knownKoreanMovies.some(movie => title.includes(movie));
    }

    // 외국 영화에 한국 감독/배우가 배정되었는지 검사
    detectMismatchedData(movie) {
        const problems = [];
        const isKorean = this.isKoreanMovie(movie.title);
        
        // 외국 영화에 한국 감독이 배정된 경우
        if (!isKorean && this.fakePatterns.directors.includes(movie.director)) {
            problems.push({
                type: 'foreign_movie_korean_director',
                field: 'director',
                value: movie.director,
                reason: `외국 영화 "${movie.title}"에 한국 감독 "${movie.director}" 잘못 배정`
            });
        }

        // 외국 영화에 한국 배우가 배정된 경우
        if (!isKorean && movie.cast_members) {
            const koreanActors = movie.cast_members.filter(actor => 
                this.fakePatterns.actors.includes(actor)
            );
            if (koreanActors.length > 0) {
                problems.push({
                    type: 'foreign_movie_korean_actors',
                    field: 'cast_members',
                    value: koreanActors,
                    reason: `외국 영화 "${movie.title}"에 한국 배우들 잘못 배정: ${koreanActors.join(', ')}`
                });
            }
        }

        // 한국 영화에 외국 감독/배우가 잘못 배정된 경우도 체크
        if (isKorean) {
            const foreignDirectors = [
                '크리스토퍼 놀란', '스티븐 스필버그', '마틴 스코세이지', '쿠엔틴 타란티노',
                '제임스 카메론', '리들리 스콧', '데니스 빌뇌브', '조던 필', '가이 리치'
            ];
            if (foreignDirectors.includes(movie.director)) {
                problems.push({
                    type: 'korean_movie_foreign_director',
                    field: 'director', 
                    value: movie.director,
                    reason: `한국 영화 "${movie.title}"에 외국 감독 "${movie.director}" 잘못 배정`
                });
            }
        }

        return problems;
    }

    async checkAllMovies() {
        console.log('[SEARCH] 전체 데이터베이스 영화 데이터 검증 시작...\n');

        let offset = 0;
        const batchSize = 100;
        
        // 전체 영화 수 먼저 확인
        const { data: totalData, error: totalError } = await this.supabase
            .from('movies')
            .select('id', { count: 'exact' });

        if (totalError) {
            console.log(`[ERROR] 전체 수 조회 실패: ${totalError.message}`);
            return;
        }

        this.totalMovies = totalData.length;
        console.log(`[INFO] 전체 영화 수: ${this.totalMovies}개`);
        console.log('[TARGET] 검증 기준: 외국/한국 영화 감독/배우 매칭 오류 탐지\n');

        while (offset < this.totalMovies) {
            console.log(`[PACKAGE] 배치 ${Math.floor(offset / batchSize) + 1} 검증 중... (${offset + 1} ~ ${Math.min(offset + batchSize, this.totalMovies)})`);

            const { data: movies, error } = await this.supabase
                .from('movies')
                .select('*')
                .range(offset, offset + batchSize - 1)
                .order('id');

            if (error) {
                console.log(`[ERROR] 배치 조회 실패: ${error.message}`);
                offset += batchSize;
                continue;
            }

            for (const movie of movies) {
                this.checkedCount++;
                
                // 알 수 없음 데이터는 스킵
                if (movie.director === '알 수 없음' || 
                    (movie.cast_members && movie.cast_members.includes('알 수 없음'))) {
                    continue;
                }

                // 문제 데이터 탐지
                const problems = this.detectMismatchedData(movie);
                
                if (problems.length > 0) {
                    this.problemMovies.push({
                        id: movie.id,
                        title: movie.title,
                        director: movie.director,
                        cast_members: movie.cast_members || [],
                        genre: movie.genre,
                        release_year: movie.release_year,
                        problems: problems
                    });

                    console.log(`   [WARN] ID ${movie.id}: "${movie.title}" - ${problems.length}개 문제 발견`);
                    problems.forEach(problem => {
                        console.log(`      🚨 ${problem.reason}`);
                    });
                }

                // 진행률 표시
                if (this.checkedCount % 500 === 0) {
                    const progress = Math.round((this.checkedCount / this.totalMovies) * 100);
                    console.log(`   📈 진행률: ${this.checkedCount}/${this.totalMovies} (${progress}%) - 문제 영화: ${this.problemMovies.length}개`);
                }
            }

            offset += batchSize;
            await this.delay(100); // 서버 부하 방지
        }

        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('[INFO] 전체 데이터베이스 검증 결과');
        console.log('='.repeat(80));
        console.log(`[MOVIE] 전체 검사한 영화: ${this.checkedCount}개`);
        console.log(`[ERROR] 문제 발견된 영화: ${this.problemMovies.length}개`);
        console.log(`[SUCCESS] 정상 영화: ${this.checkedCount - this.problemMovies.length}개`);
        console.log(`[INFO] 데이터 정확도: ${Math.round(((this.checkedCount - this.problemMovies.length) / this.checkedCount) * 100)}%`);

        if (this.problemMovies.length > 0) {
            console.log('\n🚨 주요 문제점들:');
            
            // 문제 유형별 분류
            const problemTypes = {};
            this.problemMovies.forEach(movie => {
                movie.problems.forEach(problem => {
                    if (!problemTypes[problem.type]) {
                        problemTypes[problem.type] = 0;
                    }
                    problemTypes[problem.type]++;
                });
            });

            Object.entries(problemTypes).forEach(([type, count]) => {
                const typeNames = {
                    'foreign_movie_korean_director': '외국 영화에 한국 감독 잘못 배정',
                    'foreign_movie_korean_actors': '외국 영화에 한국 배우 잘못 배정',
                    'korean_movie_foreign_director': '한국 영화에 외국 감독 잘못 배정'
                };
                console.log(`   ${typeNames[type] || type}: ${count}개`);
            });

            console.log('\n[FORM] 문제 영화 샘플 (처음 20개):');
            this.problemMovies.slice(0, 20).forEach((movie, index) => {
                console.log(`${index + 1}. ID ${movie.id}: "${movie.title}"`);
                console.log(`   감독: ${movie.director} | 출연진: ${movie.cast_members.slice(0, 3).join(', ')}`);
                console.log(`   문제: ${movie.problems[0].reason}`);
                console.log('');
            });

            // 문제 영화 목록을 파일로 저장
            this.saveProblemsToFile();
        }

        console.log('\n[TIP] 다음 단계:');
        console.log('1. 실제 영화 API/크롤링으로 정확한 정보 수집');
        console.log('2. 문제 영화들을 실제 데이터로 일괄 교체');
        console.log('3. 전체 데이터 재검증');
    }

    async saveProblemsToFile() {
        const fs = require('fs');
        const problemData = {
            총검사영화수: this.checkedCount,
            문제영화수: this.problemMovies.length,
            검증일시: new Date().toISOString(),
            문제영화목록: this.problemMovies.map(movie => ({
                id: movie.id,
                title: movie.title,
                director: movie.director,
                cast_members: movie.cast_members,
                problems: movie.problems.map(p => p.reason)
            }))
        };

        const filename = `problem-movies-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(problemData, null, 2), 'utf8');
        console.log(`\n💾 문제 영화 목록이 ${filename}에 저장되었습니다.`);
    }

    async run() {
        console.log('🚨 전체 데이터베이스 포괄적 검증 시작! 🚨');
        console.log('[TARGET] 목표: 모든 잘못된 데이터 식별 및 분류\n');
        
        await this.checkAllMovies();
        
        console.log('\n[FIRE] 검증 완료! 다음은 실제 데이터로 교체 작업입니다.');
    }
}

// 실행
const verifier = new ComprehensiveDataVerifier();
verifier.run().catch(console.error);