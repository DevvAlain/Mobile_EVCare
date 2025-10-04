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
import { registerUser } from '../service/slices/authSlice';
import { RootStackParamList, RegisterCredentials } from '../types';
import { RootState } from '../service/store';
import { AppDispatch } from '../service/store';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const RegisterScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading } = useSelector((state: RootState) => state.auth);
    const [formData, setFormData] = useState<RegisterCredentials>({
        username: '',
        fullName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Partial<RegisterCredentials>>({});

    const handleChange = (name: keyof RegisterCredentials, value: string) => {
        setFormData({ ...formData, [name]: value });
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<RegisterCredentials> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập là bắt buộc';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ tên là bắt buộc';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Vui lòng nhập email hợp lệ';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại là bắt buộc';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Vui lòng nhập số điện thoại hợp lệ';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Địa chỉ là bắt buộc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const result = await dispatch(registerUser(formData));

            if (registerUser.fulfilled.match(result)) {
                Alert.alert(
                    'Đăng ký thành công',
                    'Tài khoản đã được tạo thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            }
        } catch (error) {
            console.error('Register error:', error);
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
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backText}>← Quay lại</Text>
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>EV CARE</Text>
                        </View>
                        <Text style={styles.title}>Tạo tài khoản mới</Text>
                        <Text style={styles.subtitle}>
                            Tham gia cùng chúng tôi để trải nghiệm dịch vụ bảo dưỡng xe điện chuyên nghiệp
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Họ và tên</Text>
                                <TextInput
                                    style={[styles.input, errors.fullName && styles.inputError]}
                                    placeholder="Nhập họ và tên đầy đủ"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.fullName}
                                    onChangeText={text => handleChange('fullName', text)}
                                    editable={!loading}
                                />
                                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Tên đăng nhập</Text>
                                <TextInput
                                    style={[styles.input, errors.username && styles.inputError]}
                                    placeholder="Nhập tên đăng nhập"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.username}
                                    onChangeText={text => handleChange('username', text)}
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={[styles.input, errors.email && styles.inputError]}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.email}
                                    onChangeText={text => handleChange('email', text)}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                />
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Số điện thoại</Text>
                                <TextInput
                                    style={[styles.input, errors.phone && styles.inputError]}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.phone}
                                    onChangeText={text => handleChange('phone', text)}
                                    keyboardType="phone-pad"
                                    editable={!loading}
                                />
                                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Địa chỉ</Text>
                                <TextInput
                                    style={[styles.input, errors.address && styles.inputError]}
                                    placeholder="Nhập địa chỉ của bạn"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.address}
                                    onChangeText={text => handleChange('address', text)}
                                    editable={!loading}
                                />
                                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Mật khẩu</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.passwordInput, errors.password && styles.inputError]}
                                        placeholder="Nhập mật khẩu"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.password}
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
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            <TouchableOpacity
                                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.registerButtonText}>
                                    {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => navigation.navigate('Login')}
                                disabled={loading}
                            >
                                <Text style={styles.loginButtonText}>
                                    Đã có tài khoản? <Text style={styles.loginButtonTextBold}>Đăng nhập ngay</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Bằng việc đăng ký, bạn đồng ý với{' '}
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
        marginBottom: 32,
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
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
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
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        marginTop: 4,
    },
    registerButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    registerButtonText: {
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
    loginButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    loginButtonText: {
        fontSize: 16,
        color: '#6b7280',
    },
    loginButtonTextBold: {
        color: '#3b82f6',
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
