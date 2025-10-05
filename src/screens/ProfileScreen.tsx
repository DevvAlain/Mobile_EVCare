import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSelector, useDispatch } from "react-redux";
import { RootStackParamList } from "../types";
import { RootState, AppDispatch } from "../service/store";
import { logout } from "../service/slices/authSlice";
import { fetchUserProfile } from "../service/slices/userSlice";
import { updateUserProfile, uploadAvatar } from "../service/slices/userSlice";
import * as ImagePicker from "expo-image-picker";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get("window");

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { currentUser, loading: userLoading } = useSelector((state: RootState) => state.user);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [form, setForm] = React.useState({
    username: "",
    fullName: "",
    phone: "",
    address: "",
  });

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            dispatch(logout());
            const rootNav = navigation.getParent() || navigation;
            rootNav.reset({
              index: 0,
              routes: [
                {
                  name: 'Main',
                  state: {
                    index: 0,
                    routes: [{ name: 'Home' } as any],
                  },
                } as any,
              ],
            });
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  const displayUser = currentUser || user;

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "customer":
        return "#3764F3";
      case "admin":
        return "#FF4D4F";
      case "staff":
        return "#52C41A";
      case "technician":
        return "#FA8C16";
      default:
        return "#8C8C8C";
    }
  };

  const getRoleText = (role?: string) => {
    switch (role) {
      case "customer":
        return "Khách hàng";
      case "admin":
        return "Quản trị viên";
      case "staff":
        return "Nhân viên";
      case "technician":
        return "Kỹ thuật viên";
      default:
        return role || "";
    }
  };

  React.useEffect(() => {
    if (displayUser) {
      setForm({
        username: displayUser.username || "",
        fullName: displayUser.fullName || "",
        phone: displayUser.phone || "",
        address: displayUser.address || "",
      });
    }
  }, [displayUser]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (displayUser) {
      setForm({
        username: displayUser.username || "",
        fullName: displayUser.fullName || "",
        phone: displayUser.phone || "",
        address: displayUser.address || "",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateUserProfile(form as any)).unwrap();
      await dispatch(fetchUserProfile()).unwrap();
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công");
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      setUploading(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập bị từ chối', 'Vui lòng cấp quyền truy cập ảnh để thay đổi ảnh đại diện');
        setUploading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop() || 'avatar.jpg';
        const type = (name.match(/\.(\w+)$/)?.[1] || 'jpg');

        await dispatch(uploadAvatar({ uri, name, type: `image/${type}` })).unwrap();
        await dispatch(fetchUserProfile()).unwrap();
        Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
      }
    } catch (error: any) {
      console.error('Avatar upload error', error);
      Alert.alert('Lỗi', error?.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  if (userLoading && !displayUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3764F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header với avatar và thông tin cơ bản */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarTouchable}>
          {uploading ? (
            <View style={styles.avatarContainer}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : displayUser?.avatar ? (
            <Image source={{ uri: displayUser.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {displayUser?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{displayUser?.fullName || "Khách hàng"}</Text>

        {displayUser?.username && (
          <Text style={styles.userHandle}>@{displayUser.username}</Text>
        )}

        <View style={styles.metaContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(displayUser?.role) }]}>
            <Text style={styles.roleText}>{getRoleText(displayUser?.role)}</Text>
          </View>

          <View style={styles.verificationBadge}>
            <Text style={styles.verificationText}>
              {displayUser?.isVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
            </Text>
          </View>
        </View>
      </View>

      {/* Thông tin liên hệ */}
      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>Thông tin liên hệ</Text>

        <View style={styles.contactItem}>
          <Text style={styles.contactIcon}>📧</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{displayUser?.email || 'Chưa có email'}</Text>
          </View>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactIcon}>📞</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Số điện thoại</Text>
            <Text style={styles.contactValue}>{displayUser?.phone || 'Chưa có số điện thoại'}</Text>
          </View>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactIcon}>📍</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Địa chỉ</Text>
            <Text style={styles.contactValue}>{displayUser?.address || 'Chưa có địa chỉ'}</Text>
          </View>
        </View>
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.detailsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Thông tin chi tiết</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChangePassword')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={isEditing ? handleCancel : handleEdit}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isEditing ? (
          <View style={styles.detailsContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tên đăng nhập</Text>
              <Text style={styles.detailValue}>{displayUser?.username || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Họ và tên</Text>
              <Text style={styles.detailValue}>{displayUser?.fullName || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Vai trò</Text>
              <Text style={styles.detailValue}>{getRoleText(displayUser?.role)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              value={form.username}
              onChangeText={(text) => setForm(prev => ({ ...prev, username: text }))}
              placeholder="Tên đăng nhập"
              style={styles.textInput}
              placeholderTextColor="#94a3b8"
            />

            <TextInput
              value={form.fullName}
              onChangeText={(text) => setForm(prev => ({ ...prev, fullName: text }))}
              placeholder="Họ và tên"
              style={styles.textInput}
              placeholderTextColor="#94a3b8"
            />

            <TextInput
              value={form.phone}
              onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              style={styles.textInput}
              placeholderTextColor="#94a3b8"
            />

            <TextInput
              value={form.address}
              onChangeText={(text) => setForm(prev => ({ ...prev, address: text }))}
              placeholder="Địa chỉ"
              style={[styles.textInput, styles.textArea]}
              multiline
              numberOfLines={3}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Thông tin tài khoản */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Thông tin tài khoản</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ngày tạo tài khoản</Text>
            <Text style={styles.infoValue}>
              {displayUser?.createdAt
                ? new Date(displayUser.createdAt).toLocaleDateString('vi-VN')
                : 'Không có thông tin'
              }
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cập nhật lần cuối</Text>
            <Text style={styles.infoValue}>
              {displayUser?.updatedAt
                ? new Date(displayUser.updatedAt).toLocaleDateString('vi-VN')
                : 'Không có thông tin'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Nút đăng xuất */}
      {isAuthenticated && (
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIcon: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  verificationBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contactIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
    width: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  detailsContent: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  editForm: {
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  logoutSection: {
    margin: 16,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;