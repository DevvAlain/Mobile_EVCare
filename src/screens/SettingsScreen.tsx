import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useAppSelector, useAppDispatch } from "../service/store";
import { setTheme, setLanguage } from "../service/slices/appSlice";
import { COLORS, SPACING, FONT_SIZES } from "../service/constants";

const SettingsScreen = () => {
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.app);

  const toggleTheme = () => {
    dispatch(setTheme(theme === "light" ? "dark" : "light"));
  };

  const toggleLanguage = () => {
    dispatch(setLanguage(language === "en" ? "vi" : "en"));
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
        Settings
      </Text>

      <View style={styles.settingItem}>
        <Text
          style={[
            styles.settingLabel,
            { color: theme === "light" ? COLORS.BLACK : COLORS.WHITE },
          ]}>
          Dark Mode
        </Text>
        <Switch
          value={theme === "dark"}
          onValueChange={toggleTheme}
          trackColor={{ false: COLORS.GRAY[300], true: COLORS.PRIMARY }}
          thumbColor={theme === "dark" ? COLORS.WHITE : COLORS.GRAY[300]}
        />
      </View>

      <View style={styles.settingItem}>
        <Text
          style={[
            styles.settingLabel,
            { color: theme === "light" ? COLORS.BLACK : COLORS.WHITE },
          ]}>
          Language: {language === "en" ? "English" : "Tiếng Việt"}
        </Text>
        <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
          <Text style={styles.buttonText}>
            Switch to {language === "en" ? "Tiếng Việt" : "English"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text
          style={[
            styles.infoText,
            { color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300] },
          ]}>
          App Version: 1.0.0
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300] },
          ]}>
          Current Theme: {theme}
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300] },
          ]}>
          Current Language: {language}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: SPACING.XL,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    marginBottom: SPACING.MD,
  },
  settingLabel: {
    fontSize: FONT_SIZES.LG,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 6,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: "600",
  },
  infoSection: {
    marginTop: SPACING.XL,
    padding: SPACING.MD,
    backgroundColor: COLORS.GRAY[100],
    borderRadius: 8,
  },
  infoText: {
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.SM,
  },
});

export default SettingsScreen;
