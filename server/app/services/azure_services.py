import openai
from config.settings import AZURE_OPENAI_CONFIG

def init_azure_openai():
    openai.api_type = AZURE_OPENAI_CONFIG["api_type"]
    openai.api_base = AZURE_OPENAI_CONFIG["api_base"]
    openai.api_version = AZURE_OPENAI_CONFIG["api_version"]
    openai.api_key = AZURE_OPENAI_CONFIG["api_key"]

def chat_completion(message: str) -> str:
    try:
        response = openai.ChatCompletion.create(
            engine="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 여행 가이드 챗봇입니다."},
                {"role": "user", "content": message}
            ],
            max_tokens=500,
            temperature=0.7,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        raise Exception(f"OpenAI API Error: {str(e)}") 