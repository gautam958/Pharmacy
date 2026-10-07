export interface Medicine {
  id: number;
  fullName: string;
  brand: string;
  expiryDate: string;
  quantity: number;
  price: number;
  isExpiringSoon: boolean;
  isLowStock: boolean;
  isExpired: boolean;
}

export interface MedicineDetails {
  id: number;
  fullName: string;
  brand: string;
  notes: string | null;
  expiryDate: string;
  quantity: number;
  price: number;
}

export interface AddMedicine {
  fullName: string;
  brand: string;
  notes: string | null;
  expiryDate: string;
  quantity: number;
  price: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
