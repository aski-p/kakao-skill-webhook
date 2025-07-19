# 네이버 검색 API 설정 가이드

네이버 검색 API를 사용하여 실시간 뉴스를 제공하는 카카오 챗봇 설정 방법입니다.

## 🔑 네이버 API 키 정보
- **Client ID**: `99hDav0SfKtmPXLljc1U`
- **Client Secret**: `7ahplkzCS0`

## 📋 환경변수 설정 방법

### 1. Railway (프로덕션 환경)

1. **Railway 대시보드 접속**
   - https://railway.app/
   - 프로젝트 선택

2. **Variables 탭 클릭**
   - 프로젝트 → Settings → Variables

3. **환경변수 추가**
   ```
   NAVER_CLIENT_ID=99hDav0SfKtmPXLljc1U
   NAVER_CLIENT_SECRET=7ahplkzCS0
   ```

4. **Deploy 버튼 클릭**
   - 자동으로 재배포됩니다

### 2. 로컬 개발 환경

1. **환경변수 파일 생성** (`.env`)
   ```bash
   # .env 파일
   CLAUDE_API_KEY=your_claude_api_key_here
   NAVER_CLIENT_ID=99hDav0SfKtmPXLljc1U
   NAVER_CLIENT_SECRET=7ahplkzCS0
   ```

2. **환경변수 로드**
   ```bash
   # 터미널에서 직접 설정
   export NAVER_CLIENT_ID="99hDav0SfKtmPXLljc1U"
   export NAVER_CLIENT_SECRET="7ahplkzCS0"
   
   # 서버 실행
   npm start
   ```

### 3. 기타 클라우드 플랫폼

#### Heroku
```bash
heroku config:set NAVER_CLIENT_ID="99hDav0SfKtmPXLljc1U"
heroku config:set NAVER_CLIENT_SECRET="7ahplkzCS0"
```

#### Vercel
```bash
vercel env add NAVER_CLIENT_ID
vercel env add NAVER_CLIENT_SECRET
```

#### Netlify
- Netlify 대시보드 → Site settings → Environment variables

## 🔍 설정 확인 방법

1. **상태 페이지 확인**
   - URL: `https://your-domain.com/status`
   - 네이버 API 설정 상태 확인

2. **로그 확인**
   ```
   📰 네이버 Client ID 설정: ✅
   🔐 네이버 Client Secret 설정: ✅
   ```

3. **뉴스 테스트**
   - 카카오톡에서 "오늘 뉴스" 입력
   - 정상 동작시 네이버 검색 결과 표시

## ⚡ 네이버 검색 API 특징

- **검색 가능한 콘텐츠**: 뉴스, 블로그, 쇼핑, 이미지 등
- **일일 요청 한도**: 25,000회
- **정렬 옵션**: 정확도순(`sim`), 날짜순(`date`)
- **HTML 태그**: 자동으로 제거됨

## 🚀 뉴스 검색 키워드

봇이 자동으로 감지하는 뉴스 관련 키워드:
- `뉴스`, `최신뉴스`, `오늘뉴스`
- `새로운소식`, `헤드라인`, `속보`, `시사`

## 🔧 트러블슈팅

### API 키 오류
```
⚠️ 네이버 API 키가 설정되지 않았습니다.
```
→ 환경변수 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 확인

### 검색 결과 없음
```
📰 검색된 뉴스가 없습니다.
```
→ 검색 키워드 변경 또는 네이버 API 상태 확인

### API 호출 실패
```
❌ 네이버 뉴스 API 오류: [오류메시지]
```
→ API 키 유효성 및 일일 한도 확인

## 📞 지원

문제가 지속되면 GitHub Issues에 문의해주세요:
https://github.com/aski-p/kakao-skill-webhook/issues