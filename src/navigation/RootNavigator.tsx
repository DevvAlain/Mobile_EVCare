import React, { useRef, useState } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
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
// Technician screens
import TechnicianHomeScreen from "../screens/Technician/TechnicianHomeScreen";
import TechnicianScheduleScreen from "../screens/Technician/ScheduleScreen";
import TechnicianWorkProgressScreen from "../screens/Technician/WorkProgressScreen";
import TechnicianChatScreen from "../screens/Technician/ChatScreen";
import TechnicianHistoryScreen from "../screens/Technician/HistoryScreen";
import TechnicianSettingsScreen from "../screens/Technician/SettingsScreen";

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
  const navigationRef = useRef(createNavigationContainerRef());
  const [showTabs, setShowTabs] = useState(true);

  const handleStateChange = () => {
    try {
      const currentRoute = navigationRef.current?.getCurrentRoute();
      const currentName = currentRoute?.name ?? "";
      const hideOnRoutes = ["Auth", "Login", "Register", "ForgotPassword"];
      setShowTabs(!hideOnRoutes.includes(currentName));
    } catch {
      // no-op
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer ref={navigationRef as any} onStateChange={handleStateChange}>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: "#F2F2F7" },
              headerTintColor: "#000",
            }}
          >
            {/* Customer / Guest screens */}
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />

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

            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerTitle: "Cài đặt", headerLeft: () => null }}
            />

            {/* Auth stack */}
            <Stack.Screen
              name="Auth"
              component={AuthStack}
              options={{ headerShown: false }}
            />

            {/* Technician screens - available but not the initial route. */}
            <Stack.Screen name="TechnicianHome" component={TechnicianHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianSchedule" component={TechnicianScheduleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianWorkProgress" component={TechnicianWorkProgressScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianChat" component={TechnicianChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianHistory" component={TechnicianHistoryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianSettings" component={TechnicianSettingsScreen} options={{ headerShown: false }} />
          </Stack.Navigator>

          {/* Global bottom tabs */}
          {showTabs && <BottomTabBar />}


          {/* Global bottom tabs (customer/guest). The BottomTabBar itself will hide when a technician screen is active. */}
          <BottomTabBar />

        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default RootNavigator;
