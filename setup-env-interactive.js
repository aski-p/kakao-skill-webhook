// 대화형 환경변수 설정 도구
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 대화형 환경변수 설정 도구');
console.log('=====================================');
console.log('Railway에서 복사한 환경변수를 입력하세요.');
console.log('(Enter를 눌러서 건너뛸 수 있습니다)');
console.log('');

const envVars = {};

const questions = [
    {
        key: 'SUPABASE_URL',
        question: '📋 SUPABASE_URL을 입력하세요: ',
        required: true
    },
    {
        key: 'SUPABASE_SERVICE_ROLE_KEY', 
        question: '📋 SUPABASE_SERVICE_ROLE_KEY를 입력하세요: ',
        required: true
    },
    {
        key: 'NAVER_CLIENT_ID',
        question: '🔍 NAVER_CLIENT_ID를 입력하세요 (선택사항): ',
        required: false
    },
    {
        key: 'NAVER_CLIENT_SECRET',
        question: '🔍 NAVER_CLIENT_SECRET를 입력하세요 (선택사항): ',
        required: false
    },
    {
        key: 'CLAUDE_API_KEY',
        question: '🤖 CLAUDE_API_KEY를 입력하세요 (선택사항): ',
        required: false
    },
    {
        key: 'KOFIC_API_KEY',
        question: '🎬 KOFIC_API_KEY를 입력하세요 (선택사항): ',
        required: false
    }
];

let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion >= questions.length) {
        // 모든 질문 완료
        generateEnvFile();
        return;
    }
    
    const q = questions[currentQuestion];
    rl.question(q.question, (answer) => {
        if (answer.trim()) {
            envVars[q.key] = answer.trim();
            console.log(`✅ ${q.key} 설정됨`);
        } else if (q.required) {
            console.log(`❌ ${q.key}는 필수 항목입니다. 다시 입력해주세요.`);
            askQuestion();
            return;
        } else {
            console.log(`⏭️ ${q.key} 건너뛰기`);
        }
        
        currentQuestion++;
        askQuestion();
    });
}

function generateEnvFile() {
    console.log('');
    console.log('💾 .env 파일 생성 중...');
    
    let envContent = '# Railway 환경변수 설정\n';
    envContent += `# 생성일시: ${new Date().toLocaleString()}\n\n`;
    
    // Supabase 설정
    envContent += '# Supabase Configuration\n';
    envContent += `SUPABASE_URL=${envVars.SUPABASE_URL || 'your_supabase_url_here'}\n`;
    envContent += `SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key_here'}\n\n`;
    
    // Claude API 설정
    envContent += '# Claude API Configuration\n';
    envContent += `CLAUDE_API_KEY=${envVars.CLAUDE_API_KEY || 'your_claude_api_key_here'}\n\n`;
    
    // Naver API 설정
    envContent += '# Naver Search API Configuration\n';
    envContent += `NAVER_CLIENT_ID=${envVars.NAVER_CLIENT_ID || 'your_naver_client_id_here'}\n`;
    envContent += `NAVER_CLIENT_SECRET=${envVars.NAVER_CLIENT_SECRET || 'your_naver_client_secret_here'}\n\n`;
    
    // KOFIC API 설정
    envContent += '# KOBIS (Korean Box Office Information System) API Configuration\n';
    envContent += `KOFIC_API_KEY=${envVars.KOFIC_API_KEY || 'your_kofic_api_key_here'}\n\n`;
    
    // 서버 설정
    envContent += '# Server Configuration\n';
    envContent += 'PORT=3000\n';
    
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env 파일이 생성되었습니다!');
    console.log('');
    console.log('📋 설정된 환경변수:');
    Object.keys(envVars).forEach(key => {
        console.log(`   ✅ ${key}: ${envVars[key].substring(0, 20)}...`);
    });
    
    console.log('');
    console.log('🚀 다음 단계:');
    console.log('   1. npm start (서버 시작)');
    console.log('   2. node test-restaurant.js (맛집 검색 테스트)');
    console.log('   3. ./open-movie-sql.sh (영화 데이터베이스 SQL 파일 열기)');
    
    rl.close();
}

// 시작
askQuestion();