import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: string | Date, pattern: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
};

export const formatDateCN = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'M月d日', { locale: zhCN });
};

export const daysRemaining = (purchaseDate: string, shelfLife: number): number => {
  const purchased = new Date(purchaseDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  purchased.setHours(0, 0, 0, 0);
  const daysPassed = differenceInDays(today, purchased);
  return shelfLife - daysPassed;
};

export const isThisMonth = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  return isWithinInterval(date, { start, end });
};

export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM');
};

export const getCurrentMonthCN = (): string => {
  return format(new Date(), 'yyyy年M月', { locale: zhCN });
};
