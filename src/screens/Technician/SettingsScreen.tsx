import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Cài đặt cho kỹ thuật viên</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default SettingsScreen;


