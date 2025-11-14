import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootState } from '../service/store';
import { AppDispatch } from '../service/store';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleProtectedNavigate = (routeName: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    navigation.navigate(routeName);
  };

  const features = [
    {
      id: 1,
      title: 'Theo dõi xe & nhắc lịch',
      description: 'Nhắc lịch bảo dưỡng tự động theo km hoặc thời gian',
      icon: 'car-outline',
      color: '#1a40b8',
      delay: 100,
    },
    {
      id: 2,
      title: 'Đặt lịch dịch vụ',
      description: 'Đặt lịch bảo dưỡng và sửa chữa trực tuyến',
      icon: 'calendar-outline',
      color: '#10B981',
      delay: 200,
      onPress: () => handleProtectedNavigate('Booking'),
    },
    {
      id: 3,
      title: 'Lịch sử dịch vụ',
      description: 'Theo dõi lịch sử bảo dưỡng và chi phí',
      icon: 'document-text-outline',
      color: '#F59E0B',
      delay: 300,
      onPress: () => handleProtectedNavigate('BookingHistory'),
    },
    {
      id: 4,
      title: 'Quản lý thanh toán',
      description: 'Thanh toán trực tuyến với nhiều lựa chọn',
      icon: 'card-outline',
      color: '#8B5CF6',
      delay: 400,
      onPress: () => handleProtectedNavigate('PaymentHistory'),
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Trung tâm gần bạn',
      icon: 'location-outline',
      color: '#3B82F6',
      delay: 0,
      onPress: () => handleProtectedNavigate('ServiceCenters'),
    },
    {
      id: 2,
      title: 'Đặt lịch bảo dưỡng',
      icon: 'construct-outline',
      color: '#10B981',
      delay: 100,
      onPress: () => handleProtectedNavigate('Booking'),
    },
    {
      id: 3,
      title: 'Lịch sử đặt lịch',
      icon: 'bar-chart-outline',
      color: '#F59E0B',
      delay: 200,
      onPress: () => handleProtectedNavigate('BookingHistory'),
    },
    {
      id: 4,
      title: 'Quản lý xe',
      icon: 'car-sport-outline',
      color: '#8B5CF6',
      delay: 300,
      onPress: () => handleProtectedNavigate('ManageVehicles'),
    },
  ];

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <>
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a40b8']}
            tintColor="#1a40b8"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.headerContent}>
            {/* Title ở giữa */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Chào mừng</Text>
              <Text style={styles.userName}>EV Care</Text>
            </View>

            {/* Hiển thị nút Login/Register hoặc Avatar */}
            <View style={styles.authButtons}>
              {!isAuthenticated ? (
                <>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                  >
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
                  >
                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <View style={styles.profileIcon}>
                    {user?.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        style={styles.profileIconImage}
                      />
                    ) : (
                      <Ionicons name="person" size={20} color="#64748b" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.heroBackground}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                EV Service Center{'\n'}Maintenance{'\n'}Management System
              </Text>
              <Text style={styles.heroSubtitle}>
                Giải pháp hoàn chỉnh cho các trung tâm dịch vụ EV: theo dõi khách hàng, lập lịch bảo trì, quản lý hàng tồn kho
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => handleProtectedNavigate('Booking')}
              >
                <Text style={styles.ctaButtonText}>Đặt lịch bảo dưỡng</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <AnimatedTouchable
                key={action.id}
                style={[
                  styles.actionCard,
                  {
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, -10 * (index + 1)],
                      })
                    }]
                  }
                ]}
                onPress={action.onPress}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={20} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </AnimatedTouchable>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Giải pháp toàn diện</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <AnimatedTouchable
                key={feature.id}
                style={[
                  styles.featureCard,
                  {
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, -20 * (index % 2 === 0 ? 1 : -1)],
                      })
                    }]
                  }
                ]}
                onPress={feature.onPress}
              >
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </AnimatedTouchable>
            ))}
          </View>
        </View>

        {/* Service Centers CTA */}
        <Animated.View
          style={[
            styles.serviceCentersSection,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.serviceCentersContent}>
            <View style={styles.serviceIcon}>
              <MaterialIcons name="business-center" size={28} color="#fff" />
            </View>
            <Text style={styles.serviceCentersTitle}>Trung tâm dịch vụ gần bạn</Text>
            <Text style={styles.serviceCentersSubtitle}>
              Khám phá các trung tâm dịch vụ EV gần vị trí của bạn với công nghệ tiên tiến
            </Text>
            <TouchableOpacity
              style={styles.serviceCentersButton}
              onPress={() => handleProtectedNavigate('ServiceCenters')}
            >
              <Text style={styles.serviceCentersButtonText}>Xem tất cả trung tâm</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Khách hàng hài lòng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Trung tâm dịch vụ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Hỗ trợ khách hàng</Text>
          </View>
        </Animated.View>

        {/* Final CTA */}
        <Animated.View
          style={[
            styles.finalCTASection,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <Text style={styles.finalCTATitle}>
            Sẵn sàng trải nghiệm{'\n'}quản lý thông minh?
          </Text>
          <Text style={styles.finalCTASubtitle}>
            Trải nghiệm nền tảng toàn diện của EV CARE có thể tối ưu hóa hoạt động dịch vụ
          </Text>
          <TouchableOpacity
            style={styles.finalCTAButton}
            onPress={() => handleProtectedNavigate('Booking')}
          >
            <Text style={styles.finalCTAButtonText}>Đặt lịch hẹn ngay</Text>
            <Ionicons name="arrow-forward" size={18} color="#1a40b8" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontFamily: 'System',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'System',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a40b8',
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    color: '#1a40b8',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  registerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a40b8',
    shadowColor: '#1a40b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  profileButton: {
    marginLeft: 12,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  profileIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  heroSection: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  heroBackground: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    paddingVertical: 32,
    shadowColor: '#1a40b8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a40b8',
    marginBottom: 16,
    lineHeight: 34,
    fontFamily: 'System',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'System',
  },
  ctaButton: {
    backgroundColor: '#1a40b8',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1a40b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginRight: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    fontFamily: 'System',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (screenWidth - 72) / 4,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'System',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    fontFamily: 'System',
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontFamily: 'System',
  },
  serviceCentersSection: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 24,
    padding: 28,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCentersContent: {
    alignItems: 'center',
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a40b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1a40b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCentersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  serviceCentersSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: 'System',
  },
  serviceCentersButton: {
    backgroundColor: '#1a40b8',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1a40b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCentersButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
    marginRight: 8,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    padding: 28,
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a40b8',
    marginBottom: 6,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 16,
  },
  finalCTASection: {
    backgroundColor: '#1a40b8',
    marginHorizontal: 24,
    padding: 32,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#1a40b8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  finalCTATitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'System',
  },
  finalCTASubtitle: {
    fontSize: 15,
    color: '#dbeafe',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: 'System',
  },
  finalCTAButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  finalCTAButtonText: {
    color: '#1a40b8',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginRight: 8,
  },
});

export default HomeScreen;