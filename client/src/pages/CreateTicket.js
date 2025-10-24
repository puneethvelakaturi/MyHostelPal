import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketContext';
import { 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  MapPin,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
// import LoadingSpinner from '../components/LoadingSpinner'; // Not used in demo

const CreateTicket = () => {
  const { user } = useAuth();
  const { addTicket } = useTickets();
  const [images, setImages] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm();

  const description = watch('description', '');

  // AI Analysis - call backend /api/ai/analyze with title + description
  const analyzeDescription = async (titleText, text) => {
    if (!text || text.length < 10) {
      setAiAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title: titleText || '', description: text })
      });

      if (!res.ok) {
        // If backend returns error, fallback to lightweight client-side heuristics
        console.warn('AI analyze endpoint returned', res.status);
        throw new Error('AI analyze failed');
      }

      const data = await res.json();
      const analysis = {
        category: data.category || 'other',
        categoryConfidence: data.categoryConfidence || 0.5,
        priority: data.priority || 'medium',
        priorityConfidence: data.priorityConfidence || 0.5,
        keywords: data.keywords || [],
        suggestions: data.suggestions || [] ,
        reasoning: data.reasoning || data.reason || ''
      };

      // Log the analysis for debugging
      console.log('Received AI analysis:', analysis);

      setAiAnalysis(analysis);

      // Always update the category field with the AI suggestion
      if (analysis.category) {
        console.log('Setting category to:', analysis.category);
        setValue('category', analysis.category);
      }
    } catch (error) {
      console.error('AI analysis error (backend). Falling back to client heuristics:', error);
      // Fallback to simple client-side keyword heuristics (keeps previous behavior but only as fallback)
      const lowerText = (text || '').toLowerCase();
      const mockAnalysis = {
        category: 'maintenance',
        categoryConfidence: 0.6,
        priority: 'medium',
        priorityConfidence: 0.5,
        keywords: [],
        suggestions: [],
        reasoning: 'Client-side fallback analysis'
      };

      if (lowerText.includes('wifi') || lowerText.includes('internet') || lowerText.includes('network')) {
        mockAnalysis.category = 'wifi';
        mockAnalysis.priority = 'high';
      } else if (lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('pipe')) {
        mockAnalysis.category = 'maintenance';
        mockAnalysis.priority = 'high';
      } else if (lowerText.includes('clean') || lowerText.includes('dirty') || lowerText.includes('hygiene')) {
        mockAnalysis.category = 'cleaning';
        mockAnalysis.priority = 'low';
      } else if (lowerText.includes('medical') || lowerText.includes('emergency') || lowerText.includes('health') || lowerText.includes('fever') || lowerText.includes('headache')) {
        mockAnalysis.category = 'medical';
        mockAnalysis.priority = 'urgent';
        mockAnalysis.categoryConfidence = 0.85;
      } else if (lowerText.includes('electric') || lowerText.includes('power') || lowerText.includes('light')) {
        mockAnalysis.category = 'electricity';
        mockAnalysis.priority = 'high';
      }

      setAiAnalysis(mockAnalysis);
      if (mockAnalysis.categoryConfidence > 0.7) setValue('category', mockAnalysis.category);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounced AI analysis
  // Re-run analysis when title or description changes (debounced)
  const titleWatch = watch('title');
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const titleVal = titleWatch || '';
      if (description && description.length >= 10) {
        analyzeDescription(titleVal, description);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [description, titleWatch]);

  // Image upload handling
  const onDrop = (acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const onSubmit = async (data) => {
    try {
      // Create FormData for API call
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category || aiAnalysis?.category || 'maintenance');
      formData.append('priority', aiAnalysis?.priority || 'medium');
      formData.append('location', JSON.stringify({
        roomNumber: data.roomNumber || user.roomNumber,
        block: data.block || user.hostelBlock,
        specificLocation: data.specificLocation
      }));

      // Add images
      images.forEach(image => {
        formData.append('images', image.file);
      });

      // Try to save to database first
      try {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers,
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          toast.success('Ticket created successfully and saved to database!');
          navigate(`/tickets/${result.ticket._id}`);
          return;
        }
      } catch (apiError) {
        console.log('API call failed, using local storage:', apiError);
      }

      // Fallback to local storage if API fails
      const newTicket = {
        title: data.title,
        description: data.description,
        category: data.category || aiAnalysis?.category || 'maintenance',
        priority: aiAnalysis?.priority || 'medium',
        status: 'open',
        student: {
          _id: user.id,
          name: user.name,
          email: user.email,
          roomNumber: user.roomNumber
        },
        location: {
          roomNumber: data.roomNumber || user.roomNumber,
          block: data.block || user.hostelBlock,
          specificLocation: data.specificLocation
        },
        images: images.map(img => ({ url: img.preview, publicId: img.id })),
        aiAnalysis: aiAnalysis
      };
      
      const createdTicket = addTicket(newTicket);
      toast.success('Ticket created successfully! (Local storage)');
      navigate(`/tickets/${createdTicket._id}`);
    } catch (error) {
      console.error('Create ticket error:', error);
      toast.error('Failed to create ticket');
    }
  };

  const categories = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'medical', label: 'Medical Emergency' },
    { value: 'wifi', label: 'WiFi Issues' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'water', label: 'Water Supply' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Home className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
            <p className="text-gray-600">Submit a complaint or request for assistance</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description of the issue"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 10, message: 'Description must be at least 10 characters' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Please provide detailed information about the issue..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                  
                  {/* AI Analysis Indicator */}
                  {isAnalyzing && (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing your complaint...
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a category (optional - AI will auto-detect)</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number
                  </label>
                  <input
                    type="text"
                    {...register('roomNumber')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., A-101"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block
                  </label>
                  <input
                    type="text"
                    {...register('block')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Block A"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Location
                  </label>
                  <input
                    type="text"
                    {...register('specificLocation')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Bathroom, Kitchen, Common Area"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attach Images</h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop the images here...'
                    : 'Drag & drop images here, or click to select'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB each (max 5 images)
                </p>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
              
              {aiAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detected Category
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {aiAnalysis.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(aiAnalysis.categoryConfidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Predicted Priority
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        aiAnalysis.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        aiAnalysis.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        aiAnalysis.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {aiAnalysis.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(aiAnalysis.priorityConfidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  {aiAnalysis.keywords && aiAnalysis.keywords.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {aiAnalysis.keywords.map((keyword, index) => (
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

                  {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suggested Actions
                      </label>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Start typing to see AI analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
