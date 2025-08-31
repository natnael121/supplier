// GET /api/health
// Health check endpoint for the integration API

import { createResponse } from './auth/middleware.js';

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
    // Check environment variables
    const requiredEnvVars = ['API_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    // Check external system connectivity
    const supplierPortalUrl = process.env.SUPPLIER_PORTAL_URL || 'https://supplier-bice.vercel.app';
    const menuPlatformUrl = process.env.MENU_PLATFORM_URL || 'https://micron-dusky.vercel.app';
    
    const healthData = {
      service: 'Integration API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      configuration: {
        supplierPortalUrl,
        menuPlatformUrl,
        apiKeyConfigured: !!process.env.API_KEY,
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : null
      },
      endpoints: {
        'POST /api/products/sync': 'Supplier → Menu Platform product sync',
        'PATCH /api/products/:id/availability': 'Supplier → Menu Platform availability update',
        'POST /api/orders/webhook': 'Menu Platform → Supplier order creation',
        'POST /api/orders/backorder': 'Menu Platform → Supplier backorder notification',
        'GET /api/products/:id': 'Fetch product details',
        'GET /api/orders/:orderId': 'Fetch order details',
        'GET /api/health': 'Health check'
      }
    };
    
    if (missingEnvVars.length > 0) {
      healthData.status = 'degraded';
    }
    
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    
    return res.status(statusCode).json(createResponse(
      statusCode,
      healthData,
      `Integration API is ${healthData.status}`
    ));
    
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json(createResponse(
      500,
      {
        service: 'Integration API',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Health check failed'
    ));
  }
}