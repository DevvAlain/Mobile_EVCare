import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaymentStatus as PaymentStatusType } from '../../types/payment';

interface PaymentStatusProps {
  status: PaymentStatusType;
  showIcon?: boolean;
  showProgress?: boolean;
  style?: any;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  showIcon = true,
  showProgress = false,
  style
}) => {
  const getStatusIcon = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'pending':
        return '⏰';
      case 'cancelled':
      case 'failed':
        return '✗';
      case 'expired':
        return '⚠️';
      case 'refunded':
        return '↻';
      default:
        return '💳';
    }
  };

  const getProgressPercent = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid':
        return 100;
      case 'pending':
        return 50;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return 0;
      case 'refunded':
        return 75;
      default:
        return 0;
    }
  };

  const getStatusText = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'failed':
        return 'Thất bại';
      case 'cancelled':
        return 'Đã hủy';
      case 'expired':
        return 'Hết hạn';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid':
        return '#52c41a';
      case 'pending':
        return '#faad14';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return '#ff4d4f';
      case 'refunded':
        return '#1890ff';
      default:
        return '#666';
    }
  };

  const getBackgroundColor = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid':
        return '#f6ffed';
      case 'pending':
        return '#fffbe6';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return '#fff2f0';
      case 'refunded':
        return '#e6f7ff';
      default:
        return '#f5f5f5';
    }
  };

  const getBorderColor = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid':
        return '#b7eb8f';
      case 'pending':
        return '#ffe58f';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return '#ffccc7';
      case 'refunded':
        return '#91d5ff';
      default:
        return '#d9d9d9';
    }
  };

  const color = getStatusColor(status);
  const backgroundColor = getBackgroundColor(status);
  const borderColor = getBorderColor(status);
  const text = getStatusText(status);
  const icon = getStatusIcon(status);
  const progress = getProgressPercent(status);

  return (
    <View style={[styles.container, { backgroundColor, borderColor }, style]}>
      <View style={styles.content}>
        {showIcon && (
          <Text style={[styles.icon, { color }]}>{icon}</Text>
        )}
        <Text style={[styles.text, { color }]}>{text}</Text>
      </View>
      
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: color
                }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default PaymentStatus;
