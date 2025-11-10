import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../../service/store';
import {
    getProgressByAppointment,
    startMaintenance,
} from '../../service/technician/workProgressSlice';
import Toast from 'react-native-toast-message';
import InspectionQuoteModal from './InspectionQuoteModal';
import CompleteMaintenanceModal from './CompleteMaintenanceModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    schedule: any;
    appointmentId: string | null;
    onRefresh?: () => void;
}

const WorkProgressDetailModal: React.FC<Props> = ({
    visible,
    onClose,
    schedule,
    appointmentId,
    onRefresh,
}) => {
    const dispatch = useAppDispatch();
    const { byAppointment, loading } = useAppSelector((state) => state.workProgress);

    const [quoteOpen, setQuoteOpen] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(appointmentId);

    const progress = selectedAppointmentId ? byAppointment[selectedAppointmentId] : null;

    useEffect(() => {
        setSelectedAppointmentId(appointmentId);
    }, [appointmentId]);

    useEffect(() => {
        const loadProgress = async () => {
            if (visible && selectedAppointmentId) {
                try {
                    const result = await dispatch(getProgressByAppointment(selectedAppointmentId));
                    if (!getProgressByAppointment.fulfilled.match(result)) {
                        Toast.show({
                            type: 'error',
                            text1: 'Lỗi',
                            text2: 'Không thể tải thông tin tiến trình'
                        });
                    }
                } catch (error: any) {
                    Toast.show({
                        type: 'error',
                        text1: 'Lỗi',
                        text2: error?.message || 'Không thể tải thông tin tiến trình'
                    });
                }
            }
        };
        loadProgress();
    }, [visible, selectedAppointmentId, dispatch]);

    const handleStartMaintenance = async () => {
        if (!progress?._id) return;
        try {
            const result = await dispatch(startMaintenance(progress._id)).unwrap();
            if (result?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Thành công',
                    text2: 'Đã bắt đầu bảo dưỡng'
                });
                if (selectedAppointmentId) {
                    await dispatch(getProgressByAppointment(selectedAppointmentId));
                }
                if (onRefresh) onRefresh();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: result?.message || 'Không thể bắt đầu bảo dưỡng'
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: error?.message || 'Không thể bắt đầu bảo dưỡng'
            });
        }
    };

    const handleQuoteSuccess = async () => {
        if (selectedAppointmentId) {
            await dispatch(getProgressByAppointment(selectedAppointmentId));
            // Đóng modal quote sau khi cập nhật thành công
            setQuoteOpen(false);
        }
        if (onRefresh) onRefresh();
    };

    const handleCompleteSuccess = async () => {
        if (selectedAppointmentId) {
            await dispatch(getProgressByAppointment(selectedAppointmentId));
        }
        if (onRefresh) onRefresh();
    };

    const canSendQuote = () => {
        if (!progress) return false;

        const progressStatus = progress.currentStatus || '';
        const currentAppt = Array.isArray(schedule?.assignedAppointments)
            ? schedule.assignedAppointments.find((a: any) => a._id === selectedAppointmentId) ||
            schedule.assignedAppointments[0]
            : undefined;
        const apptStatus = currentAppt?.status || '';

        // Disable if appointment is completed
        if (apptStatus === 'completed') return false;

        // Allow re-sending quote if progress is completed but appointment is still in maintenance
        if (progressStatus === 'completed' && apptStatus === 'maintenance_completed') return true;

        // Disable if progress has a status indicating later stages
        const laterStages = ['in_progress', 'completed', 'delayed'];
        if (laterStages.includes(progressStatus)) return false;

        return true;
    };

    const getQuoteErrorMessage = () => {
        if (!progress) {
            return 'Vui lòng tạo tiến trình trước khi gửi báo giá';
        }

        const progressStatus = progress.currentStatus || '';
        const currentAppt = Array.isArray(schedule?.assignedAppointments)
            ? schedule.assignedAppointments.find((a: any) => a._id === selectedAppointmentId) ||
            schedule.assignedAppointments[0]
            : undefined;
        const apptStatus = currentAppt?.status || '';

        if (apptStatus === 'completed') {
            return 'Booking đã hoàn thành';
        }

        const laterStages = ['in_progress', 'completed', 'delayed'];
        if (laterStages.includes(progressStatus)) {
            return 'Tiến trình đã qua giai đoạn báo giá';
        }

        return '';
    };
    const canStartMaintenance = () => {
        if (!progress) return false;
        const status = progress.currentStatus || '';
        const maintenanceStartedOrBeyond = ['in_progress', 'paused', 'completed', 'delayed'].includes(status);
        if (maintenanceStartedOrBeyond) return false;

        // Allow starting maintenance only when quote is approved (or work already approved via appointment data)
        const quoteApproved =
            progress?.quote?.quoteStatus === 'approved' ||
            (typeof progress?.appointmentId === 'object' &&
                progress?.appointmentId?.inspectionAndQuote?.quoteStatus === 'approved') ||
            status === 'quote_approved';

        if (!quoteApproved) return false;

        return true;
    };

    const canComplete = () => {
        if (!progress) return false;
        return progress.currentStatus === 'in_progress';
    };

    const getCompleteErrorMessage = () => {
        if (!progress) {
            return 'Vui lòng tạo tiến trình trước';
        }

        if (progress.currentStatus !== 'in_progress') {
            return 'Tiến trình phải ở trạng thái đang thực hiện';
        }

        return '';
    }; const currentAppointment = Array.isArray(schedule?.assignedAppointments)
        ? schedule.assignedAppointments.find((a: any) => a._id === selectedAppointmentId) ||
        schedule.assignedAppointments[0]
        : undefined;

    const getStartMaintenanceErrorMessage = () => {
        if (!progress) {
            return 'Vui lòng tạo tiến trình trước';
        }

        const status = progress.currentStatus || '';
        const maintenanceStartedOrBeyond = ['in_progress', 'paused', 'completed', 'delayed'].includes(status);

        if (maintenanceStartedOrBeyond) {
            return 'Bảo dưỡng đã được bắt đầu hoặc hoàn thành';
        }

        const quoteApproved =
            progress?.quote?.quoteStatus === 'approved' ||
            (typeof progress?.appointmentId === 'object' &&
                progress?.appointmentId?.inspectionAndQuote?.quoteStatus === 'approved') ||
            status === 'quote_approved';

        if (!quoteApproved) {
            return 'Báo giá chưa được phê duyệt';
        }

        return '';
    };

    const getProgressStatusColor = (status?: string) =>
        status === 'in_progress'
            ? '#1677ff'
            : status === 'completed'
                ? '#52c41a'
                : status === 'paused'
                    ? '#faad14'
                    : status === 'delayed'
                        ? '#faad14'
                        : status === 'quote_provided'
                            ? '#1677ff'
                            : '#d9d9d9';

    return (
        <>
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Chi tiết lịch/booking</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>Đóng</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#1677ff" />
                            <Text style={styles.loadingText}>Đang tải...</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            <View style={styles.infoSection}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Ngày:</Text>
                                    <Text style={styles.infoValue}>
                                        {dayjs(schedule?.workDate || new Date()).format('DD/MM/YYYY')}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Ca:</Text>
                                    <Text style={styles.infoValue}>
                                        {schedule?.shiftStart} - {schedule?.shiftEnd}
                                    </Text>
                                </View>
                            </View>

                            {Array.isArray(schedule?.assignedAppointments) &&
                                schedule.assignedAppointments.some(
                                    (a: any) => a.status !== 'cancelled'
                                ) && (
                                    <View style={styles.appointmentSection}>
                                        <Text style={styles.sectionTitle}>Chọn booking theo giờ hẹn</Text>
                                        {schedule.assignedAppointments
                                            .filter((a: any) => a.status !== 'cancelled')
                                            .map((a: any) => (
                                                <TouchableOpacity
                                                    key={a._id}
                                                    style={[
                                                        styles.appointmentOption,
                                                        selectedAppointmentId === a._id &&
                                                        styles.appointmentOptionActive,
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedAppointmentId(a._id);
                                                        dispatch(getProgressByAppointment(a._id));
                                                    }}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.appointmentOptionText,
                                                            selectedAppointmentId === a._id &&
                                                            styles.appointmentOptionTextActive,
                                                        ]}
                                                    >
                                                        {a.appointmentTime?.startTime || ''}
                                                        {a.appointmentTime?.endTime
                                                            ? ` - ${a.appointmentTime.endTime}`
                                                            : ''}
                                                        {a.status ? ` • ${a.status}` : ''}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                )}

                            {currentAppointment && (
                                <View style={styles.appointmentInfo}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Giờ hẹn:</Text>
                                        <Text style={styles.infoValue}>
                                            {currentAppointment.appointmentTime?.startTime || ''}
                                            {currentAppointment.appointmentTime?.endTime
                                                ? ` - ${currentAppointment.appointmentTime.endTime}`
                                                : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Quote status:</Text>
                                        <Text style={styles.infoValue}>
                                            {currentAppointment.inspectionAndQuote?.quoteStatus || 'pending'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Payment:</Text>
                                        <Text style={styles.infoValue}>
                                            {currentAppointment.payment?.status || '—'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Mô tả:</Text>
                                        <Text style={styles.infoValue}>
                                            {currentAppointment.serviceDetails?.description || '—'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Xác nhận:</Text>
                                        <Text style={styles.infoValue}>
                                            {currentAppointment.confirmation?.isConfirmed
                                                ? 'Đã xác nhận'
                                                : 'Chưa xác nhận'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {!progress && (
                                <View style={styles.noProgressContainer}>
                                    <Text style={styles.noProgressText}>
                                        Chưa có tiến trình cho lịch này. Nhấn "Tạo tiến trình" để bắt đầu.
                                    </Text>
                                </View>
                            )}

                            {progress && (
                                <View style={styles.progressInfo}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Trạng thái hiện tại:</Text>
                                        <View style={[styles.progressStatusBadge, { backgroundColor: getProgressStatusColor(progress.currentStatus) }]}>
                                            <Text style={styles.progressStatusText}>{(progress.currentStatus || '').split('_').join(' ')}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Quote status:</Text>
                                        <Text style={styles.infoValue}>
                                            {progress?.quote?.quoteStatus ||
                                                (typeof progress?.appointmentId === 'object' &&
                                                    progress?.appointmentId?.inspectionAndQuote
                                                        ?.quoteStatus) ||
                                                'pending'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.actionsContainer}>
                                {progress && (
                                    <>
                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                !canSendQuote() && styles.actionButtonDisabled,
                                            ]}
                                            onPress={() => {
                                                const errorMessage = getQuoteErrorMessage();
                                                if (errorMessage) {
                                                    Toast.show({
                                                        type: 'info',
                                                        text1: 'Thông báo',
                                                        text2: errorMessage
                                                    });
                                                    return;
                                                }
                                                setQuoteOpen(true);
                                            }}
                                            disabled={!canSendQuote()}
                                        >
                                            <Text
                                                style={[
                                                    styles.actionButtonText,
                                                    !canSendQuote() && styles.actionButtonTextDisabled,
                                                ]}
                                            >
                                                Gửi Inspection & Quote
                                            </Text>
                                        </TouchableOpacity>

                                        {canStartMaintenance() && (
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => {
                                                    const errorMessage = getStartMaintenanceErrorMessage();
                                                    if (errorMessage) {
                                                        Toast.show({
                                                            type: 'info',
                                                            text1: 'Thông báo',
                                                            text2: errorMessage
                                                        });
                                                        return;
                                                    }
                                                    handleStartMaintenance();
                                                }}
                                            >
                                                <Text style={styles.actionButtonText}>
                                                    Bắt đầu bảo dưỡng
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {canComplete() && (
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.completeButton]}
                                                onPress={() => {
                                                    const errorMessage = getCompleteErrorMessage();
                                                    if (errorMessage) {
                                                        Toast.show({
                                                            type: 'info',
                                                            text1: 'Thông báo',
                                                            text2: errorMessage
                                                        });
                                                        return;
                                                    }
                                                    setCompleteOpen(true);
                                                }}
                                            >
                                                <Text style={styles.actionButtonText}>Hoàn thành</Text>
                                            </TouchableOpacity>
                                        )}
                                    </>
                                )}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </Modal>

            {progress && (
                <>
                    <InspectionQuoteModal
                        visible={quoteOpen}
                        onClose={() => setQuoteOpen(false)}
                        progressId={progress._id}
                        onSuccess={handleQuoteSuccess}
                    />
                    <CompleteMaintenanceModal
                        visible={completeOpen}
                        onClose={() => setCompleteOpen(false)}
                        progressId={progress._id}
                        onSuccess={handleCompleteSuccess}
                    />
                </>
            )}
        </>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 100,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    appointmentSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    appointmentOption: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        marginBottom: 8,
    },
    appointmentOptionActive: {
        backgroundColor: '#eef2ff',
        borderWidth: 1,
        borderColor: '#1677ff',
    },
    appointmentOptionText: {
        fontSize: 14,
        color: '#666',
    },
    appointmentOptionTextActive: {
        color: '#1677ff',
        fontWeight: '600',
    },
    appointmentInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    noProgressContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    noProgressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    progressInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    actionsContainer: {
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: '#1677ff',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonDisabled: {
        backgroundColor: '#d9d9d9',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    actionButtonTextDisabled: {
        color: '#999',
    },
    completeButton: {
        backgroundColor: '#52c41a',
    },
    progressStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    progressStatusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default WorkProgressDetailModal;

