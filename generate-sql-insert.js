// JSON 데이터를 Supabase SQL INSERT 문으로 변환하는 스크립트
const fs = require('fs');

class SQLGenerator {
    constructor() {
        this.insertStatements = [];
    }

    // 문자열을 SQL 안전하게 이스케이프
    escapeSQLString(str) {
        if (!str) return 'NULL';
        return `'${str.replace(/'/g, "''")}'`;
    }

    // 배열을 PostgreSQL 배열 형식으로 변환
    arrayToSQL(arr) {
        if (!arr || arr.length === 0) return 'NULL';
        const escapedItems = arr.map(item => this.escapeSQLString(item).slice(1, -1)); // 따옴표 제거
        return `ARRAY[${escapedItems.map(item => `'${item}'`).join(', ')}]`;
    }

    // 영화 데이터를 INSERT 문으로 변환
    generateInsertStatement(movie) {
        const values = [
            this.escapeSQLString(movie.title),
            this.escapeSQLString(movie.english_title),
            this.escapeSQLString(movie.director),
            this.arrayToSQL(movie.cast_members),
            this.escapeSQLString(movie.genre),
            movie.release_year || 'NULL',
            movie.runtime_minutes || 'NULL',
            this.escapeSQLString(movie.country),
            'NULL', // naver_rating
            this.escapeSQLString(movie.description),
            this.arrayToSQL(movie.keywords),
            'NULL', // poster_url
            'NULL', // naver_movie_id
            'NOW()', // created_at
            'NOW()'  // updated_at
        ];

        return `INSERT INTO movies (
    title, english_title, director, cast_members, genre, 
    release_year, runtime_minutes, country, naver_rating, 
    description, keywords, poster_url, naver_movie_id, 
    created_at, updated_at
) VALUES (
    ${values.join(',\n    ')}
);`;
    }

    // JSON 파일에서 영화 데이터 로드 및 SQL 생성
    generateSQL(jsonFilename) {
        try {
            console.log('📄 JSON 파일 로드 중...');
            const data = JSON.parse(fs.readFileSync(jsonFilename, 'utf8'));
            const movies = data.movies;

            console.log(`[INFO] 총 ${movies.length}개 영화 데이터 발견\n`);

            let sqlContent = `-- KOFIC 한국 영화 데이터 INSERT 스크립트
-- 생성일: ${new Date().toLocaleString('ko-KR')}
-- 총 영화 수: ${movies.length}개

-- 중복 방지를 위해 기존 데이터 확인 후 삽입하는 함수
DO $$
DECLARE
    movie_exists BOOLEAN;
BEGIN
`;

            movies.forEach((movie, index) => {
                console.log(`${index + 1}. ${movie.title} (${movie.release_year || '연도미상'})`);
                
                // 각 영화에 대해 중복 체크 후 삽입
                sqlContent += `
    -- ${index + 1}. ${movie.title}
    SELECT EXISTS(
        SELECT 1 FROM movies 
        WHERE title = ${this.escapeSQLString(movie.title)} 
        AND (release_year = ${movie.release_year || 'NULL'} OR release_year IS NULL)
    ) INTO movie_exists;
    
    IF NOT movie_exists THEN
        ${this.generateInsertStatement(movie).replace('INSERT INTO', 'INSERT INTO')}
        RAISE NOTICE 'Inserted: ${movie.title}';
    ELSE
        RAISE NOTICE 'Skipped (exists): ${movie.title}';
    END IF;
`;
            });

            sqlContent += `
END $$;

-- 삽입 결과 확인
SELECT 
    COUNT(*) as total_movies,
    COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as inserted_today
FROM movies;

-- 최근 삽입된 영화 목록 (오늘 날짜)
SELECT title, director, genre, release_year, created_at
FROM movies 
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
`;

            const sqlFilename = `kofic_movies_insert_${new Date().toISOString().slice(0, 10)}.sql`;
            fs.writeFileSync(sqlFilename, sqlContent, 'utf8');

            console.log('\n[INFO] SQL 스크립트 생성 완료!');
            console.log('='.repeat(60));
            console.log(`📄 파일명: ${sqlFilename}`);
            console.log(`[LOCATION] 위치: ${__dirname}/${sqlFilename}`);
            console.log(`[MEMO] 총 라인 수: ${sqlContent.split('\n').length}줄`);
            console.log('='.repeat(60));
            
            console.log('\n🚀 사용 방법:');
            console.log('1. Supabase 대시보드에 로그인');
            console.log('2. SQL Editor 메뉴로 이동');
            console.log('3. 생성된 SQL 파일 내용을 복사하여 붙여넣기');
            console.log('4. 실행 버튼 클릭');
            console.log('\n[SUCCESS] 중복 방지 로직이 포함되어 있어 안전하게 실행할 수 있습니다.');

            return sqlFilename;

        } catch (error) {
            console.error('[ERROR] SQL 생성 실패:', error.message);
            return null;
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const generator = new SQLGenerator();
    generator.generateSQL('korean_movies_kofic_2025-07-28.json');
}

module.exports = SQLGenerator;