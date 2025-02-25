import React from "react";
import { StyleSheet, View } from "react-native";
import TMap from "../components/TMap";
import { useRoute } from "@react-navigation/native";

const TMapScreen: React.FC = () => {
  const route = useRoute();
  const { scheduleId, selectedDate } = route.params || {
    scheduleId: "default_id",
    selectedDate: null,
  };

  return (
    <View style={styles.container}>
      <TMap scheduleId={scheduleId} selectedDate={selectedDate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TMapScreen;
