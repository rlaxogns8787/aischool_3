import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { AuthProvider } from "./contexts/AuthContext";
import HomeScreen from "./screens/HomeScreen";
import ScheduleScreen from "./screens/ScheduleScreen.tsx";
import TravelLogScreen from "./screens/TravelLogScreen.tsx";
import OnboardingScreen from "./screens/OnboardingScreen";
import AuthScreen from "./screens/AuthScreen";
import AgreementScreen from "./screens/AgreementScreen";
// import TermsDetailScreen from "./screens/TermsDetailScreen";
import CustomDrawerContent from "./components/CustomDrawerContent";
import HomeIcon from "./assets/home.svg";
import CalendarIcon from "./assets/schedule.svg";
import GalleryIcon from "./assets/travellog.svg";
import "react-native-gesture-handler";
import ChatScreen from "./screens/ChatScreen";
import TourScreen from "./screens/TourScreen.tsx";
import { MessageCircle } from "lucide-react-native";
import MyProfileScreen from "./screens/MyProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ScheduleDetail from "./screens/ScheduleDetail";
import TravelLogDetail from "./screens/TravelLogDetail";
import TermsDetailScreen from "./screens/TermsDetailScreen";
import CustomerSupportScreen from "./screens/CustomerSupportScreen";
import TMapScreen from "./screens/TMapScreen";
import MapScreen from "./screens/MapScreen";

export type RootStackParamList = {
  Auth: undefined;
  Agreement: {
    email?: string;
    isSignUp?: boolean;
    direction?: "back";
    showHeader?: boolean;
  };
  TermsDetail: {
    title: string;
    content: string;
  };
  EditProfile: {
    field: string;
    currentValue?: string;
  };
  Onboarding: undefined;
  Main: undefined;
  Chat: undefined;
  Tour: undefined;
  Map: undefined;
  MyProfile: undefined;
  ScheduleDetail: undefined;
  TravelLogDetail: undefined;
  CustomerSupport: undefined;
  TMap: undefined;
};

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 82,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: 0,
          paddingBottom: 0,
          display: route.name === "가이드" ? "none" : "flex",
        },
        tabBarItemStyle: {
          height: 48,
          paddingTop: 12,
          paddingBottom: 12,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarLabelStyle: {
          fontFamily: "System",
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "400",
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
      })}
    >
      <Tab.Screen
        name="홈"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <HomeIcon width={24} height={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="가이드"
        component={TourScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MessageCircle width={24} height={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="내일정"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <CalendarIcon width={24} height={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="여행기록"
        component={TravelLogScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <GalleryIcon width={24} height={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 305,
          backgroundColor: "#F7F7F7",
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
      <Drawer.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#fff",
              },
              animation: "slide_from_right",
              gestureDirection: "horizontal",
              gestureEnabled: true,
            }}
            initialRouteName="Auth"
          >
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen
              name="Agreement"
              component={AgreementScreen}
              options={({ route }) => ({
                animation:
                  route.params?.direction === "back"
                    ? "slide_from_left"
                    : "slide_from_right",
                gestureDirection: "horizontal",
              })}
            />

            {/* 고객센터 화면 추가 */}
            <Stack.Screen
              name="CustomerSupport"
              component={CustomerSupportScreen}
            />

            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerTitle: "여행 플래너",
                headerTitleAlign: "center",
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Tour"
              component={TourScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: false,
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="ScheduleDetail"
              component={ScheduleDetail} // 추가
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TravelLogDetail"
              component={TravelLogDetail} // 추가
              options={{ headerShown: false }}
            />

            {/* TermsDetailScreen 추가 */}
            <Stack.Screen
              name="TermsDetail"
              component={TermsDetailScreen}
              options={{
                headerShown: true, // 헤더 표시
                animation: "slide_from_right",
                gestureDirection: "horizontal",
              }}
            />

            <Stack.Screen
              name="TMap"
              component={TMapScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="Map"
              component={MapScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
