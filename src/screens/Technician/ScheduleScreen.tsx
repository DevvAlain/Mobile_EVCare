import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../../service/store";
import {
    fetchTechnicianSchedulesById,
    checkInTechnician,
    checkOutTechnician,
} from "../../service/technician/technicianSlice";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const ScheduleScreen = () => {
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((s) => s.auth);
    const technicianState = useAppSelector((s) => (s as any).technician);

    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [today] = useState(dayjs());
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs | null>(null);

    useEffect(() => {
        if (!user) return;
        const startDate = currentMonth.startOf("month").format("YYYY-MM-DD");
        const endDate = currentMonth.endOf("month").format("YYYY-MM-DD");
        dispatch(
            fetchTechnicianSchedulesById({
                technicianId: user.id,
                startDate,
                endDate,
            })
        );
    }, [dispatch, user, currentMonth]);

    const schedules: any[] = Array.isArray(technicianState?.schedules)
        ? technicianState.schedules
        : [];

    const schedulesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        schedules.forEach((sch) => {
            const key = dayjs(sch.workDate).format("YYYY-MM-DD");
            if (!map[key]) map[key] = [];
            map[key].push(sch);
        });
        return map;
    }, [schedules]);

    const todayKey = today.format("YYYY-MM-DD");
    const todaySchedule = schedulesByDate[todayKey]?.[0];
    const todayStatus = todaySchedule?.status;

    const statusColor = (status?: string) =>
        status === "working"
            ? "#1677ff"
            : status === "completed"
                ? "#52c41a"
                : status === "on_leave"
                    ? "#faad14"
                    : status === "absent"
                        ? "#ff4d4f"
                        : "#d9d9d9";

    const statusText = (status?: string) =>
        status === "working"
            ? "Đang làm"
            : status === "completed"
                ? "Hoàn tất"
                : status === "on_leave"
                    ? "Nghỉ phép"
                    : status === "absent"
                        ? "Vắng"
                        : "Đã lên lịch";

    const handleCheckIn = async () => {
        try {
            if (!user) return;
            const key = today.format("YYYY-MM-DD");
            const todaySchedules = schedulesByDate[key] || [];
            const target = todaySchedules[0];
            if (!target) {
                Toast.show({ type: "info", text1: "Hôm nay bạn không có lịch làm việc." });
                return;
            }
            if (target.status === "working") {
                Toast.show({ type: "info", text1: "Bạn đã check-in rồi." });
                return;
            }
            await dispatch(checkInTechnician(target._id)).unwrap();
            Toast.show({ type: "success", text1: "Check-in thành công" });
        } catch (e) {
            Toast.show({ type: "error", text1: "Check-in thất bại" });
        }
    };

    const handleCheckOut = async () => {
        try {
            if (!user) return;
            const key = today.format("YYYY-MM-DD");
            const todaySchedules = schedulesByDate[key] || [];
            const target = todaySchedules[0];
            if (!target) {
                Toast.show({ type: "info", text1: "Hôm nay bạn không có lịch làm việc." });
                return;
            }
            if (target.status === "completed") {
                Toast.show({ type: "info", text1: "Bạn đã check-out rồi." });
                return;
            }
            await dispatch(checkOutTechnician(target._id)).unwrap();
            Toast.show({ type: "success", text1: "Check-out thành công" });
        } catch (e) {
            Toast.show({ type: "error", text1: "Check-out thất bại" });
        }
    };

    const dateKeys = useMemo(() => {
        const keys = Object.keys(schedulesByDate).sort();
        return keys;
    }, [schedulesByDate]);

    const openDayModal = (dateKey: string) => {
        setSelectedDay(dayjs(dateKey));
        setDayModalOpen(true);
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(currentMonth.subtract(1, 'month'));
    };
    const goToNextMonth = () => {
        setCurrentMonth(currentMonth.add(1, 'month'));
    };
    const [yearModalOpen, setYearModalOpen] = useState(false);
    // Hàm mở modal chọn năm
    const openYearModal = () => {
        setYearModalOpen(true);
    };
    // Hàm chọn năm
    const selectYear = (year: number) => {
        setCurrentMonth(currentMonth.year(year));
        setYearModalOpen(false);
    };
    // Tạo danh sách năm (5 năm trước đến 5 năm sau)
    const currentYear = dayjs().year();
    const yearList = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);
    // Hiển thị nút checkin/checkout theo đúng logic ban đầu
    const renderCheckInOutButton = () => {
        if (!todaySchedule) {
            return (
                <TouchableOpacity style={[styles.actionButton, styles.disabledButton]} disabled>
                    <Text style={styles.actionButtonText}>Không có lịch</Text>
                </TouchableOpacity>
            );
        }

        switch (todayStatus) {
            case "working":
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.checkOutButton]} onPress={handleCheckOut}>
                        <Text style={styles.actionButtonText}>Check out</Text>
                    </TouchableOpacity>
                );
            case "completed":
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.disabledButton]} disabled>
                        <Text style={styles.actionButtonText}>Đã hoàn thành</Text>
                    </TouchableOpacity>
                );
            case "on_leave":
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.disabledButton]} disabled>
                        <Text style={styles.actionButtonText}>Nghỉ phép</Text>
                    </TouchableOpacity>
                );
            case "absent":
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.disabledButton]} disabled>
                        <Text style={styles.actionButtonText}>Vắng mặt</Text>
                    </TouchableOpacity>
                );
            default:
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.checkInButton]} onPress={handleCheckIn}>
                        <Text style={styles.actionButtonText}>Check in</Text>
                    </TouchableOpacity>
                );
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.title}>Lịch làm việc</Text>
            </View>

            {/* Month Filter với chọn năm */}
            <View style={styles.monthFilterContainer}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthArrow}>
                    <Text style={styles.monthArrowText}>‹</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={openYearModal} style={styles.monthYearDisplay}>
                    <Text style={styles.monthText}>{currentMonth.format('MM/YYYY')}</Text>
                    <Text style={styles.yearDropdownIcon}>⌄</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
                    <Text style={styles.monthArrowText}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: statusColor("working") }]} />
                        <Text style={styles.legendText}>Đang làm</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: statusColor("completed") }]} />
                        <Text style={styles.legendText}>Hoàn tất</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: statusColor("on_leave") }]} />
                        <Text style={styles.legendText}>Nghỉ phép</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: statusColor("absent") }]} />
                        <Text style={styles.legendText}>Vắng mặt</Text>
                    </View>
                </View>
            </View>

            {/* Today Card - QUAN TRỌNG: Luôn hiển thị phần này */}
            <View style={styles.todayCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Hôm nay - {today.format("DD/MM/YYYY")}</Text>
                    {todaySchedule && (
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(todayStatus) }]}>
                            <Text style={styles.statusBadgeText}>{statusText(todayStatus)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.todayContent}>
                    {todaySchedule ? (
                        <View style={styles.scheduleInfo}>
                            <Text style={styles.shiftTime}>{`${todaySchedule.shiftStart} - ${todaySchedule.shiftEnd}`}</Text>
                            <Text style={styles.centerName}>{todaySchedule.centerId?.name || "-"}</Text>
                        </View>
                    ) : (
                        <View style={styles.noScheduleInfo}>
                            <Text style={styles.noScheduleText}>Hôm nay bạn không có lịch làm việc</Text>
                        </View>
                    )}

                    {/* LUÔN HIỂN THỊ NÚT CHECKIN/CHECKOUT */}
                    <View style={styles.actionContainer}>
                        {renderCheckInOutButton()}
                    </View>
                </View>
            </View>

            {/* Schedule List */}
            <View style={styles.scheduleListContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>Danh sách lịch làm việc</Text>
                    <Text style={styles.scheduleCount}>{dateKeys.length} ngày có lịch</Text>
                </View>

                {technicianState?.fetchSchedulesLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1677ff" />
                        <Text style={styles.loadingText}>Đang tải lịch làm việc...</Text>
                    </View>
                ) : dateKeys.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Không có lịch làm việc trong tháng này</Text>
                    </View>
                ) : (
                    <FlatList
                        data={dateKeys}
                        keyExtractor={(item) => item}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => {
                            const items = schedulesByDate[item] || [];
                            const first = items[0];
                            const isToday = item === todayKey;

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.scheduleItem,
                                        isToday && styles.todayItem
                                    ]}
                                    onPress={() => openDayModal(item)}
                                >
                                    <View style={styles.scheduleItemLeft}>
                                        <View style={styles.dateContainer}>
                                            <Text style={[
                                                styles.dateDay,
                                                isToday && styles.todayDateDay
                                            ]}>
                                                {dayjs(item).format("DD")}
                                            </Text>
                                            <Text style={styles.dateMonth}>{dayjs(item).format("MM")}</Text>
                                        </View>
                                        <View style={styles.scheduleInfo}>
                                            <Text style={styles.scheduleDate}>{dayjs(item).format("dddd, DD/MM/YYYY")}</Text>
                                            <Text style={styles.scheduleTime}>{`${first?.shiftStart || "-"} - ${first?.shiftEnd || "-"}`}</Text>
                                            <Text style={styles.scheduleCenter}>{first?.centerId?.name || "-"}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.scheduleItemRight}>
                                        <View style={[styles.statusIndicator, { backgroundColor: statusColor(first?.status) }]}>
                                            <Text style={styles.statusIndicatorText}>{statusText(first?.status)}</Text>
                                        </View>
                                        {isToday && (
                                            <View style={styles.todayIndicator}>
                                                <Text style={styles.todayIndicatorText}>Hôm nay</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>

            <Modal visible={dayModalOpen} animationType="slide" onRequestClose={() => setDayModalOpen(false)}>
                <SafeDayModalContent
                    date={selectedDay}
                    schedulesByDate={schedulesByDate}
                    onClose={() => setDayModalOpen(false)}
                />
            </Modal>
            <Modal visible={yearModalOpen} animationType="slide" transparent={true}>
                <View style={styles.yearModalContainer}>
                    <View style={styles.yearModalContent}>
                        <View style={styles.yearModalHeader}>
                            <Text style={styles.yearModalTitle}>Chọn năm</Text>
                            <Pressable onPress={() => setYearModalOpen(false)}>
                                <Text style={styles.closeButtonText}>Đóng</Text>
                            </Pressable>
                        </View>
                        <ScrollView style={styles.yearList}>
                            {yearList.map((year) => (
                                <TouchableOpacity
                                    key={year}
                                    style={[
                                        styles.yearItem,
                                        currentMonth.year() === year && styles.selectedYearItem
                                    ]}
                                    onPress={() => selectYear(year)}
                                >
                                    <Text style={[
                                        styles.yearText,
                                        currentMonth.year() === year && styles.selectedYearText
                                    ]}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const SafeDayModalContent = ({ date, schedulesByDate, onClose }: any) => {
    if (!date) return null;
    const key = date.format("YYYY-MM-DD");
    const items = schedulesByDate[key] || [];

    const statusColor = (status?: string) =>
        status === "working"
            ? "#1677ff"
            : status === "completed"
                ? "#52c41a"
                : status === "on_leave"
                    ? "#faad14"
                    : status === "absent"
                        ? "#ff4d4f"
                        : "#d9d9d9";

    const statusText = (status?: string) =>
        status === "working"
            ? "Đang làm"
            : status === "completed"
                ? "Hoàn tất"
                : status === "on_leave"
                    ? "Nghỉ phép"
                    : status === "absent"
                        ? "Vắng"
                        : "Đã lên lịch";

    return (
        <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{`Lịch làm việc ngày ${date.format("DD/MM/YYYY")}`}</Text>
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Đóng</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {items.length === 0 ? (
                    <View style={styles.emptyModal}>
                        <Text style={styles.emptyModalText}>Không có lịch trong ngày này</Text>
                    </View>
                ) : (
                    items.map((item: any) => (
                        <View key={item._id} style={styles.modalScheduleItem}>
                            <View style={styles.modalScheduleHeader}>
                                <Text style={styles.modalShiftTime}>{`${item.shiftStart} - ${item.shiftEnd}`}</Text>
                                <View style={[styles.modalStatus, { backgroundColor: statusColor(item.status) }]}>
                                    <Text style={styles.modalStatusText}>{statusText(item.status)}</Text>
                                </View>
                            </View>
                            <Text style={styles.modalCenterName}>{item.centerId?.name}</Text>
                            <View style={styles.modalScheduleDetails}>
                                <Text style={styles.modalDetailText}>Trung tâm: {item.centerId?.name || "-"}</Text>
                                <Text style={styles.modalDetailText}>Trạng thái: {statusText(item.status)}</Text>
                                <Text style={styles.modalDetailText}>Ngày làm việc: {date.format("DD/MM/YYYY")}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa"
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        flexDirection: "row",
        alignItems: "center"
    },
    backButton: {
        marginRight: 16,
        padding: 4
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1a1a1a"
    },
    monthFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    monthArrow: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5'
    },
    monthArrowText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1677ff'
    },
    monthYearDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8f9fa'
    },
    monthText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginRight: 8
    },
    yearDropdownIcon: {
        fontSize: 16,
        color: '#666'
    },
    yearModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    yearModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxHeight: '60%'
    },
    yearModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    yearModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a'
    },
    yearList: {
        maxHeight: 300
    },
    yearItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 4
    },
    selectedYearItem: {
        backgroundColor: '#1677ff'
    },
    yearText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center'
    },
    selectedYearText: {
        color: '#fff',
        fontWeight: '600'
    },
    legendContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#fff"
    },
    legendRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center"
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6
    },
    legendText: {
        fontSize: 12,
        color: "#666"
    },
    todayCard: {
        margin: 20,
        marginTop: 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a1a1a"
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    statusBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600"
    },
    todayContent: {
        gap: 16
    },
    scheduleInfo: {
        gap: 4
    },
    noScheduleInfo: {
        paddingVertical: 8
    },
    shiftTime: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a"
    },
    centerName: {
        fontSize: 14,
        color: "#666"
    },
    noScheduleText: {
        color: "#666",
        fontSize: 14,
        textAlign: "center"
    },
    actionContainer: {
        flexDirection: "row"
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center"
    },
    checkInButton: {
        backgroundColor: "#1677ff"
    },
    checkOutButton: {
        backgroundColor: "#ff4d4f"
    },
    disabledButton: {
        backgroundColor: "#d9d9d9"
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    scheduleListContainer: {
        flex: 1,
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0"
    },
    listTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a1a1a"
    },
    scheduleCount: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500"
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#666"
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center"
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 12
    },
    scheduleItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#f0f0f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
    },
    todayItem: {
        borderColor: "#1677ff",
        borderWidth: 1.5,
        backgroundColor: "#f0f8ff"
    },
    scheduleItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },
    dateContainer: {
        alignItems: "center",
        marginRight: 16,
        minWidth: 40
    },
    dateDay: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a"
    },
    todayDateDay: {
        color: "#1677ff"
    },
    dateMonth: {
        fontSize: 12,
        color: "#666",
        marginTop: 2
    },
    scheduleDate: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1a1a1a"
    },
    scheduleTime: {
        fontSize: 13,
        color: "#666",
        marginTop: 2
    },
    scheduleCenter: {
        fontSize: 12,
        color: "#999",
        marginTop: 2
    },
    scheduleItemRight: {
        alignItems: "flex-end",
        gap: 4
    },
    statusIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    statusIndicatorText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "600"
    },
    todayIndicator: {
        backgroundColor: "#1677ff",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    todayIndicatorText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "600"
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        paddingTop: 60
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0"
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a1a1a",
        flex: 1
    },
    closeButton: {
        padding: 8
    },
    closeButtonText: {
        color: "#1677ff",
        fontSize: 16,
        fontWeight: "600"
    },
    modalContent: {
        flex: 1,
        padding: 20
    },
    emptyModal: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40
    },
    emptyModalText: {
        color: "#666",
        fontSize: 16
    },
    modalScheduleItem: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    modalScheduleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    modalShiftTime: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a1a1a"
    },
    modalStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    modalStatusText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "600"
    },
    modalCenterName: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8
    },
    modalScheduleDetails: {
        gap: 4
    },
    modalDetailText: {
        fontSize: 12,
        color: "#999"
    }
});

export default ScheduleScreen;