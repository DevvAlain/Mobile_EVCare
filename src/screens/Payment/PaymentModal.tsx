import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
// QR code generation
import QRCode from 'react-native-qrcode-svg';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { cancelPayOSPayment, getPaymentStatus, pollPaymentStatus, clearCurrentPayment } from '../../service/slices/paymentSlice.ts/paymentSlice';
import { formatPaymentAmount } from '../../utils/paymentUtils';

const { width, height } = Dimensions.get('window');

interface PaymentModalProps {
  visible: boolean;
  onCancel: () => void;
  paymentData: {
    paymentId: string;
    orderCode: number;
    paymentLink: string;
    qrCode: string;
    checkoutUrl: string;
    amount: number;
    expiresAt: string;
  };
  description: string;
  onPaymentSuccess?: (paymentData: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onCancel,
  paymentData: initialPaymentData,
  description,
  onPaymentSuccess
}) => {
  const dispatch = useAppDispatch();
  const { currentPayment } = useAppSelector((state: any) => state.payment);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [qrImageError, setQrImageError] = useState<boolean>(false);
  const [qrImageLoaded, setQrImageLoaded] = useState<boolean>(false);
  const qrTimeoutRef = React.useRef<any>(null);
  const [paymentSuccessHandled, setPaymentSuccessHandled] = useState(false);

  useEffect(() => {
    if (visible && initialPaymentData) {
      const expiresAt = new Date(initialPaymentData.expiresAt);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();

      if (diffMs > 0) {
        setTimeLeft(Math.floor(diffMs / 1000));

        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        setTimeLeft(0);
      }
    }
  }, [visible, initialPaymentData]);

  useEffect(() => {
    if (visible && initialPaymentData?.paymentId) {
      setPaymentSuccessHandled(false);
      dispatch(getPaymentStatus(initialPaymentData.paymentId));
    } else if (!visible) {
      dispatch(clearCurrentPayment());
    }
  }, [visible, initialPaymentData?.paymentId, dispatch]);

  useEffect(() => {
    if (!visible || !initialPaymentData?.paymentId) return;

    if ((!currentPayment || (currentPayment.status === 'pending' && !currentPayment.isExpired)) && !paymentSuccessHandled) {
      const interval = setInterval(() => {
        dispatch(pollPaymentStatus(initialPaymentData.paymentId));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [visible, initialPaymentData?.paymentId, currentPayment?.status, currentPayment?.isExpired, paymentSuccessHandled, dispatch]);

  useEffect(() => {
    if (currentPayment?.status === 'paid' && onPaymentSuccess && !paymentSuccessHandled) {
      setPaymentSuccessHandled(true);
      onPaymentSuccess(currentPayment);
    }
  }, [currentPayment?.status, onPaymentSuccess, paymentSuccessHandled]);

  const handleCopyLink = async () => {
    if (initialPaymentData?.checkoutUrl) {
      try {
        // In React Native, we can't use navigator.clipboard
        // Instead, we'll show an alert with the link
        Alert.alert(
          'Link thanh toán',
          initialPaymentData.checkoutUrl,
          [
            { text: 'Đóng', style: 'cancel' },
            { text: 'Sao chép', onPress: () => setCopied(true) }
          ]
        );
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể sao chép link');
      }
    }
  };

  const handleOpenPayment = () => {
    if (initialPaymentData?.checkoutUrl) {
      Linking.openURL(initialPaymentData.checkoutUrl);
    }
  };

  const handleCancelPayment = async () => {
    if (initialPaymentData?.orderCode) {
      try {
        await dispatch(cancelPayOSPayment(initialPaymentData.orderCode.toString())).unwrap();
        Alert.alert('Thành công', 'Đã hủy thanh toán');
        onCancel();
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể hủy thanh toán');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderPaymentContent = () => {
    if (currentPayment) {
      if (currentPayment.status === 'paid') {
        return (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Thanh toán thành công!</Text>
            <Text style={styles.successMessage}>Đặt lịch của bạn đã được xác nhận</Text>
            <TouchableOpacity style={styles.successButton} onPress={onCancel}>
              <Text style={styles.successButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (currentPayment.status === 'failed' || currentPayment.status === 'cancelled' || currentPayment.status === 'expired') {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>✗</Text>
            <Text style={styles.errorTitle}>Thanh toán thất bại</Text>
            <Text style={styles.errorMessage}>
              {currentPayment.status === 'failed' && 'Thanh toán thất bại do lỗi kỹ thuật'}
              {currentPayment.status === 'cancelled' && 'Thanh toán đã bị hủy'}
              {currentPayment.status === 'expired' && 'Link thanh toán đã hết hạn'}
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={onCancel}>
              <Text style={styles.errorButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    return (
      <ScrollView style={styles.paymentContent}>
        {/* Payment Info */}
        <View style={styles.paymentInfoCard}>
          <View style={styles.paymentInfoHeader}>
            <Text style={styles.paymentInfoTitle}>Thông tin thanh toán</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Số tiền</Text>
              <Text style={styles.amountValue}>
                {initialPaymentData?.amount ? formatPaymentAmount(initialPaymentData.amount) : '0'} VND
              </Text>
            </View>
          </View>
          <Text style={styles.paymentDescription}>{description}</Text>
        </View>

        {/* Timer */}
        {timeLeft > 0 && (
          <View style={styles.timerAlert}>
            <Text style={styles.timerIcon}>⏰</Text>
            <Text style={styles.timerText}>
              Link thanh toán hết hạn sau: {formatTime(timeLeft)}
            </Text>
          </View>
        )}

        {timeLeft === 0 && (
          <View style={styles.expiredAlert}>
            <Text style={styles.expiredIcon}>⚠️</Text>
            <Text style={styles.expiredText}>Link thanh toán đã hết hạn</Text>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentMethodsTitle}>Phương thức thanh toán</Text>

          {/* QR Code */}
          {initialPaymentData?.qrCode && (
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Quét mã QR</Text>
              <View style={styles.qrContainer}>
                {/* Decide how to render QR: if value looks like a URI (data: or http) try Image; else show raw payload */}
                {(() => {
                  const val = initialPaymentData.qrCode;
                  const isDataUri = typeof val === 'string' && val.startsWith('data:');
                  const isHttpUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));

                  if ((isDataUri || isHttpUrl) && !qrImageLoaded && !qrImageError && !qrTimeoutRef.current) {
                    qrTimeoutRef.current = setTimeout(() => {
                      console.warn('QR image load timed out, falling back to raw payload');
                      setQrImageError(true);
                      qrTimeoutRef.current = null;
                    }, 1200);
                  }

                  if ((isDataUri || isHttpUrl) && !qrImageError) {
                    return (
                      <Image
                        source={{ uri: val }}
                        style={styles.qrImage}
                        resizeMode="contain"
                        onError={(e) => {
                          console.warn('QR image load error:', e.nativeEvent?.error);
                          setQrImageError(true);
                          if (qrTimeoutRef.current) {
                            clearTimeout(qrTimeoutRef.current);
                            qrTimeoutRef.current = null;
                          }
                        }}
                        onLoad={() => {
                          setQrImageLoaded(true);
                          setQrImageError(false);
                          if (qrTimeoutRef.current) {
                            clearTimeout(qrTimeoutRef.current);
                            qrTimeoutRef.current = null;
                          }
                        }}
                      />
                    );
                  }

                  // If value is not a URI (likely payload string), generate QR client-side like web does
                  if (!isDataUri && !isHttpUrl) {
                    try {
                      return (
                        <View style={{ alignItems: 'center' }}>
                          <QRCode value={String(val)} size={130} />
                        </View>
                      );
                    } catch (err) {
                      console.warn('QRCode generation failed:', err);
                      // Fallthrough to show raw payload
                    }
                  }

                  // Final fallback: show raw payload and option to open/copy
                  return (
                    <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
                      <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled>
                        <Text selectable style={styles.qrText}>{String(val)}</Text>
                      </ScrollView>
                      <TouchableOpacity
                        style={[styles.copyButton, { marginTop: 8 }]}
                        onPress={async () => {
                          try {
                            if (isHttpUrl) {
                              Linking.openURL(val);
                            } else {
                              Alert.alert('QR payload', String(val), [{ text: 'Đóng' }]);
                            }
                          } catch (err) {
                            Alert.alert('Lỗi', 'Không thể sao chép');
                          }
                        }}
                      >
                        <Text style={styles.copyButtonText}>Mở/Sao chép QR</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
              <Text style={styles.qrDescription}>
                Sử dụng ứng dụng ngân hàng để quét mã QR
              </Text>
            </View>
          )}

          {/* Payment Link */}
          <View style={styles.paymentLinkCard}>
            <Text style={styles.paymentLinkTitle}>Thanh toán online</Text>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handleOpenPayment}
            >
              <Text style={styles.paymentButtonText}>Mở trang thanh toán</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copiedButton]}
              onPress={handleCopyLink}
            >
              <Text style={[styles.copyButtonText, copied && styles.copiedButtonText]}>
                {copied ? 'Đã sao chép' : 'Sao chép link'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.paymentLinkDescription}>
              Click để mở trang thanh toán PayOS
            </Text>
          </View>

          {/* Mobile App */}
          <View style={styles.mobileAppCard}>
            <Text style={styles.mobileAppTitle}>📱 Ứng dụng di động</Text>
            {initialPaymentData?.paymentLink && (
              <TouchableOpacity
                style={styles.mobileAppButton}
                onPress={() => Linking.openURL(initialPaymentData.paymentLink)}
              >
                <Text style={styles.mobileAppButtonText}>Mở trong app ngân hàng</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• Chọn một trong các phương thức thanh toán trên</Text>
            <Text style={styles.instructionItem}>• Thanh toán bằng thẻ ngân hàng hoặc ví điện tử</Text>
            <Text style={styles.instructionItem}>• Sau khi thanh toán thành công, lịch hẹn sẽ được xác nhận tự động</Text>
            <Text style={styles.instructionItem}>• Bạn sẽ nhận được email xác nhận trong vòng 5 phút</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💳 Thanh toán đặt lịch</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {renderPaymentContent()}

          {(!currentPayment || (currentPayment.status !== 'paid' && currentPayment.status !== 'failed' && currentPayment.status !== 'cancelled' && currentPayment.status !== 'expired')) && (
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPayment}>
                <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeModalButton} onPress={onCancel}>
                <Text style={styles.closeModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: width * 0.95,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  paymentContent: {
    maxHeight: height * 0.6,
  },
  paymentInfoCard: {
    backgroundColor: '#e6f7ff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  paymentInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#1890ff',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#1890ff',
  },
  timerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7e6',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffd591',
  },
  timerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#d46b08',
  },
  expiredAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f0',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  expiredIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  expiredText: {
    fontSize: 14,
    color: '#cf1322',
  },
  paymentMethods: {
    padding: 16,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  qrCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  qrContainer: {
    width: 150,
    height: 150,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  qrImage: {
    width: 130,
    height: 130,
  },
  qrPlaceholder: {
    fontSize: 12,
    color: '#666',
  },
  qrText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  qrDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  paymentLinkCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  paymentLinkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  copiedButton: {
    backgroundColor: '#52c41a',
  },
  copyButtonText: {
    color: '#666',
    fontSize: 12,
  },
  copiedButtonText: {
    color: 'white',
  },
  paymentLinkDescription: {
    fontSize: 12,
    color: '#666',
  },
  mobileAppCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  mobileAppTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mobileAppButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  mobileAppButtonText: {
    color: '#666',
    fontSize: 14,
  },
  instructionsCard: {
    backgroundColor: '#fafafa',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsList: {
    gap: 4,
  },
  instructionItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  successContainer: {
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    fontSize: 48,
    color: '#52c41a',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    color: '#ff4d4f',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default PaymentModal;