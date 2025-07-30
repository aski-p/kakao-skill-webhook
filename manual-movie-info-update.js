// 잘 알려진 영화들의 감독과 출연진 정보를 직접 업데이트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

class ManualMovieInfoUpdater {
    constructor() {
        // 잘 알려진 영화들의 정확한 정보
        this.movieData = [
            // 한국 영화
            {
                title: '파묘',
                director: '장재현',
                cast_members: ['최민식', '김고은', '유해진', '이도현']
            },
            {
                title: '기생충',
                director: '봉준호',
                cast_members: ['송강호', '이선균', '조여정', '최우식', '박소담']
            },
            {
                title: '범죄도시4',
                director: '허명행',
                cast_members: ['마동석', '김무열', '이동휘', '박지환']
            },
            {
                title: '범죄도시3',
                director: '이상용',
                cast_members: ['마동석', '이준혁', '무라야마 아오키']
            },
            {
                title: '범죄도시2',
                director: '이상용',
                cast_members: ['마동석', '손석구', '최귀화']
            },
            {
                title: '범죄도시',
                director: '강윤성',
                cast_members: ['마동석', '윤계상', '조재윤']
            },
            {
                title: '서울의 봄',
                director: '김성수',
                cast_members: ['황정민', '정우성', '이성민', '박해준', '김성균']
            },
            {
                title: '올드보이',
                director: '박찬욱',
                cast_members: ['최민식', '유지태', '강혜정', '김병옥']
            },
            {
                title: '아가씨',
                director: '박찬욱',
                cast_members: ['김민희', '김태리', '하정우', '조진웅']
            },
            {
                title: '곡성',
                director: '나홍진',
                cast_members: ['곽도원', '황정민', '천우희', '국무성']
            },
            {
                title: '헤어질 결심',
                director: '박찬욱',
                cast_members: ['박해일', '탕웨이', '이정현', '고경표']
            },
            {
                title: '한산: 용의 출현',
                director: '김한민',
                cast_members: ['박해일', '변요한', '안성기', '손현주']
            },
            {
                title: '모가디슈',
                director: '류승완',
                cast_members: ['김윤석', '조인성', '허준호', '구교환']
            },
            {
                title: '승리호',
                director: '조성희',
                cast_members: ['송중기', '김태리', '진선규', '유해진']
            },
            {
                title: '반도',
                director: '연상호',
                cast_members: ['강동원', '이정현', '권해효', '김민재']
            },
            {
                title: '부산행',
                director: '연상호',
                cast_members: ['공유', '정유미', '마동석', '김수안']
            },
            {
                title: '극한직업',
                director: '이병헌',
                cast_members: ['류승룡', '이하늬', '진선규', '이동휘']
            },
            {
                title: '베테랑',
                director: '류승완',
                cast_members: ['황정민', '유아인', '유해진', '오달수']
            },
            {
                title: '택시운전사',
                director: '장훈',
                cast_members: ['송강호', '토마스 크레치만', '유해진', '류준열']
            },
            {
                title: '1987',
                director: '장준환',
                cast_members: ['김윤석', '하정우', '유해진', '김태리']
            },
            {
                title: '신과함께-죄와 벌',
                director: '김용화',
                cast_members: ['하정우', '차태현', '주지훈', '김향기']
            },
            {
                title: '터널',
                director: '김성훈',
                cast_members: ['하정우', '배두나', '오달수', '신정근']
            },
            {
                title: '밀정',
                director: '김지운',
                cast_members: ['송강호', '공유', '한지민', '엄태구']
            },
            {
                title: '암살',
                director: '최동훈',
                cast_members: ['전지현', '이정재', '하정우', '오달수']
            },
            {
                title: '명량',
                director: '김한민',
                cast_members: ['최민식', '류승룡', '조진웅', '진구']
            },
            {
                title: '국제시장',
                director: '윤제균',
                cast_members: ['황정민', '김윤진', '오달수', '정진영']
            },

            // 해외 영화
            {
                title: '아바타: 물의 길',
                director: '제임스 카메론',
                cast_members: ['샘 워딩턴', '조 샐다나', '케이트 윈슬릿', '시고니 위버']
            },
            {
                title: '아바타',
                director: '제임스 카메론',
                cast_members: ['샘 워딩턴', '조 샐다나', '미셸 로드리게스', '시고니 위버']
            },
            {
                title: '탑건: 매버릭',
                director: '조셉 코신스키',
                cast_members: ['톰 크루즈', '마일스 텔러', '제니퍼 코넬리', '존 햄']
            },
            {
                title: '탑건',
                director: '토니 스콧',
                cast_members: ['톰 크루즈', '켈리 맥길리스', '발 킬머', '안소니 에드워즈']
            },
            {
                title: '스파이더맨: 노 웨이 홈',
                director: '존 왓츠',
                cast_members: ['톰 홀랜드', '젠데이아', '윌렘 데포', '토비 맥과이어']
            },
            {
                title: '어벤져스: 엔드게임',
                director: '안소니 루소',
                cast_members: ['로버트 다우니 주니어', '크리스 에반스', '스칼릿 요한슨', '마크 러팔로']
            },
            {
                title: '어벤져스: 인피니티 워',
                director: '안소니 루소',
                cast_members: ['로버트 다우니 주니어', '크리스 헴스워스', '마크 러팔로', '크리스 에반스']
            },
            {
                title: '인터스텔라',
                director: '크리스토퍼 놀란',
                cast_members: ['매슈 매코너히', '앤 해서웨이', '제시카 차스테인', '빌 어윈']
            },
            {
                title: '인셉션',
                director: '크리스토퍼 놀란',
                cast_members: ['레오나르도 디카프리오', '마리옹 코티야르', '조제프 고든레빗', '엘런 페이지']
            },
            {
                title: '다크 나이트',
                director: '크리스토퍼 놀란',
                cast_members: ['크리스찬 베일', '히스 레저', '아론 에크하트', '마이클 케인']
            },
            {
                title: '타이타닉',
                director: '제임스 카메론',
                cast_members: ['레오나르도 디카프리오', '케이트 윈슬릿', '빌리 제인', '글로리아 스튜어트']
            },
            {
                title: '포레스트 검프',
                director: '로버트 저메키스',
                cast_members: ['톰 행크스', '로빈 라이트', '게리 시니즈', '샐리 필드']
            },
            {
                title: '펄프 픽션',
                director: '쿠엔틴 타란티노',
                cast_members: ['존 트라볼타', '사무엘 L. 잭슨', '우마 서먼', '브루스 윌리스']
            },
            {
                title: '매트릭스',
                director: '워쇼스키 자매',
                cast_members: ['키아누 리브스', '로렌스 피시번', '캐리 앤 모스', '휴고 위빙']
            },
            {
                title: '아이언맨',
                director: '존 패브로',
                cast_members: ['로버트 다우니 주니어', '기네스 팰트로', '제프 브리지스', '테렌스 하워드']
            },
            {
                title: '캡틴 아메리카: 시빌 워',
                director: '안소니 루소',
                cast_members: ['크리스 에반스', '로버트 다우니 주니어', '스칼릿 요한슨', '세바스찬 스탠']
            },
            {
                title: '겨울왕국',
                director: '크리스 벅',
                cast_members: ['크리스틴 벨', '이디나 멘젤', '조시 개드', '조나단 그로프']
            },
            {
                title: '겨울왕국 2',
                director: '크리스 벅',
                cast_members: ['크리스틴 벨', '이디나 멘젤', '조시 개드', '조나단 그로프']
            },
            {
                title: '토이 스토리',
                director: '존 래서터',
                cast_members: ['톰 행크스', '팀 앨런', '돈 릭클스', '짐 바니']
            },
            {
                title: '주토피아',
                director: '바이런 하워드',
                cast_members: ['지니퍼 굿윈', '제이슨 베이트먼', '이드리스 엘바', '니트 벨']
            },
            {
                title: '스즈메의 문단속',
                director: '신카이 마코토',
                cast_members: ['하라 나나미', '마츠무라 호쿠토', '후카츠 에리', '하나자와 카나']
            }
        ];
    }

