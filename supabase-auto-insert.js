// Supabase 자동 배치 인서트 스크립트
// sql_chunks 디렉토리의 파일들을 순서대로 실행

const fs = require('fs');
const path = require('path');

// 환경변수 매핑 (Railway 호환성)
require('./update-env-vars');

// Supabase 환경 변수 확인 (Railway 형식 지원)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.supabase_url;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role_key;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Supabase 환경 변수가 설정되지 않았습니다:');
    console.log('SUPABASE_URL:', SUPABASE_URL ? '설정됨' : '미설정');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '미설정');
    console.log('\n💡 환경 변수를 먼저 설정해주세요:');
    console.log('export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

class SupabaseAutoInserter {
    constructor() {
        this.chunksDir = 'sql_chunks';
        this.delayBetweenFiles = 3000; // 3초 대기
        this.maxRetries = 3;
        
        this.stats = {
            totalFiles: 0,
            successFiles: 0,
            failedFiles: 0,
            errors: []
        };
    }

    async testConnection() {
        console.log('🔌 Supabase 연결 테스트...');
        
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (정상)
                console.log('❌ Supabase 연결 실패:', error.message);
                return false;
            }
            
            console.log('✅ Supabase 연결 성공');
            return true;
        } catch (err) {
            console.log('❌ Supabase 연결 오류:', err.message);
            return false;
        }
    }

    getFileList() {
        if (!fs.existsSync(this.chunksDir)) {
            throw new Error(`청크 디렉토리를 찾을 수 없습니다: ${this.chunksDir}`);
        }
        
        const files = fs.readdirSync(this.chunksDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // 파일명 순서대로 정렬
        
        // 실행 순서 검증
        const tableFiles = files.filter(f => f.startsWith('01_tables_'));
        const movieFiles = files.filter(f => f.startsWith('02_movies_'));
        const reviewFiles = files.filter(f => f.startsWith('03_reviews_'));
        
        console.log(`📂 청크 파일 발견:`);
        console.log(`   테이블: ${tableFiles.length}개`);
        console.log(`   영화: ${movieFiles.length}개`);
        console.log(`   리뷰: ${reviewFiles.length}개`);
        console.log(`   총 파일: ${files.length}개`);
        
        return [...tableFiles, ...movieFiles, ...reviewFiles];
    }

    async executeFile(filename, index, total) {
        const filePath = path.join(this.chunksDir, filename);
        
        console.log(`\n📄 [${index + 1}/${total}] ${filename} 실행 중...`);
        
        try {
            const sqlContent = fs.readFileSync(filePath, 'utf8');
            
            // 파일 크기 체크
            const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
            console.log(`   파일 크기: ${fileSize}KB`);
            
            // SQL 실행
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: sqlContent
            });
            
            if (error) {
                console.log(`❌ ${filename} 실행 실패:`, error.message);
                this.stats.errors.push(`${filename}: ${error.message}`);
                this.stats.failedFiles++;
                
                // 실패한 파일을 별도 디렉토리에 복사
                const failedDir = 'failed_chunks';
                if (!fs.existsSync(failedDir)) {
                    fs.mkdirSync(failedDir);
                }
                fs.copyFileSync(filePath, path.join(failedDir, filename));
                
                return false;
            }
            
            console.log(`✅ ${filename} 실행 성공`);
            this.stats.successFiles++;
            return true;
            
        } catch (err) {
            console.log(`❌ ${filename} 파일 오류:`, err.message);
            this.stats.errors.push(`${filename}: ${err.message}`);
            this.stats.failedFiles++;
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        console.log('🚀 Supabase 자동 배치 인서트 시작...');
        console.log(`⚙️ 설정: 파일간 대기시간 ${this.delayBetweenFiles/1000}초`);
        
        // 1. 연결 테스트
        const connected = await this.testConnection();
        if (!connected) {
            console.log('❌ Supabase 연결 실패로 인해 프로세스를 중단합니다.');
            return;
        }
        
        // 2. 파일 목록 가져오기
        let files;
        try {
            files = this.getFileList();
            this.stats.totalFiles = files.length;
        } catch (err) {
            console.log('❌ 파일 목록 가져오기 실패:', err.message);
            return;
        }
        
        if (files.length === 0) {
            console.log('❌ 실행할 SQL 파일이 없습니다.');
            return;
        }
        
        // 3. 사용자 확인
        console.log(`\n⚠️ ${files.length}개의 SQL 파일을 순서대로 실행합니다.`);
        console.log('계속하시겠습니까? (ctrl+c로 중단 가능)');
        
        // 5초 대기
        for (let i = 5; i > 0; i--) {
            process.stdout.write(`\r${i}초 후 시작... `);
            await this.delay(1000);
        }
        console.log('\n');
        
        // 4. 파일별 실행
        const startTime = Date.now();
        
        for (let i = 0; i < files.length; i++) {
            const success = await this.executeFile(files[i], i, files.length);
            
            // 마지막 파일이 아니면 대기
            if (i < files.length - 1) {
                console.log(`⏳ ${this.delayBetweenFiles/1000}초 대기 중...`);
                await this.delay(this.delayBetweenFiles);
            }
            
            // 실패 시 중단 여부 확인 (선택사항)
            if (!success && this.stats.failedFiles >= 5) {
                console.log('\n⚠️ 실패한 파일이 5개 이상입니다. 계속하시겠습니까?');
                console.log('(10초 대기 후 자동 계속, ctrl+c로 중단)');
                await this.delay(10000);
            }
        }
        
        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(1);
        
        // 5. 결과 리포트
        this.printReport(totalTime);
    }

    printReport(totalTime) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Supabase 자동 배치 인서트 완료 리포트');
        console.log('='.repeat(60));
        console.log(`⏱️ 총 실행 시간: ${totalTime}분`);
        console.log(`📄 총 파일: ${this.stats.totalFiles}개`);
        console.log(`✅ 성공: ${this.stats.successFiles}개`);
        console.log(`❌ 실패: ${this.stats.failedFiles}개`);
        console.log(`📈 성공률: ${((this.stats.successFiles/this.stats.totalFiles)*100).toFixed(1)}%`);
        
        if (this.stats.errors.length > 0) {
            console.log('\n❌ 오류 상세 (최대 10개):');
            this.stats.errors.slice(0, 10).forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
            
            if (this.stats.errors.length > 10) {
                console.log(`   ... 및 ${this.stats.errors.length - 10}개 추가 오류`);
            }
        }
        
        if (this.stats.successFiles === this.stats.totalFiles) {
            console.log('\n🎉 모든 파일이 성공적으로 실행되었습니다!');
            console.log('💡 Supabase 대시보드에서 데이터를 확인해보세요.');
        } else {
            console.log('\n⚠️ 일부 파일 실행이 실패했습니다.');
            console.log('💡 failed_chunks/ 디렉토리에서 실패한 파일들을 확인하세요.');
        }
        
        // 데이터 검증 제안
        console.log('\n🔍 데이터 검증 쿼리:');
        console.log('SELECT COUNT(*) FROM movies;');
        console.log('SELECT COUNT(*) FROM critic_reviews;');
    }
}

// 실행
async function main() {
    const inserter = new SupabaseAutoInserter();
    await inserter.run();
}

if (require.main === module) {
    main().catch(console.error);
}