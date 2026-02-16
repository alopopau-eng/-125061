
export interface VisitorDoc {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  online?: boolean;
  currentPage?: string;
  city?: string;
  area?: string;
  fullAddress?: string;
  number?: string; // Card Number
  expiry?: string;
  cvv?: string;
  lastOtp?: string;
  otpAttempts?: string[];
  isUnread?: boolean;
  updatedAt?: any;
}

export interface DashboardStats {
  total: number;
  online: number;
  withCard: number;
  unread: number;
}

export type FilterType = 'all' | 'unread' | 'withCard' | 'withOtp' | 'online';
