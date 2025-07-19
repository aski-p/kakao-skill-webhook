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
def get_claude_client():
    """Claude API 클라이언트를 동적으로 가져오기 (환경변수 실시간 체크)"""
    api_key = os.environ.get("CLAUDE_API_KEY")
    if api_key:
        print("✅ Claude API 키가 설정되어 있습니다.")
        return Anthropic(api_key=api_key)
    else:
        print("❌ CLAUDE_API_KEY 환경변수가 설정되지 않았습니다!")
        print("🔧 Railway 대시보드 → Variables 탭 → New Variable")
        print("   - Name: CLAUDE_API_KEY")
        print("   - Value: [YOUR_CLAUDE_API_KEY_HERE]")
        print("⏳ 설정 후 서버를 재시작해주세요.")
        return None

# 시작시 API 키 체크
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")
if CLAUDE_API_KEY:
    print("✅ Claude API 키가 정상적으로 설정되었습니다.")
    client = Anthropic(api_key=CLAUDE_API_KEY)
else:
    print("❌ 시작시 Claude API 키가 없습니다. 환경변수를 설정해주세요.")
    client = None

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
        
        # Claude API 클라이언트 동적 체크
        current_client = get_claude_client()
        
        if not current_client:
            print("⚠️ Claude API 클라이언트가 없어서 안내 메시지를 보냅니다.")
            test_response = f"🔧 Claude AI 설정이 필요합니다.\n\n받은 메시지: '{user_utterance}'\n\nRailway 대시보드에서 CLAUDE_API_KEY 환경변수를 설정해주세요.\n\n설정 후 자동으로 AI 응답이 활성화됩니다."
        else:
            print("✅ Claude API 호출 시작...")
            try:
                # Claude API 호출 (응답 속도 최적화)
                response = current_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=400,  # 적절한 응답 길이
                    messages=[
                        {"role": "user", "content": user_utterance}
                    ]
                )
                
                test_response = response.content[0].text
                print(f"✅ Claude 응답 받음 ({len(test_response)}자): {test_response[:100]}...")
            except Exception as claude_error:
                print(f"❌ Claude API 오류: {claude_error}")
                test_response = f"죄송합니다. Claude AI 서비스에 일시적인 문제가 있습니다.\n\n요청하신 내용: '{user_utterance}'\n\n잠시 후 다시 시도해주세요."
        
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
    # 실시간 API 키 체크
    current_api_key = os.environ.get("CLAUDE_API_KEY")
    claude_status = "configured" if current_api_key else "not_configured"
    
    status = {
        "status": "healthy",
        "message": "Kakao Skill Webhook Server is running",
        "claude_api": claude_status,
        "claude_api_length": len(current_api_key) if current_api_key else 0,
        "endpoints": {
            "webhook": "/kakao-skill-webhook",
            "root_webhook": "/",
            "health": "/health",
            "test": "/test"
        },
        "environment": {
            "PORT": os.environ.get("PORT", "5000"),
            "RAILWAY_ENVIRONMENT": os.environ.get("RAILWAY_ENVIRONMENT", "local")
        }
    }
    
    if not current_api_key:
        status["warning"] = "Claude API key not configured. Please set CLAUDE_API_KEY environment variable in Railway dashboard."
        status["instructions"] = {
            "step1": "Go to Railway dashboard",
            "step2": "Click on Variables tab", 
            "step3": "Add CLAUDE_API_KEY variable",
            "step4": "Wait for automatic redeploy"
        }
    else:
        status["success"] = "Claude API is properly configured and ready to use."
    
    return jsonify(status)

@app.route('/', methods=['GET', 'POST'])
def home():
    """홈 페이지 및 루트 웹훅 엔드포인트"""
    if request.method == 'GET':
        # 실시간 API 키 상태 체크
        current_api_key = os.environ.get("CLAUDE_API_KEY")
        api_status = "✅ 설정됨" if current_api_key else "❌ 미설정"
        api_length = f"({len(current_api_key)}자)" if current_api_key else ""
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>카카오 챗봇 Claude AI 서버</title>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                .status {{ background: {'#d4edda' if current_api_key else '#f8d7da'}; 
                          border: 1px solid {'#c3e6cb' if current_api_key else '#f5c6cb'}; 
                          padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .endpoint {{ background: #e9ecef; padding: 10px; margin: 5px 0; border-radius: 3px; }}
                a {{ color: #007bff; text-decoration: none; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <h1>🤖 카카오 챗봇 Claude AI 스킬 서버</h1>
            
            <div class="status">
                <h3>📊 서버 상태</h3>
                <p><strong>상태:</strong> 정상 실행 중</p>
                <p><strong>Claude API:</strong> {api_status} {api_length}</p>
                <p><strong>Railway 환경:</strong> {os.environ.get("RAILWAY_ENVIRONMENT", "local")}</p>
            </div>
            
            <h3>📋 사용 가능한 엔드포인트:</h3>
            <div class="endpoint"><strong>POST /kakao-skill-webhook</strong> - 카카오 스킬 웹훅 (권장)</div>
            <div class="endpoint"><strong>POST /</strong> - 루트 웹훅 (현재 경로)</div>
            <div class="endpoint"><strong>GET /health</strong> - <a href="/health">서버 상태 확인 (JSON)</a></div>
            <div class="endpoint"><strong>GET/POST /test</strong> - <a href="/test">간단한 테스트</a></div>
            
            <hr>
            <h3>🔧 설정 가이드</h3>
            {'<p style="color: green;">✅ 모든 설정이 완료되었습니다! 카카오 챗봇에서 테스트해보세요.</p>' if current_api_key else '''
            <p style="color: red;">❌ Claude API 키가 설정되지 않았습니다.</p>
            <ol>
                <li>Railway 대시보드 접속</li>
                <li>Variables 탭 클릭</li>
                <li>New Variable 클릭</li>
                <li>Name: CLAUDE_API_KEY</li>
                <li>Value: [YOUR_CLAUDE_API_KEY_HERE]</li>
                <li>Add 클릭 후 재배포 대기</li>
            </ol>
            '''}
            
            <p>💡 <strong>카카오 스킬 URL:</strong> <code>https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook</code></p>
        </body>
        </html>
        """
    elif request.method == 'POST':
        # POST 요청일 경우 웹훅 처리
        return handle_kakao_webhook()

if __name__ == '__main__':
    # Railway에서는 PORT 환경변수를 사용
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)