    async updateMovie(movieInfo) {
        try {
            console.log(`[MOVIE] ${movieInfo.title} 정보 업데이트 중...`);
            
            // 해당 제목의 영화 찾기
            const { data: existingMovies, error: findError } = await supabase
                .from('movies')
                .select('id, title, director, cast_members')
                .eq('title', movieInfo.title);
            
            if (findError) {
                console.log(`   [WARN] 검색 실패:`, findError.message);
                return false;
            }
            
            if (!existingMovies || existingMovies.length === 0) {
                console.log(`   [ERROR] 영화를 찾을 수 없음`);
                return false;
            }
            
            const movie = existingMovies[0];
            console.log(`   [LOCATION] 영화 ID: ${movie.id}`);
            console.log(`   [FORM] 기존 정보 - 감독: ${movie.director || '없음'}, 출연: ${movie.cast_members ? movie.cast_members.join(', ') : '없음'}`);
            
            // 업데이트할 정보 준비
            const updateData = {};
            
            // 감독 정보 업데이트 (비어있거나 "알 수 없음"인 경우)
            if (!movie.director || movie.director.trim() === '' || movie.director === '알 수 없음' || movie.director === 'Unknown') {
                updateData.director = movieInfo.director;
            }
            
            // 출연진 정보 업데이트 (비어있거나 "알 수 없음"인 경우)
            if (!movie.cast_members || movie.cast_members.length === 0 || 
                (Array.isArray(movie.cast_members) && movie.cast_members.some(cast => cast === '알 수 없음' || cast === 'Unknown'))) {
                updateData.cast_members = movieInfo.cast_members;
            }
            
            if (Object.keys(updateData).length === 0) {
                console.log(`   ⏭️ 이미 정보가 완전함`);
                return true;
            }
            
            // 데이터베이스 업데이트
            const { error: updateError } = await supabase
                .from('movies')
                .update(updateData)
                .eq('id', movie.id);
            
            if (updateError) {
                console.log(`   [ERROR] 업데이트 실패:`, updateError.message);
                return false;
            }
            
            console.log(`   [SUCCESS] 업데이트 완료!`);
            console.log(`   [MEMO] 새 정보 - 감독: ${updateData.director || movie.director}, 출연: ${updateData.cast_members ? updateData.cast_members.join(', ') : movie.cast_members.join(', ')}`);
            
            return true;
            
        } catch (error) {
            console.log(`   [ERROR] 오류 발생:`, error.message);
            return false;
        }
    }

