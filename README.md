# AI Travel Guide

AI 기반의 여행 가이드 애플리케이션입니다.

## 주요 기능

- 사용자 인증 (로그인/회원가입)
- 음성 인식 기반 여행 플래너
  - 실시간 음성-텍스트 변환
  - 자연어 대화를 통한 여행 계획 수립
- 여행 스타일 기반 추천
  - 문화탐방, 자연관광, 맛집탐방 등 선호도 기반
  - 지역별 맞춤 추천
- 여행 일정 관리
  - 일정 생성 및 수정
  - 상세 일정 설계
- 여행 기록 저장

## 기술 스택

### Frontend (travel/)

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Speech (음성 인식)

### Backend (myAzureBot/)

- Node.js
- Azure Bot Framework
- Azure Speech Services
- Express

## 시작하기

### 필수 조건

- Node.js 14.0 이상
- npm 또는 yarn
- Expo CLI

### 설치

## 프로젝트 구조

```
TravelBot/
├── travel/              # 모바일 앱 (Frontend)
│   ├── assets/         # 이미지, 아이콘 등 리소스
│   ├── components/     # 재사용 컴포넌트
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   ├── navigation/     # 네비게이션 설정
│   │   └── AppNavigator.tsx
│   ├── screens/        # 화면 컴포넌트
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── AuthScreen.tsx
│   └── App.tsx         # 앱 진입점
│
└── myAzureBot/         # 챗봇 서버 (Backend)
    ├── index.js        # 서버 엔트리포인트
    └── ChatBot.js      # 챗봇 로직
```

## 라이선스
