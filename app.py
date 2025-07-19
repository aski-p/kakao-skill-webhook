from flask import Flask, request, jsonify
import os
from anthropic import Anthropic

app = Flask(__name__)

# Claude API 키 설정 (환경변수에서 로드)
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")
if not CLAUDE_API_KEY:
    print("⚠️ CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.")
    print("배포 시 환경변수를 설정해주세요: CLAUDE_API_KEY=your_api_key")

client = Anthropic(api_key=CLAUDE_API_KEY)

@app.route('/kakao-skill-webhook', methods=['POST'])
def kakao_skill_webhook():
    """카카오 챗봇 스킬 웹훅 엔드포인트"""
    try:
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
        
        # 에러 발생 시 기본 응답
        error_response = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": "죄송합니다. 현재 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
                        }
                    }
                ]
            }
        }
        
        return jsonify(error_response)

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인 엔드포인트"""
    return jsonify({"status": "healthy", "message": "Server is running"})

@app.route('/', methods=['GET'])
def home():
    """홈 페이지"""
    return "카카오 챗봇 Claude AI 스킬 서버가 정상적으로 실행 중입니다."

if __name__ == '__main__':
    # 로컬 실행
    app.run(host='0.0.0.0', port=5000, debug=True)