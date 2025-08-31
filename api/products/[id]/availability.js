// PATCH /api/products/[id]/availability
// Supplier updates stock quantity and availability status

import { validateApiKey, createResponse, handleError } from '../../auth/middleware.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'PATCH') {
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
    
    const { id } = req.query;
    const { supplierId, stockQuantity, isAvailable } = req.body;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json(createResponse(400, null, 'Product ID is required'));
    }
    
    if (!supplierId) {
      return res.status(400).json(createResponse(400, null, 'supplierId is required'));
    }
    
    if (stockQuantity === undefined && isAvailable === undefined) {
      return res.status(400).json(createResponse(
        400, 
        null, 
        'At least one of stockQuantity or isAvailable must be provided'
      ));
    }
    
    // Validate data types
    if (stockQuantity !== undefined && (isNaN(stockQuantity) || stockQuantity < 0)) {
      return res.status(400).json(createResponse(400, null, 'stockQuantity must be a non-negative number'));
    }
    
    if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
      return res.status(400).json(createResponse(400, null, 'isAvailable must be a boolean'));
    }
    
    // Forward to Menu Platform
    const menuPlatformUrl = process.env.MENU_PLATFORM_URL || 'https://micron-dusky.vercel.app';
    
    try {
      const updateData = {};
      if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
      
      const response = await fetch(`${menuPlatformUrl}/api/suppliers/products/${id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MENU_PLATFORM_API_KEY || process.env.API_KEY}`,
        },
        body: JSON.stringify({
          supplierId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Menu Platform availability update failed:', errorData);
        return res.status(502).json(createResponse(
          502, 
          null, 
          'Failed to update product availability on Menu Platform'
        ));
      }
      
      const result = await response.json();
      
      return res.status(200).json(createResponse(
        200,
        {
          productId: id,
          supplierId,
          updates: updateData,
          updatedAt: new Date().toISOString(),
          menuPlatformResponse: result
        },
        'Product availability updated successfully'
      ));
      
    } catch (fetchError) {
      console.error('Error communicating with Menu Platform:', fetchError);
      return res.status(502).json(createResponse(
        502, 
        null, 
        'Unable to communicate with Menu Platform'
      ));
    }
    
  } catch (error) {
    const errorResponse = handleError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
}