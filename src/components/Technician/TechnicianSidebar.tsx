import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../service/store';
import { logout as authLogout } from '../../service/slices/authSlice';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const TechnicianSidebar = ({ isOpen, onClose }: Props) => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const { user } = useSelector((s: RootState) => s.auth);
    const screenWidth = Dimensions.get('window').width;
    const translateX = useRef(new Animated.Value(-screenWidth)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: isOpen ? 0 : -screenWidth,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [isOpen, screenWidth]);

    if (!isOpen) return null;

    const go = (route: string) => {
        navigation.navigate(route);
        onClose();
    };

    const handleLogout = () => {
        dispatch(authLogout());
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateX }], width: screenWidth * 0.82 }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatar}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{(user?.fullName || 'TV').slice(0, 2)}</Text>
                            )}
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user?.fullName || 'Kỹ thuật viên'}</Text>
                            <Text style={styles.userEmail}>{user?.email || ''}</Text>
                        </View>
                    </View>
                </View>

                {/* Main Menu */}
                <View style={styles.menu}>
                    <TouchableOpacity style={styles.item} onPress={() => go('TechnicianSchedule')}>
                        <Text style={styles.itemText}>Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => go('TechnicianWorkProgress')}>
                        <Text style={styles.itemText}>My Services</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => go('TechnicianChat')}>
                        <Text style={styles.itemText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => go('TechnicianHistory')}>
                        <Text style={styles.itemText}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => go('TechnicianSettings')}>
                        <Text style={styles.itemText}>Settings</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button - Fixed at bottom */}
                <View style={styles.bottomSection}>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: '#fff',
        zIndex: 200,
        elevation: 200
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        paddingTop: 54,
        paddingBottom: 20,
        paddingHorizontal: 24,
        backgroundColor: '#1a40b8',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e6f0ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff'
    },
    userInfo: {
        marginLeft: 12
    },
    userName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    },
    userEmail: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12
    },
    menu: {
        flex: 1,
        padding: 14,
        paddingTop: 20,
    },
    item: {
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 4,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    bottomSection: {
        padding: 14,
        paddingBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginBottom: 16
    },
    logoutButton: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#dc2626'
    },
});

export default TechnicianSidebar;