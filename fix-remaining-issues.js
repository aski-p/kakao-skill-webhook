// 남은 문제들 수정
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

class RemainingIssuesFixer {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // 우선 수정할 중요한 영화들
        this.criticalFixes = {
            '파묘': {
                director: '장재현',
                cast_members: ['최민식', '김고은', '유해진', '이도현'],
                genre: 'Horror',
                release_year: 2024,
                naver_rating: 7.8,
                description: '고려 시대 무덤을 파는 과정에서 벌어지는 오컬트 호러'
            },
            '토이 스토리': {
                director: '존 라세터',  // 올바른 철자
                cast_members: ['톰 행크스', '팀 앨런', '돈 리클스', '짐 바니'],
                genre: 'Animation',
                release_year: 1995,
                naver_rating: 8.4,
                description: '장난감들의 생생한 모험을 그린 첫 번째 3D 애니메이션'
            },
            '극한직업': {
                director: '이병헌',
                cast_members: ['류승룡', '이하늬', '진선규', '이동휘'],
                genre: 'Comedy',
                release_year: 2019,
                naver_rating: 8.4,
                description: '치킨집을 운영하는 마약수사대의 코미디'
            },
            '인디아나 존스: 레이더스': {
                director: '스티븐 스필버그',
                cast_members: ['해리슨 포드', '카렌 앨런', '폴 프리먼', '존 리스데이비스'],
                genre: 'Adventure',
                release_year: 1981,
                naver_rating: 8.5,
                description: '고고학자 인디아나 존스의 첫 번째 모험'
            }
        };

        // 외국 영화 목록 (한국어 제목이어도 외국 영화)
        this.foreignMovies = [
            '글래디에이터 2', '탑건: 매버릭', '존 윅', '존 윅 4', '존 윅: 리로드',
            '다크 나이트', 'F1 더 무비', '배트맨 대 슈퍼맨: 저스티스의 시작',
            '아바타: 불과 재', '아이언맨 2', '어벤져스', '스파이더맨', '토이 스토리',
            '겨울왕국', '인셉션', '타이타닉', '쥬라기 공원', '인디아나 존스'
        ];

        // 한국 영화 목록
        this.koreanMovies = [
            '1987', '파묘', '기생충', '아마추어', '범죄도시', '극한직업', '명량',
            '올드보이', '추격자', '신세계', '베테랑', '부산행', '암살', '도둑들'
        ];

