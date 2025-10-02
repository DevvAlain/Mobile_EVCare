import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useAppSelector, useAppDispatch } from "../service/store";
import { setCurrentUser } from "../service/slices/userSlice";
import { COLORS, SPACING, FONT_SIZES } from "../service/constants";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, "Profile">;

interface Props {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.app);
  const { currentUser } = useAppSelector((state) => state.user);
  const { userId } = route.params;

  const mockUser = {
    id: userId,
    name: "John Doe",
    email: "john.doe@example.com",
  };

  const handleLogin = () => {
    dispatch(setCurrentUser(mockUser));
    navigation.goBack();
  };

  const handleLogout = () => {
    dispatch(setCurrentUser(null));
    navigation.goBack();
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
        Profile Screen
      </Text>

      {currentUser ? (
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.label,
              {
                color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300],
              },
            ]}>
            Name: {currentUser.name}
          </Text>
          <Text
            style={[
              styles.label,
              {
                color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300],
              },
            ]}>
            Email: {currentUser.email}
          </Text>
          <Text
            style={[
              styles.label,
              {
                color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300],
              },
            ]}>
            ID: {currentUser.id}
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loginSection}>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme === "light" ? COLORS.GRAY[600] : COLORS.GRAY[300],
              },
            ]}>
            You are not logged in
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login as Mock User</Text>
          </TouchableOpacity>
        </View>
      )}
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
  userInfo: {
    alignItems: "center",
  },
  loginSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.LG,
    marginBottom: SPACING.MD,
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
    marginTop: SPACING.LG,
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: "600",
  },
});

export default ProfileScreen;
