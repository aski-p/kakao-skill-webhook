from flask import Flask, request, jsonify
import os
from anthropic import Anthropic

app = Flask(__name__)

# Claude API 키 설정 (환경변수에서 로드)
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")
if not CLAUDE_API_KEY:
    print("❌ CLAUDE_API_KEY 환경변수가 설정되지 않았습니다!")
    print("🔧 Railway 대시보드 → Variables 탭 → New Variable")
    print("   - Name: CLAUDE_API_KEY")
    print("   - Value: your-claude-api-key-here")
    print("⏳ 설정 후 자동 재배포됩니다.")
    client = None
else:
    print("✅ Claude API 키가 정상적으로 설정되었습니다.")
    client = Anthropic(api_key=CLAUDE_API_KEY)

def handle_kakao_webhook():
    """카카오 챗봇 웹훅 처리 로직"""
    try:
        # Claude API 키가 설정되지 않은 경우
        if not client:
            raise Exception("Claude API 키가 설정되지 않았습니다.")
        
        # 카카오 챗봇에서 전송된 요청 데이터 파싱
        req = request.get_json()
        
        # 사용자 메시지 추출
        user_utterance = req['userRequest']['utterance']
        
        # Claude API 호출
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": user_utterance}
            ]
        )
        
        # Claude의 응답 텍스트 추출
        claude_response = response.content[0].text
        
        # 카카오 챗봇 응답 형식으로 변환
        kakao_response = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": claude_response
                        }
                    }
                ]
            }
        }
        
        return jsonify(kakao_response)
    
    except Exception as e:
        print(f"❌ Webhook Error: {e}")
        print(f"📍 Request details: {request.method} {request.path}")
        
        # 에러 유형에 따른 응답 메시지
        if "Claude API 키가 설정되지 않았습니다" in str(e):
            error_message = "🔧 서버 설정 중입니다. Railway 환경변수를 확인해주세요.\n잠시 후 다시 시도해주세요."
        elif "anthropic" in str(e).lower() or "api" in str(e).lower():
            error_message = "Claude AI 서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요."
        else:
            error_message = "죄송합니다. 현재 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        
        # 에러 발생 시 기본 응답
        error_response = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": error_message
                        }
                    }
                ]
            }
        }
        
        return jsonify(error_response)

@app.route('/kakao-skill-webhook', methods=['POST'])
def kakao_skill_webhook():
    """카카오 챗봇 스킬 웹훅 엔드포인트"""
    return handle_kakao_webhook()

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인 엔드포인트"""
    claude_status = "configured" if client else "not_configured"
    
    status = {
        "status": "healthy",
        "message": "Kakao Skill Webhook Server is running",
        "claude_api": claude_status,
        "endpoints": {
            "webhook": "/kakao-skill-webhook",
            "root_webhook": "/",
            "health": "/health"
        }
    }
    
    if not client:
        status["warning"] = "Claude API key not configured. Please set CLAUDE_API_KEY environment variable."
    
    return jsonify(status)

@app.route('/', methods=['GET', 'POST'])
def home():
    """홈 페이지 및 루트 웹훅 엔드포인트"""
    if request.method == 'GET':
        api_status = "✅ 설정됨" if client else "❌ 미설정"
        return f"""
        <h1>🤖 카카오 챗봇 Claude AI 스킬 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>Claude API:</strong> {api_status}</p>
        <hr>
        <h3>📋 사용 가능한 엔드포인트:</h3>
        <ul>
            <li><strong>POST /kakao-skill-webhook</strong> - 카카오 스킬 웹훅 (권장)</li>
            <li><strong>POST /</strong> - 루트 웹훅 (현재 경로)</li>
            <li><strong>GET /health</strong> - 서버 상태 확인</li>
        </ul>
        <hr>
        <p>💡 카카오 챗봇 관리자센터에서 이 URL을 스킬 서버로 등록하세요.</p>
        """
    elif request.method == 'POST':
        # POST 요청일 경우 웹훅 처리
        return handle_kakao_webhook()

if __name__ == '__main__':
    # Railway에서는 PORT 환경변수를 사용
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)