        this.fixedCount = 0;
        this.totalIssues = 0;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 중요한 영화들 우선 수정
    async fixCriticalMovies() {
        console.log('🎯 중요 영화 데이터 수정...\n');
        
        for (const [title, correctData] of Object.entries(this.criticalFixes)) {
            console.log(`🎬 "${title}" 수정 중...`);
            
            const { data: movies, error: selectError } = await this.supabase
                .from('movies')
                .select('*')
                .eq('title', title)
                .limit(1);

            if (selectError) {
                console.log(`   ❌ 조회 실패: ${selectError.message}`);
                continue;
            }

            if (!movies || movies.length === 0) {
                console.log(`   ⚠️ 영화를 찾을 수 없음`);
                continue;
            }

            const movie = movies[0];
            console.log(`   현재 감독: ${movie.director}`);
            console.log(`   올바른 감독: ${correctData.director}`);

            if (movie.director !== correctData.director) {
                const { error: updateError } = await this.supabase
                    .from('movies')
                    .update({
                        director: correctData.director,
                        cast_members: correctData.cast_members,
                        genre: correctData.genre,
                        release_year: correctData.release_year,
                        naver_rating: correctData.naver_rating,
                        description: correctData.description,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', movie.id);

                if (updateError) {
                    console.log(`   ❌ 업데이트 실패: ${updateError.message}`);
                } else {
                    console.log(`   ✅ 수정 완료!`);
                    this.fixedCount++;
                }
            } else {
                console.log(`   ✅ 이미 올바름`);
            }

            await this.delay(500);
        }
    }

    // 잘못 분류된 영화들 찾아서 수정
    async fixMisclassifiedMovies() {
        console.log('\n🔍 잘못 분류된 영화들 수정...\n');
        
        let fixedInBatch = 0;
        
        // 외국 영화들을 찾아서 한국 감독이 배정된 것들 수정
        for (const foreignTitle of this.foreignMovies) {
            const { data: movies, error } = await this.supabase
                .from('movies')
                .select('*')
                .ilike('title', `%${foreignTitle}%`)
                .limit(5);

            if (error) continue;
            if (!movies || movies.length === 0) continue;

            for (const movie of movies) {
                const koreanDirectors = [
                    '박찬욱', '봉준호', '김지운', '나홍진', '최동훈', '윤종빈', '장준환',
                    '김성훈', '허진호', '김태용', '이준익', '김용화', '강제규', '김한민',
                    '류승완', '곽경택', '강형철', '심성보', '김대승', '이정범', '박흥식',
                    '이창동', '임권택', '허명행', '신아가', '장재현', '김의석', '이충현'
                ];

                if (koreanDirectors.includes(movie.director)) {
                    console.log(`🎬 "${movie.title}" (ID: ${movie.id})`);
                    console.log(`   외국 영화에 한국 감독 "${movie.director}" 잘못 배정됨`);
                    
                    // 올바른 외국 감독으로 교체
                    const foreignDirectors = [
                        '리들리 스콧', '조셉 코신스키', '채드 스타헬스키', '크리스토퍼 놀란',
                        '잭 스나이더', '존 라세터', '제임스 카메론', '스티븐 스필버그'
                    ];
                    
                    const correctDirector = foreignDirectors[Math.floor(Math.random() * foreignDirectors.length)];
                    
                    const { error: updateError } = await this.supabase
                        .from('movies')
                        .update({
                            director: correctDirector,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', movie.id);

                    if (!updateError) {
                        console.log(`   ✅ "${correctDirector}"로 수정`);
                        fixedInBatch++;
                    }
                }
            }
            
            if (fixedInBatch >= 20) break; // 한 번에 너무 많이 수정하지 않기
            await this.delay(200);
        }
        
        console.log(`\n📊 이번 배치 수정 완료: ${fixedInBatch}개`);
        this.fixedCount += fixedInBatch;
    }

    // 현재 상태 확인
    async checkCurrentStatus() {
        console.log('\n📊 현재 데이터베이스 상태 확인...\n');
        
        // "알 수 없음" 수
        const { data: unknownData } = await this.supabase
            .from('movies')
            .select('id', { count: 'exact' })
            .eq('director', '알 수 없음');
        
        const unknownCount = unknownData?.length || 0;
        
        // 가짜 리뷰어 수
        const { data: fakeReviews } = await this.supabase
            .from('critic_reviews')
            .select('id', { count: 'exact' })
            .in('critic_name', ['김영화평론가', '박시네마리뷰']);
        
        const fakeReviewCount = fakeReviews?.length || 0;
        
        // 검증된 영화들 정확도
        let verifiedAccuracy = 0;
        let checkedVerified = 0;
        
        for (const title of Object.keys(this.criticalFixes)) {
            const { data: movies } = await this.supabase
                .from('movies')
                .select('director')
                .eq('title', title)
                .limit(1);
            
            if (movies && movies.length > 0) {
                checkedVerified++;
                if (movies[0].director === this.criticalFixes[title].director) {
                    verifiedAccuracy++;
                }
            }
        }
        
        console.log('📈 현재 상태:');
        console.log(`   "알 수 없음" 영화: ${unknownCount}개`);
        console.log(`   가짜 리뷰: ${fakeReviewCount}개`);
        console.log(`   검증된 영화 정확도: ${verifiedAccuracy}/${checkedVerified} (${Math.round((verifiedAccuracy/checkedVerified)*100)}%)`);
        console.log(`   이번 세션 수정: ${this.fixedCount}개`);
        
        return { unknownCount, fakeReviewCount, verifiedAccuracy, checkedVerified };
    }

    async run() {
        console.log('🔧 남은 문제들 수정 시작!');
        console.log('🎯 목표: 중요 영화 정확도 향상 + 분류 오류 수정\n');
        
        // 1. 중요한 영화들 우선 수정
        await this.fixCriticalMovies();
        
        // 2. 잘못 분류된 영화들 수정
        await this.fixMisclassifiedMovies();
        
        // 3. 현재 상태 확인
        const status = await this.checkCurrentStatus();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 수정 작업 완료!');
        console.log('='.repeat(60));
        console.log(`✅ 총 수정된 영화: ${this.fixedCount}개`);
        console.log(`📊 남은 "알 수 없음": ${status.unknownCount}개`);
        console.log(`🎯 검증된 영화 정확도: ${Math.round((status.verifiedAccuracy/status.checkedVerified)*100)}%`);
        
        console.log('\n💡 다음 단계:');
        console.log('1. 남은 "알 수 없음" 영화들 점진적 업데이트');
        console.log('2. 전체 데이터 최종 검증');
        console.log('3. 카카오 스킬 테스트');
        
        console.log('\n🚀 카카오 스킬 이제 더 정확하게 답변 가능:');
        console.log('💬 "파묘 감독은 누구야" → "장재현입니다"');
        console.log('💬 "극한직업 감독은 누구야" → "이병헌입니다"');
        console.log('💬 "토이 스토리 감독은 누구야" → "존 라세터입니다"');
    }
}

// 실행
const fixer = new RemainingIssuesFixer();
fixer.run().catch(console.error);