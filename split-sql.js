// SQL 파일을 작은 청크로 나누기
// Supabase 대시보드에서 직접 실행할 수 있도록 분할

const fs = require('fs');
const path = require('path');

class SqlSplitter {
    constructor() {
        this.sqlFile = 'massive_real_movie_database_2025-07-26T02-57-36-081Z.sql';
        this.maxLinesPerChunk = 1000; // 청크당 최대 줄 수
        this.maxSizePerChunk = 1024 * 1024; // 1MB 제한
        this.outputDir = 'sql_chunks';
    }

    createOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
            console.log(`📁 출력 디렉토리 생성: ${this.outputDir}`);
        } else {
            console.log(`📁 출력 디렉토리 존재: ${this.outputDir}`);
            // 기존 파일들 삭제
            const files = fs.readdirSync(this.outputDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.outputDir, file));
            });
            console.log(`🗑️ 기존 청크 파일들 삭제 완료`);
        }
    }

    splitSqlFile() {
        console.log('📄 SQL 파일 분할 시작...');
        
        if (!fs.existsSync(this.sqlFile)) {
            throw new Error(`SQL 파일을 찾을 수 없습니다: ${this.sqlFile}`);
        }
        
        const sqlContent = fs.readFileSync(this.sqlFile, 'utf8');
        const lines = sqlContent.split('\n');
        
        console.log(`[INFO] 총 ${lines.length.toLocaleString()}줄의 SQL 파일 (크기: ${(fs.statSync(this.sqlFile).size / 1024 / 1024).toFixed(1)}MB)`);
        
        // 테이블 생성 구문과 데이터 삽입 구문 분리
        const tableCreationLines = [];
        const movieInsertLines = [];
        const reviewInsertLines = [];
        let currentSection = 'header';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('CREATE TABLE') || line.startsWith('DROP TABLE')) {
                currentSection = 'table_creation';
                tableCreationLines.push(lines[i]);
            } else if (line.startsWith('INSERT INTO movies')) {
                currentSection = 'movie_inserts';
                movieInsertLines.push(lines[i]);
            } else if (line.startsWith('INSERT INTO critic_reviews')) {
                currentSection = 'review_inserts';
                reviewInsertLines.push(lines[i]);
            } else {
                // 현재 섹션에 따라 분류
                if (currentSection === 'table_creation') {
                    tableCreationLines.push(lines[i]);
                } else if (currentSection === 'movie_inserts') {
                    movieInsertLines.push(lines[i]);
                } else if (currentSection === 'review_inserts') {
                    reviewInsertLines.push(lines[i]);
                } else {
                    // 헤더나 기타 구문
                    tableCreationLines.push(lines[i]);
                }
            }
        }
        
        console.log(`[INFO] 분류 결과:`);
        console.log(`   테이블 생성: ${tableCreationLines.length}줄`);
        console.log(`   영화 삽입: ${movieInsertLines.length}줄`);
        console.log(`   리뷰 삽입: ${reviewInsertLines.length}줄`);
        
        return { tableCreationLines, movieInsertLines, reviewInsertLines };
    }

    writeChunks(lines, prefix, description) {
        if (lines.length === 0) {
            console.log(`[WARN] ${description} 데이터가 없습니다.`);
            return 0;
        }
        
        console.log(`\n[MEMO] ${description} 청크 생성 중...`);
        
        let chunkIndex = 1;
        let currentChunk = [];
        let currentSize = 0;
        let totalChunks = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineSize = Buffer.byteLength(line, 'utf8');
            
            // 청크 크기나 줄 수 제한 체크
            if ((currentChunk.length >= this.maxLinesPerChunk) || 
                (currentSize + lineSize > this.maxSizePerChunk)) {
                
                // 현재 청크 저장
                if (currentChunk.length > 0) {
                    this.saveChunk(currentChunk, `${prefix}_${chunkIndex.toString().padStart(3, '0')}.sql`);
                    totalChunks++;
                    console.log(`   청크 ${chunkIndex}: ${currentChunk.length}줄 (${(currentSize/1024).toFixed(1)}KB)`);
                    
                    chunkIndex++;
                    currentChunk = [];
                    currentSize = 0;
                }
            }
            
            currentChunk.push(line);
            currentSize += lineSize;
        }
        
        // 마지막 청크 저장
        if (currentChunk.length > 0) {
            this.saveChunk(currentChunk, `${prefix}_${chunkIndex.toString().padStart(3, '0')}.sql`);
            totalChunks++;
            console.log(`   청크 ${chunkIndex}: ${currentChunk.length}줄 (${(currentSize/1024).toFixed(1)}KB)`);
        }
        
        console.log(`[SUCCESS] ${description} 총 ${totalChunks}개 청크 생성 완료`);
        return totalChunks;
    }

    saveChunk(lines, filename) {
        const filePath = path.join(this.outputDir, filename);
        const content = lines.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
    }

    generateReadme(tableChunks, movieChunks, reviewChunks) {
        const readmeContent = `# SQL 청크 실행 가이드

이 디렉토리에는 대용량 영화 데이터베이스를 안전하게 Supabase에 삽입하기 위해 분할된 SQL 파일들이 있습니다.

## [INFO] 청크 정보

- **테이블 생성**: ${tableChunks}개 파일
- **영화 데이터**: ${movieChunks}개 파일  
- **리뷰 데이터**: ${reviewChunks}개 파일
- **총 청크**: ${tableChunks + movieChunks + reviewChunks}개 파일

## 🚀 실행 순서

### 1단계: 테이블 생성
\`\`\`
01_tables_001.sql
01_tables_002.sql
...
\`\`\`

### 2단계: 영화 데이터 삽입
\`\`\`
02_movies_001.sql
02_movies_002.sql
...
\`\`\`

### 3단계: 리뷰 데이터 삽입
\`\`\`
03_reviews_001.sql
03_reviews_002.sql
...
\`\`\`

## [TIP] Supabase 실행 방법

1. Supabase 대시보드 접속
2. SQL Editor 선택
3. 위 순서대로 파일 내용을 복사하여 실행
4. 각 파일 실행 후 성공 확인

## [WARN] 주의사항

- 반드시 순서대로 실행하세요
- 한 번에 하나의 파일만 실행하세요
- 오류 발생 시 다음 파일로 넘어가지 마세요
- 큰 파일의 경우 실행에 시간이 걸릴 수 있습니다

## [FORM] 체크리스트

- [ ] 테이블 생성 완료
- [ ] 영화 데이터 삽입 완료
- [ ] 리뷰 데이터 삽입 완료
- [ ] 데이터 검증 완료

생성일: ${new Date().toLocaleString('ko-KR')}
`;

        fs.writeFileSync(path.join(this.outputDir, 'README.md'), readmeContent);
        console.log('[MEMO] README.md 파일 생성 완료');
    }

    async run() {
        console.log('🚀 SQL 파일 분할 시작...');
        
        // 1. 출력 디렉토리 생성
        this.createOutputDirectory();
        
        // 2. SQL 파일 분할
        const { tableCreationLines, movieInsertLines, reviewInsertLines } = this.splitSqlFile();
        
        // 3. 청크 파일 생성
        const tableChunks = this.writeChunks(tableCreationLines, '01_tables', '테이블 생성');
        const movieChunks = this.writeChunks(movieInsertLines, '02_movies', '영화 데이터');
        const reviewChunks = this.writeChunks(reviewInsertLines, '03_reviews', '리뷰 데이터');
        
        // 4. README 생성
        this.generateReadme(tableChunks, movieChunks, reviewChunks);
        
        // 5. 결과 리포트
        console.log('\n' + '='.repeat(50));
        console.log('[INFO] SQL 분할 완료 리포트');
        console.log('='.repeat(50));
        console.log(`📁 출력 디렉토리: ${this.outputDir}`);
        console.log(`📄 테이블 생성: ${tableChunks}개 파일`);
        console.log(`[MOVIE] 영화 데이터: ${movieChunks}개 파일`);
        console.log(`[MEMO] 리뷰 데이터: ${reviewChunks}개 파일`);
        console.log(`[FORM] 총 파일: ${tableChunks + movieChunks + reviewChunks}개`);
        
        console.log('\n[TIP] 다음 단계:');
        console.log(`1. cd ${this.outputDir}`);
        console.log('2. README.md 파일 확인');
        console.log('3. Supabase 대시보드에서 순서대로 실행');
        
        console.log('\n[PARTY] SQL 파일 분할이 완료되었습니다!');
    }
}

// 실행
async function main() {
    const splitter = new SqlSplitter();
    await splitter.run();
}

if (require.main === module) {
    main().catch(console.error);
}