# Playwright MCP 서버 설정 가이드

## 현재 상태
✅ Playwright MCP 서버 설치 완료 (`@playwright/mcp`)
✅ Playwright 브라우저 다운로드 완료 (Chromium)
✅ Claude 설정 파일 업데이트 완료

## 설정 파일 위치
- **Claude 설정**: `/home/aski/claude_desktop_config.json`
- **MCP 서버**: `/home/aski/mcp-servers/node_modules/@playwright/mcp/`
- **브라우저**: `/home/aski/.cache/ms-playwright/`

## 현재 Claude 설정
```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "/home/aski/mcp-servers/node_modules/@playwright/mcp/index.js"
      ],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "/home/aski/.cache/ms-playwright",
        "DISPLAY": ":0"
      }
    }
  }
}
```

## 시스템 종속성 문제
현재 WSL 환경에서 시스템 종속성이 누락되어 브라우저가 실행되지 않습니다.

### 해결 방법 1: 시스템 종속성 설치 (권장)
관리자 권한으로 다음 명령어 실행:
```bash
sudo apt-get update
sudo apt-get install libnspr4 libnss3 libasound2t64 libxss1 libgconf-2-4 libxrandr2 libatk1.0-0 libgtk-3-0 libdrm2 libxcomposite1 libxdamage1
```

### 해결 방법 2: Headless 모드 사용
GUI 없이 헤드리스 모드로 브라우저 작업 수행

### 해결 방법 3: Windows Chrome 직접 연결 (실험적)
Windows Chrome을 WSL에서 직접 실행하는 방법 (현재 파이프 연결 문제 있음)

## 테스트 방법
1. Claude Code 재시작
2. MCP 서버 연결 확인
3. 브라우저 자동화 테스트 실행

## 사용 가능한 Playwright MCP 기능
- 웹페이지 탐색
- 스크린샷 캡처
- 요소 클릭/입력
- 네트워크 요청 모니터링
- 페이지 성능 측정
- 크로스 브라우저 테스트

## 다음 단계
1. 시스템 종속성 설치 후 Claude Code 재시작
2. Playwright MCP 서버 정상 작동 확인
3. 브라우저 자동화 기능 테스트