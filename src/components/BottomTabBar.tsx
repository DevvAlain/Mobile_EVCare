import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../service/store';

const BottomTabBar: React.FC = () => {
    const navigation = useNavigation<any>();

    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    const handlePress = (route: string) => {
        // Home is always allowed
        if (route === 'Home') {
            navigation.navigate('Home');
            return;
        }

        if (!isAuthenticated) {
            // redirect to login
            navigation.navigate('Auth', { screen: 'Login' });
            return;
        }

        navigation.navigate(route);
    };

    const protectedRoutes = ['ManageVehicles', 'Booking', 'BookingHistory', 'PaymentHistory', 'Settings'];

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.tabButton} onPress={() => handlePress('Home')}>
                <Text style={styles.tabIcon}>🏠</Text>
                <Text style={styles.tabLabel}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handlePress('ManageVehicles')}
            >
                <Text style={styles.tabIcon}>🚗</Text>
                <Text style={styles.tabLabel}>Xe</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handlePress('Booking')}
            >
                <Text style={styles.tabIcon}>📅</Text>
                <Text style={styles.tabLabel}>Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handlePress('PaymentHistory')}
            >
                <Text style={styles.tabIcon}>📜</Text>
                <Text style={styles.tabLabel}>Lịch sử</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handlePress('Settings')}
            >
                <Text style={styles.tabIcon}>⚙️</Text>
                <Text style={styles.tabLabel}>Cài đặt</Text>
            </TouchableOpacity>
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
    tabIcon: {
        fontSize: 20,
    },
    tabLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
});

export default BottomTabBar;
