import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch } from '../service/store';
import { createVehicle } from '../service/slices/bookingSlice';
import { CreateVehicleData } from '../types/vehicle';
import { axiosInstance } from '../service/constants/axiosConfig';
import { VEHICLE_BRANDS_ENDPOINT } from '../service/constants/apiConfig';

interface VehicleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  submitButtonText?: string;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  onSuccess,
  onCancel,
  showCancelButton = true,
  submitButtonText = 'Thêm xe'
}) => {
  const dispatch = useAppDispatch();
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
  const [brands, setBrands] = useState<string[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  useEffect(() => {
    const getBrands = async () => {
      try {
        const res = await axiosInstance.get(VEHICLE_BRANDS_ENDPOINT);
        const data = res?.data?.data ?? [];
        if (Array.isArray(data)) {
          setBrands(data);
        }
      } catch (err) {
        console.error("Failed to fetch brands", err);
      }
    };
    getBrands();
  }, []);

  const validateForm = () => {
    const v = form.vehicleInfo;
    const errors: Record<string, string> = {};

    if (!v.brand.trim()) errors.brand = 'Bắt buộc';
    if (!v.modelName.trim()) errors.modelName = 'Bắt buộc';
    if (!v.batteryType.trim()) errors.batteryType = 'Bắt buộc';
    if (!v.batteryCapacity.trim()) errors.batteryCapacity = 'Bắt buộc';
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

  const handleSubmit = async () => {
    const errors = validateForm();
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
      await dispatch(createVehicle(normalizedForm)).unwrap();
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã thêm xe thành công' });
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || 'Không thể thêm xe';
      Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

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
                setShowBrandDropdown((prev) => !prev);
              }
            }}
            disabled={!editable}
            activeOpacity={editable ? 0.6 : 1}
          >
            <Text style={[styles.formInput, { color: value ? '#1F2937' : '#9CA3AF' }]}>
              {value || placeholder}
            </Text>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        scrollEnabled={!showBrandDropdown}
      >
      {formError && (
        <View style={styles.formErrorContainer}>
          <Text style={styles.formErrorText}>{formError}</Text>
        </View>
      )}

      {/* Brand Selection */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Hãng xe *</Text>
        <View style={{ position: 'relative' }}>
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
            <View style={styles.inlineDropdownContainer} pointerEvents="box-none">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 300 }}
              >
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

      {/* Model Name */}
      <FormField
        label="Dòng xe *"
        value={form.vehicleInfo.modelName}
        onChange={(text: string) => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, modelName: text }
        }))}
        placeholder="Nhập dòng xe"
        error={fieldErrors.modelName}
        iconName="model-training"
      />

      {/* License Plate */}
      <FormField
        label="Biển số *"
        value={form.vehicleInfo.licensePlate}
        onChange={(text: string) => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, licensePlate: text }
        }))}
        placeholder="VD: 30A-12345"
        error={fieldErrors.licensePlate}
        iconName="badge"
      />

      {/* Color */}
      <FormField
        label="Màu sắc *"
        value={form.vehicleInfo.color}
        onChange={(text: string) => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, color: text }
        }))}
        placeholder="Nhập màu xe"
        error={fieldErrors.color}
        iconName="palette"
      />

      {/* Year */}
      <FormField
        label="Năm sản xuất *"
        value={String(form.vehicleInfo.year)}
        onChange={(text: string) => {
          const numValue = text === '' ? new Date().getFullYear() : parseInt(text) || new Date().getFullYear();
          setForm(prev => ({
            vehicleInfo: { ...prev.vehicleInfo, year: numValue }
          }));
        }}
        placeholder="Nhập năm sản xuất"
        keyboardType="numeric"
        error={fieldErrors.year}
        iconName="event"
        showIncrementDecrement
        onIncrement={() => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, year: Math.min(new Date().getFullYear() + 1, prev.vehicleInfo.year + 1) }
        }))}
        onDecrement={() => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, year: Math.max(1970, prev.vehicleInfo.year - 1) }
        }))}
      />

      {/* Battery Type */}
      <FormField
        label="Loại pin *"
        value={form.vehicleInfo.batteryType}
        onChange={(text: string) => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, batteryType: text }
        }))}
        placeholder="Nhập loại pin"
        error={fieldErrors.batteryType}
        iconName="battery-full"
      />

      {/* Battery Capacity */}
      <FormField
        label="Dung lượng pin (kWh) *"
        value={String(form.vehicleInfo.batteryCapacity)}
        onChange={(text: string) => setForm(prev => ({
          vehicleInfo: { ...prev.vehicleInfo, batteryCapacity: text }
        }))}
        placeholder="Nhập dung lượng pin"
        keyboardType="decimal-pad"
        error={fieldErrors.batteryCapacity}
        iconName="battery-charging-full"
      />

      {/* Action Buttons */}
      <View style={styles.formActions}>
        {showCancelButton && (
          <TouchableOpacity
            style={[styles.formButton, styles.cancelButton]}
            onPress={onCancel}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.formButton, styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{submitButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 100,
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
  inlineDropdownContainer: {
    // Render dropdown as an absolute inline overlay under the selector.
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 999,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
  incrementDecrementButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  formButton: {
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
});

export default VehicleForm;
