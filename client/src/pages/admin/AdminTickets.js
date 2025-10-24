import React, { useState } from 'react';
import { useTickets } from '../../contexts/TicketContext';
import { 
  Search, 
  Calendar, 
  Clock,
  Eye,
  MessageSquare,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';
import PriorityBadge from '../../components/PriorityBadge';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminTickets = () => {
  const { getAllTickets, updateTicket } = useTickets();
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [editingTicket, setEditingTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [allTickets, setAllTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tickets from database
  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/tickets', { headers });

        if (response.ok) {
          const data = await response.json();
          setAllTickets(data.tickets || []);
        } else {
          // Fallback to local context
          setAllTickets(getAllTickets());
        }
      } catch (error) {
        console.log('API call failed, using local data:', error);
        // Fallback to local context
        setAllTickets(getAllTickets());
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [getAllTickets]);

  // Filter tickets based on current filters
  const tickets = allTickets.filter(ticket => {
    if (filters.search && !ticket.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !ticket.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.category && ticket.category !== filters.category) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
      search: ''
    });
  };

  const handleStatusUpdate = async (ticketId) => {
    if (newStatus) {
      try {
        // Try to update in database first
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/tickets/${ticketId}/status`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          // Update local state
          setAllTickets(prev => 
            prev.map(ticket => 
              ticket._id === ticketId 
                ? { ...ticket, status: newStatus }
                : ticket
            )
          );
        } else {
          // Fallback to local context
          updateTicket(ticketId, { status: newStatus });
        }
      } catch (error) {
        console.log('API call failed, using local update:', error);
        // Fallback to local context
        updateTicket(ticketId, { status: newStatus });
      }

      setEditingTicket(null);
      setNewStatus('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-gray-600">Manage and monitor all submitted tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search tickets..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
              <option value="medical">Medical</option>
              <option value="wifi">WiFi</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
          <p className="text-sm text-gray-600">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
            <p className="text-gray-600 mt-2">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some(f => f) 
                ? 'No tickets match your current filters.'
                : 'No tickets have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {ticket.title}
                      </h3>
                      <PriorityBadge priority={ticket.priority} size="sm" />
                      <StatusBadge status={ticket.status} size="sm" />
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(ticket.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {ticket.comments?.length || 0} comments
                      </div>
                      <div className="text-primary-600">
                        by {ticket.student?.name} • {ticket.student?.roomNumber}
                      </div>
                    </div>

                    {/* Status Update Section */}
                    {editingTicket === ticket._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Select Status</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleStatusUpdate(ticket._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTicket(null);
                            setNewStatus('');
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingTicket(ticket._id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update Status
                        </button>
                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;
