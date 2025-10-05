// Export reducers with clear names
export { default as appReducer } from "./appSlice";
export { default as userReducer } from "./userSlice";

// Namespace action creators and other named exports to avoid collisions
export * as appActions from "./appSlice";
export * as userActions from "./userSlice";
