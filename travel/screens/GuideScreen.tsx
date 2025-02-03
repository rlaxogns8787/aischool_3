import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, Mic } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import WaveIcon from '../assets/wave.svg';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

// Azure OpenAI Configuration
const AZURE_ENDPOINT = "YOUR_AZURE_ENDPOINT";
const AZURE_API_KEY = "YOUR_API_KEY";
const AZURE_DEPLOYMENT_NAME = "YOUR_DEPLOYMENT_NAME";

type Message = {
  id: string;
  text: string;
  isAI: boolean;
  isLoading?: boolean;
};

export default function GuideScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '음성인식 중입니다. 말을 하면 자동 입력됩니다. 지금 말을 하기 어려운 상황이라면 아래 입력창을 이용해주세요.',
      isAI: true,
    },
    {
      id: '2',
      text: '먼저 진행하기전에 아래 두 옵션 중 하나를 선택을 해주세요. 이미 어느정도 정해진 일정이 있다면 1번, 여행을 염두하고 계시지만 어떻게 시작해야할 지 몰라 저와 함께 서슴부터 같이 진행하고 싶다면 2번을 선택해주세요.',
      isAI: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to send message to Azure OpenAI
  const sendToAzureOpenAI = async (userMessage: string) => {
    try {
      // Add loading message
      const loadingMessageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: loadingMessageId,
        text: '',
        isAI: true,
        isLoading: true,
      }]);

      const response = await fetch(`${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "당신은 여행 일정을 계획하는데 도움을 주는 AI 여행 가이드입니다. 사용자의 선호도와 요구사항을 파악하여 최적의 여행 일정을 제안해주세요."
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, text: aiResponse, isLoading: false }
          : msg
      ));

    } catch (error) {
      console.error('Azure OpenAI Error:', error);
      Alert.alert('오류', 'AI 응답을 받아오는데 실패했습니다.');
      
      // Remove loading message on error
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    }
  };

  useEffect(() => {
    function onSpeechResults(e: SpeechResultsEvent) {
      if (e.value && e.value[0]) {
        const recognizedText = e.value[0];
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: recognizedText,
          isAI: false,
        }]);
        sendToAzureOpenAI(recognizedText);
      }
    }

    function onSpeechError(e: SpeechErrorEvent) {
      console.error(e);
      setIsListening(false);
      Alert.alert('음성 인식 오류', '음성을 인식하는 중에 문제가 발생했습니다.');
    }

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: inputText,
        isAI: false,
      }]);
      const messageToSend = inputText;
      setInputText('');
      sendToAzureOpenAI(messageToSend);
    }
  };

  const handleVoiceInput = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      } else {
        setIsListening(true);
        await Voice.start('ko-KR');
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
      Alert.alert('오류', '음성 인식을 시작할 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>직접등록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isAI ? styles.aiMessage : styles.userMessage,
            ]}
          >
            {message.isAI && (
              <View style={styles.waveIcon}>
                {message.isLoading ? (
                  <ActivityIndicator color="#006FFD" />
                ) : (
                  <WaveIcon width={24} height={24} />
                )}
              </View>
            )}
            <Text style={[
              styles.messageText,
              message.isAI ? styles.aiMessageText : styles.userMessageText,
            ]}>
              {message.isLoading ? '응답을 생성하고 있습니다...' : message.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleVoiceInput}
            disabled={isListening}
          >
            {isListening ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Mic size={24} color={isListening ? '#fff' : '#006FFD'} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#006FFD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    borderRadius: 16,
    padding: 16,
  },
  aiMessage: {
    backgroundColor: '#F2F2F7',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  waveIcon: {
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  aiMessageText: {
    color: '#000',
  },
  userMessageText: {
    color: '#000',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#006FFD',
  },
  micButtonActive: {
    backgroundColor: '#006FFD',
  },
});

