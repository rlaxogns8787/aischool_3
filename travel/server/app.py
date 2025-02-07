from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

app = Flask(__name__)
CORS(app)

# Azure OpenAI 설정
openai.api_type = "azure"
openai.api_base = "https://ssapy-openai.openai.azure.com"
openai.api_version = "2024-08-01-preview"
openai.api_key = "AdUzyU0yj12b5DMUqoABiwtYMiinFxzYtV6t2bfUR4gLVst0hU9eJQQJ99BAACfhMk5XJ3w3AAABACOGiK4S"

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message", "")

        response = openai.ChatCompletion.create(
            engine="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 여행 가이드 챗봇입니다."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0
        )

        return jsonify({
            "success": True,
            "response": response["choices"][0]["message"]["content"]
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000) 