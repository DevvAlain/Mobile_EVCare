# Mobile App - Expo TypeScript

Một ứng dụng mobile được phát triển với Expo và TypeScript, sử dụng cấu trúc dự án chuẩn chỉnh.

## 🏗️ Cấu trúc dự án

```
src/
├── components/          # Các component tái sử dụng
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Loading.tsx
│   └── index.ts
├── navigation/          # Cấu hình điều hướng
│   ├── RootNavigator.tsx
│   └── index.ts
├── screens/            # Các màn hình của ứng dụng
│   ├── HomeScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingsScreen.tsx
│   └── index.ts
├── service/            # Logic nghiệp vụ và state management
│   ├── constants/      # Các hằng số
│   │   └── index.ts
│   ├── slices/        # Redux slices
│   │   ├── appSlice.ts
│   │   ├── userSlice.ts
│   │   └── index.ts
│   ├── store/         # Redux store configuration
│   │   └── index.ts
│   └── index.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   ├── api.ts
│   └── index.ts
└── index.ts
```

## 🚀 Tính năng

- ✅ **TypeScript** - Type safety cho toàn bộ dự án
- ✅ **Redux Toolkit** - State management hiện đại
- ✅ **React Navigation** - Điều hướng linh hoạt
- ✅ **Component Library** - Components tái sử dụng
- ✅ **Theme Support** - Hỗ trợ Light/Dark mode
- ✅ **Multi-language** - Hỗ trợ đa ngôn ngữ
- ✅ **API Client** - HTTP client với retry và timeout
- ✅ **Utility Functions** - Các functions tiện ích

## 📦 Dependencies chính

- **@reduxjs/toolkit** - Redux state management
- **react-redux** - React bindings for Redux
- **@react-navigation/native** - Navigation library
- **@react-navigation/stack** - Stack navigator
- **@react-navigation/bottom-tabs** - Tab navigator
- **react-native-screens** - Native screen components
- **react-native-safe-area-context** - Safe area handling

## 🛠️ Cài đặt và chạy

### Prerequisites

- Node.js (v16 hoặc cao hơn)
- npm hoặc yarn
- Expo CLI

### Cài đặt dependencies

```bash
npm install
```

### Chạy ứng dụng

```bash
# Chạy trên tất cả platforms
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS (cần macOS)
npm run ios

# Chạy trên web
npm run web
```

## 📱 Screens

### HomeScreen

- Màn hình chính với thông tin chào mừng
- Toggle theme (Light/Dark)
- Hiển thị thông tin user hiện tại

### ProfileScreen

- Quản lý thông tin user
- Login/Logout functionality
- Hiển thị user details

### SettingsScreen

- Cài đặt theme
- Chuyển đổi ngôn ngữ
- Thông tin ứng dụng

## 🎨 Theme System

Ứng dụng hỗ trợ hai theme:

- **Light Mode** - Theme sáng (mặc định)
- **Dark Mode** - Theme tối

Theme được quản lý thông qua Redux store và có thể toggle từ bất kỳ screen nào.

## 🌍 Multi-language Support

Hỗ trợ hai ngôn ngữ:

- **English (en)** - Mặc định
- **Tiếng Việt (vi)**

## 🔧 Development

### TypeScript

Dự án sử dụng TypeScript strict mode. Chạy type checking:

```bash
npx tsc --noEmit
```

### State Management

Sử dụng Redux Toolkit với các slices:

- **appSlice** - Theme, loading, error, language
- **userSlice** - User authentication và management

### API Integration

Sử dụng API client với features:

- Automatic timeout handling
- Request/response interceptors
- Error handling
- Retry mechanism

## 📚 Coding Guidelines

- Sử dụng TypeScript cho type safety
- Components phải có proper typing
- Follow React hooks best practices
- Use Redux Toolkit cho state management
- Consistent file naming convention
- Export/import patterns chuẩn chỉnh

## 🤝 Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.
