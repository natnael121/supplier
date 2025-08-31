import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock, 
  Package,
  Building2,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { firebaseService } from '../services/firebase';
import { SupplierAnalytics, PurchaseOrder, RestaurantConnection } from '../types';
import { format, subDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [connections, setConnections] = useState<RestaurantConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, dateRange]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [analyticsData, orders, restaurantConnections] = await Promise.all([
        firebaseService.getSupplierAnalytics(user.supplierId),
        firebaseService.getPurchaseOrders(user.supplierId),
        firebaseService.getRestaurantConnections(user.supplierId)
      ]);
      
      setAnalytics(analyticsData);
      setRecentOrders(orders.slice(0, 10));
      setConnections(restaurantConnections);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRevenueChartData = () => {
    if (!analytics) return [];
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      // Filter orders for this date
      const dayOrders = recentOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === date.toDateString();
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const orders = dayOrders.length;
      
      data.push({
        date: dateStr,
        revenue,
        orders,
      });
    }
    
    return data;
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const chartData = getRevenueChartData();
  const pendingOrders = recentOrders.filter(order => order.status === 'sent');
  const activeConnections = connections.filter(conn => conn.connectionStatus === 'active');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingOrders.length} pending approval
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: ${analytics?.averageOrderValue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Restaurant Partners</p>
              <p className="text-2xl font-bold text-gray-900">{activeConnections.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                Active connections
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.performanceMetrics.averageDeliveryDays || 0} days</p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.performanceMetrics.onTimeDeliveryRate || 0}% on-time
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders Alert */}
      {pendingOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900">
                {pendingOrders.length} orders need your attention
              </h3>
              <p className="text-sm text-yellow-700">
                Review and confirm pending purchase orders from restaurants
              </p>
            </div>
            <Link
              to="/orders?status=sent"
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Review Orders
            </Link>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Orders Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
                name="revenue"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link
              to="/orders"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Restaurant Connections */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Partners</h2>
            <Link
              to="/connections"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {activeConnections.slice(0, 5).map((connection) => (
              <div key={connection.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{connection.restaurantName}</p>
                    <p className="text-xs text-gray-500">{connection.totalOrders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${connection.totalSpent.toFixed(2)}</p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/products"
            className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Manage Products</p>
                <p className="text-sm text-blue-700">Update catalog</p>
              </div>
            </div>
          </Link>

          <Link
            to="/orders?status=sent"
            className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Pending Orders</p>
                <p className="text-sm text-yellow-700">{pendingOrders.length} need attention</p>
              </div>
            </div>
          </Link>

          <Link
            to="/connections"
            className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Restaurant Partners</p>
                <p className="text-sm text-green-700">{activeConnections.length} connected</p>
              </div>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="bg-purple-50 border border-purple-200 p-4 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">View Analytics</p>
                <p className="text-sm text-purple-700">Performance insights</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};