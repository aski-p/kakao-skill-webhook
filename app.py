from flask import Flask, request, jsonify
import os
from anthropic import Anthropic

app = Flask(__name__)

# Claude API 키 설정 (환경변수에서 로드)
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")
if not CLAUDE_API_KEY:
    print("⚠️ CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.")
    print("배포 시 환경변수를 설정해주세요: CLAUDE_API_KEY=your_api_key")
    client = None
else:
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
        print(f"Error occurred: {e}")
        
        # 에러 유형에 따른 응답 메시지
        if "Claude API 키가 설정되지 않았습니다" in str(e):
            error_message = "서버 설정 중입니다. 잠시만 기다려주세요."
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
    status = {
        "status": "healthy",
        "message": "Server is running",
        "claude_api": "configured" if client else "not_configured"
    }
    return jsonify(status)

@app.route('/', methods=['GET', 'POST'])
def home():
    """홈 페이지 및 루트 웹훅 엔드포인트"""
    if request.method == 'GET':
        return "카카오 챗봇 Claude AI 스킬 서버가 정상적으로 실행 중입니다."
    elif request.method == 'POST':
        # POST 요청일 경우 웹훅 처리
        return handle_kakao_webhook()

if __name__ == '__main__':
    # Railway에서는 PORT 환경변수를 사용
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)