// POST /api/orders/backorder
// Menu platform notifies supplier of unavailable or backordered items

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
    
    const { orderId, restaurantId, supplierId, backorderedItems, reason, estimatedRestockDate } = req.body;
    
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
    
    if (!backorderedItems || !Array.isArray(backorderedItems) || backorderedItems.length === 0) {
      return res.status(400).json(createResponse(400, null, 'backorderedItems array is required and cannot be empty'));
    }
    
    // Validate backordered items structure
    const requiredItemFields = ['productId', 'productName', 'requestedQuantity', 'availableQuantity'];
    for (const item of backorderedItems) {
      for (const field of requiredItemFields) {
        if (item[field] === undefined || item[field] === null) {
          return res.status(400).json(createResponse(
            400, 
            null, 
            `Backordered item missing required field: ${field}`
          ));
        }
      }
      
      // Validate numeric fields
      if (isNaN(item.requestedQuantity) || item.requestedQuantity <= 0) {
        return res.status(400).json(createResponse(400, null, 'Item requestedQuantity must be a positive number'));
      }
      
      if (isNaN(item.availableQuantity) || item.availableQuantity < 0) {
        return res.status(400).json(createResponse(400, null, 'Item availableQuantity must be a non-negative number'));
      }
    }
    
    // Prepare backorder notification for Supplier Portal
    const backorderData = {
      orderId,
      restaurantId,
      supplierId,
      backorderedItems: backorderedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || null,
        requestedQuantity: parseInt(item.requestedQuantity),
        availableQuantity: parseInt(item.availableQuantity),
        backorderQuantity: parseInt(item.requestedQuantity) - parseInt(item.availableQuantity),
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice) || 0,
        notes: item.notes || null
      })),
      reason: reason || 'Insufficient stock',
      estimatedRestockDate,
      notificationDate: new Date().toISOString(),
      priority: 'normal'
    };
    
    // Forward to Supplier Portal
    const supplierPortalUrl = process.env.SUPPLIER_PORTAL_URL || 'https://supplier-bice.vercel.app';
    
    try {
      const response = await fetch(`${supplierPortalUrl}/api/orders/backorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPPLIER_PORTAL_API_KEY || process.env.API_KEY}`,
        },
        body: JSON.stringify(backorderData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Supplier Portal backorder notification failed:', errorData);
        return res.status(502).json(createResponse(
          502, 
          null, 
          'Failed to send backorder notification to Supplier Portal'
        ));
      }
      
      const result = await response.json();
      
      return res.status(200).json(createResponse(
        200,
        {
          orderId,
          restaurantId,
          supplierId,
          backorderedItemsCount: backorderedItems.length,
          totalBackorderQuantity: backorderedItems.reduce((sum, item) => 
            sum + (parseInt(item.requestedQuantity) - parseInt(item.availableQuantity)), 0
          ),
          notificationSentAt: new Date().toISOString(),
          supplierPortalResponse: result
        },
        'Backorder notification sent to supplier successfully'
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