import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAppSelector, useAppDispatch } from "../service/store";
import { setTheme } from "../service/slices/appSlice";
import { COLORS, SPACING, FONT_SIZES } from "../service/constants";

const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const { theme, isLoading } = useAppSelector((state) => state.app);
  const { currentUser } = useAppSelector((state) => state.user);

  const toggleTheme = () => {
    dispatch(setTheme(theme === "light" ? "dark" : "light"));
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "light" ? COLORS.WHITE : COLORS.BLACK },
      ]}>
      <Text
        style={[
          styles.title,
          { color: theme === "light" ? COLORS.BLACK : COLORS.WHITE },
        ]}>
        Welcome to Mobile App
      </Text>

      {currentUser ? (
        <Text
          style={[
            styles.subtitle,
            { color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300] },
          ]}>
          Hello, {currentUser.name}!
        </Text>
      ) : (
        <Text
          style={[
            styles.subtitle,
            { color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300] },
          ]}>
          Please sign in to continue
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={toggleTheme}>
        <Text style={styles.buttonText}>
          Switch to {theme === "light" ? "Dark" : "Light"} Theme
        </Text>
      </TouchableOpacity>

      {isLoading && (
        <Text
          style={[
            styles.loading,
            { color: theme === "light" ? COLORS.PRIMARY : COLORS.WHITE },
          ]}>
          Loading...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: "bold",
    marginBottom: SPACING.MD,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZES.LG,
    marginBottom: SPACING.XL,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.MD,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: "600",
  },
  loading: {
    fontSize: FONT_SIZES.MD,
    fontStyle: "italic",
  },
});

export default HomeScreen;
