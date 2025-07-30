# Railway 환경변수 설정 가이드

## ⚠️ 중요: API 키 보안

**절대로 API 키를 코드에 직접 넣거나 GitHub에 커밋하지 마세요!**

## Railway에서 환경변수 설정하는 방법

1. **Railway 대시보드 접속**
   - https://railway.app 로그인
   - `kakao-skill-webhook` 프로젝트 선택

2. **Variables 탭 클릭**
   - 프로젝트 설정에서 `Variables` 탭 선택

3. **환경변수 추가**
   - `+ New Variable` 클릭
   - 다음 변수들을 추가:

```
CLAUDE_API_KEY=sk-ant-api03-xxxxx_YOUR_ACTUAL_KEY_xxxxx
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
WEATHER_API_KEY=your_weather_api_key
```

4. **저장 및 재배포**
   - 변수 추가 후 자동으로 재배포됨
   - 로그에서 "Claude AI API 키 상태: 설정됨" 확인

## 보안 주의사항

- API 키는 Railway 환경변수에만 저장
- 로컬 개발시 `.env` 파일 사용 (`.gitignore`에 포함됨)
- 절대 공개 저장소에 커밋하지 않음

## 테스트

환경변수 설정 후:
1. Railway 로그 확인
2. 카카오톡에서 "안녕" 메시지 전송
3. 정상 응답 확인