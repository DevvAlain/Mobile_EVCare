import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "../types";

// Import screens
import { HomeScreen, ProfileScreen, SettingsScreen } from "../screens";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#8E8E93",
        headerStyle: {
          backgroundColor: "#F2F2F7",
        },
        headerTintColor: "#000",
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: "EVCare",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }} accessibilityLabel="Trang chủ">🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Cài đặt",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }} accessibilityLabel="Cài đặt">⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

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
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#F2F2F7",
          },
          headerTintColor: "#000",
        }}>
        {/* Main app tabs are the default entry point (Home visible on launch) */}
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />

        {/* Common screens (can be reached from Main) */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: "Hồ sơ", presentation: "modal" }}
        />

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
