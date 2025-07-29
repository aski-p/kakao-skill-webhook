// 대량 업데이트 후 데이터베이스 재검증
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dpmoafgaysocfjxlmaum.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbW9hZmdheXNvY2ZqeGxtYXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2NDMzMSwiZXhwIjoyMDY3MDQwMzMxfQ.G2woWTLhGpc0FOEyfABZs7k1wYTSYCaDeYhYtpoY73c';

class PostUpdateVerifier {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // 검증된 실제 영화 데이터 (정답 셋)
        this.verifiedMovies = {
            '기생충': { director: '봉준호', actors: ['송강호', '이선균', '조여정'] },
            '파묘': { director: '장재현', actors: ['최민식', '김고은', '유해진'] },
            '아마추어': { director: '신아가', actors: ['이수연', '이효제', '권해효'] },
            '탑건: 매버릭': { director: '조셉 코신스키', actors: ['톰 크루즈', '마일스 텔러'] },
            '범죄도시4': { director: '허명행', actors: ['마동석', '김무열'] },
            '어벤져스': { director: '조스 웨던', actors: ['로버트 다우니 주니어', '크리스 에반스'] },
            '겨울왕국': { director: '크리스 벅', actors: ['크리스틴 벨', '이디나 멘젤'] },
            '토이 스토리': { director: '존 라세터', actors: ['톰 행크스', '팀 앨런'] },
            '쥬라기 공원': { director: '스티븐 스필버그', actors: ['샘 닐', '로라 던'] },
            '인디아나 존스: 레이더스': { director: '스티븐 스필버그', actors: ['해리슨 포드'] },
            '존 윅': { director: '채드 스타헬스키', actors: ['키아누 리브스'] },
            '극한직업': { director: '이병헌', actors: ['류승룡', '이하늬'] },
            '명량': { director: '김한민', actors: ['최민식', '류승룡'] },
            '올드보이': { director: '박찬욱', actors: ['최민식', '유지태'] },
            '인셉션': { director: '크리스토퍼 놀란', actors: ['레오나르도 디카프리오'] },
            '타이타닉': { director: '제임스 카메론', actors: ['레오나르도 디카프리오', '케이트 윈슬렛'] }
        };

        // 알려진 외국 영화들 (한국어 제목이어도)
        this.knownForeignMovies = [
            '아바타', '아바타: 물의 길', '인터스텔라', '덩케르크', '미지와의 조우',
            '쉰들러 리스트', '저수지의 개들', '우주전쟁', '나폴레옹', '인디아나 존스',
            '어벤져스', '스파이더맨', '배트맨', '아이언맨', '토르', '쥬라기 공원',
            '타이타닉', '인셉션', '매트릭스', '터미네이터', '트랜스포머', '겨울왕국',
            '토이 스토리', '라이온 킹', '니모를 찾아서', '몬스터 주식회사'
        ];

        this.issues = [];
        this.totalChecked = 0;
        this.accurateCount = 0;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 영화 분류 (한국/외국)
    classifyMovie(title) {
        // 명확히 알려진 외국 영화
        if (this.knownForeignMovies.some(movie => title.includes(movie))) {
            return 'foreign';
        }
        
        // 한국어가 포함되어 있으면 한국 영화 (외국 영화 제외 후)
        if (/[가-힣]/.test(title)) {
            return 'korean';
        }
        
        return 'foreign';
    }

