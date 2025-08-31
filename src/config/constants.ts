// Configuration constants
export const APP_CONFIG = {
  name: 'Global Supplier Management System',
  version: '1.0.0',
  description: 'Professional supplier management platform for restaurant industry',
  
  // Main restaurant system integration
  mainSystemUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-main-system.vercel.app' 
    : 'http://localhost:5173',
  
  // API endpoints
  apiEndpoints: {
    restaurants: '/api/restaurants',
    sync: '/api/sync',
    orders: '/api/orders',
    products: '/api/products',
  },
  
  // Business settings
  defaultCurrency: 'USD',
  defaultTaxRate: 0.08,
  defaultPaymentTerms: 30,
  
  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const PRODUCT_CATEGORIES = [
  'Food & Beverages',
  'Kitchen Equipment',
  'Cleaning Supplies',
  'Packaging Materials',
  'Office Supplies',
  'Furniture & Fixtures',
  'Technology & POS',
  'Uniforms & Apparel',
  'Marketing Materials',
  'Maintenance & Repair',
];

export const UNITS = [
  'pieces',
  'kg',
  'lbs',
  'grams',
  'ounces',
  'liters',
  'gallons',
  'boxes',
  'cases',
  'dozen',
  'packs',
  'rolls',
  'sheets',
  'meters',
  'feet',
];

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'credit', label: 'Credit Terms' },
];