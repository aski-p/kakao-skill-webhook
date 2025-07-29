# 🎬 영화 데이터 자동 업데이트 스케줄러 가이드

## 📋 개요

매일 오전 12시에 자동으로 한국영화진흥위원회(KOFIC) API와 네이버 API를 통해 최신 영화 정보를 수집하고 Supabase 데이터베이스를 업데이트하는 시스템입니다.

## 🚀 스케줄러 시작

### 1. 일반 실행 (터미널에서)
```bash
node start-scheduler.js
```

### 2. 백그라운드 실행 (nohup)
```bash
nohup node start-scheduler.js > scheduler.log 2>&1 &
```

### 3. PM2를 사용한 실행 (권장)
```bash
# PM2 설치 (글로벌)
npm install -g pm2

# 스케줄러 실행
pm2 start start-scheduler.js --name "movie-scheduler"

# 상태 확인
pm2 status

# 로그 확인
pm2 logs movie-scheduler

# 자동 재시작 설정
pm2 startup
pm2 save
```

### 4. 시스템 서비스로 실행
```bash
# 서비스 파일 복사
sudo cp movie-scheduler.service /etc/systemd/system/

# 서비스 활성화
sudo systemctl enable movie-scheduler.service

# 서비스 시작
sudo systemctl start movie-scheduler.service

# 상태 확인
sudo systemctl status movie-scheduler.service

# 로그 확인
sudo journalctl -u movie-scheduler.service -f
```

## 🧪 테스트 및 수동 실행

### 스케줄러 테스트
```bash
node test-scheduler.js
```

### 수동으로 즉시 실행
```bash
node -e "require('./scheduler/movie-update-scheduler').runNow().then(console.log)"
```

### 스케줄러 상태 확인
```bash
node -e "console.log(require('./scheduler/movie-update-scheduler').getStatus())"
```

## ⏰ 스케줄 정보

- **실행 시간**: 매일 오전 12시 정각 (한국 시간)
- **시간대**: Asia/Seoul (KST)
- **cron 표현식**: `0 0 0 * * *`

## 🔄 업데이트 프로세스

### 자동 실행 순서 (매일 12시)
1. **KOFIC API 박스오피스 수집**
   - 어제 날짜 박스오피스 조회
   - 한국 영화만 필터링
   - JSON 파일로 임시 저장

2. **데이터베이스 업데이트**
   - 수집된 한국 영화를 Supabase에 저장
   - 중복 체크 및 기존 데이터 업데이트

3. **네이버 API 보완**
   - 추가 영화 정보 수집
   - 평점, 리뷰 등 보완 정보 업데이트

## 📊 로그 및 모니터링

### 로그 파일 위치
- `kofic_daily_updates.log` - KOFIC 업데이트 로그
- `daily_update_YYYYMMDD.json` - 일일 수집 데이터
- `scheduler.log` - 스케줄러 전체 로그 (nohup 사용시)

### 로그 확인 방법
```bash
# 실시간 로그 확인
tail -f kofic_daily_updates.log

# 최근 로그 확인
tail -n 100 kofic_daily_updates.log

# 특정 날짜 로그 검색
grep "2025-07-28" kofic_daily_updates.log
```

## 🛠️ 환경 변수 설정

### 필수 환경 변수
```bash
# .env 파일 또는 시스템 환경 변수
SUPABASE_URL=https://dpmoafgaysocfjxlmaum.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
KOFIC_API_KEY=504ec8ff56d6c888399e9b9c1f719f03
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

## 🔧 문제 해결

### 스케줄러가 실행되지 않는 경우
1. **환경 변수 확인**
   ```bash
   node -e "console.log(process.env.SUPABASE_URL)"
   ```

2. **포트 충돌 확인**
   ```bash
   lsof -i :3000
   ```

3. **권한 확인**
   ```bash
   ls -la start-scheduler.js
   ```

### API 오류 해결
1. **KOFIC API 키 확인**
   ```bash
   curl "http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=YOUR_API_KEY&targetDt=20250727"
   ```

2. **Supabase 연결 확인**
   ```bash
   node -e "require('./final-db-movie-updater').testConnection()"
   ```

### 메모리 부족 시
```bash
# 메모리 사용량 확인
free -h

# 스케줄러 메모리 사용량 확인
ps aux | grep node
```

## 📈 성능 최적화

### 권장 설정
- **메모리**: 최소 512MB
- **CPU**: 최소 1코어
- **디스크**: 최소 1GB 여유 공간

### 최적화 옵션
```bash
# Node.js 힙 메모리 증가
node --max-old-space-size=1024 start-scheduler.js

# PM2 메모리 제한 설정
pm2 start start-scheduler.js --name "movie-scheduler" --max-memory-restart 500M
```

## 🔄 업데이트 및 유지보수

### 스케줄러 업데이트
```bash
# 스케줄러 중지
pm2 stop movie-scheduler

# 코드 업데이트 후
pm2 restart movie-scheduler
```

### 데이터베이스 정리
```sql
-- 오래된 임시 파일 정리 (매월)
DELETE FROM movies WHERE created_at < NOW() - INTERVAL '6 months' AND naver_rating IS NULL;
```

## 📞 지원 및 문의

### 상태 확인 명령어
```bash
# 전체 시스템 상태
pm2 status && systemctl status movie-scheduler.service

# 최근 에러 로그
tail -n 50 kofic_daily_updates.log | grep "❌"

# 성공 통계
grep "🎉" kofic_daily_updates.log | wc -l
```

---

## 🎯 요약

- **설치**: `node start-scheduler.js` 또는 PM2 사용
- **스케줄**: 매일 오전 12시 자동 실행
- **테스트**: `node test-scheduler.js`
- **로그**: `tail -f kofic_daily_updates.log`
- **중지**: `Ctrl+C` 또는 `pm2 stop movie-scheduler`

**이제 매일 자동으로 최신 한국 영화 정보가 업데이트됩니다!** 🎬✨