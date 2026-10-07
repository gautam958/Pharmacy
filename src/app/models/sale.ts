export interface Sale {
  id: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  soldOn: string;
}
