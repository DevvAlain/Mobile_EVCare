import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const onSave = () => {
    if (!oldPassword || !newPassword) return;
    if (newPassword !== confirm) return;
    // TODO: call API to change password
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đổi mật khẩu</Text>
      <TextInput placeholder="Mật khẩu cũ" secureTextEntry style={styles.input} value={oldPassword} onChangeText={setOldPassword} />
      <TextInput placeholder="Mật khẩu mới" secureTextEntry style={styles.input} value={newPassword} onChangeText={setNewPassword} />
      <TextInput placeholder="Xác nhận mật khẩu" secureTextEntry style={styles.input} value={confirm} onChangeText={setConfirm} />
      <TouchableOpacity style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#e6e6e6', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#1a40b8', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: '700' },
});

export default ChangePasswordScreen;
