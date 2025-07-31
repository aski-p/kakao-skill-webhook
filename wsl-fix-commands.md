# WSL에서 Playwright 실행하기

## 🚀 빠른 해결책 (권장)

터미널에서 다음 명령어를 **순서대로** 실행하세요:

### 1단계: 시스템 종속성 설치
```bash
sudo apt-get update
sudo npx playwright install-deps
```

### 2단계: 테스트 실행
```bash
cd /home/aski/mcp-servers
node deadlock-test.js
```

## 🔧 수동 설치 (1단계가 안 될 경우)

```bash
sudo apt-get update && sudo apt-get install -y \
    libnspr4 \
    libnss3 \
    libasound2t64 \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3
```

## 🐳 Docker 대안 (시스템 종속성 설치 불가능한 경우)

Docker Desktop for Windows 설치 후:

```bash
cd /home/aski/mcp-servers
node docker-playwright-test.js
```

## ✅ 성공 확인

설치 후 다음과 같이 출력되면 성공:

```
🎮 Deadlock Items 페이지 테스트 시작...
🌐 페이지 로딩 중...
📄 페이지 제목: Deadlock Stats
✅ 아이템 컨텐츠 로드 완료
🖼️ 이미지 상태: 총 27개, 로드 성공 27개, 실패 0개
📊 카테고리별 아이템 수:
  - 무기: 9개 아이템
  - 활력: 9개 아이템  
  - 정신력: 9개 아이템
📸 스크린샷 저장됨: /home/aski/deadlock-items-test.png
🎉 모든 테스트 완료!
```

## 🔍 문제 해결

### "sudo: a password is required" 오류
- WSL에서 `sudo passwd` 명령어로 패스워드 설정
- 또는 Windows 터미널을 관리자 권한으로 실행

### "Docker not found" 오류  
- Docker Desktop for Windows 설치
- WSL 통합 활성화: Settings > Resources > WSL Integration

### 그래도 안 될 경우
- Claude Code의 내장 Playwright MCP 사용 (이미 설정 완료)
- GitHub Codespaces 또는 온라인 IDE 사용