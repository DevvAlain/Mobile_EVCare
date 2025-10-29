import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import TechnicianSidebar from '../../components/Technician/TechnicianSidebar';
import SidebarOverlay from '../../components/SidebarOverlay';

const TechnicianHomeScreen = () => {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => setOpen(true)}
                        style={styles.menuButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.menu}>☰</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Bảng điều khiển kỹ thuật viên</Text>

                    <View style={styles.headerRight} />
                </View>
            </View>

            {/* Main Content */}
            <Text style={styles.welcome}>Dashboard</Text>
            {/* Sidebar Components */}
            <SidebarOverlay isOpen={open} onClose={() => setOpen(false)} />
            <TechnicianSidebar isOpen={open} onClose={() => setOpen(false)} />
        </View>
    );
};

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: isTablet ? 60 : 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: isTablet ? 32 : 20,
    },
    menuButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menu: {
        fontSize: isTablet ? 22 : 18,
        color: '#334155',
        fontWeight: '600',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: isTablet ? 20 : 16,
        fontWeight: '700',
        color: '#1e293b',
        marginHorizontal: 16,
    },
    headerRight: {
        width: 44,
        height: 44,
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: isTablet ? 32 : 20,
    },
    welcomeContainer: {
        backgroundColor: '#fff',
        padding: isTablet ? 40 : 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: isTablet ? 400 : '100%',
        maxWidth: 500,
    },
    welcome: {
        fontSize: isTablet ? 18 : 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: isTablet ? 28 : 24,
        fontWeight: '500',
    },
});

export default TechnicianHomeScreen;