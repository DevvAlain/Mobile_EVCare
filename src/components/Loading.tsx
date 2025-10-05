import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../service/constants/theme";

interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "large",
  color = COLORS.PRIMARY,
  overlay = false,
}) => {
  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size={size} color={color} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

export default Loading;
