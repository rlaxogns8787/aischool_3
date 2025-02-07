from flask import Flask
from flask_cors import CORS
from app.routes.chat import chat_bp
from app.services.azure_services import init_azure_openai

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Azure OpenAI 초기화
    init_azure_openai()
    
    # 라우트 등록
    app.register_blueprint(chat_bp)
    
    return app 