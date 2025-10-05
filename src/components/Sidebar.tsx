import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logout as authLogout } from '../service/slices/authSlice';
import { RootState } from '../service/store';
import { useSelector } from 'react-redux';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(-screenWidth)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, screenWidth]);

  const handleLogout = () => {
    // Clear user profile and navigate to login
    try {
      // clear auth state
      dispatch(authLogout());
    } catch (e) {
      // ignore
    }
    // After logout go back to Home (unauthenticated view with Login/Register)
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (!isOpen) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX }], width: screenWidth * 0.82 }]}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(user?.fullName || 'KB').slice(0, 2)}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Khách hàng'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('Profile');
            onClose();
          }}>
          <View style={[styles.menuIcon, styles.iconBg]}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.menuText}>Hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('ManageVehicles');
            onClose();
          }}>
          <View style={[styles.menuIcon, styles.iconBg]}>
            <Text style={styles.iconText}>🚗</Text>
          </View>
          <Text style={styles.menuText}>Quản lý xe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('BookingHistory');
            onClose();
          }}>
          <View style={[styles.menuIcon, styles.iconBg]}>
            <Text style={styles.iconText}>📅</Text>
          </View>
          <Text style={styles.menuText}>Lịch sử đặt lịch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('PaymentHistory');
            onClose();
          }}>
          <View style={[styles.menuIcon, styles.iconBg]}>
            <Text style={styles.iconText}>💳</Text>
          </View>
          <Text style={styles.menuText}>Lịch sử thanh toán</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('ChangePassword');
            onClose();
          }}>
          <View style={[styles.menuIcon, styles.iconBg]}>
            <Text style={styles.iconText}>🔒</Text>
          </View>
          <Text style={styles.menuText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('Settings');
            onClose();
          }}>
          <View style={[styles.menuIcon, styles.iconBg]}>
            <Text style={styles.iconText}>⚙️</Text>
          </View>
          <Text style={styles.menuText}>Cài đặt</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={[styles.menuIcon, styles.logoutIcon]}>
            <Text style={styles.iconText}>🚪</Text>
          </View>
          <Text style={[styles.menuText, styles.logoutText]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  header: {
    padding: 18,
    backgroundColor: '#1a40b8',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  userInfo: { marginLeft: 12 },
  userName: { color: 'white', fontSize: 16, fontWeight: '700' },
  userEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  menuContainer: { padding: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  iconBg: { backgroundColor: '#f3f4f6' },
  logoutIcon: { backgroundColor: '#ffe6e6' },
  iconText: { fontSize: 20 },
  menuText: { marginLeft: 12, fontSize: 16, fontWeight: '600' },
  logoutText: { color: '#d00' },
  divider: { height: 1, backgroundColor: '#e6e6e6', marginVertical: 12 },
});

export default Sidebar;
