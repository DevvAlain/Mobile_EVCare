import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Animated,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../service/slices/authSlice';
import { RootStackParamList } from '../types';
import { RootState } from '../service/store';
import { AppDispatch } from '../service/store';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const LoginScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleChange = (name: string, value: string) => {
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async () => {
        if (!credentials.email || !credentials.password) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng nhập đầy đủ thông tin' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng nhập email hợp lệ' });
            return;
        }

        try {
            const result = await dispatch(loginUser(credentials));
            if (loginUser.fulfilled.match(result)) {
                // Reset navigation to top-level Home screen after successful login
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'Home',
                        } as any,
                    ],
                });
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a40b8" />
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <Text style={styles.loadingText}>Đang xử lý...</Text>
                        </View>
                    )}

                    {/* Header Section */}
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backText}>←</Text>
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>EV CARE</Text>
                            <Text style={styles.logoSubtitle}>Service Center</Text>
                        </View>

                        <Text style={styles.title}>Chào mừng trở lại</Text>
                        <Text style={styles.subtitle}>
                            Đăng nhập để tiếp tục sử dụng dịch vụ bảo dưỡng xe điện chuyên nghiệp
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <View style={styles.form}>
                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập email của bạn"
                                        placeholderTextColor="#9ca3af"
                                        value={credentials.email}
                                        onChangeText={text => handleChange('email', text)}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Mật khẩu</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập mật khẩu của bạn"
                                        placeholderTextColor="#9ca3af"
                                        value={credentials.password}
                                        onChangeText={text => handleChange('password', text)}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Text style={styles.eyeText}>
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot Password */}
                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                                disabled={loading}
                            >
                                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <AnimatedTouchable
                                style={[
                                    styles.loginButton,
                                    loading && styles.loginButtonDisabled,
                                    { transform: [{ scale: fadeAnim }] }
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </Text>
                            </AnimatedTouchable>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Register Link */}
                            <TouchableOpacity
                                style={styles.registerLink}
                                onPress={() => navigation.navigate('Register')}
                                disabled={loading}
                            >
                                <Text style={styles.registerLinkText}>
                                    Chưa có tài khoản? <Text style={styles.registerLinkBold}>Đăng ký ngay</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        style={[
                            styles.footer,
                            { opacity: fadeAnim }
                        ]}
                    >
                        <Text style={styles.footerText}>
                            Bằng việc đăng nhập, bạn đồng ý với{' '}
                            <Text style={styles.footerLink}>Điều khoản sử dụng</Text> và{' '}
                            <Text style={styles.footerLink}>Chính sách bảo mật</Text>
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a40b8',
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 64, 184, 0.9)',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
        padding: 8,
    },
    backText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
        marginBottom: 4,
    },
    logoSubtitle: {
        fontSize: 14,
        color: '#dbeafe',
        letterSpacing: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#dbeafe',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 24,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: '#1e293b',
        paddingVertical: 8,
    },
    eyeButton: {
        padding: 8,
    },
    eyeText: {
        fontSize: 20,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#1a40b8',
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#1a40b8',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#1a40b8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#64748b',
        fontWeight: '500',
        fontSize: 14,
    },
    registerLink: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    registerLinkText: {
        fontSize: 16,
        color: '#64748b',
    },
    registerLinkBold: {
        color: '#1a40b8',
        fontWeight: 'bold',
    },
    footer: {
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#dbeafe',
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: '#fff',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});