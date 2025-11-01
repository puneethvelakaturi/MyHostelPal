import React, { useState, useEffect } from 'react';
import { Clock, BarChart2, Users, AlertTriangle, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';

// Simple Error Boundary for debugging render-time errors
class ReportsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ReportsErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 rounded">
          <h3 className="text-red-700 font-bold">Report rendering error</h3>
          <pre className="whitespace-pre-wrap text-sm text-red-700">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setReportData(null); // Clear old data first
        
        const [reportsResponse, statsResponse] = await Promise.all([
          api.get(`/reports/${selectedPeriod}`),
          api.get('/reports/users')
        ]);

        // Process and validate stats data
        const stats = {
          totalUsers: Number(statsResponse.data?.totalUsers || 0),
          studentCount: Number(statsResponse.data?.studentCount || 0),
          staffCount: Number(statsResponse.data?.staffCount || 0),
          adminCount: Number(statsResponse.data?.adminCount || 0)
        };
        
        // Process and validate report data
        const report = reportsResponse.data ? {
          aiAnalysis: typeof reportsResponse.data.aiAnalysis === 'string' 
            ? reportsResponse.data.aiAnalysis.trim() 
            : 'No analysis available.',
          totalTickets: Number(reportsResponse.data.totalTickets || 0),
          criticalIssues: Number(reportsResponse.data.criticalIssues || 0),
          statusDistribution: Array.isArray(reportsResponse.data.statusDistribution) 
            ? reportsResponse.data.statusDistribution.map(item => ({
                _id: String(item._id || ''),
                count: Number(item.count || 0)
              }))
            : [],
          categoryBreakdown: Array.isArray(reportsResponse.data.categoryBreakdown)
            ? reportsResponse.data.categoryBreakdown.map(item => ({
                _id: String(item._id || ''),
                count: Number(item.count || 0)
              }))
            : [],
          dailyDistribution: Array.isArray(reportsResponse.data.dailyDistribution)
            ? reportsResponse.data.dailyDistribution.map(item => ({
                _id: String(item._id || ''),
                count: Number(item.count || 0)
              }))
            : [],
          weeklyDistribution: Array.isArray(reportsResponse.data.weeklyDistribution)
            ? reportsResponse.data.weeklyDistribution.map(item => ({
                _id: String(item._id || ''),
                count: Number(item.count || 0)
              }))
            : [],
          resolutionMetrics: {
            avgResolutionTime: Number(reportsResponse.data.resolutionMetrics?.avgResolutionTime || 0),
            totalResolved: Number(reportsResponse.data.resolutionMetrics?.totalResolved || 0)
          },
          tickets: Array.isArray(reportsResponse.data.tickets)
            ? reportsResponse.data.tickets.map(ticket => ({
                _id: String(ticket._id || ''),
                title: String(ticket.title || ''),
                category: String(ticket.category || ''),
                status: String(ticket.status || ''),
                createdBy: {
                  name: String(ticket.createdBy?.name || ticket.student?.name || 'Unknown')
                }
              }))
            : []
        } : null;

        setReportData(report);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedPeriod]);

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ReportsErrorBoundary>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        
        {/* Period Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              selectedPeriod === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Daily
          </button>
          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              selectedPeriod === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Weekly
          </button>
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              selectedPeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CalendarRange className="h-4 w-4" />
            Monthly
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{userStats?.totalUsers || 0}</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Students: {userStats?.studentCount || 0}</p>
            <p>Staff: {userStats?.staffCount || 0}</p>
            <p>Admins: {userStats?.adminCount || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Total Tickets</h3>
            <BarChart2 className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{reportData?.totalTickets || 0}</p>
          <div className="mt-4 text-sm text-gray-500">
              {Array.isArray(reportData?.statusDistribution) ? reportData.statusDistribution.map(status => (
                <p key={String(status._id)}>
                  {String(status._id)}: {String(status.count)}
                </p>
              )) : null}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Resolution Time</h3>
            <Clock className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatDuration(reportData?.resolutionMetrics?.avgResolutionTime)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Resolved: {reportData?.resolutionMetrics?.totalResolved || 0} tickets
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Critical Issues</h3>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.criticalIssues || reportData?.priorityDistribution?.find(p => p._id === 'high')?.count || 0}
          </p>
        </div>
      </div>

      {/* Time Distribution */}
      {(reportData?.dailyDistribution || reportData?.weeklyDistribution) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedPeriod === 'weekly' ? 'Daily Distribution' : 'Weekly Distribution'}
          </h2>
          <div className="space-y-4">
            {(Array.isArray(reportData?.dailyDistribution) || Array.isArray(reportData?.weeklyDistribution)) ? (reportData?.dailyDistribution || reportData?.weeklyDistribution).map(item => (
              <div key={item._id} className="flex items-center gap-4">
                <span className="w-32 text-sm text-gray-600">{item._id}</span>
                <div className="flex-1">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(item.count / reportData.totalTickets) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <span className="w-20 text-right text-sm text-gray-600">
                  {item.count} ({Math.round((item.count / reportData.totalTickets) * 100)}%)
                </span>
              </div>
            )) : null}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="space-y-4">
          {Array.isArray(reportData?.categoryBreakdown) ? reportData.categoryBreakdown.map(category => (
            <div key={category._id} className="flex items-center gap-4">
              <span className="w-32 text-sm text-gray-600">{category._id}</span>
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(category.count / reportData.totalTickets) * 100}%`
                    }}
                  />
                </div>
              </div>
              <span className="w-20 text-right text-sm text-gray-600">
                {category.count} ({Math.round((category.count / reportData.totalTickets) * 100)}%)
              </span>
            </div>
          )) : null}
        </div>
      </div>

      {/* Recent Tickets */}
      {reportData?.tickets && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(reportData?.tickets) ? reportData.tickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket._id.slice(-6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : ticket.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.createdBy?.name || ticket.student?.name || 'Unknown'}
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis</h2>
        <div className="prose max-w-none text-gray-600">
          {(() => {
            try {
              if (!reportData?.aiAnalysis) {
                return <div>No analysis available for this period.</div>;
              }

              const markdownText = String(reportData.aiAnalysis || '').trim();
              
              if (!markdownText) {
                return <div>No analysis content available.</div>;
              }

              // Create a sanitized version of the markdown content
              const sanitizedContent = markdownText
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
                .trim();

              return (
                <div>
                  {sanitizedContent.split('\n').map((line, index) => (
                    <p key={index} className="mb-4">
                      {line}
                    </p>
                  ))}
                </div>
              );
            } catch (error) {
              console.error('Error rendering analysis:', error);
              return <div className="text-red-500">Error displaying analysis content.</div>;
            }
          })()}
        </div>
      </div>
    </div>
    </ReportsErrorBoundary>
  );
};

export default AdminReports;
