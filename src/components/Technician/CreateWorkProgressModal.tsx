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
    Platform,
} from 'react-native';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { createWorkProgress, getProgressByAppointment } from '../../service/technician/workProgressSlice';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Milestone {
    name: string;
    description: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    schedule: any;
    appointmentId: string | null;
    onSuccess?: () => void;
}

const CreateWorkProgressModal: React.FC<Props> = ({
    visible,
    onClose,
    schedule,
    appointmentId,
    onSuccess,
}) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { loading } = useAppSelector((state) => state.workProgress);

    const [serviceDate, setServiceDate] = useState<Date>(
        schedule?.workDate ? new Date(schedule.workDate) : new Date()
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [notes, setNotes] = useState('');
    const [milestoneName, setMilestoneName] = useState('');
    const [milestoneDesc, setMilestoneDesc] = useState('');

    React.useEffect(() => {
        if (visible && schedule) {
            // Prefill serviceDate and startTime from booking if available (similar to web)
            let serviceDateValue: Date | undefined;
            let startTimeValue: Date | undefined;
            
            // Find the selected appointment
            const selectedAppt = schedule.assignedAppointments?.find((a: any) => a._id === appointmentId) 
                || schedule.assignedAppointments?.[0];
            const aTime = selectedAppt?.appointmentTime as { date?: string; startTime?: string } | undefined;
            const dateISO = aTime?.date || schedule.workDate;
            
            if (dateISO) {
                serviceDateValue = new Date(dateISO);
                setServiceDate(serviceDateValue);
                
                const start = aTime?.startTime;
                if (start) {
                    const [hh, mm] = start.split(':');
                    startTimeValue = new Date(dateISO);
                    startTimeValue.setHours(Number(hh || 0), Number(mm || 0), 0, 0);
                    setStartTime(startTimeValue);
                } else {
                    // Default to current time if no start time
                    setStartTime(new Date());
                }
            } else if (schedule.workDate) {
                setServiceDate(new Date(schedule.workDate));
                setStartTime(new Date());
            }
            
            // Reset form when opening
            setMilestones([]);
            setNotes('');
        }
    }, [visible, schedule, appointmentId]);

    const handleAddMilestone = () => {
        if (!milestoneName.trim() || !milestoneDesc.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập đầy đủ thông tin mốc tiến độ' });
            return;
        }
        setMilestones([...milestones, { name: milestoneName, description: milestoneDesc }]);
        setMilestoneName('');
        setMilestoneDesc('');
    };

    const handleRemoveMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validation
        if (!appointmentId || !user) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin cần thiết' });
            return;
        }

        if (!serviceDate) {
            Toast.show({ type: 'error', text1: 'Vui lòng chọn ngày dịch vụ' });
            return;
        }

        if (!startTime) {
            Toast.show({ type: 'error', text1: 'Vui lòng chọn thời điểm bắt đầu' });
            return;
        }

        // Validate milestones if any
        const invalidMilestones = milestones.filter(m => !m.name.trim() || !m.description.trim());
        if (invalidMilestones.length > 0) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập đầy đủ thông tin cho các mốc tiến độ' });
            return;
        }

        try {
            const payload = {
                technicianId: user.id,
                appointmentId,
                serviceDate: serviceDate.toISOString(),
                startTime: startTime.toISOString(),
                milestones: milestones.map((m) => ({ name: m.name, description: m.description })),
                notes: notes || '',
            };

            // Double check progress doesn't exist before creating (similar to web)
            const checkResult = await dispatch(getProgressByAppointment(appointmentId));
            if (getProgressByAppointment.fulfilled.match(checkResult) && (checkResult.payload as any)?.success) {
                Toast.show({ type: 'info', text1: 'Booking đã có tiến trình.' });
                onClose();
                if (onSuccess) onSuccess();
                return;
            }

            const result = await dispatch(createWorkProgress(payload)).unwrap();
            if (result?.success) {
                Toast.show({ type: 'success', text1: 'Tạo tiến trình thành công' });
                // Refresh progress
                await dispatch(getProgressByAppointment(appointmentId));
                onClose();
                if (onSuccess) onSuccess();
                // Reset form
                setMilestones([]);
                setNotes('');
            } else {
                Toast.show({ type: 'error', text1: result?.message || 'Tạo tiến trình thất bại' });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error?.message || 'Tạo tiến trình thất bại',
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Tạo tiến trình làm việc</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>Đóng</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ngày dịch vụ *</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text>{dayjs(serviceDate).format('DD/MM/YYYY')}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={serviceDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) setServiceDate(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Thời điểm bắt đầu *</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text>{dayjs(startTime).format('HH:mm')}</Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedTime) => {
                                    setShowTimePicker(Platform.OS === 'ios');
                                    if (selectedTime) setStartTime(selectedTime);
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Các mốc tiến độ</Text>
                        {milestones.map((milestone, index) => (
                            <View key={index} style={styles.milestoneItem}>
                                <Text style={styles.milestoneName}>{milestone.name}</Text>
                                <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                                <TouchableOpacity
                                    onPress={() => handleRemoveMilestone(index)}
                                    style={styles.removeButton}
                                >
                                    <Text style={styles.removeButtonText}>Xóa</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        <View style={styles.addMilestoneContainer}>
                            <TextInput
                                style={[styles.input, styles.milestoneInput]}
                                placeholder="Tên mốc"
                                value={milestoneName}
                                onChangeText={setMilestoneName}
                            />
                            <TextInput
                                style={[styles.input, styles.milestoneInput]}
                                placeholder="Mô tả"
                                value={milestoneDesc}
                                onChangeText={setMilestoneDesc}
                            />
                            <TouchableOpacity
                                onPress={handleAddMilestone}
                                style={styles.addButton}
                            >
                                <Text style={styles.addButtonText}>Thêm mốc</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ghi chú</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Nhập ghi chú"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
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
                            <Text style={styles.submitButtonText}>Tạo</Text>
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
    milestoneItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    milestoneName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    milestoneDesc: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    removeButton: {
        alignSelf: 'flex-end',
    },
    removeButtonText: {
        color: '#ff4d4f',
        fontSize: 12,
    },
    addMilestoneContainer: {
        gap: 8,
    },
    milestoneInput: {
        marginBottom: 0,
    },
    addButton: {
        backgroundColor: '#1677ff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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

export default CreateWorkProgressModal;

