// GET /api/products/[id]
// Fetch product details from Supplier Portal

import { validateApiKey, createResponse, handleError } from '../../auth/middleware.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
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
    const { supplierId } = req.query;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json(createResponse(400, null, 'Product ID is required'));
    }
    
    if (!supplierId) {
      return res.status(400).json(createResponse(400, null, 'supplierId query parameter is required'));
    }
    
    // Forward to Supplier Portal
    const supplierPortalUrl = process.env.SUPPLIER_PORTAL_URL || 'https://supplier-bice.vercel.app';
    
    try {
      const response = await fetch(`${supplierPortalUrl}/api/products/${id}?supplierId=${supplierId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPPLIER_PORTAL_API_KEY || process.env.API_KEY}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json(createResponse(404, null, 'Product not found'));
        }
        
        const errorData = await response.text();
        console.error('Supplier Portal product fetch failed:', errorData);
        return res.status(502).json(createResponse(
          502, 
          null, 
          'Failed to fetch product from Supplier Portal'
        ));
      }
      
      const product = await response.json();
      
      return res.status(200).json(createResponse(
        200,
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.unitPrice,
          currency: product.currency,
          category: product.category,
          subcategory: product.subcategory,
          stock: product.stockQuantity,
          unit: product.unit,
          imageUrl: product.images?.[0] || null,
          isAvailable: product.isAvailable,
          minimumOrderQuantity: product.minimumOrderQuantity,
          leadTimeDays: product.leadTimeDays,
          brand: product.brand,
          sku: product.sku,
          specifications: product.specifications,
          supplierId: product.supplierId,
          updatedAt: product.updated_at
        },
        'Product details retrieved successfully'
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