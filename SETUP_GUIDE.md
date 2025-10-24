# MyHostelPal Setup Guide

## Step-by-Step Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Setup MongoDB

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose the free tier)
4. Create a database user
5. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/myhostelpal`)

#### Option B: Local MongoDB
1. Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/myhostelpal`

### 3. Create Environment File

Create a `.env` file in the root directory with the following content:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myhostelpal
# OR for local: MONGODB_URI=mongodb://localhost:27017/myhostelpal

# JWT Secret (use any random string)
JWT_SECRET=myhostelpal_secret_key_2024_very_secure_random_string

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Environment
NODE_ENV=development
PORT=5000
```

### 4. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 5. Start the Application

```bash
# Start backend (Terminal 1)
npm run dev

# Start frontend (Terminal 2)
cd client
npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Testing the Application

1. **Register a new account** or use the demo credentials
2. **Create a ticket** - the AI will automatically categorize and prioritize it
3. **View your tickets** in the dashboard
4. **Test the admin features** by registering with role: 'admin'

## Demo Credentials

- **Student**: student@example.com / password123
- **Admin**: admin@example.com / password123

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Check your MongoDB URI in the .env file
   - Ensure MongoDB is running (if using local)
   - Check network access (if using Atlas)

2. **Gemini API Error**
   - Verify your API key is correct
   - Check if you have API access enabled
   - Ensure you have sufficient quota

3. **Port Already in Use**
   - Change the PORT in .env file
   - Kill the process using the port: `lsof -ti:5000 | xargs kill -9`

## Next Steps (Optional Services)

Once the basic setup is working, you can optionally add:

- **Firebase** - For push notifications
- **Twilio** - For SMS notifications  
- **Nodemailer** - For email notifications
- **Cloudinary** - For image uploads

These are not required for basic functionality and can be added later.

## Support

If you encounter any issues, check the console logs for error messages and refer to the README.md for more detailed information.
