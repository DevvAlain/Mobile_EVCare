import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../service/store';
import { AppDispatch } from '../service/store';
import { logout } from '../service/slices/authSlice';
import { Avatar, List, Switch, Divider, Button, Text } from 'react-native-paper';
import { useAppSelector } from '../service/store';
import { setTheme } from '../service/slices/appSlice';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const appState = useAppSelector((s) => s.app);

  const [isDark, setIsDark] = useState(appState?.theme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          try {
            dispatch(logout());
          } catch (e) {
            // ignore
          }
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  };

  const openProfile = () => {
    navigation.navigate('Profile');
  };

  const handleLanguage = () => {
    Alert.alert('Ngôn ngữ', 'Chọn ngôn ngữ (placeholder)');
  };

  const handleAbout = () => {
    Alert.alert('Về ứng dụng', 'EVCare - Phiên bản demo');
  };

  const handleContact = () => {
    Alert.alert('Liên hệ', 'Email: support@example.com');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <View style={styles.profileRow}>
            {user?.avatar ? (
              <Avatar.Image size={72} source={{ uri: user.avatar }} />
            ) : (
              <Avatar.Text size={72} label={user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : 'U'} />
            )}
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={styles.name}>
                {user?.fullName ?? 'Người dùng'}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {user?.email ?? 'Chưa đăng nhập'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <List.Section>
            <List.Subheader>Tài khoản</List.Subheader>
            <List.Item
              title="Thông tin cá nhân"
              description="Chỉnh sửa tên, điện thoại, địa chỉ"
              left={props => <List.Icon {...props} icon="account" />}
              onPress={openProfile}
            />
            <Divider />
            <List.Item
              title="Bảo mật"
              description="Đổi mật khẩu, xác thực"
              left={props => <List.Icon {...props} icon="shield-lock" />}
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <Divider />
            <List.Item
              title="Thông báo"
              description="Tùy chỉnh thông báo"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
              )}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            />
          </List.Section>
        </View>

        <View style={styles.card}>
          <List.Section>
            <List.Subheader>Ứng dụng</List.Subheader>
            <List.Item
              title="Chế độ tối"
              left={props => <List.Icon {...props} icon="brightness-3" />}
              right={() => <Switch value={isDark} onValueChange={(v) => {
                setIsDark(v);
                dispatch(setTheme(v ? 'dark' : 'light'));
              }} />}
              onPress={() => { const v = !isDark; setIsDark(v); dispatch(setTheme(v ? 'dark' : 'light')); }}
            />
            <Divider />
            <List.Item
              title="Ngôn ngữ"
              description="Tiếng Việt"
              left={props => <List.Icon {...props} icon="translate" />}
              onPress={handleLanguage}
            />
            <Divider />
            <List.Item
              title="Về ứng dụng"
              left={props => <List.Icon {...props} icon="information" />}
              onPress={handleAbout}
            />
          </List.Section>
        </View>

        <View style={styles.card}>
          <List.Section>
            <List.Subheader>Hỗ trợ</List.Subheader>
            <List.Item
              title="Trung tâm trợ giúp"
              left={props => <List.Icon {...props} icon="help-circle" />}
              onPress={() => Alert.alert('Trợ giúp', 'Mở trung tâm trợ giúp (placeholder)')}
            />
            <Divider />
            <List.Item
              title="Liên hệ"
              left={props => <List.Icon {...props} icon="phone" />}
              onPress={handleContact}
            />
            <Divider />
            <List.Item
              title="Đánh giá ứng dụng"
              left={props => <List.Icon {...props} icon="star" />}
              onPress={() => Alert.alert('Đánh giá', 'Mở cửa hàng để đánh giá (placeholder)')}
            />
          </List.Section>
        </View>

        {/* Đăng xuất / Đăng nhập ở cuối nội dung - giữ marginBottom lớn để không bị che bởi bottom tabs */}
        {isAuthenticated ? (
          <View style={[styles.card, { marginTop: 16, marginBottom: 140, marginHorizontal: 16 }]}>
            <View style={{ padding: 16 }}>
              <Button mode="contained" buttonColor="#ef4444" onPress={handleLogout}>
                Đăng xuất
              </Button>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { marginTop: 16, marginBottom: 140, marginHorizontal: 16 }]}>
            <View style={{ padding: 16 }}>
              <Button mode="outlined" onPress={() => navigation.navigate('Auth')}>
                Đăng nhập / Đăng ký
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eef2f6' },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16 },
  name: { fontWeight: '700' },
  email: { color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    paddingHorizontal: 20,
  },
  logoutWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
});

export default SettingsScreen;
