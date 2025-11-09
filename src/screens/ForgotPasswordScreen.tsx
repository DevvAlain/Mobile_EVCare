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
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../service/slices/authSlice';
import { RootStackParamList } from '../types';
import { RootState } from '../service/store';
import { AppDispatch } from '../service/store';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ForgotPasswordScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading } = useSelector((state: RootState) => state.auth);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        if (!email.trim()) {
            setEmailError('Vui lòng nhập email');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Vui lòng nhập email hợp lệ');
            return;
        }

        setEmailError('');

        try {
            const result = await dispatch(resetPassword({ email }));

            if (resetPassword.fulfilled.match(result)) {
                Toast.show({ type: 'success', text1: 'Email đã được gửi', text2: 'Chúng tôi đã gửi link reset mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.' });
                navigation.navigate('Login');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
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
                        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
                            <Text style={styles.backTopText}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>EV CARE</Text>
                        </View>
                        <Text style={styles.title}>Quên mật khẩu?</Text>
                        <Text style={styles.subtitle}>
                            Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi link reset mật khẩu cho bạn.
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={[styles.input, emailError && styles.inputError]}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (emailError) setEmailError('');
                                    }}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                />
                                {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {loading ? 'Đang gửi...' : 'Gửi link reset mật khẩu'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.navigate('Login')}
                                disabled={loading}
                            >
                                <Text style={styles.backButtonText}>
                                    Quay lại <Text style={styles.backButtonTextBold}>đăng nhập</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
                            <Text style={styles.footerLink}>liên hệ hỗ trợ</Text>
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
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        marginTop: 4,
    },
    submitButton: {
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
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
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
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#6b7280',
    },
    backButtonTextBold: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    backButtonTop: {
        alignSelf: 'flex-start',
        marginBottom: 12,
        padding: 8,
    },
    backTopText: {
        color: '#fff',
        fontSize: 24,
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
