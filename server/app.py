from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import AzureOpenAI
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Azure OpenAI 설정
AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/"
AZURE_OPENAI_KEY = "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4"
AZURE_OPENAI_DEPLOYMENT = "gpt-4o"

# Azure Search 설정
AZURE_SEARCH_ENDPOINT = "https://ssapy-search.search.windows.net"
AZURE_SEARCH_KEY = "s6d0odfWQpmQh1HpjXELLBbrq1blnEvtGOncvWqMNyAzSeA2zxTa"
AZURE_SEARCH_INDEX = "travel-index"

# 데이터 저장 디렉토리 설정
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 피드백 데이터 파일 경로
FEEDBACK_FILE = os.path.join(DATA_DIR, 'feedback.json')

# 피드백 데이터 로드
def load_feedback():
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

# 피드백 데이터 저장
def save_feedback(feedback_list):
    with open(FEEDBACK_FILE, 'w', encoding='utf-8') as f:
        json.dump(feedback_list, f, ensure_ascii=False, indent=2)

# Azure OpenAI 클라이언트 초기화
client = AzureOpenAI(
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_key=AZURE_OPENAI_KEY,
    api_version="2024-02-15-preview"
)

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message", "")

        # 채팅 요청 구성
        messages = [
            {
                "role": "system",
                "content": "당신은 여행 가이드 챗봇입니다. 다음과 같은 형식으로 답변해주세요:\n1. 여행지 추천\n2. 주요 관광지\n3. 예상 소요 시간\n4. 교통 정보\n5. 예상 비용"
            },
            {
                "role": "user",
                "content": user_message
            }
        ]

        # Azure OpenAI API 호출
        completion = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=messages,
            max_tokens=800,
            temperature=0.7,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0,
            data_sources=[{
                "type": "azure_search",
                "parameters": {
                    "endpoint": AZURE_SEARCH_ENDPOINT,
                    "key": AZURE_SEARCH_KEY,
                    "indexName": AZURE_SEARCH_INDEX,
                    "semantic_configuration": "travel-semantic",
                    "query_type": "semantic",
                    "in_scope": True,
                    "strictness": 3,
                    "top_n_documents": 5
                }
            }]
        )

        return jsonify({
            "success": True,
            "response": completion.choices[0].message.content
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/feedback', methods=['POST'])
def save_user_feedback():
    try:
        feedback_data = request.json
        print(f"Received feedback data: {feedback_data}")
        
        # 필수 필드 검증
        required_fields = ['rating', 'emotion', 'feedback', 'location', 'timestamp', 'username']
        for field in required_fields:
            if field not in feedback_data:
                print(f"Missing field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # 피드백 데이터 파일이 없으면 생성
        if not os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        # 기존 피드백 데이터 로드
        feedback_list = load_feedback()
        
        # 새 피드백 추가
        new_feedback = {
            'id': len(feedback_list) + 1,
            'username': feedback_data['username'],
            'rating': feedback_data['rating'],
            'emotion': feedback_data['emotion'],
            'feedback': feedback_data['feedback'],
            'location': feedback_data['location'],
            'timestamp': feedback_data['timestamp'],
            'created_at': datetime.now().isoformat()
        }
        feedback_list.append(new_feedback)
        print(f"Saving feedback: {new_feedback}")
        
        # 피드백 저장
        save_feedback(feedback_list)
        
        return jsonify({
            'message': 'Feedback saved successfully',
            'feedback_id': new_feedback['id']
        }), 200
        
    except Exception as e:
        print(f"Error saving feedback: {str(e)}")
        return jsonify({'error': f'Failed to save feedback: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True) 