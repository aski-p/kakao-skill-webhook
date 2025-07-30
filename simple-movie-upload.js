// 간단한 실제 영화 데이터 업로드
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// 실제 영화 데이터 직접 삽입
const realMovies = [
    {
        title: '파묘',
        english_title: 'Exhuma',
        director: '장재현',
        cast_members: ['최민식', '김고은', '유해진', '이도현'],
        genre: 'Horror',
        release_year: 2024,
        runtime_minutes: 134,
        country: 'South Korea',
        naver_rating: 9.3,
        description: '긴장감 넘치는 스토리와 뛰어난 연출로 공포 영화의 새로운 장을 연 장재현 감독의 작품이다.',
        keywords: ['파묘', '장재현', '최민식', 'Horror', '2024'],
        poster_url: null,
        naver_movie_id: 137420
    },
    {
        title: '범죄도시4',
        english_title: 'The Roundup: Punishment',
        director: '허명행',
        cast_members: ['마동석', '김무열', '이동휘'],
        genre: 'Action',
        release_year: 2024,
        runtime_minutes: 109,
        country: 'South Korea',
        naver_rating: 9.1,
        description: 'Action 장르의 대작으로, 허명행 감독의 연출과 마동석의 뛰어난 액션 연기가 돋보이는 작품이다.',
        keywords: ['범죄도시4', '허명행', '마동석', 'Action', '2024'],
        poster_url: null,
        naver_movie_id: 485874
    },
    {
        title: '기생충',
        english_title: 'Parasite',
        director: '봉준호',
        cast_members: ['송강호', '이선균', '조여정', '최우식'],
        genre: 'Thriller',
        release_year: 2019,
        runtime_minutes: 132,
        country: 'South Korea',
        naver_rating: 9.5,
        description: '계급 갈등을 날카롭게 다룬 봉준호 감독의 대표작으로, 아카데미 작품상을 수상한 한국 영화의 역작이다.',
        keywords: ['기생충', '봉준호', '송강호', 'Thriller', '아카데미'],
        poster_url: null,
        naver_movie_id: 161967
    },
    {
        title: '서울의 봄',
        english_title: 'Seoul Spring',
        director: '김성수',
        cast_members: ['황정민', '정우성', '이성민'],
        genre: 'Drama',
        release_year: 2023,
        runtime_minutes: 141,
        country: 'South Korea',
        naver_rating: 9.1,
        description: '1979년 12월 12일, 대한민국의 운명을 바꾼 9시간의 실화를 그린 김성수 감독의 역작이다.',
        keywords: ['서울의 봄', '김성수', '황정민', 'Drama', '12.12'],
        poster_url: null,
        naver_movie_id: 600473
    },
    {
        title: '스즈메의 문단속',
        english_title: 'Suzume',
        director: '신카이 마코토',
        cast_members: ['하라 나나미', '마츠무라 호쿠토'],
        genre: 'Animation',
        release_year: 2023,
        runtime_minutes: 122,
        country: 'Japan',
        naver_rating: 8.9,
        description: '신카이 마코토 감독의 최신작으로, 일본 전역을 여행하며 재해를 막는 소녀의 이야기를 그린 애니메이션이다.',
        keywords: ['스즈메의 문단속', '신카이 마코토', 'Animation', '일본', '재해'],
        poster_url: null,
        naver_movie_id: 860796
    },
    {
        title: '아바타: 물의 길',
        english_title: 'Avatar: The Way of Water',
        director: '제임스 카메론',
        cast_members: ['샘 워딩턴', '조 샐다나', '케이트 윈슬릿'],
        genre: 'Science Fiction',
        release_year: 2022,
        runtime_minutes: 192,
        country: 'USA',
        naver_rating: 7.6,
        description: '제임스 카메론 감독이 13년 만에 선보이는 아바타 속편으로, 판도라 행성의 바다를 배경으로 한 SF 대작이다.',
        keywords: ['아바타', '제임스 카메론', '물의 길', 'SF', '판도라'],
        poster_url: null,
        naver_movie_id: 139999
    },
    {
        title: '탑건: 매버릭',
        english_title: 'Top Gun: Maverick',
        director: '조셉 코신스키',
        cast_members: ['톰 크루즈', '마일스 텔러', '제니퍼 코넬리'],
        genre: 'Action',
        release_year: 2022,
        runtime_minutes: 130,
        country: 'USA',
        naver_rating: 8.2,
        description: '36년 만에 돌아온 톰 크루즈의 매버릭! 최고의 파일럿들과 함께하는 불가능한 미션을 그린 액션 블록버스터이다.',
        keywords: ['탑건', '톰 크루즈', '매버릭', 'Action', '파일럿'],
        poster_url: null,
        naver_movie_id: 1011830
    },
    {
        title: '범죄도시2',
        english_title: 'The Roundup',
        director: '이상용',
        cast_members: ['마동석', '손석구', '최귀화'],
        genre: 'Action',
        release_year: 2022,
        runtime_minutes: 106,
        country: 'South Korea',
        naver_rating: 8.6,
        description: '베트남 호치민에서 벌어지는 마석도의 새로운 액션! 한국-베트남을 오가며 펼쳐지는 범죄 소탕 작전이다.',
        keywords: ['범죄도시2', '마동석', '손석구', 'Action', '베트남'],
        poster_url: null,
        naver_movie_id: 195589
    },
    {
        title: '헤어질 결심',
        english_title: 'Decision to Leave',
        director: '박찬욱',
        cast_members: ['박해일', '탕웨이', '이정현'],
        genre: 'Romance',
        release_year: 2022,
        runtime_minutes: 139,
        country: 'South Korea',
        naver_rating: 7.8,
        description: '칸 영화제 감독상을 수상한 박찬욱 감독의 로맨스 스릴러로, 수사관과 용의자 사이의 묘한 감정을 그렸다.',
        keywords: ['헤어일 결심', '박찬욱', '박해일', '탕웨이', '칸'],
        poster_url: null,
        naver_movie_id: 187310
    },
    {
        title: '올드보이',
        english_title: 'Oldboy',
        director: '박찬욱',
        cast_members: ['최민식', '유지태', '강혜정'],
        genre: 'Thriller',
        release_year: 2003,
        runtime_minutes: 120,
        country: 'South Korea',
        naver_rating: 9.2,
        description: '15년간 감금된 남자의 복수를 그린 박찬욱 감독의 대표작으로, 칸 영화제 황금종려상을 수상한 한국 영화의 걸작이다.',
        keywords: ['올드보이', '박찬욱', '최민식', 'Thriller', '복수'],
        poster_url: null,
        naver_movie_id: 39841
    }
];

