import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketContext';
import {
  Clock,
  Calendar,
  MapPin,
  MessageCircle,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import toast from 'react-hot-toast';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch ticket');
      const data = await response.json();
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: comment })
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      toast.success('Comment added successfully');
      setComment('');
      fetchTicketDetails(); // Refresh ticket data
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success('Status updated successfully');
      fetchTicketDetails(); // Refresh ticket data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
        <p className="text-gray-600 mb-4">This ticket may have been deleted or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/tickets')}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Go back to tickets
        </button>
      </div>
    );
  }

  const canUpdateStatus = user.role === 'admin' || user.role === 'staff';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <div className="flex items-center space-x-3">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {ticket.student?.name || 'Unknown User'}
            </div>
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              {ticket.category}
            </div>
            {ticket.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {ticket.location.roomNumber} {ticket.location.block}
                {ticket.location.specificLocation && ` (${ticket.location.specificLocation})`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Images */}
          {ticket.images && ticket.images.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ticket.images.map((image, index) => (
                  <a
                    key={index}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square"
                  >
                    <img
                      src={image.url}
                      alt={`Ticket attachment ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
            
            {/* Add Comment */}
            <div className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={addComment}
                  disabled={submitting || !comment.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{comment.user?.name || 'Unknown User'}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          {canUpdateStatus && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="space-y-2">
                <button
                  onClick={() => updateStatus('open')}
                  disabled={ticket.status === 'open'}
                  className={`w-full p-2 text-left rounded-md ${
                    ticket.status === 'open'
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => updateStatus('in-progress')}
                  disabled={ticket.status === 'in-progress'}
                  className={`w-full p-2 text-left rounded-md ${
                    ticket.status === 'in-progress'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => updateStatus('resolved')}
                  disabled={ticket.status === 'resolved'}
                  className={`w-full p-2 text-left rounded-md ${
                    ticket.status === 'closed'
                      ? 'bg-green-50 text-green-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => updateStatus('closed')}
                  disabled={ticket.status === 'closed'}
                  className={`w-full p-2 text-left rounded-md ${
                    ticket.status === 'escalated'
                      ? 'bg-red-50 text-red-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {ticket.aiAnalysis && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {ticket.aiAnalysis.category}
                    </span>
                    {ticket.aiAnalysis.categoryConfidence && (
                      <span className="text-xs text-gray-500">
                        {Math.round(ticket.aiAnalysis.categoryConfidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <div className="flex items-center space-x-2">
                    <PriorityBadge priority={ticket.aiAnalysis.priority} />
                    {ticket.aiAnalysis.priorityConfidence && (
                      <span className="text-xs text-gray-500">
                        {Math.round(ticket.aiAnalysis.priorityConfidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>

                {ticket.aiAnalysis.keywords && ticket.aiAnalysis.keywords.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {ticket.aiAnalysis.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.aiAnalysis.suggestions && ticket.aiAnalysis.suggestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suggested Actions
                    </label>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {ticket.aiAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
