import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../service/store';
import { fetchServiceCenterDetail } from '../service/slices/serviceCenterSlice';
import { useRoute } from '@react-navigation/native';

const ServiceCenterDetailScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const route = useRoute<any>();
    const id = route.params?.id;
    const { selectedServiceCenter, loading, error } = useSelector((state: RootState) => state.serviceCenter);

    useEffect(() => {
        if (id) dispatch(fetchServiceCenterDetail(id));
    }, [id]);

    if (loading && !selectedServiceCenter) {
        return (
            <View style={styles.loading}><ActivityIndicator size="large" color="#1a40b8" /></View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}><Text style={{ color: '#b00020' }}>{error}</Text></View>
        );
    }

    if (!selectedServiceCenter) {
        return (
            <View style={styles.center}><Text>Không tìm thấy trung tâm dịch vụ</Text></View>
        );
    }

    const sc = selectedServiceCenter;

    const formatAddress = (address: any) => {
        if (!address) return '';
        if (typeof address === 'string') return address;
        const parts: string[] = [];
        if (address.street) parts.push(address.street);
        if (address.ward) parts.push(address.ward);
        if (address.district) parts.push(address.district);
        if (address.city) parts.push(address.city);
        return parts.filter(Boolean).join(', ');
    };

    const handleGetDirections = async () => {
        try {
            // Prefer coordinates if available
            const coords = sc.address?.coordinates;
            let url = '';
            if (coords && (coords.lat || coords.lng)) {
                const lat = coords.lat;
                const lng = coords.lng;
                url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            } else {
                const addr = formatAddress(sc.address) || '';
                if (!addr) {
                    Alert.alert('Không có địa chỉ', 'Không có thông tin địa chỉ để mở bản đồ.');
                    return;
                }
                const encoded = encodeURIComponent(addr);
                url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
            }

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Không thể mở bản đồ', 'Không thể mở ứng dụng bản đồ trên thiết bị này.');
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể mở chỉ đường.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.title}>{sc.name}</Text>
            <Text style={styles.subtitle}>{sc.description}</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Địa chỉ:</Text>
                <View style={styles.addressRow}>
                    <Text style={styles.value}>{formatAddress(sc.address) || 'N/A'}</Text>
                    <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
                        <Text style={styles.directionsText}>Get Directions</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Điện thoại:</Text>
                <Text style={styles.value}>{sc.contact?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Dịch vụ:</Text>
                <Text style={styles.value}>{(sc.services || []).map(s => s.name).join(', ') || 'N/A'}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
    subtitle: { fontSize: 14, color: '#475569', marginTop: 8 },
    row: { marginTop: 12 },
    label: { fontWeight: '600', color: '#334155' },
    value: { color: '#0f172a', marginTop: 4 },
    addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    directionsButton: { backgroundColor: '#1a40b8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 12 },
    directionsText: { color: 'white', fontWeight: '600' },
});

export default ServiceCenterDetailScreen;
