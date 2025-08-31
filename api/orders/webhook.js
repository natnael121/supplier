// POST /api/orders/webhook
// Menu platform sends new orders to Supplier Portal

import { validateApiKey, createResponse, handleError } from '../auth/middleware.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json(createResponse(405, null, 'Method not allowed'));
  }
  
  try {
    // Validate API key
    const authResult = validateApiKey(req);
    if (!authResult.isValid) {
      return res.status(authResult.error.status).json(createResponse(
        authResult.error.status, 
        null, 
        authResult.error.message
      ));
    }
    
    const { orderId, restaurantId, supplierId, items, deliveryInfo, status, orderDate, requestedDeliveryDate, notes } = req.body;
    
    // Validate required fields
    if (!orderId) {
      return res.status(400).json(createResponse(400, null, 'orderId is required'));
    }
    
    if (!restaurantId) {
      return res.status(400).json(createResponse(400, null, 'restaurantId is required'));
    }
    
    if (!supplierId) {
      return res.status(400).json(createResponse(400, null, 'supplierId is required'));
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(createResponse(400, null, 'items array is required and cannot be empty'));
    }
    
    // Validate item structure
    const requiredItemFields = ['productId', 'productName', 'quantity', 'unitPrice', 'unit'];
    for (const item of items) {
      for (const field of requiredItemFields) {
        if (!item[field]) {
          return res.status(400).json(createResponse(
            400, 
            null, 
            `Order item missing required field: ${field}`
          ));
        }
      }
      
      // Validate numeric fields
      if (isNaN(item.quantity) || item.quantity <= 0) {
        return res.status(400).json(createResponse(400, null, 'Item quantity must be a positive number'));
      }
      
      if (isNaN(item.unitPrice) || item.unitPrice < 0) {
        return res.status(400).json(createResponse(400, null, 'Item unitPrice must be a non-negative number'));
      }
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = deliveryInfo?.shippingCost || 0;
    const discount = 0; // No discount by default
    const total = subtotal + tax + shipping - discount;
    
    // Prepare order data for Supplier Portal
    const orderData = {
      orderId,
      restaurantId,
      supplierId,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || null,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        unit: item.unit,
        total: parseInt(item.quantity) * parseFloat(item.unitPrice),
        notes: item.notes || null
      })),
      subtotal,
      tax,
      shipping,
      discount,
      total,
      status: status || 'sent',
      orderDate: orderDate || new Date().toISOString(),
      requestedDeliveryDate,
      notes,
      deliveryAddress: deliveryInfo?.address || null,
      paymentStatus: 'pending',
      createdBy: 'menu_platform'
    };
    
    // Forward to Supplier Portal
    const supplierPortalUrl = process.env.SUPPLIER_PORTAL_URL || 'https://supplier-bice.vercel.app';
    
    try {
      const response = await fetch(`${supplierPortalUrl}/api/orders/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPPLIER_PORTAL_API_KEY || process.env.API_KEY}`,
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Supplier Portal order creation failed:', errorData);
        return res.status(502).json(createResponse(
          502, 
          null, 
          'Failed to create order in Supplier Portal'
        ));
      }
      
      const result = await response.json();
      
      return res.status(200).json(createResponse(
        200,
        {
          orderId,
          restaurantId,
          supplierId,
          itemsCount: items.length,
          total,
          status: orderData.status,
          createdAt: new Date().toISOString(),
          supplierPortalResponse: result
        },
        'Order sent to supplier successfully'
      ));
      
    } catch (fetchError) {
      console.error('Error communicating with Supplier Portal:', fetchError);
      return res.status(502).json(createResponse(
        502, 
        null, 
        'Unable to communicate with Supplier Portal'
      ));
    }
    
  } catch (error) {
    const errorResponse = handleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}