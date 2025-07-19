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

# 시작시 환경변수 체크
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")
if CLAUDE_API_KEY:
    print("✅ Claude API 키가 설정되었습니다.")
else:
    print("❌ Claude API 키가 설정되지 않았습니다. Railway Variables에서 CLAUDE_API_KEY를 설정해주세요.")

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
        
        # Claude API 호출
        api_key = os.environ.get("CLAUDE_API_KEY")
        
        if not api_key:
            print("⚠️ Claude API 키가 설정되지 않았습니다.")
            test_response = f"안녕하세요! 현재 Claude AI 설정 중입니다.\n받은 메시지: '{user_utterance}'"
        else:
            print("✅ Claude API 호출 시작...")
            try:
                client = Anthropic(api_key=api_key)
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=400,
                    messages=[{"role": "user", "content": user_utterance}]
                )
                
                test_response = response.content[0].text
                print(f"✅ Claude 응답 받음: {test_response[:100]}...")
            except Exception as e:
                print(f"❌ Claude API 오류: {e}")
                test_response = f"죄송합니다. 잠시 후 다시 시도해주세요.\n요청: '{user_utterance}'"
        
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



@app.route('/', methods=['GET', 'POST'])
def home():
    """홈 페이지 및 루트 웹훅 엔드포인트"""
    if request.method == 'GET':
        current_api_key = os.environ.get("CLAUDE_API_KEY")
        status = "✅ Claude API 설정됨" if current_api_key else "❌ Claude API 미설정"
        
        return f"""
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>Claude API:</strong> {status}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> https://kakao-skill-webhook-production.up.railway.app/kakao-skill-webhook</p>
        <p><strong>루트 웹훅:</strong> https://kakao-skill-webhook-production.up.railway.app</p>
        """
    elif request.method == 'POST':
        return handle_kakao_webhook()

if __name__ == '__main__':
    # Railway에서는 PORT 환경변수를 사용
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)