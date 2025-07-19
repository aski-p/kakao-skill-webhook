# 카카오 챗봇 Claude AI 스킬 서버

카카오 챗봇과 Claude AI (claude-3-haiku-20240307)를 연동하는 Flask 서버입니다.

## 파일 구조

```
.
├── app.py              # Flask 메인 애플리케이션
├── requirements.txt    # Python 의존성 패키지
└── README.md          # 이 파일
```

## 로컬 실행 방법

### 1. 의존성 설치

```bash
pip install -r requirements.txt
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
python app.py
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

1. [Railway](https://railway.app) 계정 생성
2. GitHub에 이 코드를 push
3. Railway에서 GitHub 연결하여 배포
4. 환경변수 설정: `CLAUDE_API_KEY=your-api-key-here`
5. 자동으로 HTTPS URL 생성됨

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

1. **스킬 URL**: 배포된 서버의 HTTPS URL + `/kakao-skill-webhook`
   - 예: `https://your-domain.com/kakao-skill-webhook`

2. **테스트**: 관리자센터에서 스킬 테스트 기능으로 동작 확인

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
- HTTPS URL 사용 확인
- 응답 형식이 카카오 규격에 맞는지 확인

### 3. 서버 오류
- 로그 확인: `print(f"Error occurred: {e}")`
- 의존성 패키지 설치 확인