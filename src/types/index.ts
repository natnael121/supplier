// Core Supplier Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position?: string;
  };
  businessInfo: {
    registrationNumber?: string;
    taxId?: string;
    website?: string;
    description?: string;
    logo?: string;
  };
  isActive: boolean;
  created_at: string;
  updated_at: string;
  
  // Analytics
  totalOrders?: number;
  totalRevenue?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
  
  // Payment terms
  paymentTerms: {
    method: 'cash' | 'bank_transfer' | 'check' | 'credit';
    daysNet: number;
    discountPercent?: number;
    discountDays?: number;
  };
  
  // Delivery information
  deliveryInfo: {
    minimumOrder?: number;
    deliveryFee?: number;
    freeDeliveryThreshold?: number;
    estimatedDeliveryDays: number;
    deliveryAreas: string[];
  };
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  sku?: string;
  barcode?: string;
  
  // Pricing
  unitPrice: number;
  currency: string;
  unit: string;
  minimumOrderQuantity: number;
  
  // Availability
  isAvailable: boolean;
  stockQuantity?: number;
  leadTimeDays?: number;
  
  // Product details
  brand?: string;
  specifications?: Record<string, string>;
  images?: string[];
  
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  supplierId: string;
  
  // Order details
  items: Array<{
    productId: string;
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    total: number;
    notes?: string;
  }>;
  
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  
  // Status tracking
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'invoiced' | 'paid';
  
  // Dates
  orderDate: string;
  requestedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  actualDeliveryDate?: string;
  
  // Additional info
  notes?: string;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    instructions?: string;
  };
  
  // Payment tracking
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentDueDate?: string;
  paymentMethod?: string;
  
  created_at: string;
  updated_at: string;
  createdBy: string;
}

export interface RestaurantCustomer {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  averageOrderValue: number;
  status: 'active' | 'inactive';
  
  // Connection to main system
  mainSystemUserId: string;
  connectionDate: string;
}

export interface Invoice {
  id: string;
  purchaseOrderId: string;
  restaurantId: string;
  supplierId: string;
  
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  
  subtotal: number;
  tax: number;
  total: number;
  
  status: 'pending' | 'paid' | 'overdue' | 'disputed';
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SupplierAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  
  monthlyTrends: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  
  topProducts: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }>;
  
  topCustomers: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }>;
  
  ordersByStatus: Record<PurchaseOrder['status'], number>;
  
  performanceMetrics: {
    onTimeDeliveryRate: number;
    averageDeliveryDays: number;
    customerSatisfactionScore: number;
    orderFulfillmentRate: number;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

// Integration with main restaurant system
export interface RestaurantConnection {
  id: string;
  supplierId: string;
  restaurantId: string; // ID from main system
  restaurantName: string;
  restaurantEmail: string;
  connectionStatus: 'pending' | 'active' | 'suspended' | 'rejected';
  connectionDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  
  // Sync settings
  syncSettings: {
    autoSyncProducts: boolean;
    syncFrequency: number; // hours
    lastSync?: string;
  };
  
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  supplierId: string;
  restaurantId?: string;
  action: 'product_sync' | 'order_sync' | 'customer_sync' | 'full_sync';
  status: 'success' | 'failed' | 'partial';
  details: {
    itemsProcessed: number;
    itemsSucceeded: number;
    itemsFailed: number;
    errors?: string[];
  };
  timestamp: string;
}