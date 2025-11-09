import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { logoutUser, logout } from '../../service/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const TechnicianProfileScreen = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(logoutUser()).unwrap();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' as any }],
                            });
                        } catch (error) {
                            // Logout locally even if API fails
                            dispatch(logout());
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' as any }],
                            });
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Tài khoản</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar ? (
                            <Icon name="account-circle" size={80} color="#1a40b8" />
                        ) : (
                            <Icon name="account-circle" size={80} color="#1a40b8" />
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.fullName || 'Kỹ thuật viên'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    {user?.role && (
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {user.role === 'technician' ? 'Kỹ thuật viên' : user.role}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <View style={styles.infoItemLeft}>
                            <Icon name="account" size={20} color="#64748b" />
                            <Text style={styles.infoLabel}>Họ và tên</Text>
                        </View>
                        <Text style={styles.infoValue}>{user?.fullName || '-'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoItem}>
                        <View style={styles.infoItemLeft}>
                            <Icon name="email" size={20} color="#64748b" />
                            <Text style={styles.infoLabel}>Email</Text>
                        </View>
                        <Text style={styles.infoValue}>{user?.email || '-'}</Text>
                    </View>

                    <View style={styles.divider} />

                    {user?.phone && (
                        <>
                            <View style={styles.infoItem}>
                                <View style={styles.infoItemLeft}>
                                    <Icon name="phone" size={20} color="#64748b" />
                                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                                </View>
                                <Text style={styles.infoValue}>{user.phone}</Text>
                            </View>
                            <View style={styles.divider} />
                        </>
                    )}

                    <View style={styles.infoItem}>
                        <View style={styles.infoItemLeft}>
                            <Icon name="shield-check" size={20} color="#64748b" />
                            <Text style={styles.infoLabel}>Trạng thái xác thực</Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Icon
                                name={user?.isVerified ? "check-circle" : "alert-circle"}
                                size={16}
                                color={user?.isVerified ? "#52c41a" : "#faad14"}
                                style={styles.verifiedIcon}
                            />
                            <Text style={[
                                styles.verifiedText,
                                { color: user?.isVerified ? "#52c41a" : "#faad14" }
                            ]}>
                                {user?.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={20} color="#fff" />
                    <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Space for bottom tab
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    profileCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginTop: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: '#eef2ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a40b8',
    },
    infoSection: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 12,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
        flex: 1,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedIcon: {
        marginRight: 6,
    },
    verifiedText: {
        fontSize: 14,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#ff4d4f',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ff4d4f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default TechnicianProfileScreen;

