import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import TMapScreen from "../screens/TMapScreen";
import SpontaneousTourScreen from "../screens/SpontaneousTourScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          // 또는 헤더를 보여주고 싶다면:
          // headerTitle: "여행 플래너",
          // headerBackTitle: "뒤로"
        }}
      />
      <Stack.Screen
        name="TMapScreen" // ✅ TMapScreen 추가
        component={TMapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="가이드"
        component={SpontaneousTourScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
