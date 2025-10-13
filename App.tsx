import React from "react";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./src/service/store";
import { RootNavigator } from "./src/navigation";
import Toast from "react-native-toast-message";
import 'react-native-gesture-handler';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootNavigator />
        <StatusBar style="auto" />
        <Toast />
      </PersistGate>
    </Provider>
  );
}
