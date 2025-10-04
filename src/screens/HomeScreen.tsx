import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../service/store';
import { AppDispatch } from '../service/store';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const services = [
    {
      id: 1,
      title: 'Bảo dưỡng định kỳ',
      description: 'Kiểm tra và bảo dưỡng xe điện định kỳ',
      icon: '🔧',
      color: '#3B82F6',
    },
    {
      id: 2,
      title: 'Sửa chữa pin',
      description: 'Thay thế và sửa chữa pin xe điện',
      icon: '🔋',
      color: '#10B981',
    },
    {
      id: 3,
      title: 'Kiểm tra hệ thống',
      description: 'Kiểm tra toàn diện hệ thống điện',
      icon: '⚡',
      color: '#F59E0B',
    },
    {
      id: 4,
      title: 'Cập nhật phần mềm',
      description: 'Cập nhật phần mềm và firmware',
      icon: '💻',
      color: '#8B5CF6',
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Tìm trung tâm',
      subtitle: 'Gần bạn',
      icon: '🏢',
      onPress: () => navigation.navigate('ServiceCenters'),
    },
    {
      id: 2,
      title: 'Đặt lịch',
      subtitle: 'Ngay hôm nay',
      icon: '📅',
      onPress: () => navigation.navigate('Booking'),
    },
    {
      id: 3,
      title: 'Lịch sử',
      subtitle: 'Đặt lịch',
      icon: '📋',
      onPress: () => navigation.navigate('BookingHistory'),
    },
    {
      id: 4,
      title: 'Xe của tôi',
      subtitle: 'Quản lý',
      icon: '🚗',
      onPress: () => navigation.navigate('ManageVehicles'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              if (isAuthenticated) navigation.navigate('Profile');
              else navigation.navigate('Auth', { screen: 'Login' } as any);
            }}
          >
            <Text style={styles.greeting}>
              {isAuthenticated ? 'Xin chào,' : 'Chào mừng đến với'}
            </Text>
            <Text style={styles.userName}>
              {isAuthenticated ? (user?.fullName || 'Khách hàng') : 'EVCare'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              if (isAuthenticated) navigation.navigate('Profile');
              else navigation.navigate('Auth', { screen: 'Login' } as any);
            }}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Auth actions (shown when user is not authenticated) */}
      {!isAuthenticated && (
        <View style={styles.authActions}>
          <TouchableOpacity
            style={styles.authButtonPrimary}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' } as any)}
          >
            <Text style={styles.authButtonPrimaryText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authButtonSecondary}
            onPress={() => navigation.navigate('Auth', { screen: 'Register' } as any)}
          >
            <Text style={styles.authButtonSecondaryText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Dịch vụ bảo dưỡng xe điện chuyên nghiệp
          </Text>
          <Text style={styles.heroSubtitle}>
            Chăm sóc xe điện của bạn với đội ngũ kỹ thuật viên giàu kinh nghiệm
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('ServiceCenters')}
          >
            <Text style={styles.ctaButtonText}>Tìm trung tâm gần bạn</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Services */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Dịch vụ của chúng tôi</Text>
        {services.map((service) => (
          <TouchableOpacity key={service.id} style={styles.serviceCard}>
            <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '20' }]}>
              <Text style={styles.serviceIcon}>{service.icon}</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>500+</Text>
          <Text style={styles.statLabel}>Khách hàng hài lòng</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>50+</Text>
          <Text style={styles.statLabel}>Trung tâm dịch vụ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>Hỗ trợ khách hàng</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  heroSection: {
    backgroundColor: '#3b82f6',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    lineHeight: 24,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  ctaArrow: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  servicesSection: {
    padding: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 20,
    color: '#cbd5e1',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  authActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  authButtonPrimary: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 8,
  },
  authButtonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  authButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  authButtonSecondaryText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default HomeScreen;
