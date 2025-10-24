import React from 'react';
import { useTickets } from '../../contexts/TicketContext';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const { getAllTickets } = useTickets();
  const allTickets = getAllTickets();

  // Calculate statistics from actual data
  const stats = {
    totalTickets: allTickets.length,
    ticketsByStatus: allTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {}),
    ticketsByCategory: allTickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {}),
    ticketsByPriority: allTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {}),
    overdueCount: allTickets.filter(ticket => {
      const hoursSinceCreated = (new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60);
      const thresholds = { urgent: 2, high: 24, medium: 72, low: 168 };
      return ticket.status !== 'resolved' && ticket.status !== 'closed' && 
             hoursSinceCreated > (thresholds[ticket.priority] || 72);
    }).length,
    recentTickets: allTickets
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">
          Monitor and manage all hostel requests and user activities
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Open Tickets"
          value={stats.ticketsByStatus?.open || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Resolved"
          value={stats.ticketsByStatus?.resolved || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueCount || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.ticketsByPriority || {}).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{priority}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        priority === 'urgent' ? 'bg-red-500' :
                        priority === 'high' ? 'bg-orange-500' :
                        priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ 
                        width: `${(count / (stats.totalTickets || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.ticketsByCategory || {}).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ 
                        width: `${(count / (stats.totalTickets || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentTickets?.length > 0 ? (
            stats.recentTickets.map((ticket) => (
              <div key={ticket._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ticket.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      by {ticket.student?.name} • {ticket.student?.roomNumber}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent tickets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
