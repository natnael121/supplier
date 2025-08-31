import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  ShoppingBag,
  DollarSign,
  Search,
  Filter,
  Globe,
  Plus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { firebaseService } from '../services/firebase';
import { mainSystemIntegration } from '../services/mainSystemIntegration';
import { RestaurantConnection } from '../types';
import { format } from 'date-fns';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<RestaurantConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const connectionsData = await firebaseService.getRestaurantConnections(user.supplierId);
      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: RestaurantConnection['connectionStatus']) => {
    try {
      await firebaseService.updateRestaurantConnection(connectionId, { connectionStatus: status });
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { ...conn, connectionStatus: status } : conn
      ));
    } catch (error) {
      console.error('Error updating connection status:', error);
      alert('Failed to update connection status');
    }
  };

  const getStatusColor = (status: RestaurantConnection['connectionStatus']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.restaurantEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || connection.connectionStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Customers</h1>
          <p className="text-gray-600">Manage your restaurant partnerships</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Restaurant</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConnections.map((connection) => (
          <div key={connection.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{connection.restaurantName}</h3>
                  <p className="text-sm text-gray-500">
                    Connected {format(new Date(connection.connectionDate), 'MMM yyyy')}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(connection.connectionStatus)}`}>
                {connection.connectionStatus}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders:</span>
                <span className="text-sm font-medium text-gray-900">{connection.totalOrders}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Spent:</span>
                <span className="text-sm font-medium text-gray-900">${connection.totalSpent.toFixed(2)}</span>
              </div>
              
              {connection.lastOrderDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Order:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(connection.lastOrderDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{connection.restaurantEmail}</span>
                </div>
              </div>

              {connection.connectionStatus === 'pending' && (
                <div className="pt-3 border-t flex space-x-2">
                  <button
                    onClick={() => updateConnectionStatus(connection.id, 'active')}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredConnections.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurant connections found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Connect with restaurants to start receiving orders'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowConnectModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Connect Restaurant
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connect Restaurant Modal */}
      {showConnectModal && (
        <ConnectRestaurantModal
          supplierId={user?.supplierId || ''}
          onClose={() => setShowConnectModal(false)}
          onConnect={loadConnections}
        />
      )}
    </div>
  );
};

// Connect Restaurant Modal Component
interface ConnectRestaurantModalProps {
  supplierId: string;
  onClose: () => void;
  onConnect: () => void;
}

const ConnectRestaurantModal: React.FC<ConnectRestaurantModalProps> = ({
  supplierId,
  onClose,
  onConnect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const results = await mainSystemIntegration.searchRestaurants(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      alert('Failed to search restaurants');
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async (restaurantId: string, restaurantName: string, restaurantEmail: string) => {
    setConnecting(restaurantId);
    try {
      const success = await mainSystemIntegration.requestConnection(supplierId, restaurantId);
      if (success) {
        // Add to local connections
        await firebaseService.addRestaurantConnection({
          supplierId,
          restaurantId,
          restaurantName,
          restaurantEmail,
          connectionStatus: 'pending',
          connectionDate: new Date().toISOString(),
          totalOrders: 0,
          totalSpent: 0,
          syncSettings: {
            autoSyncProducts: true,
            syncFrequency: 24,
          },
        });
        
        onConnect();
        onClose();
        alert('Connection request sent successfully!');
      } else {
        alert('Failed to send connection request');
      }
    } catch (error) {
      console.error('Error connecting to restaurant:', error);
      alert('Failed to connect to restaurant');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Connect with Restaurant</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <Globe className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Restaurants
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter restaurant name or email..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Search Results</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {searchResults.map((restaurant) => (
                  <div key={restaurant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{restaurant.businessName || restaurant.name}</h4>
                        <p className="text-sm text-gray-600">{restaurant.email}</p>
                        {restaurant.address && (
                          <p className="text-xs text-gray-500">{restaurant.address}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleConnect(restaurant.id, restaurant.businessName || restaurant.name, restaurant.email)}
                        disabled={connecting === restaurant.id}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 text-sm"
                      >
                        {connecting === restaurant.id ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to Connect</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Search for restaurants by name or email address</li>
              <li>• Send connection requests to restaurants you want to work with</li>
              <li>• Once accepted, you can receive orders and sync your products</li>
              <li>• Restaurants can browse your catalog and place orders directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};