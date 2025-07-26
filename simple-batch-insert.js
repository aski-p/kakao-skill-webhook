// 간단한 Supabase 배치 인서트 스크립트
// SQL 파일을 청크로 나누어서 직접 실행

const fs = require('fs');

// Supabase 환경 변수 확인
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 환경 변수 상태:');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.log('💡 환경 변수를 설정하고 다시 실행해주세요:');
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

class SimpleBatchInserter {
    constructor() {
        this.sqlFile = 'massive_real_movie_database_2025-07-26T02-57-36-081Z.sql';
        this.chunkSize = 1000; // SQL 줄 단위로 청크 분할
        this.delayBetweenChunks = 2000; // 2초 대기
    }

    async testConnection() {
        console.log('🔌 Supabase 연결 테스트...');
        
        try {
            // 간단한 쿼리로 연결 테스트
            const { data, error } = await supabase
                .from('movies')
                .select('id')
                .limit(1);
            
            if (error) {
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

    splitSqlFile() {
        console.log('📄 SQL 파일 분할 시작...');
        
        if (!fs.existsSync(this.sqlFile)) {
            throw new Error(`SQL 파일을 찾을 수 없습니다: ${this.sqlFile}`);
        }
        
        const sqlContent = fs.readFileSync(this.sqlFile, 'utf8');
        const lines = sqlContent.split('\n');
        
        console.log(`📊 총 ${lines.length.toLocaleString()}줄의 SQL 파일`);
        
        // 의미있는 줄만 필터링
        const meaningfulLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed && 
                   !trimmed.startsWith('--') && 
                   !trimmed.startsWith('/*') && 
                   trimmed !== '';
        });
        
        console.log(`📊 의미있는 줄: ${meaningfulLines.length.toLocaleString()}줄`);
        
        // 청크로 분할
        const chunks = [];
        for (let i = 0; i < meaningfulLines.length; i += this.chunkSize) {
            const chunk = meaningfulLines.slice(i, i + this.chunkSize);
            chunks.push(chunk.join('\n'));
        }
        
        console.log(`📦 ${chunks.length}개의 청크로 분할됨 (청크당 최대 ${this.chunkSize}줄)`);
        
        return chunks;
    }

    async executeChunk(chunkIndex, chunk) {
        console.log(`\n🔄 청크 ${chunkIndex + 1} 실행 중... (크기: ${chunk.length.toLocaleString()}자)`);
        
        try {
            // Supabase SQL 실행
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: chunk
            });
            
            if (error) {
                console.log(`❌ 청크 ${chunkIndex + 1} 실행 실패:`, error.message);
                
                // 파일로 실패한 청크 저장
                const failedChunkFile = `failed_chunk_${chunkIndex + 1}.sql`;
                fs.writeFileSync(failedChunkFile, chunk);
                console.log(`💾 실패한 청크를 ${failedChunkFile}에 저장했습니다.`);
                
                return false;
            }
            
            console.log(`✅ 청크 ${chunkIndex + 1} 실행 성공`);
            return true;
            
        } catch (err) {
            console.log(`❌ 청크 ${chunkIndex + 1} 실행 오류:`, err.message);
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        console.log('🚀 간단한 배치 인서트 시작...');
        
        // 1. 연결 테스트
        const connected = await this.testConnection();
        if (!connected) {
            console.log('❌ Supabase 연결 실패로 인해 프로세스를 중단합니다.');
            return;
        }
        
        // 2. SQL 파일 분할
        let chunks;
        try {
            chunks = this.splitSqlFile();
        } catch (err) {
            console.log('❌ SQL 파일 분할 실패:', err.message);
            return;
        }
        
        // 3. 청크별 실행
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < chunks.length; i++) {
            const success = await this.executeChunk(i, chunks[i]);
            
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
            
            // 마지막 청크가 아니면 대기
            if (i < chunks.length - 1) {
                console.log(`⏳ ${this.delayBetweenChunks/1000}초 대기 중...`);
                await this.delay(this.delayBetweenChunks);
            }
        }
        
        // 4. 결과 리포트
        console.log('\n' + '='.repeat(50));
        console.log('📊 배치 인서트 완료 리포트');
        console.log('='.repeat(50));
        console.log(`✅ 성공: ${successCount}/${chunks.length} 청크`);
        console.log(`❌ 실패: ${failCount}/${chunks.length} 청크`);
        console.log(`📈 성공률: ${((successCount/chunks.length)*100).toFixed(1)}%`);
        
        if (successCount === chunks.length) {
            console.log('\n🎉 모든 청크가 성공적으로 실행되었습니다!');
        } else {
            console.log('\n⚠️ 일부 청크 실행이 실패했습니다. failed_chunk_*.sql 파일을 확인해주세요.');
        }
    }
}

// 실행
async function main() {
    const inserter = new SimpleBatchInserter();
    await inserter.run();
}

if (require.main === module) {
    main().catch(console.error);  
}