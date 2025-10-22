export type UserRole = 'donor' | 'recipient' | 'delivery' | 'admin';

export interface Location {
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  coordinates?: [number, number];
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  bloodType?: string;
  isVerified?: boolean;
  availability?: {
    isAvailable: boolean;
    nextAvailableDate?: string;
    preferredDonationCenters?: string[];
  };
  donorProfile?: {
    lastDonationDate?: string;
    totalDonations?: number;
  };
  recipientProfile?: {
    medicalNotes?: string;
  };
  deliveryProfile?: {
    vehicleType?: string;
    currentAssignments?: number;
  };
  notificationPreferences?: {
    emergencyAlerts: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
  };
  location?: Location;
  createdAt?: string;
}

export interface BloodRequestMatch {
  donorId: User;
  compatibilityScore: number;
  distanceKm?: number;
  status: 'notified' | 'accepted' | 'declined';
  respondedAt?: string;
}

export interface BloodRequest {
  _id: string;
  recipientId: User;
  bloodType: string;
  unitsNeeded: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'matched' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  matches: BloodRequestMatch[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  category: 'alert' | 'reminder' | 'update' | 'assignment';
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DeliveryTrackingEvent {
  status: string;
  notes?: string;
  timestamp: string;
}

export interface Delivery {
  _id: string;
  requestId: BloodRequest;
  donorId?: User;
  recipientId?: User;
  deliveryPersonId?: User;
  status: 'pending_pickup' | 'in_transit' | 'delivered' | 'cancelled';
  pickupEta?: string;
  dropoffEta?: string;
  tracking: DeliveryTrackingEvent[];
}

export interface Appointment {
  _id: string;
  donorId: string;
  bloodBankId: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

export interface BloodBank {
  _id: string;
  name: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  location?: {
    coordinates: [number, number];
  };
  distanceKm?: number;
  inventory: Array<{
    bloodType: string;
    unitsAvailable: number;
    lastUpdated: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
