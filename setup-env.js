// Railway 환경변수를 로컬 .env 파일로 복사하는 도구
const fs = require('fs');
const path = require('path');

console.log('[TOOL] Railway 환경변수 설정 도구');
console.log('=====================================');
console.log('');
console.log('[FORM] 다음 단계를 따라주세요:');
console.log('');
console.log('1. Railway 대시보드에 접속: https://railway.app');
console.log('2. 프로젝트 선택');
console.log('3. Variables 탭 클릭');
console.log('4. 다음 환경변수들을 복사해서 .env 파일에 붙여넣기:');
console.log('');
console.log('필요한 환경변수:');
console.log('[SUCCESS] SUPABASE_URL');
console.log('[SUCCESS] SUPABASE_SERVICE_ROLE_KEY'); 
console.log('[WARN] NAVER_CLIENT_ID (선택사항)');
console.log('[WARN] NAVER_CLIENT_SECRET (선택사항)');
console.log('[WARN] CLAUDE_API_KEY (선택사항)');
console.log('[WARN] KOFIC_API_KEY (선택사항)');
console.log('');

// .env 파일 체크
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('📁 현재 .env 파일 내용:');
    console.log('=====================================');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // 실제 값이 설정되었는지 체크
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const hasRealValues = requiredVars.some(varName => {
        const match = envContent.match(new RegExp(`${varName}=(.+)`));
        return match && match[1] && !match[1].includes('your_') && !match[1].includes('here');
    });
    
    if (hasRealValues) {
        console.log('[SUCCESS] 환경변수가 설정되어 있습니다!');
        console.log('');
        console.log('🚀 서버 재시작:');
        console.log('   npm start');
    } else {
        console.log('[ERROR] 환경변수를 아직 설정하지 않았습니다.');
        console.log('');
        console.log('[MEMO] .env 파일을 편집하세요:');
        console.log('   code .env');
        console.log('   또는');
        console.log('   nano .env');
    }
    
    console.log('');
    console.log(envContent);
} else {
    console.log('[ERROR] .env 파일이 없습니다. 생성해주세요.');
}

console.log('');
console.log('[TIP] 완료 후 다음 명령어로 테스트:');
console.log('   node test-restaurant.js');
console.log('   또는');
console.log('   npm start');