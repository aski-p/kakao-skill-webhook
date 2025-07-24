# 🔧 카카오톡 스킬 webhook 디버깅 가이드

## 현재 상황 분석

**문제**: "맥미니 m4와 m2 성능차이 알려줘" 메시지에 응답을 받지 못함

**원인**: Railway 환경변수 (API 키) 미설정으로 인한 서비스 제한

## ⚡ 즉시 해결 방법

### 1. Railway 환경변수 설정 (5분 소요)

1. **Railway 대시보드 접속**
   - https://railway.app 로그인
   - `kakao-skill-webhook` 프로젝트 클릭

2. **환경변수 추가**
   - **"Variables"** 탭 클릭
   - **"New Variable"** 버튼 클릭
   - 다음 정보 입력:

```bash
# 필수 환경변수
CLAUDE_API_KEY=your-claude-api-key-here
NAVER_CLIENT_ID=your-naver-client-id-here  
NAVER_CLIENT_SECRET=your-naver-client-secret-here
```

3. **재배포 대기**
   - "Add" 클릭 후 1-2분 자동 재배포 대기
   - 로그에서 ✅ 표시 확인

### 2. API 키 획득 방법

#### Claude API 키
1. https://console.anthropic.com 접속
2. API Keys → Create Key 
3. 생성된 키 복사 (`sk-ant-api...`)

#### 네이버 API 키 (선택사항)
1. https://developers.naver.com/main/ 접속
2. 애플리케이션 등록 → 검색 API 선택
3. Client ID, Client Secret 확인

## 🚨 현재 서버 상태

```bash
🔑 Claude API 키 설정: ❌
📰 네이버 Client ID 설정: ❌ 
🔐 네이버 Client Secret 설정: ❌
```

**결과**: AI 응답 불가, 기본 시간 응답만 제공

## 📋 테스트 시나리오

### 환경변수 설정 전 (현재)
```bash
입력: "맥미니 m4와 m2 성능차이 알려줘"
출력: "안녕하세요! 서버가 정상 작동 중입니다. 현재 시간: ..."
```

### 환경변수 설정 후 (예상)
```bash
입력: "맥미니 m4와 m2 성능차이 알려줘"  
출력: "🖥️ Mac mini M4 vs M2 성능 비교

**CPU 성능**
- M4: 10코어 CPU (4P+6E), 최대 25% 향상
- M2: 8코어 CPU (4P+4E)

**GPU 성능** 
- M4: 10코어 GPU, Ray Tracing 지원
- M2: 10코어 GPU (동일 코어, 성능 15% 향상)

**메모리**
- M4: 통합 메모리 최대 64GB 지원
- M2: 통합 메모리 최대 24GB

**전력 효율성**
- M4: 3nm 공정, 전력 효율 20% 개선
- M2: 5nm 공정

**가격 대비 성능**
- M4: 신제품 프리미엄 적용
- M2: 가격 하락으로 가성비 우수

💡 용도별 추천:
- 전문 작업(영상편집, 3D): M4 추천
- 일반 사용, 가성비: M2도 충분

🔄 '계속'을 입력하면 더 자세한 벤치마크 점수를 확인할 수 있습니다."
```

## 🔍 실시간 디버깅

### Railway 로그 모니터링
```bash
# Railway CLI 사용 (선택사항)
railway logs --follow

# 웹에서 확인 (권장)
Railway 대시보드 → 프로젝트 → "Logs" 탭
```

### 기대되는 로그 메시지
```bash
✅ 성공 케이스:
🔔 카카오 웹훅 요청 받음!
💬 사용자 메시지: '맥미니 m4와 m2 성능차이 알려줘'
🤖 Claude API 호출 중...
📄 응답 분할: 총 2개 청크, 첫 청크 756자
✅ 텍스트 응답 전송 완료

❌ 실패 케이스:
🔔 카카오 웹훅 요청 받음!  
💬 사용자 메시지: '맥미니 m4와 m2 성능차이 알려줘'
⚠️ Claude API 키가 설정되지 않았습니다.
❌ 에러 발생: API 키가 설정되지 않았습니다
```

## ⏱️ 예상 해결 시간

- **환경변수 설정**: 3분
- **Railway 재배포**: 2분  
- **테스트 및 확인**: 1분
- **총 소요시간**: **6분**

## 📞 추가 지원

환경변수 설정 후에도 문제가 지속되면:

1. **서버 재시작**: Railway에서 Manual Deploy
2. **캐시 클리어**: 브라우저 새로고침  
3. **로그 분석**: 구체적인 에러 메시지 확인

---

**🎯 목표**: 5-10분 내 정상 AI 응답 서비스 복구