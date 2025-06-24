import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, UserCheck, UserX, Clock, Search, 
  CheckCircle, XCircle, MessageCircle, Calendar, Trash2,
  Filter, RefreshCw, Bell, User
} from 'lucide-react';
import { UserConnection, Connection } from '../types';
import api from '../config/api';

const Connections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'connections', label: 'My Connections', icon: Users },
    { id: 'requests', label: 'Pending Requests', icon: Bell },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [connectionsRes, requestsRes] = await Promise.all([
        api.connections.getMyConnections(),
        api.connections.getPendingRequests()
      ]);
      
      setConnections(connectionsRes.data);
      setPendingRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load connections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      await api.connections.acceptRequest(connectionId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept connection request.');
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await api.connections.rejectRequest(connectionId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject connection request.');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }
    
    try {
      await api.connections.disconnect(connectionId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError('Failed to remove connection.');
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = pendingRequests.filter(req =>
    req.from_user_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Connections</h1>
          <p className="text-gray-600">Manage your professional network and connection requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {connections.length}
                </h3>
                <p className="text-gray-600">Total Connections</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingRequests.length}
                </h3>
                <p className="text-gray-600">Pending Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <RefreshCw className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <button
                  onClick={fetchData}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
                <p className="text-gray-600">Update Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-600 hover:text-red-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'connections' | 'requests')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {tab.id === 'requests' && pendingRequests.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                          {pendingRequests.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'connections' ? 'connections' : 'requests'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'connections' ? (
              <div className="space-y-4">
                {filteredConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm ? 'No connections found' : 'No connections yet'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Try adjusting your search terms'
                        : 'Start connecting with other professionals to grow your network'
                      }
                    </p>
                  </div>
                ) : (
                  filteredConnections.map((connection) => (
                    <motion.div
                      key={connection.connection_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {connection.user.username}
                          </h4>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            Connected since {formatDate(connection.connected_since)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {/* Navigate to chat */}}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Send message"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDisconnect(connection.connection_id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove connection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm ? 'No requests found' : 'No pending requests'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Try adjusting your search terms'
                        : 'You have no pending connection requests at the moment'
                      }
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.from_user_username}
                          </h4>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            Requested {formatDate(request.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections; 