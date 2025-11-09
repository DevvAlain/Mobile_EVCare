import React, { useRef, useState } from "react";
import { NavigationContainer, createNavigationContainerRef, CommonActions } from "@react-navigation/native";
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
import TechnicianBottomTabBar from "../components/Technician/TechnicianBottomTabBar";
// Technician screens
import TechnicianHomeScreen from "../screens/Technician/TechnicianHomeScreen";
import TechnicianScheduleScreen from "../screens/Technician/ScheduleScreen";
import TechnicianProfileScreen from "../screens/Technician/TechnicianProfileScreen";
import TechnicianWorkProgressScreen from "../screens/Technician/WorkProgressScreen";
import TechnicianChatScreen from "../screens/Technician/ChatScreen";
import TechnicianHistoryScreen from "../screens/Technician/HistoryScreen";
import TechnicianSettingsScreen from "../screens/Technician/SettingsScreen";
import { useSelector } from "react-redux";
import { RootState } from "../service/store";

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
  const [currentRouteName, setCurrentRouteName] = useState('');
  const user = useSelector((state: RootState) => state.auth.user);
  const isTechnician = user?.role === 'technician';

  const getActiveRouteName = (state: any): string => {
    if (!state) return '';
    const route = state.routes[state.index];
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  const handleStateChange = () => {
    try {
      const ref = navigationRef.current as any;
      let currentName = '';
      if (ref && typeof ref.isReady === 'function' && ref.isReady()) {
        const rootState = ref.getRootState?.();
        currentName = rootState ? getActiveRouteName(rootState) : (ref.getCurrentRoute?.()?.name ?? '');
      }
      const hideOnRoutes = ['Auth', 'Login', 'Register', 'ForgotPassword', 'ChangePassword'];
      // Show tabs only if not in hide routes and user is authenticated
      const shouldShowTabs = !hideOnRoutes.includes(currentName);
      setShowTabs(shouldShowTabs);
      setCurrentRouteName(currentName);
    } catch {
      // no-op
    }
  };

  // set initial route name once navigation is ready
  const handleReady = () => {
    try {
      const ref = navigationRef.current as any;
      if (ref && typeof ref.isReady === 'function' && ref.isReady()) {
        const rootState = ref.getRootState?.();
        const currentName = rootState ? getActiveRouteName(rootState) : (ref.getCurrentRoute?.()?.name ?? '');
        setCurrentRouteName(currentName);
        const hideOnRoutes = ['Auth', 'Login', 'Register', 'ForgotPassword', 'ChangePassword'];
        setShowTabs(!hideOnRoutes.includes(currentName));
      }
    } catch (err) {
      // ignore
    }
  };

  const safeNavigate = (route: string) => {
    try {
      const ref = navigationRef.current as any;
      if (ref && typeof ref.isReady === 'function' && ref.isReady()) {
        const bottomRoutes = ['Home', 'ManageVehicles', 'Booking', 'PaymentHistory', 'Settings'];
        const technicianBottomRoutes = ['TechnicianSchedule', 'TechnicianProfile'];

        // For main bottom-tab routes, reset root so the new screen appears immediately (no push animation)
        if (bottomRoutes.includes(route) || technicianBottomRoutes.includes(route)) {
          if (typeof ref.resetRoot === 'function') {
            ref.resetRoot({ index: 0, routes: [{ name: route }] });
          } else {
            // fallback to dispatch reset action
            ref.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: route as any }] })
            );
          }
        } else {
          ref.navigate(route as any);
        }
      } else {
        // navigation not ready yet
        console.warn('[RootNavigator] navigation not ready, ignoring navigate to', route);
      }
    } catch (err) {
      console.warn('[RootNavigator] safeNavigate error', err);
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer ref={navigationRef as any} onStateChange={handleStateChange} onReady={handleReady}>
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

            {/* Technician screens */}
            <Stack.Screen name="TechnicianHome" component={TechnicianHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianSchedule" component={TechnicianScheduleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianProfile" component={TechnicianProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianWorkProgress" component={TechnicianWorkProgressScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianChat" component={TechnicianChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianHistory" component={TechnicianHistoryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TechnicianSettings" component={TechnicianSettingsScreen} options={{ headerShown: false }} />
          </Stack.Navigator>

          {/* Bottom tabs - show different tabs based on user role */}
          {showTabs && isTechnician ? (
            <TechnicianBottomTabBar activeRouteName={currentRouteName} onNavigate={safeNavigate} />
          ) : showTabs && !isTechnician ? (
            <BottomTabBar activeRouteName={currentRouteName} onNavigate={safeNavigate} />
          ) : null}

        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default RootNavigator;
