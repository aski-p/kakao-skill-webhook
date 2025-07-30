// 수집된 영화 데이터 요약 스크립트
const fs = require('fs');
const path = require('path');

const jsonFile = 'korean_movies_kofic_2025-07-28.json';

try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    console.log('[MOVIE] KOFIC 한국 영화 데이터 수집 결과 요약\n');
    console.log(`[TOMORROW] 수집 일시: ${new Date(data.collection_date).toLocaleString('ko-KR')}`);
    console.log(`[INFO] 총 수집 영화: ${data.total_movies}개\n`);
    
    console.log('[PROJECTOR] 수집된 영화 목록:');
    console.log('═'.repeat(60));
    
    data.movies.forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title} (${movie.release_year || '연도 미상'})`);
        console.log(`   감독: ${movie.director || '미상'}`);
        console.log(`   장르: ${movie.genre}`);
        if (movie.cast_members && movie.cast_members.length > 0) {
            console.log(`   주연: ${movie.cast_members.slice(0, 3).join(', ')}`);
        }
        console.log('');
    });
    
    console.log('═'.repeat(60));
    console.log('\n[SUCCESS] 데이터 준비 완료!');
    console.log('🗄️ 다음 단계: Supabase의 movies 테이블에 수동 업로드');
    console.log('📄 JSON 파일 위치:', path.resolve(jsonFile));
    
} catch (error) {
    console.error('[ERROR] 파일 읽기 실패:', error.message);
}