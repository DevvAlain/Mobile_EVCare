import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HistoryScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Lịch sử công việc (đang phát triển)</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default HistoryScreen;


