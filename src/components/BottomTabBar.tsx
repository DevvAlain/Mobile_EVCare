import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../service/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
    activeRouteName?: string;
    onNavigate?: (route: string) => void;
}

const BottomTabBar: React.FC<Props> = ({ activeRouteName = '', onNavigate }) => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    // Hide tabs when logged in as a technician (role-based). This is more reliable
    // than trying to inspect the navigation state from here.
    const role = useSelector((state: RootState) => state.auth.user?.role);
    if (isAuthenticated && role && String(role).toLowerCase() === 'technician') {
        return null;
    }

    const handlePress = (route: string) => {
        if (!onNavigate) return;

        if (route === 'Home') {
            onNavigate('Home');
            return;
        }

        if (!isAuthenticated) {
            // navigate to Auth stack; Auth stack initial screen is Login
            onNavigate('Auth');
            return;
        }

        onNavigate(route);
    };

    const renderTab = (route: string, iconName: string, label: string) => {
        const focused = activeRouteName === route;
        return (
            <TouchableOpacity
                style={[styles.tabButton, focused && styles.tabButtonFocused]}
                onPress={() => handlePress(route)}
            >
                <Icon name={iconName} size={24} color={focused ? '#1a40b8' : '#64748b'} style={styles.tabIcon} />
                <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {renderTab('Home', 'home-outline', 'Trang chủ')}
            {renderTab('ManageVehicles', 'car-outline', 'Xe')}
            {renderTab('Booking', 'calendar-blank-outline', 'Đặt lịch')}
            {renderTab('PaymentHistory', 'history', 'Lịch sử')}
            {renderTab('Settings', 'cog-outline', 'Cài đặt')}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 72,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e6e9ef',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 8,
        zIndex: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonFocused: {
        backgroundColor: '#eef2ff',
        borderRadius: 12,
        marginHorizontal: 8,
        paddingVertical: 6,
    },
    tabIcon: {
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 11,
        color: '#64748b',
    },
    tabLabelFocused: {
        color: '#1a40b8',
        fontWeight: '600',
    },
});

export default BottomTabBar;