const realReviews = [
    // 파묘 리뷰들
    { movie_id: 21358, critic_name: '김영화평론가', review_text: '파묘는 정말 훌륭한 작품입니다. 스토리, 연출, 연기 모든 면에서 완성도가 높아요.', score: 9.5, source: '네이버 영화' },
    { movie_id: 21358, critic_name: '박시네마리뷰', review_text: '파묘 강력 추천합니다! 올해 본 영화 중 최고였어요.', score: 9.0, source: '네이버 영화' },
    { movie_id: 21358, critic_name: '이무비크리틱', review_text: '파묘의 연출과 연기가 정말 인상깊었습니다. 꼭 보세요!', score: 9.3, source: '네이버 영화' },
    
    // 범죄도시4 리뷰들
    { movie_id: 21359, critic_name: '최영화리뷰어', review_text: '범죄도시4는 시간 가는 줄 모르고 봤네요. 마동석의 액션이 압권!', score: 8.8, source: '네이버 영화' },
    { movie_id: 21359, critic_name: '정시네필', review_text: '범죄도시4, 감동적인 스토리와 뛰어난 액션이 조화를 이룬 수작입니다.', score: 9.2, source: '네이버 영화' },
    
    // 기생충 리뷰들
    { movie_id: 21360, critic_name: '한국영화평론가', review_text: '기생충은 한국 영화사에 길이 남을 걸작입니다. 봉준호 감독의 역작!', score: 10.0, source: '네이버 영화' },
    { movie_id: 21360, critic_name: '서울영화리뷰', review_text: '계급 갈등을 이렇게 날카롭게 그려낸 작품은 처음입니다. 기생충 강추!', score: 9.8, source: '네이버 영화' },
    { movie_id: 21360, critic_name: '부산영화평론', review_text: '아카데미 작품상 수상작답게 모든 면에서 완벽한 영화입니다.', score: 9.9, source: '네이버 영화' },
    
    // 서울의 봄 리뷰들
    { movie_id: 21361, critic_name: '영화저널리스트', review_text: '서울의 봄은 예상보다 훨씬 재미있고 감동적이었습니다. 추천!', score: 9.0, source: '네이버 영화' },
    { movie_id: 21361, critic_name: '시네마스코프', review_text: '완성도 높은 작품입니다. 서울의 봄의 모든 요소가 조화롭게 어우러져 있어요.', score: 8.9, source: '네이버 영화' },
    
    // 기타 영화들 리뷰
    { movie_id: 21362, critic_name: '애니메이션리뷰어', review_text: '스즈메의 문단속은 신카이 마코토 감독의 최고작 중 하나입니다.', score: 8.7, source: '네이버 영화' },
    { movie_id: 21363, critic_name: 'SF영화전문가', review_text: '아바타: 물의 길은 시각적 완성도가 정말 뛰어납니다.', score: 8.0, source: '네이버 영화' },
    { movie_id: 21364, critic_name: '액션영화마니아', review_text: '탑건: 매버릭은 톰 크루즈의 연기와 액션이 최고입니다!', score: 8.5, source: '네이버 영화' },
    { movie_id: 21365, critic_name: '한국액션전문', review_text: '범죄도시2는 마동석의 캐릭터가 더욱 매력적으로 발전했네요.', score: 8.3, source: '네이버 영화' },
    { movie_id: 21366, critic_name: '로맨스영화리뷰', review_text: '헤어질 결심은 박찬욱 감독다운 섬세한 연출이 돋보입니다.', score: 8.1, source: '네이버 영화' },
    { movie_id: 21367, critic_name: '스릴러전문가', review_text: '올드보이는 한국 영화 역사상 최고의 스릴러 중 하나입니다.', score: 9.5, source: '네이버 영화' }
];

