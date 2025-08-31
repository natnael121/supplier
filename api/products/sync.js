// POST /api/products/sync
// Supplier pushes full product catalog to Menu Platform

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
    
    const { supplierId, products } = req.body;
    
    // Validate required fields
    if (!supplierId) {
      return res.status(400).json(createResponse(400, null, 'supplierId is required'));
    }
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json(createResponse(400, null, 'products array is required'));
    }
    
    // Validate product structure
    const requiredFields = ['id', 'name', 'description', 'price', 'currency', 'category', 'unit'];
    for (const product of products) {
      for (const field of requiredFields) {
        if (!product[field]) {
          return res.status(400).json(createResponse(
            400, 
            null, 
            `Product missing required field: ${field}`
          ));
        }
      }
    }
    
    // Forward to Menu Platform
    const menuPlatformUrl = process.env.MENU_PLATFORM_URL || 'https://micron-dusky.vercel.app';
    
    try {
      const response = await fetch(`${menuPlatformUrl}/api/suppliers/products/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MENU_PLATFORM_API_KEY || process.env.API_KEY}`,
        },
        body: JSON.stringify({
          supplierId,
          products: products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            currency: product.currency,
            category: product.category,
            stock: parseInt(product.stock) || 0,
            unit: product.unit,
            imageUrl: product.imageUrl || null,
            isAvailable: product.isAvailable !== false,
            minimumOrderQuantity: parseInt(product.minimumOrderQuantity) || 1,
            leadTimeDays: parseInt(product.leadTimeDays) || 0,
            brand: product.brand || null,
            sku: product.sku || null,
          }))
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Menu Platform sync failed:', errorData);
        return res.status(502).json(createResponse(
          502, 
          null, 
          'Failed to sync products to Menu Platform'
        ));
      }
      
      const result = await response.json();
      
      return res.status(200).json(createResponse(
        200,
        {
          supplierId,
          productsCount: products.length,
          syncedAt: new Date().toISOString(),
          menuPlatformResponse: result
        },
        'Products synced successfully to Menu Platform'
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