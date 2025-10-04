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
    Alert,
} from 'react-native';
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

    const handleChange = (name: string, value: string) => {
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async () => {
        if (!credentials.email || !credentials.password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
            return;
        }

        try {
            const result = await dispatch(loginUser(credentials));

            if (loginUser.fulfilled.match(result)) {
                // Login successful, reset to Main and ensure Home tab is selected
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'Main',
                            state: {
                                index: 0,
                                routes: [{ name: 'Home' } as any],
                            },
                        } as any,
                    ],
                });
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
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
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text style={styles.loadingText}>Đang xử lý...</Text>
                        </View>
                    )}

                    {/* Header Section */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => {
                                // Reset navigation to main Home tab
                                navigation.reset({
                                    index: 0,
                                    routes: [
                                        {
                                            name: 'Main',
                                            state: {
                                                index: 0,
                                                routes: [{ name: 'Home' } as any],
                                            },
                                        } as any,
                                    ],
                                });
                            }}
                        >
                            <Text style={styles.backText}>← Quay lại</Text>
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>EV CARE</Text>
                        </View>
                        <Text style={styles.title}>Chào mừng trở lại</Text>
                        <Text style={styles.subtitle}>
                            Đăng nhập để tiếp tục sử dụng dịch vụ bảo dưỡng xe điện chuyên nghiệp
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
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

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Mật khẩu</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Nhập mật khẩu"
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
                                        <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                                disabled={loading}
                            >
                                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={() => navigation.navigate('Register')}
                                disabled={loading}
                            >
                                <Text style={styles.registerButtonText}>
                                    Chưa có tài khoản? <Text style={styles.registerButtonTextBold}>Đăng ký ngay</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Bằng việc đăng nhập, bạn đồng ý với{' '}
                            <Text style={styles.footerLink}>Điều khoản sử dụng</Text> và{' '}
                            <Text style={styles.footerLink}>Chính sách bảo mật</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3b82f6',
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        width: '100%',
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#1e40af',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    title: {
        fontSize: 32,
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
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 56,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    eyeButton: {
        padding: 8,
    },
    eyeText: {
        fontSize: 20,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#9ca3af',
        fontWeight: '500',
        fontSize: 14,
    },
    registerButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    registerButtonText: {
        fontSize: 16,
        color: '#6b7280',
    },
    registerButtonTextBold: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 32,
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
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    backText: {
        color: '#dbeafe',
        fontSize: 16,
        fontWeight: '600',
    },
});
