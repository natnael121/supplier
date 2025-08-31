# Supplier-Menu Integration API

A serverless API hosted on Vercel that enables seamless integration between the Supplier Portal and Menu Platform.

## 🚀 Overview

This API serves as a bridge between:
- **Supplier Portal**: https://supplier-bice.vercel.app
- **Menu Platform**: https://micron-dusky.vercel.app

## 🔐 Authentication

All endpoints require an API key in the Authorization header:

```
Authorization: Bearer <API_KEY>
```

## 📡 API Endpoints

### Supplier → Menu Platform

#### 1. Sync Product Catalog
```http
POST /api/products/sync
Content-Type: application/json
Authorization: Bearer <API_KEY>

{
  "supplierId": "supplier_123",
  "products": [
    {
      "id": "prod_1",
      "name": "Premium Olive Oil",
      "description": "Extra virgin olive oil from Italy",
      "price": 25.99,
      "currency": "USD",
      "category": "Food & Beverages",
      "stock": 100,
      "unit": "bottles",
      "imageUrl": "https://example.com/image.jpg",
      "isAvailable": true,
      "minimumOrderQuantity": 1,
      "leadTimeDays": 2,
      "brand": "Italian Gold",
      "sku": "OIL-001"
    }
  ]
}
```

#### 2. Update Product Availability
```http
PATCH /api/products/{productId}/availability
Content-Type: application/json
Authorization: Bearer <API_KEY>

{
  "supplierId": "supplier_123",
  "stockQuantity": 50,
  "isAvailable": true
}
```

### Menu Platform → Supplier

#### 3. Send New Order
```http
POST /api/orders/webhook
Content-Type: application/json
Authorization: Bearer <API_KEY>

{
  "orderId": "order_456",
  "restaurantId": "restaurant_789",
  "supplierId": "supplier_123",
  "items": [
    {
      "productId": "prod_1",
      "productName": "Premium Olive Oil",
      "quantity": 5,
      "unitPrice": 25.99,
      "unit": "bottles",
      "sku": "OIL-001"
    }
  ],
  "deliveryInfo": {
    "address": {
      "line1": "123 Restaurant St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "shippingCost": 15.00
  },
  "status": "sent",
  "orderDate": "2025-01-27T10:00:00Z",
  "requestedDeliveryDate": "2025-01-30T10:00:00Z",
  "notes": "Urgent delivery required"
}
```

#### 4. Backorder Notification
```http
POST /api/orders/backorder
Content-Type: application/json
Authorization: Bearer <API_KEY>

{
  "orderId": "order_456",
  "restaurantId": "restaurant_789",
  "supplierId": "supplier_123",
  "backorderedItems": [
    {
      "productId": "prod_1",
      "productName": "Premium Olive Oil",
      "requestedQuantity": 10,
      "availableQuantity": 3,
      "unit": "bottles",
      "unitPrice": 25.99
    }
  ],
  "reason": "Insufficient stock",
  "estimatedRestockDate": "2025-02-05T00:00:00Z"
}
```

### Optional Endpoints

#### 5. Get Product Details
```http
GET /api/products/{productId}?supplierId=supplier_123
Authorization: Bearer <API_KEY>
```

#### 6. Get Order Details
```http
GET /api/orders/{orderId}?supplierId=supplier_123
Authorization: Bearer <API_KEY>
```

#### 7. Health Check
```http
GET /api/health
```

## 📊 Response Format

All endpoints return structured JSON responses:

```json
{
  "status": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2025-01-27T10:00:00Z"
}
```

### Error Responses

```json
{
  "status": 401,
  "message": "Invalid API key",
  "data": null,
  "timestamp": "2025-01-27T10:00:00Z"
}
```

## 🔧 Environment Variables

Set these environment variables in your Vercel project:

```env
API_KEY=your_secure_api_key_here
SUPPLIER_PORTAL_URL=https://supplier-bice.vercel.app
MENU_PLATFORM_URL=https://micron-dusky.vercel.app
SUPPLIER_PORTAL_API_KEY=supplier_portal_api_key
MENU_PLATFORM_API_KEY=menu_platform_api_key
```

## 🚀 Deployment

### Deploy to Vercel

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required environment variables

3. **Configure Custom Domain** (Optional)
   - Add custom domain like `api.yourdomain.com`
   - Update both systems to use the new API URL

## 🔄 Data Flow

### Product Synchronization
1. Supplier updates product catalog in Supplier Portal
2. Supplier Portal calls `POST /api/products/sync` to push updates
3. Integration API forwards data to Menu Platform
4. Menu Platform updates its supplier product listings

### Stock Updates
1. Supplier updates stock levels in Supplier Portal
2. Supplier Portal calls `PATCH /api/products/:id/availability`
3. Integration API forwards update to Menu Platform
4. Menu Platform reflects new availability

### Order Processing
1. Restaurant creates order in Menu Platform
2. Menu Platform calls `POST /api/orders/webhook`
3. Integration API forwards order to Supplier Portal
4. Supplier receives order notification

### Backorder Handling
1. Menu Platform detects insufficient stock
2. Menu Platform calls `POST /api/orders/backorder`
3. Integration API notifies Supplier Portal
4. Supplier can update stock and notify when available

## 🛡️ Security Features

- **API Key Authentication**: All endpoints protected
- **CORS Configuration**: Proper cross-origin handling
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Graceful error responses
- **Rate Limiting**: Built-in Vercel protection

## 📈 Monitoring

### Health Check
Use `GET /api/health` to monitor:
- API service status
- Environment configuration
- External system connectivity
- Available endpoints

### Error Logging
All errors are logged with:
- Timestamp
- Request details
- Error messages
- Stack traces (in development)

## 🔗 Integration Examples

### Supplier Portal Integration
```javascript
// Sync products to Menu Platform
const response = await fetch('https://your-api.vercel.app/api/products/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    supplierId: 'supplier_123',
    products: supplierProducts
  })
});
```

### Menu Platform Integration
```javascript
// Send order to supplier
const response = await fetch('https://your-api.vercel.app/api/orders/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    orderId: 'order_456',
    restaurantId: 'restaurant_789',
    supplierId: 'supplier_123',
    items: orderItems,
    deliveryInfo: deliveryDetails
  })
});
```

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Invalid API key |
| 404  | Not Found - Resource doesn't exist |
| 405  | Method Not Allowed |
| 500  | Internal Server Error |
| 502  | Bad Gateway - External system error |
| 503  | Service Unavailable |

## 📞 Support

For integration support:
1. Check the health endpoint: `GET /api/health`
2. Verify environment variables are set correctly
3. Ensure both systems are accessible
4. Check API key validity

---

**Built for Seamless Integration**

*Connecting suppliers and restaurants through modern API architecture.*