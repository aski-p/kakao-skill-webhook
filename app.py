from flask import Flask, request, jsonify
import os
import json
from anthropic import Anthropic

app = Flask(__name__)

# CORS 설정 (카카오 요청 허용)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

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
        # 요청 로깅
        print("🔔 카카오 웹훅 요청 받음!")
        print(f"📍 Request Method: {request.method}")
        print(f"📍 Request Path: {request.path}")
        print(f"📍 Content-Type: {request.headers.get('Content-Type', 'N/A')}")
        
        # 요청 데이터 로깅
        req = request.get_json()
        if req:
            print(f"📦 요청 데이터: {req}")
            
            # 사용자 메시지 추출 시도
            if 'userRequest' in req and 'utterance' in req['userRequest']:
                user_utterance = req['userRequest']['utterance']
                print(f"💬 사용자 메시지: '{user_utterance}'")
            else:
                print("❌ userRequest.utterance가 없습니다!")
                user_utterance = "안녕하세요"  # 기본값
        else:
            print("❌ JSON 데이터가 없습니다!")
            user_utterance = "안녕하세요"  # 기본값
        
        # 간단한 테스트 응답 (Claude API 없이도 작동)
        if not client:
            print("⚠️ Claude API 클라이언트가 없어서 테스트 응답을 보냅니다.")
            test_response = f"🔧 서버 설정 중입니다.\n받은 메시지: '{user_utterance}'\nClaude API 키를 설정해주세요."
        else:
            print("✅ Claude API 호출 시작...")
            try:
                # Claude API 호출 (타임아웃 방지를 위해 max_tokens 줄임)
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=300,  # 더 빠른 응답을 위해 줄임
                    messages=[
                        {"role": "user", "content": user_utterance}
                    ]
                )
                
                test_response = response.content[0].text
                print(f"✅ Claude 응답 받음: {test_response[:100]}...")
            except Exception as claude_error:
                print(f"❌ Claude API 오류: {claude_error}")
                test_response = f"죄송합니다. AI 서비스에 일시적인 문제가 있습니다.\n받은 메시지: '{user_utterance}'"
        
        # 카카오 챗봇 응답 형식으로 변환
        kakao_response = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": test_response
                        }
                    }
                ]
            }
        }
        
        print("📤 카카오 응답 전송 중...")
        print(f"📦 응답 데이터: {kakao_response}")
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

@app.route('/test', methods=['GET', 'POST'])
def test_endpoint():
    """간단한 테스트 엔드포인트"""
    if request.method == 'GET':
        return jsonify({
            "message": "Test endpoint is working",
            "method": "GET",
            "timestamp": "2025-07-19",
            "status": "OK"
        })
    elif request.method == 'POST':
        # 카카오 형식으로 간단한 응답
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": "✅ 테스트 성공! 서버가 정상 작동합니다."
                        }
                    }
                ]
            }
        })

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
            <li><strong>GET /health</strong> - <a href="/health">서버 상태 확인</a></li>
            <li><strong>GET/POST /test</strong> - <a href="/test">간단한 테스트</a></li>
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