import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { AuthProvider } from "./contexts/AuthContext";
import HomeScreen from "./screens/HomeScreen";
import ScheduleScreen from "./screens/ScheduleScreen";
import TravelLogScreen from "./screens/TravelLogScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import AuthScreen from "./screens/AuthScreen";
import AgreementScreen from "./screens/AgreementScreen";
import TermsDetailScreen from "./screens/TermsDetailScreen";
import CustomDrawerContent from "./screens/CustomDrawerContent";
import HomeIcon from "./assets/home.svg";
import CalendarIcon from "./assets/calendar.svg";
import GalleryIcon from "./assets/gallery.svg";
import "react-native-gesture-handler";
import ChatScreen from "./screens/ChatScreen";
import TourScreen from "./screens/TourScreen";
import { MessageCircle } from "lucide-react-native";

export type RootStackParamList = {
  Auth: undefined;
  Agreement: {
    email?: string;
    isSignUp?: boolean;
    direction?: "back";
  };
  TermsDetail: {
    title?: string;
    content?: string;
  };
  Onboarding: undefined;
  Main: undefined;
  Chat: undefined;
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
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#E0E0E0",
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
        tabBarActiveTintColor: "#006FFD",
        tabBarInactiveTintColor: "#616161",
      })}
    >
      <Tab.Screen
        name="홈"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <HomeIcon
              width={24}
              height={24}
              color={focused ? "#006FFD" : "#71727A"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="가이드"
        component={TourScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <MessageCircle
              width={24}
              height={24}
              color={focused ? "#006FFD" : "#71727A"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="내일정"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <CalendarIcon
              width={24}
              height={24}
              color={focused ? "#006FFD" : "#71727A"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="여행기록"
        component={TravelLogScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <GalleryIcon
              width={24}
              height={24}
              color={focused ? "#006FFD" : "#71727A"}
            />
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
        drawerType: "front",
        overlayColor: "rgba(0, 0, 0, 0.5)",
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
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
            <Stack.Screen
              name="TermsDetail"
              component={TermsDetailScreen}
              options={{
                animation: "slide_from_right",
                gestureDirection: "horizontal",
              }}
            />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