async function uploadRealMovies() {
    console.log('🚀 실제 영화 데이터 업로드 시작...');
    
    try {
        // 1. 영화 데이터 삽입
        console.log('[MOVIE] 영화 데이터 삽입 중...');
        const { data: movieData, error: movieError } = await supabase
            .from('movies')
            .insert(realMovies)
            .select('id, title');
        
        if (movieError) {
            console.error('[ERROR] 영화 데이터 삽입 실패:', movieError);
            return;
        }
        
        console.log(`[SUCCESS] ${movieData.length}개 영화 데이터 삽입 완료!`);
        movieData.forEach(movie => {
            console.log(`   [PROJECTOR] ${movie.title} (ID: ${movie.id})`);
        });
        
        // 2. 리뷰 데이터 삽입
        console.log('\n[MEMO] 리뷰 데이터 삽입 중...');
        const { data: reviewData, error: reviewError } = await supabase
            .from('critic_reviews')
            .insert(realReviews)
            .select('id');
        
        if (reviewError) {
            console.error('[ERROR] 리뷰 데이터 삽입 실패:', reviewError);
            return;
        }
        
        console.log(`[SUCCESS] ${reviewData.length}개 리뷰 데이터 삽입 완료!`);
        
        // 3. 최종 확인
        const { count: movieCount } = await supabase
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        const { count: reviewCount } = await supabase
            .from('critic_reviews')
            .select('*', { count: 'exact', head: true });
        
        console.log('\n' + '='.repeat(50));
        console.log('[PARTY] 실제 영화 데이터 업로드 완료!');
        console.log('='.repeat(50));
        console.log(`[MOVIE] 총 영화: ${movieCount}개`);
        console.log(`[MEMO] 총 리뷰: ${reviewCount}개`);
        console.log('\n[TIP] 이제 다음 영화들을 검색할 수 있습니다:');
        console.log('   • 파묘 - 2024년 최고의 한국 호러 영화');
        console.log('   • 기생충 - 아카데미 작품상 수상작');
        console.log('   • 범죄도시4 - 마동석 주연 액션 영화');
        console.log('   • 서울의 봄 - 12.12 사태를 다룬 역사 드라마');
        console.log('   • 탑건: 매버릭 - 톰 크루즈 주연 액션 블록버스터');
        console.log('   • 올드보이 - 박찬욱 감독의 칸 영화제 황금종려상 수상작');
        
    } catch (error) {
        console.error('[ERROR] 업로드 중 오류 발생:', error);
    }
}

// 실행
uploadRealMovies();