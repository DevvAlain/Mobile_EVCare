import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppDispatch, useAppSelector, RootState } from '../service/store';
import { fetchVehicles as fetchBookingVehicles, createVehicle as createBookingVehicle } from '../service/slices/bookingSlice';
import { updateVehicle, deleteVehicle } from '../service/slices/vehicleSlice';
import { Vehicle, CreateVehicleData } from '../types/vehicle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { axiosInstance } from '../service/constants/axiosConfig';
import { VEHICLE_BRANDS_ENDPOINT } from '../service/constants/apiConfig';

const VehicleManagementScreen = () => {
    const dispatch = useAppDispatch();
    const { vehicles, loading, error } = useAppSelector((state: RootState) => state.booking);
    const [refreshing, setRefreshing] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Vehicle | null>(null);

    const [form, setForm] = useState<CreateVehicleData>({
        vehicleInfo: {
            brand: '',
            modelName: '',
            year: new Date().getFullYear(),
            batteryType: '',
            licensePlate: '',
            color: '',
            batteryCapacity: '',
        },
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [brands, setBrands] = useState<string[]>([]);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false); // sẽ dùng cho select box nội bộ

    useEffect(() => {
        // Fetch vehicles using booking slice (align with FE flow)
        dispatch(fetchBookingVehicles());
    }, [dispatch]);

    // fetch vehicle brands from API (if available)
    useEffect(() => {
        let mounted = true;
        const getBrands = async () => {
            try {
                const res = await axiosInstance.get(VEHICLE_BRANDS_ENDPOINT);
                const data = res?.data?.data ?? [];
                if (mounted && Array.isArray(data)) {
                    setBrands(data);
                }
            } catch (err) {
                console.error("Failed to fetch brands", err);
            }
        };
        getBrands();
        return () => { mounted = false; };
    }, []);

    const openAdd = () => {
        setForm({
            vehicleInfo: {
                brand: '',
                modelName: '',
                year: new Date().getFullYear(),
                batteryType: '',
                licensePlate: '',
                color: '',
                batteryCapacity: '',
            },
        });
        setFieldErrors({});
        setFormError(null);
        setAddOpen(true);
    };

    const validateForm = (isEdit: boolean = false) => {
        const v = form.vehicleInfo;
        const errors: Record<string, string> = {};

        if (!isEdit) {
            if (!v.brand.trim()) errors.brand = 'Bắt buộc';
            if (!v.modelName.trim()) errors.modelName = 'Bắt buộc';
            if (!v.batteryType.trim()) errors.batteryType = 'Bắt buộc';
            if (!v.batteryCapacity.trim()) errors.batteryCapacity = 'Bắt buộc';
        }

        if (!v.licensePlate.trim()) errors.licensePlate = 'Bắt buộc';
        if (!v.color.trim()) errors.color = 'Bắt buộc';
        if (!v.year) errors.year = 'Bắt buộc';

        const y = Number(v.year);
        if (v.year && (y < 1970 || y > new Date().getFullYear() + 1)) {
            errors.year = 'Năm không hợp lệ';
        }

        const plate = String(v.licensePlate || '').trim().toUpperCase();
        const plateOk = /^\d{1,2}[A-Z]-\d{4,5}$/.test(plate);
        if (v.licensePlate && !plateOk) {
            errors.licensePlate = 'Biển số phải có định dạng: (VD: 30A-12345 hoặc 9B-1234)';
        }

        return errors;
    };

    const submitAdd = async () => {
        const errors = validateForm(false);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        setFormError(null);
        setSubmitting(true);
        try {
            const normalizedForm: CreateVehicleData = {
                vehicleInfo: {
                    ...form.vehicleInfo,
                    licensePlate: String(form.vehicleInfo.licensePlate).trim().toUpperCase(),
                    year: Number(form.vehicleInfo.year),
                },
            };
            await dispatch(createBookingVehicle(normalizedForm)).unwrap();
            setAddOpen(false);
            dispatch(fetchBookingVehicles());
            Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã thêm xe thành công' });
        } catch (err: any) {
            const msg = err?.message || err?.data?.message || 'Không thể thêm xe';
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const openView = (vehicle: Vehicle) => {
        setSelected(vehicle);
        setViewOpen(true);
    };

    const openEdit = (vehicle: Vehicle) => {
        setSelected(vehicle);
        setForm({
            vehicleInfo: {
                brand: vehicle.vehicleInfo?.brand || vehicle.vehicleInfo?.vehicleModel?.brand || '',
                modelName: vehicle.vehicleInfo?.modelName || vehicle.vehicleInfo?.vehicleModel?.modelName || '',
                year: vehicle.vehicleInfo?.year || new Date().getFullYear(),
                batteryType: vehicle.vehicleInfo?.batteryType || vehicle.vehicleInfo?.vehicleModel?.batteryType || '',
                licensePlate: vehicle.vehicleInfo?.licensePlate || '',
                color: vehicle.vehicleInfo?.color || '',
                batteryCapacity: String(vehicle.vehicleInfo?.batteryCapacity || ''),
            },
        });
        setFieldErrors({});
        setFormError(null);
        setEditOpen(true);
    };

    const submitEdit = async () => {
        if (!selected) return;

        const errors = validateForm(true);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setFormError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        setFormError(null);
        setEditSubmitting(true);
        try {
            const payload = {
                vehicleInfo: {
                    licensePlate: String(form.vehicleInfo.licensePlate).trim().toUpperCase(),
                    color: form.vehicleInfo.color,
                    year: Number(form.vehicleInfo.year),
                },
            };
            await dispatch(updateVehicle({ vehicleId: selected._id, updateData: payload })).unwrap();
            setEditOpen(false);
            setSelected(null);
            dispatch(fetchBookingVehicles());
            Toast.show({ type: 'success', text1: 'Thành công', text2: 'Cập nhật thông tin xe thành công' });
        } catch (err: any) {
            const msg = err?.message || err?.data?.message || 'Không thể cập nhật xe';
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
        } finally {
            setEditSubmitting(false);
        }
    };

    const openDelete = (vehicle: Vehicle) => {
        setSelected(vehicle);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!selected) return;

        try {
            setDeletingId(selected._id);
            await dispatch(deleteVehicle(selected._id)).unwrap();
            setDeleteOpen(false);
            setSelected(null);
            dispatch(fetchBookingVehicles());
            Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã xóa xe thành công' });
        } catch (err: any) {
            const msg = err?.message || err?.data?.message || 'Không thể xóa xe';
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
        } finally {
            setDeletingId(null);
        }
    };

    const totalVehiclesText = vehicles.length === 0
        ? 'Bạn chưa có xe nào. Thêm xe để bắt đầu quản lý.'
        : vehicles.length === 1
            ? 'Bạn có 1 xe đã đăng ký'
            : `Bạn có ${vehicles.length} xe đã đăng ký`;

    const FormField = ({
        label,
        value,
        onChange,
        placeholder,
        error,
        keyboardType = 'default',
        editable = true,
        iconName,
        isSelect = false,
        onSelectPress,
        showIncrementDecrement = false,
        onIncrement,
        onDecrement
    }: any) => {
        const stringValue = value === undefined || value === null ? '' : String(value);

        return (
            <View style={styles.formField}>
                <Text style={styles.formLabel}>{label}</Text>
                {isSelect ? (
                    <TouchableOpacity
                        style={[
                            styles.formInputContainer,
                            error && styles.inputError,
                            !editable && styles.inputDisabled
                        ]}
                        onPress={() => {
                            if (editable) {
                                Keyboard.dismiss();
                                if (addOpen) setAddOpen(false);
                                if (editOpen) setEditOpen(false);
                                setShowBrandDropdown(true);
                            }
                        }}
                        disabled={!editable}
                        activeOpacity={editable ? 0.6 : 1}
                    >
                        <TextInput
                            style={[
                                styles.formInput,
                                !editable && styles.inputDisabledText
                            ]}
                            value={stringValue}
                            placeholder={placeholder}
                            editable={false}
                            placeholderTextColor="#9CA3AF"
                            pointerEvents="none"
                        />
                        {iconName && <Icon name={iconName} size={20} color="#6B7280" style={styles.inputIcon} />}
                        <Icon name="arrow-drop-down" size={24} color="#6B7280" style={styles.selectIcon} />
                    </TouchableOpacity>
                ) : (
                    <View
                        style={[
                            styles.formInputContainer,
                            error && styles.inputError,
                            !editable && styles.inputDisabled
                        ]}
                    >
                        {showIncrementDecrement && (
                            <TouchableOpacity onPress={onDecrement} style={styles.incrementDecrementButton}>
                                <Icon name="remove" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                        <TextInput
                            style={[
                                styles.formInput,
                                !editable && styles.inputDisabledText
                            ]}
                            value={stringValue}
                            onChangeText={onChange}
                            placeholder={placeholder}
                            keyboardType={keyboardType}
                            editable={editable}
                            placeholderTextColor="#9CA3AF"
                            returnKeyType="done"
                            blurOnSubmit={true}
                        />
                        {showIncrementDecrement && (
                            <TouchableOpacity onPress={onIncrement} style={styles.incrementDecrementButton}>
                                <Icon name="add" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                        {iconName && <Icon name={iconName} size={20} color="#6B7280" style={styles.inputIcon} />}
                    </View>
                )}
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    };

    const VehicleDetailCard = ({ vehicle }: { vehicle: Vehicle }) => {
        const v = vehicle.vehicleInfo;
        const model = v?.vehicleModel;

        return (
            <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                    <View style={styles.carIconContainer}>
                        <Icon name="directions-car" size={24} color="#10B981" />
                    </View>
                    <View style={styles.detailTitle}>
                        <Text style={styles.detailName}>
                            {v?.brand || model?.brand || ''} {v?.modelName || model?.modelName || ''}
                        </Text>
                        <View style={styles.detailPlate}>
                            <Icon name="badge" size={16} color="#6B7280" />
                            <Text style={styles.detailPlateText}> {v?.licensePlate || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Icon name="event" size={16} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>NĂM</Text>
                            <Text style={styles.detailValue}>{v?.year || '—'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Icon name="palette" size={16} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>MÀU</Text>
                            <Text style={styles.detailValue}>{v?.color || '—'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#FFFBEB' }]}>
                            <Icon name="battery-full" size={16} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>LOẠI PIN</Text>
                            <Text style={styles.detailValue}>
                                {v?.batteryType || model?.batteryType || '—'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#FEF2F2' }]}>
                            <Icon name="battery-charging-full" size={16} color="#EF4444" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>PIN (kWh)</Text>
                            <Text style={styles.detailValue}>
                                {v?.batteryCapacity || model?.batteryCapacity || '—'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderVehicleItem = ({ item }: { item: Vehicle }) => (
        <View style={styles.vehicleCard}>
            <VehicleDetailCard vehicle={item} />

            <View style={styles.vehicleActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEdit(item)}
                    disabled={deletingId === item._id || loading}
                >
                    <Icon name="edit" size={18} color="#F59E0B" />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => openDelete(item)}
                    disabled={deletingId === item._id || loading}
                >
                    {deletingId === item._id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                        <>
                            <Icon name="delete" size={18} color="#EF4444" />
                            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    {/* keep only subtitle here — the navigation header shows the main title */}
                    <Text style={styles.headerSubtitle}>{totalVehiclesText}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAdd}>
                    <Icon name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Thêm xe</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading && vehicles.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
                </View>
            ) : vehicles.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Icon name="directions-car" size={48} color="#9CA3AF" />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có xe nào</Text>
                    <Text style={styles.emptyText}>Thêm xe đầu tiên để bắt đầu quản lý</Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={openAdd}>
                        <Icon name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.emptyButtonText}>Thêm xe mới</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    keyExtractor={(item) => item._id}
                    renderItem={renderVehicleItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    refreshing={refreshing}
                    onRefresh={async () => {
                        setRefreshing(true);
                        await dispatch(fetchBookingVehicles());
                        setRefreshing(false);
                    }}
                />
            )}

            {/* Add Vehicle Modal - FIXED */}
            <Modal
                visible={addOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setAddOpen(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Thêm xe mới</Text>
                        <TouchableOpacity onPress={() => setAddOpen(false)} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Content - ĐÃ SỬA: Loại bỏ TouchableWithoutFeedback và thêm onScrollBeginDrag */}
                    <ScrollView
                        style={styles.modalContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        onScrollBeginDrag={dismissKeyboard} // ← THÊM DÒNG NÀY
                    >
                        {formError && (
                            <View style={styles.formErrorContainer}>
                                <Text style={styles.formErrorText}>{formError}</Text>
                            </View>
                        )}

                        {/* Field Hãng xe với dropdown select box */}
                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Hãng xe *</Text>
                            <View>
                                <TouchableOpacity
                                    style={[styles.formInputContainer, fieldErrors.brand && styles.inputError]}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowBrandDropdown((prev) => !prev);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.formInput, { color: form.vehicleInfo.brand ? '#1F2937' : '#9CA3AF' }]}>
                                        {form.vehicleInfo.brand || 'Chọn hãng xe'}
                                    </Text>
                                    <Icon name="directions-car" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <Icon name="arrow-drop-down" size={24} color="#6B7280" style={styles.selectIcon} />
                                </TouchableOpacity>
                                {showBrandDropdown && (
                                    <View style={styles.inlineDropdownContainer}>
                                        <ScrollView style={{ maxHeight: 200 }}>
                                            {brands.map((item) => (
                                                <TouchableOpacity
                                                    key={item}
                                                    style={[styles.dropdownItem, form.vehicleInfo.brand === item && styles.dropdownItemSelected]}
                                                    onPress={() => {
                                                        setForm((p) => ({ vehicleInfo: { ...p.vehicleInfo, brand: item } }));
                                                        setShowBrandDropdown(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownItemText}>{item}</Text>
                                                    {form.vehicleInfo.brand === item && <Icon name="check" size={20} color="#10B981" />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                            {fieldErrors.brand && <Text style={styles.errorText}>{fieldErrors.brand}</Text>}
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Dòng xe *</Text>
                            <View style={[
                                styles.formInputContainer,
                                fieldErrors.modelName && styles.inputError,
                                { paddingHorizontal: 12 }
                            ]}>
                                <TextInput
                                    style={[styles.formInput, { flex: 1 }]}
                                    value={form.vehicleInfo.modelName}
                                    onChangeText={(text) => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, modelName: text }
                                    }))}
                                    placeholder="Nhập dòng xe"
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="next"
                                    pointerEvents="auto"
                                />
                                <Icon name="model-training" size={20} color="#6B7280" style={styles.inputIcon} />
                            </View>
                            {fieldErrors.modelName && <Text style={styles.errorText}>{fieldErrors.modelName}</Text>}
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Biển số *</Text>
                            <View style={[
                                styles.formInputContainer,
                                fieldErrors.licensePlate && styles.inputError,
                                { paddingHorizontal: 12 }
                            ]}>
                                <TextInput
                                    style={[styles.formInput, { flex: 1 }]}
                                    value={form.vehicleInfo.licensePlate}
                                    onChangeText={(text) => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, licensePlate: text }
                                    }))}
                                    placeholder="VD: 30A-12345"
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="next"
                                    autoCapitalize="characters"
                                    pointerEvents="auto"
                                />
                                <Icon name="badge" size={20} color="#6B7280" style={styles.inputIcon} />
                            </View>
                            {fieldErrors.licensePlate && <Text style={styles.errorText}>{fieldErrors.licensePlate}</Text>}
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Màu sắc *</Text>
                            <View style={[
                                styles.formInputContainer,
                                fieldErrors.color && styles.inputError,
                                { paddingHorizontal: 12 }
                            ]}>
                                <TextInput
                                    style={[styles.formInput, { flex: 1 }]}
                                    value={form.vehicleInfo.color}
                                    onChangeText={(text) => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, color: text }
                                    }))}
                                    placeholder="Nhập màu xe"
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="next"
                                    pointerEvents="auto"
                                />
                                <Icon name="palette" size={20} color="#6B7280" style={styles.inputIcon} />
                            </View>
                            {fieldErrors.color && <Text style={styles.errorText}>{fieldErrors.color}</Text>}
                        </View>

                        {/* Year field */}
                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Năm sản xuất *</Text>
                            <View style={[
                                styles.formInputContainer,
                                fieldErrors.year && styles.inputError,
                                { paddingHorizontal: 8 }
                            ]}>
                                <TouchableOpacity
                                    onPress={() => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, year: Math.max(1970, prev.vehicleInfo.year - 1) }
                                    }))}
                                    style={styles.incrementDecrementButton}
                                >
                                    <Icon name="remove" size={20} color="#6B7280" />
                                </TouchableOpacity>

                                <TextInput
                                    style={[styles.formInput, { textAlign: 'center', flex: 1 }]}
                                    value={String(form.vehicleInfo.year)}
                                    onChangeText={(text) => {
                                        const numValue = text === '' ? new Date().getFullYear() : parseInt(text) || new Date().getFullYear();
                                        setForm(prev => ({
                                            vehicleInfo: { ...prev.vehicleInfo, year: numValue }
                                        }));
                                    }}
                                    placeholder="Nhập năm sản xuất"
                                    keyboardType="number-pad"
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="next"
                                    pointerEvents="auto"
                                />

                                <TouchableOpacity
                                    onPress={() => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, year: Math.min(new Date().getFullYear() + 1, prev.vehicleInfo.year + 1) }
                                    }))}
                                    style={styles.incrementDecrementButton}
                                >
                                    <Icon name="add" size={20} color="#6B7280" />
                                </TouchableOpacity>

                                <Icon name="event" size={20} color="#6B7280" style={styles.inputIcon} />
                            </View>
                            {fieldErrors.year && <Text style={styles.errorText}>{fieldErrors.year}</Text>}
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Loại pin *</Text>
                            <View style={[
                                styles.formInputContainer,
                                fieldErrors.batteryType && styles.inputError,
                                { paddingHorizontal: 12 }
                            ]}>
                                <TextInput
                                    style={[styles.formInput, { flex: 1 }]}
                                    value={form.vehicleInfo.batteryType}
                                    onChangeText={(text) => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, batteryType: text }
                                    }))}
                                    placeholder="Nhập loại pin"
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="next"
                                    pointerEvents="auto"
                                />
                                <Icon name="battery-full" size={20} color="#6B7280" style={styles.inputIcon} />
                            </View>
                            {fieldErrors.batteryType && <Text style={styles.errorText}>{fieldErrors.batteryType}</Text>}
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>Dung lượng pin (kWh) *</Text>
                            <View style={[
                                styles.formInputContainer,
                                fieldErrors.batteryCapacity && styles.inputError,
                                { paddingHorizontal: 12 }
                            ]}>
                                <TextInput
                                    style={[styles.formInput, { flex: 1 }]}
                                    value={String(form.vehicleInfo.batteryCapacity)}
                                    onChangeText={(text) => setForm(prev => ({
                                        vehicleInfo: { ...prev.vehicleInfo, batteryCapacity: text }
                                    }))}
                                    placeholder="Nhập dung lượng pin"
                                    keyboardType="decimal-pad"
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="done"
                                    pointerEvents="auto"
                                />
                                <Icon name="battery-charging-full" size={20} color="#6B7280" style={styles.inputIcon} />
                            </View>
                            {fieldErrors.batteryCapacity && <Text style={styles.errorText}>{fieldErrors.batteryCapacity}</Text>}
                        </View>
                        <View style={{ height: 50 }} />
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setAddOpen(false)}
                            disabled={submitting}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={submitAdd}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Thêm xe</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>



            {/* View Details Modal */}
            <Modal visible={viewOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewOpen(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalTitleRow}>
                            <View style={[styles.modalIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Icon name="visibility" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>Chi tiết xe</Text>
                                <Text style={styles.modalSubtitle}>Thông tin chi tiết của xe</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setViewOpen(false)} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                        {selected && <VehicleDetailCard vehicle={selected} />}
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setViewOpen(false)}
                        >
                            <Text style={styles.cancelButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalTitleRow}>
                            <View style={[styles.modalIcon, { backgroundColor: '#FFFBEB' }]}>
                                <Icon name="edit" size={24} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>Sửa thông tin xe</Text>
                                <Text style={styles.modalSubtitle}>Cập nhật thông tin cơ bản</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                        {formError && (
                            <View style={styles.formErrorContainer}>
                                <Text style={styles.formErrorText}>{formError}</Text>
                            </View>
                        )}

                        <FormField
                            label="Biển số *"
                            value={form.vehicleInfo.licensePlate}
                            onChange={(t: string) => setForm((p) => ({ vehicleInfo: { ...p.vehicleInfo, licensePlate: t } }))}
                            placeholder="VD: 30A-12345"
                            error={fieldErrors.licensePlate}
                            iconName="badge"
                        />

                        <FormField
                            label="Màu sắc *"
                            value={form.vehicleInfo.color}
                            onChange={(t: string) => setForm((p) => ({ vehicleInfo: { ...p.vehicleInfo, color: t } }))}
                            placeholder="Nhập màu xe"
                            error={fieldErrors.color}
                            iconName="palette"
                        />

                        <FormField
                            label="Năm sản xuất *"
                            value={String(form.vehicleInfo.year)}
                            onChange={(t: string) => {
                                const numValue = t === '' ? new Date().getFullYear() : parseInt(t) || new Date().getFullYear();
                                setForm((p) => ({ vehicleInfo: { ...p.vehicleInfo, year: numValue } }));
                            }}
                            placeholder="Nhập năm sản xuất"
                            keyboardType="numeric"
                            error={fieldErrors.year}
                            iconName="event"
                            showIncrementDecrement
                            onIncrement={() => setForm((p) => ({ vehicleInfo: { ...p.vehicleInfo, year: Math.min(new Date().getFullYear() + 1, p.vehicleInfo.year + 1) } }))}
                            onDecrement={() => setForm((p) => ({ vehicleInfo: { ...p.vehicleInfo, year: Math.max(1970, p.vehicleInfo.year - 1) } }))}
                        />
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setEditOpen(false)}
                            disabled={editSubmitting}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.submitButton, editSubmitting && styles.submitButtonDisabled]}
                            onPress={submitEdit}
                            disabled={editSubmitting}
                        >
                            {editSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Cập nhật</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteOpen} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmContainer}>
                        <View style={styles.confirmHeader}>
                            <View style={[styles.confirmIcon, { backgroundColor: '#FEF2F2' }]}>
                                <Icon name="delete" size={24} color="#EF4444" />
                            </View>
                            <View>
                                <Text style={styles.confirmTitle}>Xóa xe</Text>
                                <Text style={styles.confirmSubtitle}>Bạn có chắc muốn xóa xe này? Hành động không thể hoàn tác.</Text>
                            </View>
                        </View>

                        {selected && (
                            <View style={styles.confirmContent}>
                                <Text style={styles.confirmVehicleText}>
                                    {selected.vehicleInfo?.brand || selected.vehicleInfo?.vehicleModel?.brand || ''}{' '}
                                    {selected.vehicleInfo?.modelName || selected.vehicleInfo?.vehicleModel?.modelName || ''}
                                    {' • '}
                                    {selected.vehicleInfo?.licensePlate || ''}
                                </Text>
                            </View>
                        )}

                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmCancelButton]}
                                onPress={() => setDeleteOpen(false)}
                                disabled={deletingId === selected?._id}
                            >
                                <Text style={styles.confirmCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmDeleteButton]}
                                onPress={confirmDelete}
                                disabled={deletingId === selected?._id}
                            >
                                {deletingId === selected?._id ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>Xóa</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    inlineDropdownContainer: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
    },
    addButton: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: '#64748B',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    vehicleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    detailCard: {
        marginBottom: 16,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    carIconContainer: {
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        marginRight: 12,
    },
    detailTitle: {
        flex: 1,
    },
    detailName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    detailPlate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailPlateText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        flex: 1,
        minWidth: '48%',
    },
    detailIcon: {
        padding: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    vehicleActions: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 8,
    },
    viewButton: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    editButton: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    deleteButton: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    viewButtonText: {
        color: '#3B82F6',
    },
    editButtonText: {
        color: '#F59E0B',
    },
    deleteButtonText: {
        color: '#EF4444',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalIcon: {
        padding: 8,
        borderRadius: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    formErrorContainer: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    formErrorText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
    formField: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    formInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
    },
    formInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    inputIcon: {
        marginRight: 8,
    },
    selectIcon: {
        marginLeft: 8,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputDisabled: {
        backgroundColor: '#F9FAFB',
    },
    inputDisabledText: {
        color: '#6B7280',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#10B981',
    },
    submitButtonDisabled: {
        backgroundColor: '#A7F3D0',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Dropdown Styles
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
        zIndex: 9999,
    },
    dropdownContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        maxHeight: '80%',
        zIndex: 10000,
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownItemSelected: {
        backgroundColor: '#F0FDF4',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#1E293B',
    },
    // Confirm Modal Styles
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    confirmContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
    },
    confirmHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    confirmIcon: {
        padding: 8,
        borderRadius: 8,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    confirmSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    confirmContent: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    confirmVehicleText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        textAlign: 'center',
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmCancelButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    confirmCancelText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmDeleteButton: {
        backgroundColor: '#EF4444',
    },
    confirmDeleteText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    incrementDecrementButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VehicleManagementScreen;