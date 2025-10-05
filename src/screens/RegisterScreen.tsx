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
    Animated,
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

    const handleChange = (name: keyof RegisterCredentials, value: string) => {
        setFormData({ ...formData, [name]: value });
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

                        <Text style={styles.title}>Tạo tài khoản mới</Text>
                        <Text style={styles.subtitle}>
                            Tham gia cùng chúng tôi để trải nghiệm dịch vụ bảo dưỡng xe điện chuyên nghiệp
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
                            {/* Full Name */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Họ và tên</Text>
                                <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập họ và tên đầy đủ"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.fullName}
                                        onChangeText={text => handleChange('fullName', text)}
                                        editable={!loading}
                                    />
                                </View>
                                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                            </View>

                            {/* Username */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Tên đăng nhập</Text>
                                <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập tên đăng nhập"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.username}
                                        onChangeText={text => handleChange('username', text)}
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>
                                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                            </View>

                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập email của bạn"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.email}
                                        onChangeText={text => handleChange('email', text)}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        editable={!loading}
                                    />
                                </View>
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>

                            {/* Phone */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Số điện thoại</Text>
                                <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập số điện thoại"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.phone}
                                        onChangeText={text => handleChange('phone', text)}
                                        keyboardType="phone-pad"
                                        editable={!loading}
                                    />
                                </View>
                                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                            </View>

                            {/* Address */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Địa chỉ</Text>
                                <View style={[styles.inputWrapper, errors.address && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập địa chỉ của bạn"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.address}
                                        onChangeText={text => handleChange('address', text)}
                                        editable={!loading}
                                    />
                                </View>
                                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                            </View>

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Mật khẩu</Text>
                                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
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
                                        <Text style={styles.eyeText}>
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            {/* Register Button */}
                            <AnimatedTouchable
                                style={[
                                    styles.registerButton,
                                    loading && styles.registerButtonDisabled,
                                    { transform: [{ scale: fadeAnim }] }
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.registerButtonText}>
                                    {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                                </Text>
                            </AnimatedTouchable>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Login Link */}
                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.navigate('Login')}
                                disabled={loading}
                            >
                                <Text style={styles.loginLinkText}>
                                    Đã có tài khoản? <Text style={styles.loginLinkBold}>Đăng nhập ngay</Text>
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
                            Bằng việc đăng ký, bạn đồng ý với{' '}
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
        marginBottom: 32,
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
        marginBottom: 24,
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
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
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
        height: 56,
        fontSize: 16,
        color: '#1e293b',
        paddingVertical: 8,
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
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
        marginTop: 6,
        marginLeft: 4,
    },
    registerButton: {
        backgroundColor: '#1a40b8',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#1a40b8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
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
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#64748b',
        fontWeight: '500',
        fontSize: 14,
    },
    loginLink: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    loginLinkText: {
        fontSize: 16,
        color: '#64748b',
    },
    loginLinkBold: {
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