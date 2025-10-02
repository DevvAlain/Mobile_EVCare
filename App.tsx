import React from "react";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store } from "./src/service/store";
import { RootNavigator } from "./src/navigation";

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
      <StatusBar style="auto" />
    </Provider>
  );
}