    async run() {
        console.log('🚀 영화 정보 수동 업데이트 시작...');
        console.log(`[INFO] 총 ${this.movieData.length}개 영화 정보 업데이트 예정\n`);
        
        let updatedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < this.movieData.length; i++) {
            const movieInfo = this.movieData[i];
            
            const result = await this.updateMovie(movieInfo);
            
            if (result === true) {
                if (i === this.movieData.length - 1) { // 마지막이면 업데이트된 것
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                failedCount++;
            }
            
            // 진행률 표시
            const progress = Math.round(((i + 1) / this.movieData.length) * 100);
            console.log(`📈 진행률: ${i + 1}/${this.movieData.length} (${progress}%)\n`);
        }
        
        // 실제 업데이트된 수 다시 계산
        updatedCount = this.movieData.length - skippedCount - failedCount;
        
        // 최종 통계
        const { count: totalMovies } = await supabase
            .from('movies')
            .select('*', { count: 'exact', head: true });
        
        console.log('='.repeat(60));
        console.log('[PARTY] 영화 정보 수동 업데이트 완료!');
        console.log('='.repeat(60));
        console.log(`[MOVIE] 전체 영화 수: ${totalMovies}개`);
        console.log(`[SUCCESS] 성공적으로 업데이트: ${updatedCount}개`);
        console.log(`⏭️ 이미 정보가 있어서 스킵: ${skippedCount}개`);
        console.log(`[ERROR] 업데이트 실패: ${failedCount}개`);
        console.log(`[INFO] 성공률: ${Math.round(((updatedCount + skippedCount) / this.movieData.length) * 100)}%`);
        console.log('\n[TIP] 주요 영화들의 감독과 출연진 정보가 정확하게 업데이트되었습니다!');
        console.log('[SEARCH] 이제 "파묘 감독은 누구야?", "기생충 출연진 알려줘" 등을 정확하게 확인할 수 있습니다.');
        
        // 샘플 확인
        console.log('\n[MEMO] 업데이트된 영화 샘플 확인:');
        const sampleTitles = ['파묘', '기생충', '탑건: 매버릭'];
        
        for (const title of sampleTitles) {
            const { data: movie } = await supabase
                .from('movies')
                .select('title, director, cast_members')
                .eq('title', title)
                .limit(1);
            
            if (movie && movie.length > 0) {
                const m = movie[0];
                console.log(`   [SUCCESS] ${m.title}: ${m.director} 감독, 출연진: ${m.cast_members ? m.cast_members.join(', ') : '정보없음'}`);
            }
        }
    }
}

// 실행
const updater = new ManualMovieInfoUpdater();
updater.run().catch(console.error);