import { APP_CONFIG } from '../config/constants';
import { firebaseService } from './firebase';
import { RestaurantConnection, SyncLog } from '../types';

class MainSystemIntegrationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = APP_CONFIG.mainSystemUrl;
  }

  // =======================
  // Restaurant Discovery
  // =======================
  
  async searchRestaurants(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/restaurants/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search restaurants');
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }

  async getRestaurantDetails(restaurantId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/restaurants/${restaurantId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }
  }

  // =======================
  // Connection Management
  // =======================
  
  async requestConnection(supplierId: string, restaurantId: string, message?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/supplier-connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId,
          restaurantId,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Create local connection record
        const restaurant = await this.getRestaurantDetails(restaurantId);
        if (restaurant) {
          await firebaseService.addRestaurantConnection({
            supplierId,
            restaurantId,
            restaurantName: restaurant.businessName || restaurant.name,
            restaurantEmail: restaurant.email,
            connectionStatus: 'pending',
            connectionDate: new Date().toISOString(),
            totalOrders: 0,
            totalSpent: 0,
            syncSettings: {
              autoSyncProducts: true,
              syncFrequency: 24,
            },
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting connection:', error);
      return false;
    }
  }

  async acceptConnection(connectionId: string): Promise<boolean> {
    try {
      await firebaseService.updateRestaurantConnection(connectionId, {
        connectionStatus: 'active',
      });
      return true;
    } catch (error) {
      console.error('Error accepting connection:', error);
      return false;
    }
  }

  async rejectConnection(connectionId: string, reason?: string): Promise<boolean> {
    try {
      await firebaseService.updateRestaurantConnection(connectionId, {
        connectionStatus: 'rejected',
      });
      return true;
    } catch (error) {
      console.error('Error rejecting connection:', error);
      return false;
    }
  }

  // =======================
  // Product Synchronization
  // =======================
  
  async syncProductsToRestaurant(supplierId: string, restaurantId: string, productIds: string[]): Promise<boolean> {
    try {
      const products = await firebaseService.getProducts(supplierId);
      const selectedProducts = products.filter(p => productIds.includes(p.id));

      const response = await fetch(`${this.baseUrl}/api/supplier-products/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId,
          restaurantId,
          products: selectedProducts,
          timestamp: new Date().toISOString(),
        }),
      });

      const success = response.ok;
      
      // Log sync attempt
      await firebaseService.addSyncLog({
        supplierId,
        restaurantId,
        action: 'product_sync',
        status: success ? 'success' : 'failed',
        details: {
          itemsProcessed: selectedProducts.length,
          itemsSucceeded: success ? selectedProducts.length : 0,
          itemsFailed: success ? 0 : selectedProducts.length,
          errors: success ? [] : ['Sync request failed'],
        },
      });

      return success;
    } catch (error) {
      console.error('Error syncing products:', error);
      
      // Log failed sync
      await firebaseService.addSyncLog({
        supplierId,
        restaurantId,
        action: 'product_sync',
        status: 'failed',
        details: {
          itemsProcessed: productIds.length,
          itemsSucceeded: 0,
          itemsFailed: productIds.length,
          errors: [error.message],
        },
      });
      
      return false;
    }
  }

  async syncAllProductsToRestaurant(supplierId: string, restaurantId: string): Promise<boolean> {
    try {
      const products = await firebaseService.getProducts(supplierId);
      const availableProducts = products.filter(p => p.isAvailable);
      
      return await this.syncProductsToRestaurant(
        supplierId, 
        restaurantId, 
        availableProducts.map(p => p.id)
      );
    } catch (error) {
      console.error('Error syncing all products:', error);
      return false;
    }
  }

  // =======================
  // Order Synchronization
  // =======================
  
  async receiveOrderFromRestaurant(orderData: any): Promise<string | null> {
    try {
      // Convert main system order to supplier purchase order
      const purchaseOrder: Omit<PurchaseOrder, 'id' | 'orderNumber'> = {
        restaurantId: orderData.restaurantId,
        supplierId: orderData.supplierId,
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        discount: orderData.discount || 0,
        total: orderData.total,
        status: 'sent',
        orderDate: orderData.orderDate,
        requestedDeliveryDate: orderData.requestedDeliveryDate,
        notes: orderData.notes,
        deliveryAddress: orderData.deliveryAddress,
        paymentStatus: 'pending',
        createdBy: orderData.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Generate order number
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const orderNumber = `PO-${dateStr}-${Date.now().toString().slice(-6)}`;

      const docRef = await addDoc(collection(db, 'purchaseOrders'), {
        ...purchaseOrder,
        orderNumber,
      });

      // Update connection stats
      const connections = await firebaseService.getRestaurantConnections(orderData.supplierId);
      const connection = connections.find(c => c.restaurantId === orderData.restaurantId);
      if (connection) {
        await firebaseService.updateRestaurantConnection(connection.id, {
          totalOrders: connection.totalOrders + 1,
          totalSpent: connection.totalSpent + orderData.total,
          lastOrderDate: new Date().toISOString(),
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error receiving order from restaurant:', error);
      return null;
    }
  }

  // =======================
  // Status Updates
  // =======================
  
  async notifyRestaurantOfStatusUpdate(orderId: string, status: PurchaseOrder['status']): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/purchase-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error notifying restaurant of status update:', error);
      return false;
    }
  }

  // =======================
  // Health Check
  // =======================
  
  async checkMainSystemConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Main system connection check failed:', error);
      return false;
    }
  }
}

export const mainSystemIntegration = new MainSystemIntegrationService();