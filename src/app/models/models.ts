export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  imagePath: string | null;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;         // kept for compatibility — equals originalPrice
  costPrice?: number;
  stock: number;
  reorderLevel?: number;
  imageUrl: string;
  extraImages: string[];
  barcode: string;
  sku?: string;
  status?: string;       // ACTIVE | INACTIVE | DISCONTINUED
  supplier?: string;
  createdAt: string;
  // Discount fields (from PricedProductResponse)
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountLabel: string;
  discountType?: string;
  discountValue?: number;
}

export interface ProductVariantSize {
  id: number;
  size: string;  // M | L | XL | XXL
  stock: number;
  barcode?: string;
}

export interface ProductVariant {
  id: number;
  colorName: string;
  colorHex: string;
  imageUrl: string | null;
  sizes: ProductVariantSize[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface OrderRequest {
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
}

export interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  paymentStatus: string;  // PENDING | PAID | FAILED | COD
  fulfillmentStatus: string;  // PENDING | CONFIRMED | PACKED | SHIPPED | DELIVERED
  razorpayOrderId: string;
  createdAt: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export interface BillingRequest {
  customerName: string;
  phone: string;
  paymentMode: string;
  sendWhatsApp: boolean;
  discountType?: string;   // NONE | PERCENTAGE | FIXED
  discountValue?: number;
  items: OrderItem[];
}

export interface Billing {
  id: number;
  customerName: string;
  phone: string;
  totalAmount: number;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;       // post-discount, pre-GST subtotal
  gstPercentage: number;     // 0 if GST disabled
  gstAmount: number;
  grandTotal: number;        // finalAmount + gstAmount (what customer pays)
  paymentMode: string;
  status: string;   // ACTIVE | RETURNED | PARTIALLY_RETURNED
  createdAt: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentResponse {
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
  mock: boolean;
}

export interface ProductSales {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  quantitySold: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardSummary {
  currentMonthRevenue: number;
  totalOrders: number;
  totalProductsSold: number;
  lowStockCount: number;
  topProducts: ProductSales[];
  categorySales: CategorySales[];
  dailySales: DailySales[];
}

export interface MonthlyReport {
  month: string;
  totalSales: number;
  totalOrders: number;
  totalProductsSold: number;
  topProducts: ProductSales[];
  lowProducts: ProductSales[];
}

// ── Discount / Offers ──────────────────────────────────────────────────────

export interface Offer {
  id: number;
  offerName: string;
  offerScope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  categoryName: string | null;
  productId: number | null;
  startDate: string;   // yyyy-MM-dd
  endDate: string;
  active: boolean;
  currentlyActive: boolean;
  createdAt: string;
}

export interface OfferRequest {
  offerName: string;
  offerScope: string;
  discountType: string;
  discountValue: number;
  categoryName: string | null;
  productId: number | null;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface ProductDiscountRequest {
  productIds: number[];
  discountType: string;
  discountValue: number;
}

export interface CategoryDiscountRequest {
  categoryName: string;
  discountType: string;
  discountValue: number;
}

// ── Returns & Exchanges ────────────────────────────────────────────────────

export interface ReturnItemRequest {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface ReturnRequest {
  billId: number;
  returnType: 'FULL' | 'PARTIAL';
  returnReason: string;
  refundMethod: 'CASH' | 'STORE_CREDIT';
  processedBy: string;
  itemsToReturn: ReturnItemRequest[];
}

export interface ReturnRecord {
  id: number;
  billId: number;
  customerName: string;
  customerPhone: string;
  returnType: string;
  returnReason: string;
  returnDate: string;
  refundAmount: number;
  refundMethod: string;
  processedBy: string;
  items: ReturnItemRequest[];
}

export interface ExchangeRequest {
  oldBillId: number;
  oldProductId: number;
  oldQuantity: number;
  newProductId: number;
  newQuantity: number;
  refundMethod: 'CASH' | 'STORE_CREDIT';
  exchangeReason: string;
  processedBy: string;
}

export interface ExchangeRecord {
  id: number;
  oldBillId: number;
  oldProductId: number;
  oldProductName: string;
  oldQuantity: number;
  oldPrice: number;
  newProductId: number;
  newProductName: string;
  newQuantity: number;
  newPrice: number;
  priceDifference: number;
  refundMethod: string;
  customerName: string;
  customerPhone: string;
  exchangeReason: string;
  processedBy: string;
  exchangeDate: string;
}

export interface ReturnExchangeMonthlyStats {
  totalReturns: number;
  totalExchanges: number;
  totalRefunds: number;
  returns: ReturnRecord[];
  exchanges: ExchangeRecord[];
}

// ── Inventory ──────────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface StockAdjustment {
  id: number;
  productId: number;
  productName: string;
  productBarcode: string;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId: number | null;
  note: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface InventoryProductRequest {
  id?: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  costPrice?: number;
  stock?: number;
  reorderLevel?: number;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
  status?: string;
  supplier?: string;
  extraImages?: string[];
  discountType?: string;
  discountValue?: number;
}

export interface StockAdjustRequest {
  productId: number;
  quantityDelta: number;
  reason: string;
  note?: string;
  adjustedBy?: string;
}

export interface BulkStatusRequest {
  productIds: number[];
  status: string;
}

export interface InventorySummary {
  totalActiveProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalInventoryValue: number;
  totalCostValue: number;
  categoryCount: number;
  categories: string[];
}

export interface ImportResult {
  created: number;
  updated: number;
  errorCount: number;
  errors: string[];
}

// ── Admin Users ────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  username: string;
  role: string;   // ADMIN | BILLING
}

// ── App Settings / GST ─────────────────────────────────────────────────────

export interface AppSettings {
  id: number;
  gstEnabled: boolean;
  gstPercentage: number;  // 0 | 1 | 2 | 3 | 5 | 12 | 18
}

// ── Reviews & Ratings ──────────────────────────────────────────────────────

export interface Review {
  id: number;
  productId: number;
  customerName: string;
  mobileNumber: string;
  rating: number;          // 1–5
  reviewComment: string;
  status: string;          // PENDING | APPROVED | REJECTED
  adminReply: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewStats {
  totalReviews: number;
  pendingReviews: number;
  averageRating: number;
}

export interface ReviewRequest {
  productId: number;
  customerName: string;
  mobileNumber?: string;
  rating: number;
  reviewComment: string;
}
