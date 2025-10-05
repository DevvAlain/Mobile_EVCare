import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
// remove bottom tabs to avoid bottom buttons
import { RootStackParamList } from "../types";

// Import screens
import { HomeScreen, ProfileScreen, SettingsScreen } from "../screens";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";

const Stack = createStackNavigator<RootStackParamList>();
// Tab navigator removed as requested (no bottom Home/Settings buttons)

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#F2F2F7",
          },
          headerTintColor: "#000",
        }}>
  {/* Main app entrypoint is Home directly (no bottom tab bar) */}
  <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

        {/* Common screens (can be reached from Main) */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: "Hồ sơ", presentation: "modal" }}
        />

        <Stack.Screen name="ChangePassword" component={require('../screens/ChangePasswordScreen').default} options={{ headerTitle: 'Đổi mật khẩu' }} />

        <Stack.Screen name="ServiceCenters" component={HomeScreen} options={{ headerTitle: "Trung tâm dịch vụ" }} />
        <Stack.Screen name="Booking" component={HomeScreen} options={{ headerTitle: "Đặt lịch" }} />
        <Stack.Screen name="BookingHistory" component={HomeScreen} options={{ headerTitle: "Lịch sử đặt lịch" }} />
        <Stack.Screen name="ManageVehicles" component={HomeScreen} options={{ headerTitle: "Quản lý xe" }} />
        <Stack.Screen name="PaymentHistory" component={HomeScreen} options={{ headerTitle: "Lịch sử thanh toán" }} />

        {/* Auth stack is available but not the initial screen; open it when user wants to login/register */}
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false, presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
