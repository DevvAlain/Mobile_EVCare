import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Linking,
    Alert,
    PermissionsAndroid,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppDispatch } from '../service/store';
import { fetchNearbyServiceCenters, setSelectedServiceCenter } from '../service/slices/serviceCenterSilce.ts/serviceCenterSlice';
import { RootState } from '../service/store';
import { ServiceCenter } from '../types/serviceCenter';
import { RootStackParamList } from '../types';

const DEFAULT_COORDS = { latitude: 10.762622, longitude: 106.660172 };

const ServiceCentersScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const { serviceCenters, loading, error } = useSelector((state: RootState) => state.serviceCenter);
    const centersList: ServiceCenter[] = Array.isArray(serviceCenters) ? serviceCenters : [];

    const [refreshing, setRefreshing] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Hàm request quyền vị trí cho Android
    const requestLocationPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Quyền truy cập vị trí',
                        message: 'Ứng dụng cần truy cập vị trí của bạn để tìm trung tâm dịch vụ gần nhất.',
                        buttonNeutral: 'Hỏi sau',
                        buttonNegative: 'Từ chối',
                        buttonPositive: 'Đồng ý',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                // Failed to request permission
                return false;
            }
        }
        return true; // iOS sẽ tự hiển thị prompt
    };

    const fetchNearby = async (coords: { latitude: number; longitude: number }) => {
        try {
            setLocationError(null);
            const res = await dispatch(fetchNearbyServiceCenters({
                lat: coords.latitude,
                lng: coords.longitude,
                radius: 20,
            }));
            return res;
        } catch (e) {
            // Error handled below and surfaced to UI
            setLocationError('Lỗi khi tải dữ liệu trung tâm dịch vụ');
            return null;
        }
    };

    const getCurrentLocation = (): Promise<{ latitude: number, longitude: number }> => {
        return new Promise(async (resolve, reject) => {
            try {
                // Kiểm tra và request quyền
                const hasPermission = await requestLocationPermission();
                if (!hasPermission) {
                    setLocationError('Không có quyền truy cập vị trí. Sử dụng vị trí mặc định.');
                    resolve(DEFAULT_COORDS);
                    return;
                }

                // Kiểm tra geolocation có khả dụng không
                if (!navigator.geolocation) {
                    // Geolocation not available
                    setLocationError('Trình duyệt không hỗ trợ định vị. Sử dụng vị trí mặc định.');
                    resolve(DEFAULT_COORDS);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocationError(null);
                        resolve({ latitude, longitude });
                    },
                    (error) => {
                        // Geolocation error, will fallback to default
                        let errorMsg = 'Không thể lấy vị trí. Sử dụng vị trí mặc định.';

                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMsg = 'Từ chối truy cập vị trí. Sử dụng vị trí mặc định.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMsg = 'Thông tin vị trí không khả dụng. Sử dụng vị trí mặc định.';
                                break;
                            case error.TIMEOUT:
                                errorMsg = 'Hết thời gian lấy vị trí. Sử dụng vị trí mặc định.';
                                break;
                        }

                        setLocationError(errorMsg);
                        resolve(DEFAULT_COORDS);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 1000 * 60 * 5 // 5 minutes
                    }
                );
            } catch (error) {
                // Unexpected error while getting location
                setLocationError('Lỗi khi lấy vị trí. Sử dụng vị trí mặc định.');
                resolve(DEFAULT_COORDS);
            }
        });
    };

    const requestLocationAndFetch = async () => {
        try {
            setLocationLoading(true);
            const coords = await getCurrentLocation();
            await fetchNearby(coords);
        } catch (error) {
            // Error fetching nearby, fallback below
            // Fallback to default coordinates
            await fetchNearby({ latitude: DEFAULT_COORDS.latitude, longitude: DEFAULT_COORDS.longitude });
        } finally {
            setLocationLoading(false);
        }
    };

    useEffect(() => {
        requestLocationAndFetch();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await requestLocationAndFetch();
        setRefreshing(false);
    };

    const formatAddress = (address: ServiceCenter['address'] | string | undefined) => {
        if (!address) return '';
        if (typeof address === 'string') return address;
        const parts: string[] = [];
        if (address.street) parts.push(address.street);
        if (address.ward) parts.push(address.ward);
        if (address.district) parts.push(address.district);
        if (address.city) parts.push(address.city);
        return parts.filter(Boolean).join(', ');
    };

    const renderItem = ({ item }: { item: ServiceCenter }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={async () => {
                dispatch(setSelectedServiceCenter(item));
                navigation.navigate('ServiceCenterDetail', { id: item._id });
            }}
        >
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.address}>{formatAddress(item.address) || 'Địa chỉ không xác định'}</Text>
                {item.contact?.phone && <Text style={styles.phone}>☎ {item.contact.phone}</Text>}

                <View style={styles.getDirectionsRow}>
                    <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={async () => {
                            try {
                                const coords = item.address?.coordinates;
                                let url = '';
                                if (coords && (coords.lat || coords.lng)) {
                                    const lat = coords.lat;
                                    const lng = coords.lng;
                                    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                                } else {
                                    const addr = formatAddress(item.address) || '';
                                    if (!addr) {
                                        Alert.alert('Không có địa chỉ', 'Không có thông tin địa chỉ để mở bản đồ.');
                                        return;
                                    }
                                    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
                                }

                                const supported = await Linking.canOpenURL(url);
                                if (supported) await Linking.openURL(url);
                                else Alert.alert('Không thể mở bản đồ', 'Không thể mở ứng dụng bản đồ trên thiết bị này.');
                            } catch (e) {
                                Alert.alert('Lỗi', 'Không thể mở bản đồ.');
                            }
                        }}
                    >
                        <Text style={styles.directionsText}>Get Directions</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Trung tâm dịch vụ gần bạn</Text>
                <Text style={styles.subtitle}>Tìm trung tâm dịch vụ EV gần vị trí của bạn</Text>

                {/* Hiển thị thông báo lỗi vị trí */}
                {locationError && (
                    <View style={styles.locationError}>
                        <Text style={styles.locationErrorText}>{locationError}</Text>
                    </View>
                )}
            </View>

            {(loading || locationLoading) && centersList.length === 0 ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#1a40b8" />
                    <Text style={styles.loadingText}>Đang tìm trung tâm gần bạn...</Text>
                </View>
            ) : (
                <FlatList
                    data={centersList}
                    keyExtractor={(item: ServiceCenter) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#1a40b8"]}
                        />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>Không có trung tâm nào trong phạm vi 20km.</Text>
                            <Text style={styles.emptySubText}>Kéo xuống để thử lại</Text>
                        </View>
                    )}
                />
            )}

            {error && (
                <View style={styles.error}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 20, fontWeight: '700', color: '#1a40b8' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 6 },
    locationError: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 6, marginTop: 8 },
    locationErrorText: { fontSize: 12, color: '#92400e' },
    list: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eef2ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardContent: {},
    name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    address: { fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 18 },
    phone: { fontSize: 13, color: '#2563eb', marginTop: 8, fontWeight: '500' },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    error: {
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        margin: 16,
        borderRadius: 8,
    },
    errorText: {
        color: '#b00020',
        fontSize: 14,
        textAlign: 'center',
    },
    getDirectionsRow: { marginTop: 10, alignItems: 'flex-start' },
    directionsButton: {
        backgroundColor: '#1a40b8',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    directionsText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },

});

export default ServiceCentersScreen;