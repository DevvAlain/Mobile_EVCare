import dayjs from 'dayjs';

export interface WeeklyOperatingHours {
  monday: { open: string; close: string; isOpen: boolean };
  tuesday: { open: string; close: string; isOpen: boolean };
  wednesday: { open: string; close: string; isOpen: boolean };
  thursday: { open: string; close: string; isOpen: boolean };
  friday: { open: string; close: string; isOpen: boolean };
  saturday: { open: string; close: string; isOpen: boolean };
  sunday: { open: string; close: string; isOpen: boolean };
}

export const isCurrentlyOpen = (operatingHours: WeeklyOperatingHours): boolean => {
  const now = dayjs();
  const currentDay = now.format('dddd').toLowerCase() as keyof WeeklyOperatingHours;
  const currentTime = now.format('HH:mm');
  
  const todayHours = operatingHours[currentDay];
  
  if (!todayHours.isOpen) {
    return false;
  }
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

export const getNextOpeningTime = (operatingHours: WeeklyOperatingHours): string => {
  const now = dayjs();
  const currentDay = now.format('dddd').toLowerCase() as keyof WeeklyOperatingHours;
  const currentTime = now.format('HH:mm');
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = days.indexOf(currentDay);
  
  // Check if open today
  const todayHours = operatingHours[currentDay];
  if (todayHours.isOpen && currentTime < todayHours.open) {
    return `Hôm nay lúc ${todayHours.open}`;
  }
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = days[nextDayIndex] as keyof WeeklyOperatingHours;
    const nextDayHours = operatingHours[nextDay];
    
    if (nextDayHours.isOpen) {
      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      return `${dayNames[nextDayIndex]} lúc ${nextDayHours.open}`;
    }
  }
  
  return 'Không có lịch mở cửa';
};

export const formatOperatingHours = (operatingHours: WeeklyOperatingHours): string => {
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  let result = '';
  
  days.forEach((day, index) => {
    const hours = operatingHours[day as keyof WeeklyOperatingHours];
    if (hours.isOpen) {
      result += `${dayNames[index]}: ${hours.open} - ${hours.close}\n`;
    } else {
      result += `${dayNames[index]}: Đóng cửa\n`;
    }
  });
  
  return result.trim();
};