import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
    activeRouteName?: string;
    onNavigate?: (route: string) => void;
}

const TechnicianBottomTabBar: React.FC<Props> = ({ activeRouteName = '', onNavigate }) => {
    const handlePress = (route: string) => {
        if (!onNavigate) return;
        onNavigate(route);
    };

    const renderTab = (route: string, iconName: string, label: string) => {
        const focused = activeRouteName === route;
        return (
            <TouchableOpacity
                style={[styles.tabButton, focused && styles.tabButtonFocused]}
                onPress={() => handlePress(route)}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon
                    name={iconName}
                    size={26}
                    color={focused ? '#2563eb' : '#94a3b8'}
                    style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {renderTab('TechnicianSchedule', 'calendar-clock', 'Lịch làm việc')}
            {renderTab('TechnicianProfile', 'account-circle', 'Tài khoản')}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        zIndex: 50,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    tabButtonFocused: {
        backgroundColor: 'transparent',
    },
    tabIcon: {
        marginBottom: 2,
    },
    tabLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    tabLabelFocused: {
        color: '#2563eb',
        fontWeight: '700',
    },
});

export default TechnicianBottomTabBar;
