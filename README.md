# 카카오 챗봇 Claude AI 스킬 서버

카카오 챗봇과 Claude AI (claude-3-haiku-20240307)를 연동하는 Node.js Express 서버입니다.

## 파일 구조

```
.
├── index.js            # Node.js Express 메인 애플리케이션
├── package.json        # Node.js 의존성 패키지
├── python-backup/      # 이전 Python 파일들 백업
└── README.md          # 이 파일
```

## 로컬 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

Claude API 키를 환경변수로 설정해야 합니다:

```bash
# Linux/Mac
export CLAUDE_API_KEY="your-claude-api-key-here"

# Windows
set CLAUDE_API_KEY=your-claude-api-key-here
```

또는 `.env` 파일을 생성해서 설정:

```bash
# .env 파일 생성
cp .env.example .env
# .env 파일을 열어서 API 키 입력
```

### 3. 서버 실행

```bash
npm start
```

서버가 실행되면 `http://localhost:5000`에서 접근할 수 있습니다.

## 엔드포인트

- `POST /kakao-skill-webhook`: 카카오 챗봇 스킬 웹훅
- `GET /health`: 서버 상태 확인
- `GET /`: 홈 페이지

## 로컬 테스트 방법

### curl로 테스트

```bash
curl -X POST http://localhost:5000/kakao-skill-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "userRequest": {
      "utterance": "안녕하세요"
    }
  }'
```

### 서버 상태 확인

```bash
curl http://localhost:5000/health
```

## 배포 방법

### 1. Railway 배포 (권장)

**단계별 가이드:**

1. **[Railway](https://railway.app) 계정 생성**
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "New Project" → "Deploy from GitHub repo" 클릭
   - `kakao-skill-webhook` 저장소 선택

3. **환경변수 설정 (중요!)**
   - 배포된 프로젝트 클릭 → **"Variables"** 탭 클릭
   - **"New Variable"** 버튼 클릭
   - 다음 정보 입력:
     - **Name**: `CLAUDE_API_KEY`
     - **Value**: `your-claude-api-key-here`
   - **"Add"** 클릭 후 자동 재배포 대기 (1-2분)

4. **배포 완료**
   - 자동으로 HTTPS URL 생성 (예: `https://kakao-skill-webhook-production.up.railway.app`)
   - `/health` 엔드포인트로 상태 확인

5. **웹훅 URL 설정**
   - **방법 1 (권장)**: `https://your-app.railway.app/kakao-skill-webhook`
   - **방법 2**: `https://your-app.railway.app` (루트 경로도 지원)

### 2. Heroku 배포

1. [Heroku](https://heroku.com) 계정 생성
2. Heroku CLI 설치
3. 아래 명령어 실행:

```bash
heroku create your-app-name
heroku config:set CLAUDE_API_KEY=your-api-key-here
git push heroku main
```

### 3. 기타 배포 옵션

- **Vercel**: Serverless 배포
- **AWS EC2**: 직접 서버 관리
- **Google Cloud Run**: 컨테이너 배포

## 카카오 챗봇 관리자센터 설정

### 스킬 URL 설정

**올바른 URL 형식:**
- ✅ `https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook`
- ✅ `https://kakao-skill-webhook-production.up.railway.app` (루트 경로)

**주의사항:**
- 반드시 **HTTPS**를 사용해야 합니다
- URL 끝에 `/`는 붙이지 마세요

### 테스트 방법

1. **관리자센터에서 테스트**
   - 스킬 편집 페이지에서 "테스트" 탭 클릭
   - 메시지 입력 후 응답 확인

2. **직접 테스트**
   ```bash
   # 카카오 형식 테스트
   curl -X POST https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook \
     -H "Content-Type: application/json" \
     -d '{"userRequest": {"utterance": "안녕하세요"}}'
   
   # 간단한 테스트
   curl -X POST https://kakao-skill-webhook-production.up.railway.app/test
   ```

3. **상태 확인**
   - 서버 상태: `https://kakao-skill-webhook-production.up.railway.app/health`
   - 테스트 페이지: `https://kakao-skill-webhook-production.up.railway.app/test`

## 🔍 디버깅 가이드

### 카카오 봇이 응답하지 않는 경우

1. **Railway 로그 확인**
   - Railway 대시보드 → 프로젝트 → "Logs" 탭
   - 다음 메시지가 나타나는지 확인:
     ```
     🔔 카카오 웹훅 요청 받음!
     💬 사용자 메시지: '안녕하세요'
     📤 카카오 응답 전송 중...
     ```

2. **스킬 설정 확인**
   - 카카오 관리자센터에서 스킬이 "사용" 상태인지 확인
   - URL이 정확한지 확인 (HTTPS 필수)
   - 발화 예시가 등록되어 있는지 확인

3. **단계별 테스트**
   ```bash
   # 1단계: 서버 상태 확인
   curl https://kakao-skill-webhook-production.up.railway.app/health
   
   # 2단계: 간단한 테스트
   curl -X POST https://kakao-skill-webhook-production.up.railway.app/test
   
   # 3단계: 카카오 형식 테스트
   curl -X POST https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook \
     -H "Content-Type: application/json" \
     -d '{"userRequest": {"utterance": "테스트"}}'
   ```

4. **자주 발생하는 문제들**
   - **5초 타임아웃**: Claude API 응답이 느릴 때 → max_tokens을 300으로 줄임
   - **환경변수 미설정**: API 키가 없을 때도 테스트 응답 제공
   - **CORS 문제**: 헤더 설정으로 해결
   - **JSON 파싱 오류**: 요청 데이터 로깅으로 디버깅

## 주의사항

⚠️ **보안 주의사항**:
- API 키는 절대 코드에 직접 입력하지 마세요
- 환경변수로 관리하고 .env 파일은 .gitignore에 추가하세요
- 배포 시 플랫폼의 환경변수 설정을 사용하세요

## 문제 해결

### 1. Claude API 오류
- API 키가 유효한지 확인
- API 호출 한도 확인

### 2. 카카오 웹훅 오류

**405 METHOD_NOT_ALLOWED 에러:**
- 잘못된 URL: `https://your-app.railway.app` → 올바른 URL: `https://your-app.railway.app/kakao-skill-webhook`
- 또는 루트 경로 사용: `https://your-app.railway.app` (이제 지원됨)

**기타 웹훅 오류:**
- HTTPS URL 사용 확인
- 응답 형식이 카카오 규격에 맞는지 확인
- JSON Content-Type 헤더 확인

### 3. Railway 배포 오류

**"requirements.txt not found" 에러:**
- 프로젝트 루트에 `requirements.txt` 파일이 있는지 확인
- GitHub에 파일이 정상적으로 업로드되었는지 확인

**빌드 실패:**
- `railway.toml` 파일 확인
- Python 버전 호환성 확인 (`runtime.txt`)

**서버 시작 실패:**
- Railway 로그에서 오류 메시지 확인
- 환경변수가 올바르게 설정되었는지 확인

**환경변수 설정 안됨 에러:**
```
⚠️ CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.
Error occurred: Claude API 키가 설정되지 않았습니다.
```
해결방법:
1. Railway 대시보드 → 프로젝트 클릭
2. "Variables" 탭 → "New Variable"
3. Name: `CLAUDE_API_KEY`, Value: API 키 입력
4. 1-2분 대기 후 자동 재배포 완료

### 4. 서버 오류
- Railway 대시보드에서 로그 확인
- `/health` 엔드포인트로 서버 상태 확인
- 의존성 패키지 설치 확인