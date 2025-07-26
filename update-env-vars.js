// 환경변수 업데이트 스크립트
// Railway의 다양한 환경변수 형식 지원

// Railway 환경변수 형식을 표준 형식으로 매핑
if (process.env.supabase_url && !process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.supabase_url;
    console.log('✅ supabase_url → SUPABASE_URL 매핑 완료');
}

if (process.env.supabase_service_role_key && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.supabase_service_role_key;
    console.log('✅ supabase_service_role_key → SUPABASE_SERVICE_ROLE_KEY 매핑 완료');
}

// 환경변수 확인
console.log('\n🔑 환경변수 상태:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정');

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n✅ Supabase 환경변수가 모두 설정되었습니다!');
    console.log('이제 배치 인서트를 실행할 수 있습니다.');
} else {
    console.log('\n❌ Supabase 환경변수가 부족합니다.');
    console.log('Railway에서 다음 환경변수를 확인하세요:');
    console.log('- supabase_url 또는 SUPABASE_URL');
    console.log('- supabase_service_role_key 또는 SUPABASE_SERVICE_ROLE_KEY');
}

module.exports = {
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.supabase_url,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role_key
};