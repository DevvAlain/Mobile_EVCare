import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { completeMaintenance } from '../../service/technician/workProgressSlice';
import Toast from 'react-native-toast-message';

interface Props {
    visible: boolean;
    onClose: () => void;
    progressId: string;
    onSuccess?: () => void;
}

const CompleteMaintenanceModal: React.FC<Props> = ({
    visible,
    onClose,
    progressId,
    onSuccess,
}) => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.workProgress);

    const [notes, setNotes] = useState('');
    const [workDone, setWorkDone] = useState('');
    const [recommendations, setRecommendations] = useState('');

    const handleSubmit = async () => {
        // Validation
        if (!workDone.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập công việc đã làm' });
            return;
        }

        if (workDone.trim().length < 10) {
            Toast.show({ type: 'error', text1: 'Công việc đã làm phải có ít nhất 10 ký tự' });
            return;
        }

        try {
            const result = await dispatch(
                completeMaintenance({
                    progressId,
                    payload: {
                        notes: notes || '',
                        workDone,
                        recommendations: recommendations || '',
                    },
                })
            ).unwrap();

            if (result?.success) {
                Toast.show({ type: 'success', text1: 'Đã hoàn thành bảo dưỡng' });
                onClose();
                if (onSuccess) onSuccess();
                // Reset form
                setNotes('');
                setWorkDone('');
                setRecommendations('');
            } else {
                Toast.show({ type: 'error', text1: result?.message || 'Hoàn thành thất bại' });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error?.message || 'Hoàn thành thất bại',
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Hoàn thành bảo dưỡng</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>Đóng</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ghi chú</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Nhập ghi chú"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={2}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Công việc đã làm *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                workDone && workDone.trim().length < 10 && styles.inputError,
                            ]}
                            placeholder="Mô tả công việc đã thực hiện (tối thiểu 10 ký tự)"
                            value={workDone}
                            onChangeText={setWorkDone}
                            multiline
                            numberOfLines={3}
                        />
                        {workDone && workDone.trim().length < 10 && (
                            <Text style={styles.errorText}>Công việc đã làm phải có ít nhất 10 ký tự</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Khuyến nghị</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Nhập khuyến nghị"
                            value={recommendations}
                            onChangeText={setRecommendations}
                            multiline
                            numberOfLines={2}
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.submitButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Xác nhận hoàn thành</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeButton: {
        color: '#1677ff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#1677ff',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inputError: {
        borderColor: '#ff4d4f',
        borderWidth: 2,
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 12,
        marginTop: 4,
    },
});

export default CompleteMaintenanceModal;

