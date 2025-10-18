import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../service/store';
import { fetchServiceCenterDetail } from '../service/slices/serviceCenterSlice';
import { useRoute } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const ServiceCenterDetailScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const route = useRoute<any>();
    const id = route.params?.id;
    const { selectedServiceCenter, loading, error } = useSelector((state: RootState) => state.serviceCenter);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        if (id) dispatch(fetchServiceCenterDetail(id));

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                },
                () => {
                    // Silent fail
                }
            );
        }
    }, [id]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 10) / 10;
    };

    if (loading && !selectedServiceCenter) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar backgroundColor="#1a40b8" barStyle="light-content" />
                <ActivityIndicator size="large" color="#1a40b8" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar backgroundColor="#1a40b8" barStyle="light-content" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!selectedServiceCenter) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar backgroundColor="#1a40b8" barStyle="light-content" />
                <Text style={styles.errorText}>Không tìm thấy trung tâm dịch vụ</Text>
            </View>
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

    let distance = null;
    if (userLocation && sc.address?.coordinates) {
        const coords = sc.address.coordinates;
        distance = calculateDistance(
            userLocation.latitude, userLocation.longitude,
            coords.lat, coords.lng
        );
    }

    const handleGetDirections = async () => {
        try {
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
        <View style={styles.container}>
            <StatusBar backgroundColor="#1a40b8" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={2}>{sc.name}</Text>
                        {distance !== null && (
                            <View style={[
                                styles.distanceBadge,
                                distance <= 2 && styles.distanceBadgeNear
                            ]}>
                                <Text style={styles.distanceText}>{distance} km</Text>
                            </View>
                        )}
                    </View>

                    {sc.description && (
                        <Text style={styles.description} numberOfLines={3}>
                            {sc.description}
                        </Text>
                    )}
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Thông tin liên hệ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📞</Text>
                        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📍 Địa chỉ</Text>
                            <Text style={styles.infoValue} numberOfLines={3}>
                                {formatAddress(sc.address) || 'Đang cập nhật'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📞 Điện thoại</Text>
                            <Text style={styles.infoValue}>
                                {sc.contact?.phone || 'Đang cập nhật'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={handleGetDirections}
                        >
                            <Text style={styles.directionsIcon}>🗺️</Text>
                            <Text style={styles.directionsText}>Chỉ đường</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dịch vụ */}
                {sc.services && sc.services.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>🔧</Text>
                            <Text style={styles.sectionTitle}>Dịch vụ cung cấp</Text>
                        </View>
                        <View style={styles.servicesGrid}>
                            {(sc.services || []).map((service, index) => (
                                <View key={index} style={styles.serviceItem}>
                                    <Text style={styles.serviceText}>{service.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Thông tin bổ sung */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>ℹ️</Text>
                        <Text style={styles.sectionTitle}>Thông tin khác</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>🆔 Mã trung tâm</Text>
                            <Text style={styles.infoValue}>{sc._id || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📅 Cập nhật</Text>
                            <Text style={styles.infoValue}>
                                {sc.updatedAt ? new Date(sc.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Padding bottom */}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748b',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        color: '#b00020',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    header: {
        backgroundColor: '#1a40b8',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 24,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
        marginRight: 12,
        lineHeight: 28,
    },
    distanceBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        minWidth: 70,
        alignItems: 'center',
    },
    distanceBadgeNear: {
        backgroundColor: 'rgba(5, 150, 105, 0.3)',
        borderColor: 'rgba(5, 150, 105, 0.5)',
    },
    distanceText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        color: '#e2e8f0',
        lineHeight: 22,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 30,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a40b8',
    },
    infoCard: {
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoRow: {
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    infoValue: {
        fontSize: 15,
        color: '#0f172a',
        lineHeight: 22,
    },
    directionsButton: {
        backgroundColor: '#1a40b8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    directionsIcon: {
        fontSize: 16,
    },
    directionsText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    serviceItem: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#c7d2fe',
        minWidth: (screenWidth - 52) / 2,
    },
    serviceText: {
        color: '#1a40b8',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    bottomPadding: {
        height: 20,
    },
});

export default ServiceCenterDetailScreen;