import React from "react";
import { StyleSheet, View } from "react-native";
import TMap from "../components/TMap";

const TMapScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <TMap />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TMapScreen;