    // 감독/배우가 영화 국적과 매치되는지 확인
    validateMovieData(movie) {
        const issues = [];
        const movieType = this.classifyMovie(movie.title);
        
        // 검증된 영화인지 확인
        if (this.verifiedMovies[movie.title]) {
            const verified = this.verifiedMovies[movie.title];
            
            if (movie.director !== verified.director) {
                issues.push({
                    type: 'incorrect_director',
                    expected: verified.director,
                    actual: movie.director,
                    severity: 'high'
                });
            }
            
            // 주요 배우들이 포함되어 있는지 확인
            const hasMainActors = verified.actors.some(actor => 
                movie.cast_members && movie.cast_members.includes(actor)
            );
            
            if (!hasMainActors) {
                issues.push({
                    type: 'missing_main_actors',
                    expected: verified.actors,
                    actual: movie.cast_members,
                    severity: 'medium'
                });
            }
        }

        // 일반적인 국적 매칭 확인
        const koreanDirectors = [
            '박찬욱', '봉준호', '김지운', '나홍진', '최동훈', '윤종빈', '장준환',
            '김성훈', '허진호', '김태용', '이준익', '김용화', '강제규', '김한민',
            '류승완', '곽경택', '강형철', '심성보', '김대승', '이정범', '박흥식',
            '이창동', '임권택', '허명행', '신아가', '장재현', '김의석', '이충현'
        ];

        const foreignDirectors = [
            '크리스토퍼 놀란', '스티븐 스필버그', '마틴 스코세이지', '쿠엔틴 타란티노',
            '제임스 카메론', '리들리 스콧', '데니스 빌뇌브', '조던 필', '가이 리치',
            '조스 웨던', '케빈 파이기', '존 라세터', '채드 스타헬스키', '조셉 코신스키'
        ];

        // 한국 영화에 외국 감독이 잘못 배정된 경우
        if (movieType === 'korean' && foreignDirectors.includes(movie.director)) {
            issues.push({
                type: 'korean_movie_foreign_director',
                reason: `한국 영화 "${movie.title}"에 외국 감독 "${movie.director}" 배정`,
                severity: 'high'
            });
        }

        // 외국 영화에 한국 감독이 잘못 배정된 경우
        if (movieType === 'foreign' && koreanDirectors.includes(movie.director)) {
            issues.push({
                type: 'foreign_movie_korean_director',
                reason: `외국 영화 "${movie.title}"에 한국 감독 "${movie.director}" 배정`,
                severity: 'high'
            });
        }

        return issues;
    }

    // 가짜 리뷰어 확인
    async checkFakeReviewers() {
        console.log('\n🔍 가짜 리뷰어 확인...');
        
        const fakeReviewers = ['김영화평론가', '박시네마리뷰'];
        
        const { data: fakeReviews, error } = await this.supabase
            .from('critic_reviews')
            .select('id, movie_id, critic_name')
            .in('critic_name', fakeReviewers);

        if (error) {
            console.log(`❌ 리뷰 조회 실패: ${error.message}`);
            return;
        }

        if (fakeReviews && fakeReviews.length > 0) {
            console.log(`🚨 가짜 리뷰어 발견: ${fakeReviews.length}개`);
            fakeReviews.forEach(review => {
                console.log(`   - ${review.critic_name} (영화 ID: ${review.movie_id})`);
            });
        } else {
            console.log('✅ 가짜 리뷰어 없음');
        }
    }

    // "알 수 없음" 데이터 현황
    async checkUnknownData() {
        console.log('\n📊 "알 수 없음" 데이터 현황...');
        
        const { data: unknownMovies, error } = await this.supabase
            .from('movies')
            .select('id', { count: 'exact' })
            .eq('director', '알 수 없음');

        if (error) {
            console.log(`❌ 조회 실패: ${error.message}`);
            return;
        }

        const unknownCount = unknownMovies?.length || 0;
        console.log(`📋 "알 수 없음" 감독: ${unknownCount}개`);
        
        return unknownCount;
    }

    // 샘플 검증
    async verifySampleMovies() {
        console.log('\n🎯 샘플 영화 검증...');
        
        const sampleTitles = Object.keys(this.verifiedMovies);
        
        for (const title of sampleTitles) {
            const { data: movies, error } = await this.supabase
                .from('movies')
                .select('*')
                .eq('title', title)
                .limit(1);

            if (error) {
                console.log(`❌ "${title}" 조회 실패: ${error.message}`);
                continue;
            }

            if (!movies || movies.length === 0) {
                console.log(`⚠️ "${title}" 데이터베이스에 없음`);
                continue;
            }

            const movie = movies[0];
            const verified = this.verifiedMovies[title];
            
            console.log(`\n🎬 "${title}" 검증:`);
            console.log(`   실제 감독: ${verified.director}`);
            console.log(`   DB 감독: ${movie.director}`);
            console.log(`   매치: ${movie.director === verified.director ? '✅' : '❌'}`);
            
            if (movie.director === verified.director) {
                this.accurateCount++;
            } else {
                this.issues.push({
                    id: movie.id,
                    title: movie.title,
                    issue: `감독 불일치: "${movie.director}" → "${verified.director}"`
                });
            }
            
            this.totalChecked++;
        }
    }

