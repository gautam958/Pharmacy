export interface Sale {
  id: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  soldOn: string;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  salesToday: number;
  revenueToday: number;
}
