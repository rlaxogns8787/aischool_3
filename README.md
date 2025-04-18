# AI Travel Guide

AI 기반의 여행 가이드 애플리케이션입니다.

## 주요 기능

- 사용자 인증 (로그인/회원가입)
- 여행 플래너
  - AI 통한 여행 계획 수립
  - 여행 스타일 기반 추천
    - 문화탐방, 자연관광, 맛집탐방 등 선호도 기반
    - 지역별 맞춤 추천
- 도슨트 가이드
  - 사용자 관심사 기반 스토리텔링  
- 여행 일정 관리
  - 일정 생성 및 수정
- 여행 기록 저장

## 프로젝트 구조

```
.
├── server/                  # 백엔드 서버
│   ├── app/
│   │   ├── routes/         # API 라우트
│   │   │   └── chat.py     # 채팅 API 엔드포인트
│   │   └── services/       # 외부 서비스 연동
│   │       └── azure_services.py  # Azure OpenAI 서비스
│   ├── config/             # 서버 설정
│   │   └── settings.py     # 환경 설정
│   ├── app.py              # Flask 앱 진입점
│   └── requirements.txt    # Python 의존성
│
└── travel/                 # React Native 앱
    ├── api/                # API 클라이언트
    │   └── openai.ts       # OpenAI API 연동
    ├── components/         # 재사용 가능한 컴포넌트
    │   ├── MessageInput.tsx
    │   └── MessageList.tsx
    ├── screens/            # 화면 컴포넌트
    │   └── ChatScreen.tsx
    ├── types/              # 타입 정의
    │   └── message.ts
    └── App.tsx             # 앱 진입점
```

## 기술 스택

### Backend

- Python 3.9+
- Flask
- Azure OpenAI

### Frontend

- React Native
- TypeScript
- Expo

## 시작하기

### Backend 설정

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend 설정

```bash
cd travel
npm install
npx expo start
yarn add react-native-snap-carousel@4.0.0-beta.6 # carousel 사용에 필요
npx expo install expo-linear-gradient #새로운 안드로이드 모델 생성시 설치 필요 혹은 오류나면 설치해볼것
```

## 라이선스