    // 전체 데이터 품질 검사
    async performQualityCheck() {
        console.log('\n🔍 전체 데이터 품질 검사...');
        
        let offset = 0;
        const batchSize = 100;
        let totalMovies = 0;
        let issueCount = 0;
        
        // 전체 영화 수 확인
        const { data: totalData } = await this.supabase
            .from('movies')
            .select('id', { count: 'exact' });
        
        totalMovies = totalData?.length || 0;
        console.log(`📊 전체 영화 수: ${totalMovies}개`);
        
        while (offset < totalMovies) {
            const { data: movies, error } = await this.supabase
                .from('movies')
                .select('*')
                .range(offset, offset + batchSize - 1);
            
            if (error) {
                console.log(`❌ 배치 조회 실패: ${error.message}`);
                break;
            }
            
            for (const movie of movies) {
                if (movie.director === '알 수 없음') continue;
                
                const movieIssues = this.validateMovieData(movie);
                if (movieIssues.length > 0) {
                    issueCount++;
                    if (issueCount <= 10) { // 처음 10개만 로그
                        console.log(`⚠️ ID ${movie.id}: "${movie.title}"`);
                        movieIssues.forEach(issue => {
                            console.log(`   ${issue.reason || issue.type}`);
                        });
                    }
                }
            }
            
            offset += batchSize;
            
            if (offset % 1000 === 0) {
                console.log(`📈 진행률: ${offset}/${totalMovies} - 문제: ${issueCount}개`);
            }
            
            await this.delay(100);
        }
        
        console.log(`\n📊 품질 검사 결과:`);
        console.log(`   검사된 영화: ${totalMovies}개`);
        console.log(`   문제 영화: ${issueCount}개`);
        console.log(`   정확도: ${Math.round(((totalMovies - issueCount) / totalMovies) * 100)}%`);
    }

    async run() {
        console.log('🔍 대량 업데이트 후 데이터베이스 검증 시작!');
        console.log('='.repeat(60));
        
        // 1. 가짜 리뷰어 확인
        await this.checkFakeReviewers();
        
        // 2. "알 수 없음" 데이터 현황
        const unknownCount = await this.checkUnknownData();
        
        // 3. 검증된 샘플 영화들 확인
        await this.verifySampleMovies();
        
        // 4. 전체 품질 검사 (간단 버전)
        await this.performQualityCheck();
        
        // 최종 결과
        console.log('\n' + '='.repeat(60));
        console.log('📊 최종 검증 결과');
        console.log('='.repeat(60));
        
        const sampleAccuracy = this.totalChecked > 0 ? 
            Math.round((this.accurateCount / this.totalChecked) * 100) : 0;
        
        console.log(`🎬 샘플 영화 정확도: ${this.accurateCount}/${this.totalChecked} (${sampleAccuracy}%)`);
        console.log(`📋 남은 "알 수 없음": ${unknownCount}개`);
        
        if (this.issues.length > 0) {
            console.log(`\n🚨 발견된 문제들:`);
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ID ${issue.id}: ${issue.issue}`);
            });
        } else {
            console.log('\n✅ 검증된 샘플 영화들은 모두 정확합니다!');
        }
        
        console.log('\n💡 권장사항:');
        if (unknownCount > 0) {
            console.log(`- 남은 ${unknownCount}개 "알 수 없음" 영화 업데이트`);
        }
        if (this.issues.length > 0) {
            console.log(`- ${this.issues.length}개 문제 영화 수정`);
        }
        console.log('- 전체 데이터 재검증 후 품질 보고서 생성');
    }
}

// 실행
const verifier = new PostUpdateVerifier();
verifier.run().catch(console.error);