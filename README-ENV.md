# 🔧 환경변수 설정 가이드

Railway에 설정된 환경변수를 로컬 개발 환경에서 사용하는 방법입니다.

## 🚀 빠른 설정 방법

### 방법 1: 대화형 설정 도구 (추천)
```bash
node setup-env-interactive.js
```

### 방법 2: Railway CLI 사용
```bash
./railway-login.sh
```

### 방법 3: 수동 설정
```bash
code .env  # VS Code로 .env 파일 편집
```

## 📋 필요한 환경변수

### ✅ 필수 (Supabase 연동)
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 롤 키

### ⚠️ 선택사항 (기능별)
- `NAVER_CLIENT_ID`: 네이버 검색 API (맛집, 쇼핑)
- `NAVER_CLIENT_SECRET`: 네이버 검색 API 시크릿
- `CLAUDE_API_KEY`: Claude AI 연동 (미지원 질문 처리)
- `KOFIC_API_KEY`: 영화진흥위원회 API (영화 데이터)

## 🔍 설정 확인

### 현재 환경변수 상태 확인
```bash
node setup-env.js
```

### 서버 시작으로 연결 테스트
```bash
npm start
```

## 🎯 Railway에서 환경변수 복사하기

1. **Railway 대시보드 접속**: https://railway.app
2. **프로젝트 선택**: kakao-skill-webhook
3. **Variables 탭 클릭**
4. **환경변수 복사**:
   - `SUPABASE_URL` 값 복사
   - `SUPABASE_SERVICE_ROLE_KEY` 값 복사
   - 기타 필요한 변수들 복사

## 🧪 테스트

### 맛집 검색 테스트
```bash
node test-restaurant.js
```

### 영화 데이터베이스 확인
```bash
./open-movie-sql.sh
```

### 카카오 스킬 웹훅 테스트
```bash
# 서버 시작 후
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"userRequest":{"utterance":"구의 맛집"}}'
```

## 🔒 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- 환경변수 값을 공개 채널에 공유하지 마세요
- API 키가 노출되면 즉시 재발급하세요

## 🐛 문제 해결

### 1. SUPABASE_URL 환경변수가 설정되지 않았습니다
```bash
# .env 파일 확인
cat .env

# 대화형 설정 다시 실행
node setup-env-interactive.js
```

### 2. Railway CLI 인증 오류
```bash
# Railway 로그인
railway login

# 프로젝트 연결 확인
railway status
```

### 3. 맛집 검색이 작동하지 않음
- `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET` 확인
- Railway Variables에서 올바른 값 복사 확인

## 📝 .env 파일 예시

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Naver Search API Configuration  
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Claude API Configuration
CLAUDE_API_KEY=sk-ant-api03-...

# KOBIS API Configuration
KOFIC_API_KEY=your_kofic_api_key

# Server Configuration
PORT=3000
```