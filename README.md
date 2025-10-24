# MyHostelPal: AI-Powered Hostel Assistance App

A comprehensive hostel management system that leverages AI to streamline complaint handling, automate categorization, and provide intelligent insights for better hostel administration.

## 🌟 Features

### For Students
- **Smart Complaint Submission**: Submit complaints with AI-powered categorization and priority detection
- **Real-time Tracking**: Track ticket status and receive notifications
- **Image Upload**: Attach images to provide visual context
- **Mobile-Responsive**: Works seamlessly on all devices

### For Administrators
- **AI-Powered Dashboard**: Get insights with automated categorization and priority prediction
- **Smart Notifications**: Receive alerts for high-priority tickets via SMS, email, and push notifications
- **Automated Reports**: AI-generated daily and weekly summaries
- **User Management**: Manage student and staff accounts
- **Analytics**: Track trends, resolution times, and performance metrics

### AI Features
- **Auto-Categorization**: Automatically categorizes complaints (Maintenance, Cleaning, Medical, etc.)
- **Priority Prediction**: AI determines urgency levels (Urgent, High, Medium, Low)
- **Smart Suggestions**: Provides actionable recommendations for ticket resolution
- **Report Generation**: Creates comprehensive summaries and trend analysis

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **OpenAI GPT-3.5** for AI features
- **Firebase Admin SDK** for push notifications
- **Twilio** for SMS notifications
- **Nodemailer** for email notifications
- **Cloudinary** for image storage

### Frontend
- **React.js** with React Router
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Hook Form** for form management
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- Firebase project (for notifications)
- Twilio account (for SMS)
- Cloudinary account (for images)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MyHostelPal
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your credentials:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/myhostelpal
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here
   
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Firebase Admin SDK
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   
   # Twilio (SMS)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Cloudinary (Image upload)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Environment
   NODE_ENV=development
   PORT=5000
   ```

5. **Start the application**
   ```bash
   # Start backend (from root directory)
   npm run dev
   
   # Start frontend (from client directory)
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Usage

### For Students

1. **Register/Login**: Create an account with your hostel details
2. **Create Ticket**: Submit complaints with descriptions and images
3. **Track Progress**: Monitor ticket status and receive updates
4. **View History**: Access all your submitted tickets

### For Administrators

1. **Admin Login**: Access admin dashboard with elevated privileges
2. **Monitor Tickets**: View all tickets with AI-powered insights
3. **Manage Users**: Handle student and staff accounts
4. **Generate Reports**: Access AI-generated analytics and summaries

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/my-tickets` - Get user's tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/comments` - Add comment
- `PUT /api/tickets/:id/status` - Update ticket status (Admin)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/reports/daily` - Get daily report

### AI
- `POST /api/ai/analyze` - Analyze complaint text
- `POST /api/ai/generate-report` - Generate AI report

## 🤖 AI Integration

The app uses OpenAI's GPT-3.5-turbo for:

1. **Complaint Categorization**: Automatically categorizes complaints into predefined categories
2. **Priority Detection**: Determines urgency levels based on content analysis
3. **Smart Suggestions**: Provides actionable recommendations for resolution
4. **Report Generation**: Creates comprehensive summaries and insights

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/admin/staff),
  studentId: String,
  roomNumber: String,
  phoneNumber: String,
  hostelBlock: String,
  isActive: Boolean,
  fcmToken: String
}
```

### Ticket Model
```javascript
{
  title: String,
  description: String,
  category: String,
  priority: String,
  status: String,
  student: ObjectId,
  assignedTo: ObjectId,
  images: Array,
  location: Object,
  aiAnalysis: Object,
  resolution: Object,
  comments: Array
}
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables in your hosting platform
2. Connect your GitHub repository
3. Deploy automatically on push

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/build`
4. Deploy

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Get connection string
3. Update MONGODB_URI in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Puneeth Velakaturi** - 22BCT0268
- **Golla Nikhil** - 22BCT0318  
- **Sutan Mandava** - 22BCT0350

**Faculty Guide**: Prof. Shamila Bhanu  
**Branch**: School of Computer Science and Engineering (SCOPE)

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔮 Future Enhancements

- Mobile app (React Native/Flutter)
- Advanced analytics dashboard
- Integration with hostel management systems
- Multi-language support
- Voice-to-text complaint submission
- IoT integration for automated issue detection

---

**MyHostelPal** - Transforming hostel management with AI-powered intelligence! 🏠✨
