import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";

import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import TravelLogScreen from "../screens/TravelLogScreen";
import MapScreen from "../screens/MapScreen";
import TourScreen from "../screens/TourScreen";
import CustomDrawerContent from "../screens/CustomDrawerContent";
import ScheduleDetail from "../screens/ScheduleDetail";
import TermsDetailScreen from "../screens/TermsDetailScreen";
import AgreementScreen from "../screens/AgreementScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "홈" }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ title: "일정" }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: "지도" }}
      />
      <Tab.Screen
        name="TravelLog"
        component={TravelLogScreen}
        options={{ title: "기록" }}
      />
    </Tab.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTab" component={TabNavigator} />
    </Drawer.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Tour"
        component={TourScreen}
        options={{
          headerShown: true,
          title: "투어 가이드",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ScheduleDetail"
        component={ScheduleDetail}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TermsDetail"
        component={TermsDetailScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Agreement"
        component={AgreementScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
