import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";

import { RootStackParamList } from "../types";

// Screens
import { HomeScreen, ProfileScreen, SettingsScreen } from "../screens";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";

import BookingHistoryScreen from "../screens/BookingHistorySreen";
import PaymentHistoryScreen from "../screens/Payment/PaymentHistorySreen";

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: "#F2F2F7" },
              headerTintColor: "#000",
            }}
          >
            
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />

            {/* Common screens */}
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerTitle: "Hồ sơ", presentation: "modal" }}
            />

            <Stack.Screen
              name="ChangePassword"
              component={require("../screens/ChangePasswordScreen").default}
              options={{ headerTitle: "Đổi mật khẩu" }}
            />

            <Stack.Screen
              name="ServiceCenters"
              component={HomeScreen}
              options={{ headerTitle: "Trung tâm dịch vụ" }}
            />
            <Stack.Screen
              name="Booking"
              component={HomeScreen}
              options={{ headerTitle: "Đặt lịch" }}
            />
            <Stack.Screen
              name="BookingHistory"
              component={BookingHistoryScreen}
              options={{ headerTitle: "Lịch sử đặt lịch" }}
            />
            <Stack.Screen
              name="ManageVehicles"
              component={HomeScreen}
              options={{ headerTitle: "Quản lý xe" }}
            />
            <Stack.Screen
              name="PaymentHistory"
              component={PaymentHistoryScreen}
              options={{ headerTitle: "Lịch sử thanh toán" }}
            />

            {/* Auth stack */}
            <Stack.Screen
              name="Auth"
              component={AuthStack}
              options={{ headerShown: false, presentation: "modal" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default RootNavigator;
