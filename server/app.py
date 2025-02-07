from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import AzureOpenAI
import os

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True) 