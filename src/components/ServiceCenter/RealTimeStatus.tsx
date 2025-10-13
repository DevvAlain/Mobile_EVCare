import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { isCurrentlyOpen, getNextOpeningTime, WeeklyOperatingHours } from '../../utils/timeUtils';

interface RealTimeStatusProps {
  operatingHours: WeeklyOperatingHours;
  showNextOpening?: boolean;
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  operatingHours,
  showNextOpening = false
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [nextOpening, setNextOpening] = useState<string | null>(null);

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkStatus = () => {
      // Check if operatingHours is valid before processing
      if (!operatingHours) {
        setIsOpen(false);
        setNextOpening(null);
        return;
      }

      const currentlyOpen = isCurrentlyOpen(operatingHours);
      const nextOpeningTime = getNextOpeningTime(operatingHours);

      setIsOpen(currentlyOpen);
      setNextOpening(nextOpeningTime);
    };

    checkStatus();
  }, [operatingHours, currentTime]);

  return (
    <View style={styles.container}>
      <Icon name="time-outline" size={16} color="#f97316" />
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: isOpen ? '#10B981' : '#EF4444' }]}>
          {isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'}
        </Text>
        {showNextOpening && !isOpen && nextOpening && (
          <Text style={styles.nextOpeningText}>
            Mở cửa {nextOpening}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextOpeningText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default RealTimeStatus;
