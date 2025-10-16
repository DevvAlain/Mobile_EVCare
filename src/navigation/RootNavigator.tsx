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
import BookingScreen from "../screens/BookingScreen";
import BookingHistoryScreen from "../screens/BookingHistorySreen";
import PaymentHistoryScreen from "../screens/Payment/PaymentHistorySreen";
import ServiceCentersScreen from "../screens/ServiceCentersScreen";
import ServiceCenterDetailScreen from "../screens/ServiceCenterDetailScreen";
import BottomTabBar from "../components/BottomTabBar";

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
              options={{ headerTitle: "Hồ sơ" }}
            />

            <Stack.Screen
              name="ChangePassword"
              component={require("../screens/ChangePasswordScreen").default}
              options={{ headerTitle: "Đổi mật khẩu" }}
            />

            <Stack.Screen
              name="ServiceCenters"
              component={ServiceCentersScreen}
              options={{ headerTitle: "Trung tâm dịch vụ" }}
            />
            <Stack.Screen
              name="ServiceCenterDetail"
              component={ServiceCenterDetailScreen}
              options={{ headerTitle: "Chi tiết trung tâm" }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ headerTitle: "Đặt lịch", headerLeft: () => null }}
            />
            <Stack.Screen
              name="BookingHistory"
              component={BookingHistoryScreen}
              options={{ headerTitle: "Lịch sử đặt lịch", headerLeft: () => null }}
            />
            <Stack.Screen
              name="ManageVehicles"
              component={require("../screens/VehicleManagementScreen").default}
              options={{ headerTitle: "Quản lý xe", headerLeft: () => null }}
            />
            <Stack.Screen
              name="PaymentHistory"
              component={PaymentHistoryScreen}
              options={{ headerTitle: "Lịch sử thanh toán", headerLeft: () => null }}
            />

            {/* Auth stack */}
            <Stack.Screen
              name="Auth"
              component={AuthStack}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
          {/* Global bottom tabs */}
          <BottomTabBar />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default RootNavigator;
