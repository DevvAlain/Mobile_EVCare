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
    StatusBar,
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
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

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
                return false;
            }
        }
        return true;
    };

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

    const fetchNearby = async (coords: { latitude: number; longitude: number }) => {
        try {
            setLocationError(null);
            setUserLocation(coords);
            const res = await dispatch(fetchNearbyServiceCenters({
                lat: coords.latitude,
                lng: coords.longitude,
                radius: 20,
            }));
            return res;
        } catch (e) {
            setLocationError('Lỗi khi tải dữ liệu trung tâm dịch vụ');
            return null;
        }
    };

    const getCurrentLocation = (): Promise<{ latitude: number, longitude: number }> => {
        return new Promise(async (resolve, reject) => {
            try {
                const hasPermission = await requestLocationPermission();
                if (!hasPermission) {
                    setLocationError('Không có quyền truy cập vị trí. Sử dụng vị trí mặc định.');
                    resolve(DEFAULT_COORDS);
                    return;
                }

                if (!navigator.geolocation) {
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
                        maximumAge: 1000 * 60 * 5
                    }
                );
            } catch (error) {
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
            await fetchNearby(DEFAULT_COORDS);
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

    const sortedCenters = [...centersList].sort((a, b) => {
        if (!userLocation) return 0;

        const coordsA = a.address?.coordinates;
        const coordsB = b.address?.coordinates;

        if (!coordsA || !coordsB) return 0;

        const distanceA = calculateDistance(
            userLocation.latitude, userLocation.longitude,
            coordsA.lat, coordsA.lng
        );
        const distanceB = calculateDistance(
            userLocation.latitude, userLocation.longitude,
            coordsB.lat, coordsB.lng
        );

        return distanceA - distanceB;
    });

    const renderItem = ({ item, index }: { item: ServiceCenter; index: number }) => {
        let distance = null;
        if (userLocation && item.address?.coordinates) {
            const coords = item.address.coordinates;
            distance = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                coords.lat, coords.lng
            );
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={async () => {
                    dispatch(setSelectedServiceCenter(item));
                    navigation.navigate('ServiceCenterDetail', { id: item._id });
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                        {index === 0 && distance !== null && distance <= 5 && (
                            <View style={styles.nearestBadge}>
                                <Text style={styles.nearestText}>GẦN NHẤT</Text>
                            </View>
                        )}
                    </View>
                    {distance !== null && (
                        <View style={[
                            styles.distanceBadge,
                            distance <= 2 && styles.distanceBadgeNear
                        ]}>
                            <Text style={styles.distanceText}>{distance} km</Text>
                        </View>
                    )}
                </View>

                <View style={styles.addressContainer}>
                    <Text style={styles.address} numberOfLines={2}>
                        📍 {formatAddress(item.address) || 'Địa chỉ không xác định'}
                    </Text>
                </View>

                {item.contact?.phone && (
                    <View style={styles.phoneContainer}>
                        <Text style={styles.phone}>📞 {item.contact.phone}</Text>
                    </View>
                )}

                <View style={styles.directionsContainer}>
                    <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={async (e) => {
                            e.stopPropagation();
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
                        <Text style={styles.directionsText}>🗺️ Chỉ đường</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#1a40b8" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Trung tâm dịch vụ gần bạn</Text>
                    <Text style={styles.subtitle}>
                        {userLocation && !locationError
                            ? `Đang hiển thị ${sortedCenters.length} trung tâm gần bạn`
                            : 'Tìm trung tâm dịch vụ EV gần vị trí của bạn'
                        }
                    </Text>

                    {locationError && (
                        <View style={styles.locationError}>
                            <Text style={styles.locationErrorText}>{locationError}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {(loading || locationLoading) && centersList.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1a40b8" />
                        <Text style={styles.loadingText}>Đang tìm trung tâm gần bạn...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={sortedCenters}
                        keyExtractor={(item: ServiceCenter) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        style={styles.list}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#1a40b8"]}
                                tintColor="#1a40b8"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🏢</Text>
                                <Text style={styles.emptyText}>Không có trung tâm nào trong phạm vi 20km</Text>
                                <Text style={styles.emptySubText}>Kéo xuống để thử lại</Text>
                            </View>
                        )}
                    />
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#1a40b8',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#e2e8f0',
        lineHeight: 20,
    },
    locationError: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    locationErrorText: {
        fontSize: 13,
        color: '#fff',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    nameContainer: {
        flex: 1,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        lineHeight: 22,
        marginRight: 8,
    },
    nearestBadge: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    nearestText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    distanceBadge: {
        backgroundColor: '#64748b',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        minWidth: 65,
        alignItems: 'center',
    },
    distanceBadgeNear: {
        backgroundColor: '#059669',
    },
    distanceText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    addressContainer: {
        marginBottom: 8,
    },
    address: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    phoneContainer: {
        marginBottom: 14,
    },
    phone: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '500',
    },
    directionsContainer: {
        alignItems: 'flex-start',
    },
    directionsButton: {
        backgroundColor: '#1a40b8',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        minWidth: 110,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    directionsText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
        fontWeight: '500',
    },
    emptySubText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    errorContainer: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#b00020',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
});

export default ServiceCentersScreen;