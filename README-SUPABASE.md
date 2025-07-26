# 🎬 Supabase 영화 데이터베이스 시스템

완전한 영화 데이터베이스와 자동 크롤링 시스템을 Supabase로 구축했습니다.

## 🗄️ 데이터베이스 구조

### 테이블 구성
- **movies**: 영화 기본 정보 (제목, 감독, 출연진, 평점 등)
- **critic_reviews**: 평론가 리뷰 (이동진, 김혜리, 허지웅 등)
- **audience_reviews**: 관객 실제 리뷰 (사용자명, 평점, 한줄평)
- **box_office**: 박스오피스 정보 (선택사항)

### 환경변수 설정 (Railway)
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
KOFIC_API_KEY=504ec8ff56d6c888399e9b9c1f719f03
```

## 🚀 시스템 기능

### 1. 영화평 검색 우선순위
1. **Supabase DB 조회** (최우선) - 영화진흥위원회 + 네이버 통합 데이터
2. **로컬 공개 DB** (fallback) - 인기 영화 하드코딩 데이터
3. **네이버 API** (마지막) - 실시간 검색

### 2. 자동 크롤링 시스템 (통합)
- **스케줄**: 매일 오전 12시 (한국시간)
- **1단계**: 영화진흥위원회 API로 박스오피스 기반 전체 영화 수집
- **2단계**: 네이버 API로 포스터, 평점 등 상세 정보 보완
- **중복 방지**: 기존 영화 제목+연도 검사
- **데이터**: 영화 기본정보 + 평론가/관객 리뷰 + 박스오피스 순위

### 3. API 엔드포인트
- `POST /api/crawl-movies`: 통합 크롤링 실행 (영화진흥위원회 + 네이버)
- `POST /api/crawl-kofic-movies`: 영화진흥위원회 전용 크롤링
- `GET /api/kofic-status`: 영화진흥위원회 API 상태 확인
- `GET /api/scheduler-status`: 스케줄러 상태 확인
- `POST /kakao-skill-webhook`: 메인 챗봇 엔드포인트

## 🎯 사용 방법

### Supabase 설정
1. Supabase 프로젝트 생성
2. `database/supabase-schema.sql` 실행
3. 환경변수 설정
4. 서버 재시작

### 영화평 요청
```
사용자: "친절한 금자씨 영화평"
응답: 
🎬 "친절한 금자씨" 영화평 종합

📽️ 기본 정보
감독: 박찬욱
출연: 이영애, 최민식, 강혜정, 김시후, 남일우
...

👨‍💼 평론가 평가:
1. 이동진 ★★★★☆ (8.5/10)
   "박찬욱 감독의 복수 삼부작 완결편..."

👥 관객 실제 평가:
1. movie_fanatic ★★★★★ (9/10)
   "이영애 연기 정말 대단해요..."
```

## 🔧 기술 스택

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Scheduler**: node-cron
- **APIs**: 네이버 영화 API, 네이버 뉴스 API
- **Deployment**: Railway

## 📊 데이터 흐름

```
영화평 요청 → Supabase 검색 → 있으면 DB 데이터 반환
                ↓ (없으면)
            로컬 공개 DB 검색 → 있으면 하드코딩 데이터 반환
                ↓ (없으면)
            네이버 API 검색 → 실시간 데이터 수집 + DB 저장
```

## ⚡ 성능 최적화

- **캐싱**: Supabase 조회 결과 세션 캐시
- **배치 처리**: 크롤링시 API 호출 간격 조절
- **중복 제거**: 제목+연도 기반 중복 검사
- **점진적 확장**: 인기 영화부터 우선 수집

## 🛠️ 유지보수

### 수동 크롤링 실행
```bash
# 통합 크롤링 (영화진흥위원회 + 네이버)
curl -X POST https://your-app.railway.app/api/crawl-movies

# 영화진흥위원회 전용 크롤링
curl -X POST https://your-app.railway.app/api/crawl-kofic-movies
```

### 시스템 상태 확인
```bash
# 스케줄러 상태
curl https://your-app.railway.app/api/scheduler-status

# 영화진흥위원회 API 상태
curl https://your-app.railway.app/api/kofic-status
```

### 로그 모니터링
- Railway 대시보드에서 실시간 로그 확인
- 크롤링 성공/실패 상태 추적

## 🎉 결과

✅ **영화진흥위원회 API 통합**: 박스오피스 기반 전체 영화 데이터베이스  
✅ **완전한 영화평 시스템**: 감독, 출연진, 평점, 평론가 리뷰, 관객 리뷰 포함  
✅ **자동 데이터 업데이트**: 매일 신규 영화 자동 수집 (2단계 크롤링)  
✅ **중복 방지**: 기존 영화와 중복 체크  
✅ **실시간 조회**: Supabase 데이터베이스에서 빠른 검색  
✅ **확장 가능**: 영화진흥위원회 최신 데이터 자동 동기화  

**Railway 환경변수 추가 후 완전 활성화**:
```
KOFIC_API_KEY=504ec8ff56d6c888399e9b9c1f719f03
```

이제 모든 영화 요청이 영화진흥위원회 공식 데이터 기반으로 처리됩니다! 🎬✨