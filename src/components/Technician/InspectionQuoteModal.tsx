import React, { useState, useEffect } from 'react';
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
import { submitInspectionQuote, getProgressByAppointment } from '../../service/technician/workProgressSlice';
import { fetchBookingDetails } from '../../service/slices/bookingSlice';
import { fetchParts } from '../../service/parts/partsSlice';
import Toast from 'react-native-toast-message';

interface QuoteItem {
    partId?: string;
    name?: string;
    unitPrice?: number;
    quantity?: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    progressId: string;
    onSuccess?: () => void;
}

const InspectionQuoteModal: React.FC<Props> = ({
    visible,
    onClose,
    progressId,
    onSuccess,
}) => {
    const dispatch = useAppDispatch();
    const { parts, loading: partsLoading } = useAppSelector((state) => state.parts);
    const { loading } = useAppSelector((state) => state.workProgress);

    const [vehicleCondition, setVehicleCondition] = useState('');
    const [diagnosisDetails, setDiagnosisDetails] = useState('');
    const [inspectionNotes, setInspectionNotes] = useState('');
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (visible && parts.length === 0) {
            dispatch(fetchParts(undefined));
        }
    }, [visible, dispatch, parts.length]);

    const categories = React.useMemo(() => {
        const set = new Set<string>();
        parts.forEach((p) => {
            if (p?.category) set.add(p.category);
        });
        return Array.from(set).sort();
    }, [parts]);

    const filteredParts = React.useMemo(() => {
        if (!selectedCategory) return parts;
        return parts.filter((p) => p.category === selectedCategory);
    }, [parts, selectedCategory]);

    const totalAmount = React.useMemo(() => {
        return quoteItems.reduce((sum, it) => {
            const q = Number(it?.quantity || 0);
            const p = Number(it?.unitPrice || 0);
            if (!q || !p) return sum;
            return sum + q * p;
        }, 0);
    }, [quoteItems]);

    const handleSelectPart = (itemIndex: number, partId: string) => {
        const part = parts.find((p) => p._id === partId);
        const newItems = [...quoteItems];
        newItems[itemIndex] = {
            ...newItems[itemIndex],
            partId,
            name: newItems[itemIndex]?.name || part?.partName || '',
            unitPrice: newItems[itemIndex]?.unitPrice || part?.unitPrice || 0,
            quantity: newItems[itemIndex]?.quantity || 1,
        };
        setQuoteItems(newItems);
    };

    const handleAddItem = () => {
        setQuoteItems([...quoteItems, { quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setQuoteItems(quoteItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validation với error messages rõ ràng
        if (!vehicleCondition || !vehicleCondition.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập tình trạng xe'
            });
            return;
        }

        if (!diagnosisDetails || !diagnosisDetails.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập chẩn đoán'
            });
            return;
        }

        // Validate quote items
        const validItems = quoteItems.filter((it) => !!it?.partId);
        if (validItems.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng thêm ít nhất một linh kiện'
            });
            return;
        }

        // Validate each item
        for (let i = 0; i < validItems.length; i++) {
            const item = validItems[i];
            if (!item.partId) {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: `Vui lòng chọn linh kiện cho mục ${i + 1}`
                });
                return;
            }
            if (!item.quantity || item.quantity <= 0) {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: `Số lượng phải lớn hơn 0 cho mục ${i + 1}`
                });
                return;
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: `Đơn giá phải lớn hơn 0 cho mục ${i + 1}`
                });
                return;
            }
        }

        try {
            // Build payload giống web
            const items = validItems
                .filter((it) => !!it?.partId)  // Lọc lại một lần nữa để đảm bảo
                .map((it) => ({
                    partId: it.partId as string,
                    quantity: Number(it?.quantity || 0),
                    unitPrice: Number(it?.unitPrice || 0),
                    name: it?.name,
                }));

            const payloadToSend = {
                vehicleCondition: vehicleCondition.trim(),
                diagnosisDetails: diagnosisDetails.trim(),
                inspectionNotes: inspectionNotes.trim(),
                quoteDetails: { items },
            };

            const result = await dispatch(
                submitInspectionQuote({ progressId, payload: payloadToSend })
            ).unwrap();

            if (result?.success) {
                Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã gửi báo giá' });

                const apptId =
                    typeof result?.data?.appointmentId === 'string'
                        ? result.data.appointmentId
                        : result?.data?.appointmentId?._id;

                if (apptId) {
                    await dispatch(getProgressByAppointment(apptId));
                    // Also refresh booking details in booking slice (helps local UI / debugging)
                    try {
                        await dispatch(fetchBookingDetails(apptId));
                    } catch (e) {
                        // ignore fetch booking details errors
                    }
                }

                // Reset form
                setVehicleCondition('');
                setDiagnosisDetails('');
                setInspectionNotes('');
                setQuoteItems([]);

                onClose();
                if (onSuccess) onSuccess();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: result?.message || 'Gửi báo giá thất bại'
                });
            }
        } catch (error: any) {
            console.error('Error submitting inspection quote:', error);
            const errorMessage = error?.message ||
                error?.response?.data?.message ||
                'Gửi báo giá thất bại. Vui lòng thử lại.';
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: errorMessage
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Inspection & Quote</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>Đóng</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tình trạng xe *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                !vehicleCondition?.trim() && styles.inputError,
                            ]}
                            placeholder="Ví dụ: Ắc quy yếu, đèn báo động cơ..."
                            value={vehicleCondition}
                            onChangeText={setVehicleCondition}
                            multiline
                            numberOfLines={2}
                        />
                        {!vehicleCondition?.trim() && (
                            <Text style={styles.errorText}>Vui lòng nhập tình trạng xe</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Chẩn đoán *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                !diagnosisDetails?.trim() && styles.inputError,
                            ]}
                            placeholder="Chi tiết chẩn đoán"
                            value={diagnosisDetails}
                            onChangeText={setDiagnosisDetails}
                            multiline
                            numberOfLines={3}
                        />
                        {!diagnosisDetails?.trim() && (
                            <Text style={styles.errorText}>Vui lòng nhập chẩn đoán</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ghi chú kiểm tra</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Ghi chú"
                            value={inspectionNotes}
                            onChangeText={setInspectionNotes}
                            multiline
                            numberOfLines={2}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.label}>Hạng mục linh kiện</Text>
                            <View style={styles.categorySelector}>
                                <Text style={styles.categoryLabel}>Danh mục:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <TouchableOpacity
                                        style={[
                                            styles.categoryChip,
                                            !selectedCategory && styles.categoryChipActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedCategory(undefined);
                                            dispatch(fetchParts(undefined));
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryChipText,
                                                !selectedCategory && styles.categoryChipTextActive,
                                            ]}
                                        >
                                            Tất cả
                                        </Text>
                                    </TouchableOpacity>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryChip,
                                                selectedCategory === cat && styles.categoryChipActive,
                                            ]}
                                            onPress={() => {
                                                setSelectedCategory(cat);
                                                dispatch(fetchParts(cat));
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryChipText,
                                                    selectedCategory === cat &&
                                                    styles.categoryChipTextActive,
                                                ]}
                                            >
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        {quoteItems.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                                <View style={styles.itemRow}>
                                    <View style={styles.itemField}>
                                        <Text style={styles.itemLabel}>Linh kiện *</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.partsScrollView}
                                        >
                                            {filteredParts.map((part) => (
                                                <TouchableOpacity
                                                    key={part._id}
                                                    style={[
                                                        styles.partChip,
                                                        item.partId === part._id && styles.partChipActive,
                                                    ]}
                                                    onPress={() => handleSelectPart(index, part._id)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.partChipText,
                                                            item.partId === part._id &&
                                                            styles.partChipTextActive,
                                                        ]}
                                                    >
                                                        {part.partName} ({part.partNumber})
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>

                                <View style={styles.itemRow}>
                                    <View style={[styles.itemField, styles.itemFieldHalf]}>
                                        <Text style={styles.itemLabel}>Tên hiển thị</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ví dụ: Dầu, Lọc dầu"
                                            value={item.name || ''}
                                            onChangeText={(text) => {
                                                const newItems = [...quoteItems];
                                                newItems[index] = { ...newItems[index], name: text };
                                                setQuoteItems(newItems);
                                            }}
                                        />
                                    </View>
                                    <View style={[styles.itemField, styles.itemFieldHalf]}>
                                        <Text style={styles.itemLabel}>Số lượng *</Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                item.quantity !== undefined && item.quantity <= 0 && styles.inputError,
                                            ]}
                                            placeholder="1"
                                            value={item.quantity !== undefined ? String(item.quantity) : ''}
                                            onChangeText={(text) => {
                                                const numValue = text === '' ? undefined : Number(text);
                                                const newItems = [...quoteItems];
                                                newItems[index] = {
                                                    ...newItems[index],
                                                    quantity: numValue !== undefined && !Number.isNaN(numValue) ? numValue : undefined,
                                                };
                                                setQuoteItems(newItems);
                                            }}
                                            keyboardType="numeric"
                                        />
                                        {item.quantity !== undefined && item.quantity <= 0 && (
                                            <Text style={styles.errorText}>Số lượng phải lớn hơn 0</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.itemField}>
                                    <Text style={styles.itemLabel}>Đơn giá (VND) *</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            item.unitPrice !== undefined && item.unitPrice <= 0 && styles.inputError,
                                        ]}
                                        placeholder="0"
                                        value={item.unitPrice !== undefined ? String(item.unitPrice) : ''}
                                        onChangeText={(text) => {
                                            const numValue = text === '' ? undefined : Number(text);
                                            const newItems = [...quoteItems];
                                            newItems[index] = {
                                                ...newItems[index],
                                                unitPrice: numValue !== undefined && !Number.isNaN(numValue) ? numValue : undefined,
                                            };
                                            setQuoteItems(newItems);
                                        }}
                                        keyboardType="numeric"
                                    />
                                    {item.unitPrice !== undefined && item.unitPrice <= 0 && (
                                        <Text style={styles.errorText}>Đơn giá phải lớn hơn 0</Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleRemoveItem(index)}
                                    style={styles.removeItemButton}
                                >
                                    <Text style={styles.removeItemButtonText}>Xóa mục</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity onPress={handleAddItem} style={styles.addItemButton}>
                            <Text style={styles.addItemButtonText}>Thêm linh kiện</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={styles.totalPreview}>
                    <Text style={styles.totalLabel}>Tổng báo giá:</Text>
                    <Text style={styles.totalValue}>{totalAmount.toLocaleString()} VND</Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.submitButton,
                            loading && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Gửi báo giá</Text>
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
        minHeight: 60,
        textAlignVertical: 'top',
    },
    sectionHeader: {
        marginBottom: 12,
    },
    categorySelector: {
        marginTop: 8,
    },
    categoryLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#1677ff',
    },
    categoryChipText: {
        fontSize: 12,
        color: '#666',
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    itemRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    itemField: {
        flex: 1,
    },
    itemFieldHalf: {
        flex: 0.5,
    },
    itemLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    partsScrollView: {
        maxHeight: 120,
    },
    partChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        marginBottom: 8,
    },
    partChipActive: {
        backgroundColor: '#1677ff',
    },
    partChipText: {
        fontSize: 11,
        color: '#666',
    },
    partChipTextActive: {
        color: '#fff',
    },
    removeItemButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    removeItemButtonText: {
        color: '#ff4d4f',
        fontSize: 12,
    },
    addItemButton: {
        backgroundColor: '#1677ff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    addItemButtonText: {
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
    submitButtonDisabled: {
        backgroundColor: '#d9d9d9',
        opacity: 0.6,
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
    totalPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '700',
    },
});

export default InspectionQuoteModal;

