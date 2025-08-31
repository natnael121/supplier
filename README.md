# Global Supplier Management System

A standalone supplier management platform that integrates with the main restaurant system to provide comprehensive supplier services.

## 🚀 Features

### Core Supplier Features
- **Product Catalog Management**: Complete CRUD operations for products with images and specifications
- **Order Management**: Receive and process purchase orders from restaurants
- **Customer Management**: Track restaurant partnerships and order history
- **Invoice Generation**: Automated billing and payment tracking
- **Analytics Dashboard**: Performance metrics and business insights
- **Restaurant Connections**: Direct integration with restaurant management systems

### Integration Capabilities
- **Main System Integration**: Seamless connection with restaurant platform
- **Real-time Synchronization**: Product and order sync across systems
- **Cross-platform Communication**: Order notifications and status updates
- **Unified Analytics**: Combined reporting across all connected restaurants

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern styling
- **React Router DOM** for navigation
- **Lucide React** for icons
- **Recharts** for analytics visualization

### Backend & Database
- **Firebase** (Firestore, Auth, Storage) - Dedicated supplier database
- **ImgBB API** for image hosting (shared with main system)

### Integration
- **REST API** communication with main restaurant system
- **Real-time sync** for products and orders
- **Webhook support** for instant notifications

## 📋 Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- Firebase account (separate from main system)
- ImgBB API access (shared)

### 2. Firebase Setup
1. Create a new Firebase project for suppliers
2. Enable Authentication with Email/Password
3. Create Firestore database
4. Enable Storage for image uploads
5. Configure security rules for supplier data

### 3. Environment Configuration
The Firebase configuration is already set up in `src/config/firebase.ts` with the provided credentials.

### 4. Installation
```bash
cd project2
npm install
```

### 5. Development
```bash
npm run dev
```

The supplier system will run on port 3001 to avoid conflicts with the main system.

## 🔧 Integration with Main System

### Connection Flow
1. **Supplier Registration**: Suppliers create accounts in the standalone system
2. **Restaurant Discovery**: Search and connect with restaurants from main system
3. **Product Sync**: Sync supplier products to restaurant supplier management
4. **Order Flow**: Receive purchase orders from restaurants
5. **Status Updates**: Notify restaurants of order status changes

### API Endpoints
The system communicates with the main restaurant system through these endpoints:
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `POST /api/supplier-connections` - Request connection
- `POST /api/supplier-products/sync` - Sync products
- `PUT /api/purchase-orders/:id/status` - Update order status

### Data Synchronization
- **Products**: Suppliers manage their catalog, sync to restaurants on demand
- **Orders**: Purchase orders flow from restaurants to suppliers
- **Status Updates**: Real-time status updates flow back to restaurants
- **Analytics**: Combined reporting across all connections

## 📊 Database Structure

### Supplier System Collections
```
suppliers/              # Supplier business information
products/              # Product catalog
purchaseOrders/        # Orders from restaurants
restaurantConnections/ # Restaurant partnerships
syncLogs/             # Synchronization history
supplierUsers/        # Supplier user accounts
productCategories/    # Product categorization
```

### Integration Points
- **Restaurant Discovery**: Query main system for available restaurants
- **Order Reception**: Receive orders via API from main system
- **Status Synchronization**: Push order updates back to main system
- **Product Sync**: Push product catalog to restaurant systems

## 🔐 Security Features

### Authentication & Authorization
- **Firebase Authentication** for supplier accounts
- **Role-based Access** (Admin, Staff)
- **Secure API Communication** with main system
- **Data Isolation** between suppliers

### Data Protection
- **Input Validation** on all forms
- **Secure File Uploads** via ImgBB
- **API Rate Limiting** for external calls
- **Audit Logging** for all sync operations

## 🚀 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables if needed
5. Deploy with custom domain (e.g., suppliers.yourdomain.com)

### Post-Deployment
1. Configure CORS for main system integration
2. Set up webhook endpoints for real-time updates
3. Test integration with main restaurant system
4. Configure monitoring and alerts

## 🔄 System Integration

### Main System → Supplier System
- Restaurant creates purchase order
- Order data sent to supplier system via API
- Supplier receives notification and can process order
- Status updates flow back to restaurant system

### Supplier System → Main System
- Supplier updates product catalog
- Products can be synced to restaurant systems
- Order status updates sent to restaurants
- Analytics data shared for reporting

### Shared Resources
- **ImgBB API**: Shared image hosting service
- **Common Types**: Shared data structures for integration
- **API Standards**: Consistent API design across systems

## 📱 User Experience

### Supplier Dashboard
- **Overview**: Key metrics and recent activity
- **Product Management**: Full catalog management with images
- **Order Processing**: Streamlined order fulfillment workflow
- **Customer Insights**: Restaurant partnership analytics
- **Performance Tracking**: Delivery and satisfaction metrics

### Restaurant Integration
- **Seamless Discovery**: Restaurants can find and connect with suppliers
- **Product Browsing**: Access to supplier catalogs within restaurant system
- **Order Placement**: Direct purchase order creation
- **Status Tracking**: Real-time order status updates

## 🛡 Business Logic

### Order Processing Workflow
1. **Order Reception**: Receive from restaurant system
2. **Order Confirmation**: Supplier confirms availability and pricing
3. **Preparation**: Supplier prepares order for shipment
4. **Shipping**: Order shipped with tracking information
5. **Delivery**: Confirmation of delivery to restaurant
6.  **Invoicing**: Automated invoice generation
7. **Payment**: Payment tracking and reconciliation

### Product Synchronization
- **Catalog Management**: Suppliers maintain master catalog
- **Selective Sync**: Choose which products to share with each restaurant
- **Real-time Updates**: Availability and pricing updates
- **Bulk Operations**: Mass updates across multiple restaurants

## 📈 Analytics & Reporting

### Supplier Analytics
- **Revenue Tracking**: Daily, weekly, monthly trends
- **Order Analytics**: Volume, value, and frequency
- **Customer Insights**: Restaurant performance and preferences
- **Product Performance**: Best-selling items and categories
- **Delivery Metrics**: On-time delivery and customer satisfaction

### Integration Analytics
- **Sync Performance**: Success rates and error tracking
- **Connection Health**: Active vs. inactive partnerships
- **Cross-system Metrics**: Combined reporting with main system

## 🤝 Support & Maintenance

### Monitoring
- **System Health**: Automated monitoring of all services
- **Integration Status**: Real-time connection monitoring with main system
- **Performance Metrics**: Response times and error rates
- **User Activity**: Login patterns and feature usage

### Backup & Recovery
- **Automated Backups**: Daily Firebase backups
- **Data Recovery**: Point-in-time recovery capabilities
- **Integration Resilience**: Graceful handling of main system downtime
- **Sync Recovery**: Automatic retry mechanisms for failed syncs

---

**Built for Professional Suppliers**

*Empowering suppliers with modern technology for efficient restaurant partnerships and streamlined order management.*