// screens/Route_Map.tsx
import React from "react";
import { SafeAreaView } from "react-native";
import TMap_Route from "../components/TMap_Route";

const Route_Map: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TMap_Route />
    </SafeAreaView>
  );
};

export default Route_Map;
