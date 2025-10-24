import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketContext';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { getTicketsByUser, getAllTickets } = useTickets();
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Fetch tickets from database
  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const endpoint = user?.role === 'admin' ? '/api/tickets' : '/api/tickets/my-tickets';
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(endpoint, { headers });

        if (response.ok) {
          const data = await response.json();
          setTickets(data.tickets || []);
        } else {
          // Fallback to local context
          const localTickets = user?.role === 'admin' ? getAllTickets() : getTicketsByUser(user?.id);
          setTickets(localTickets);
        }
      } catch (error) {
        console.log('API call failed, using local data:', error);
        // Fallback to local context
        const localTickets = user?.role === 'admin' ? getAllTickets() : getTicketsByUser(user?.id);
        setTickets(localTickets);
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchTickets();
  }, [user, getAllTickets, getTicketsByUser]);

  // Calculate statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
    high: tickets.filter(t => t.priority === 'high').length
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary', trend = null }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, href, color = 'primary' }) => (
    <Link
      to={href}
      className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (ticketsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-primary-100">
          {user?.role === 'student' 
            ? 'Manage your hostel requests and stay updated on their progress.'
            : 'Monitor and manage all hostel requests from your dashboard.'
          }
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Open Tickets"
          value={stats.open}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Priority Alerts */}
      {(stats.urgent > 0 || stats.high > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                High Priority Tickets
              </h3>
              <p className="text-sm text-red-700">
                You have {stats.urgent} urgent and {stats.high} high priority tickets that need attention.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <QuickAction
              title="Create New Ticket"
              description="Submit a new complaint or request"
              icon={Plus}
              href="/create-ticket"
              color="primary"
            />
            <QuickAction
              title="View All Tickets"
              description="See all your submitted tickets"
              icon={FileText}
              href="/my-tickets"
              color="blue"
            />
            {user?.role === 'admin' || user?.role === 'staff' ? (
              <QuickAction
                title="Admin Dashboard"
                description="Manage all tickets and users"
                icon={Users}
                href="/admin"
                color="purple"
              />
            ) : null}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            <Link
              to="/my-tickets"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No tickets yet</p>
                <p className="text-sm mb-4">Get started by creating your first ticket</p>
                <Link
                  to="/create-ticket"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ticket
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/tickets/${ticket._id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate"
                        >
                          {ticket.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <PriorityBadge priority={ticket.priority} size="sm" />
                          <StatusBadge status={ticket.status} size="sm" />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
