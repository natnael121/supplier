import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch,
  increment,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  Supplier, 
  Product, 
  PurchaseOrder, 
  Invoice, 
  SupplierAnalytics,
  ProductCategory,
  RestaurantConnection,
  SyncLog
} from '../types';

class FirebaseService {
  // =======================
  // Supplier Management
  // =======================
  
  async getSupplier(id: string): Promise<Supplier | null> {
    try {
      const docRef = doc(db, 'suppliers', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Supplier;
      }
      return null;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    try {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  // =======================
  // Product Management
  // =======================
  
  async getProducts(supplierId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('supplierId', '==', supplierId),
        orderBy('category'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // =======================
  // Purchase Order Management
  // =======================
  
  async getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        where('supplierId', '==', supplierId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<void> {
    try {
      const docRef = doc(db, 'purchaseOrders', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  // =======================
  // Restaurant Connections
  // =======================
  
  async getRestaurantConnections(supplierId: string): Promise<RestaurantConnection[]> {
    try {
      const q = query(
        collection(db, 'restaurantConnections'),
        where('supplierId', '==', supplierId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantConnection));
    } catch (error) {
      console.error('Error fetching restaurant connections:', error);
      throw error;
    }
  }

  async addRestaurantConnection(connection: Omit<RestaurantConnection, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'restaurantConnections'), {
        ...connection,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding restaurant connection:', error);
      throw error;
    }
  }

  async updateRestaurantConnection(id: string, updates: Partial<RestaurantConnection>): Promise<void> {
    try {
      const docRef = doc(db, 'restaurantConnections', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating restaurant connection:', error);
      throw error;
    }
  }

  // =======================
  // Analytics
  // =======================
  
  async getSupplierAnalytics(supplierId: string): Promise<SupplierAnalytics> {
    try {
      const [orders, products, connections] = await Promise.all([
        this.getPurchaseOrders(supplierId),
        this.getProducts(supplierId),
        this.getRestaurantConnections(supplierId)
      ]);

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalCustomers = connections.filter(c => c.connectionStatus === 'active').length;

      // Calculate monthly trends
      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        
        const monthOrders = orders.filter(order => 
          order.created_at.startsWith(monthStr)
        );
        
        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, order) => sum + order.total, 0)
        });
      }

      // Calculate top products
      const productStats: Record<string, { name: string; orders: number; revenue: number }> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!productStats[item.productId]) {
            productStats[item.productId] = { name: item.productName, orders: 0, revenue: 0 };
          }
          productStats[item.productId].orders += item.quantity;
          productStats[item.productId].revenue += item.total;
        });
      });

      const topProducts = Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate top customers
      const customerStats: Record<string, { name: string; orders: number; revenue: number }> = {};
      orders.forEach(order => {
        const connection = connections.find(c => c.restaurantId === order.restaurantId);
        if (connection) {
          if (!customerStats[order.restaurantId]) {
            customerStats[order.restaurantId] = { 
              name: connection.restaurantName, 
              orders: 0, 
              revenue: 0 
            };
          }
          customerStats[order.restaurantId].orders++;
          customerStats[order.restaurantId].revenue += order.total;
        }
      });

      const topCustomers = Object.entries(customerStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate orders by status
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<PurchaseOrder['status'], number>);

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalCustomers,
        monthlyTrends,
        topProducts,
        topCustomers,
        ordersByStatus,
        performanceMetrics: {
          onTimeDeliveryRate: 95.5,
          averageDeliveryDays: 2.3,
          customerSatisfactionScore: 4.8,
          orderFulfillmentRate: 98.2,
        }
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }

  // =======================
  // Product Categories
  // =======================
  
  async getProductCategories(): Promise<ProductCategory[]> {
    try {
      const q = query(
        collection(db, 'productCategories'),
        where('isActive', '==', true),
        orderBy('order'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
    } catch (error) {
      console.error('Error fetching product categories:', error);
      throw error;
    }
  }

  async addProductCategory(category: Omit<ProductCategory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'productCategories'), {
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding product category:', error);
      throw error;
    }
  }

  // =======================
  // File Upload
  // =======================
  
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // =======================
  // Sync Logs
  // =======================
  
  async addSyncLog(log: Omit<SyncLog, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'syncLogs'), {
        ...log,
        timestamp: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding sync log:', error);
      throw error;
    }
  }

  async getSyncLogs(supplierId: string, limitCount?: number): Promise<SyncLog[]> {
    try {
      let q = query(
        collection(db, 'syncLogs'),
        where('supplierId', '==', supplierId),
        orderBy('timestamp', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SyncLog));
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      throw error;
    }
  }

  // =======================
  // Supplier User Management
  // =======================
  
  async createSupplierUser(userData: {
    email: string;
    name: string;
    supplierId: string;
    role: 'admin' | 'staff';
  }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'supplierUsers'), {
        ...userData,
        isActive: true,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating supplier user:', error);
      throw error;
    }
  }

  async createSupplierUserWithId(userId: string, userData: any): Promise<void> {
    try {
      const docRef = doc(db, 'supplierUsers', userId);
      await setDoc(docRef, userData);
    } catch (error) {
      console.error('Error creating supplier user with ID:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();