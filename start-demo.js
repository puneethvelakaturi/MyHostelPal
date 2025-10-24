#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏠 MyHostelPal Demo Setup');
console.log('========================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/myhostelpal

# JWT Secret
JWT_SECRET=myhostelpal_secret_key_2024_very_secure_random_string

# Gemini API Key
GEMINI_API_KEY=AIzaSyAYq1eks7fbAJIRjgLOdF5tK-KOPlE4gvk

# Environment
NODE_ENV=development
PORT=5000`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created successfully!\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing backend dependencies...');
  console.log('Run: npm install\n');
} else {
  console.log('✅ Backend dependencies installed.\n');
}

// Check if client/node_modules exists
if (!fs.existsSync('client/node_modules')) {
  console.log('📦 Installing frontend dependencies...');
  console.log('Run: cd client && npm install\n');
} else {
  console.log('✅ Frontend dependencies installed.\n');
}

console.log('🚀 Ready to start! Run these commands:');
console.log('=====================================');
console.log('1. Start MongoDB (if using local):');
console.log('   mongod');
console.log('');
console.log('2. Start backend:');
console.log('   npm run dev');
console.log('');
console.log('3. Start frontend (in new terminal):');
console.log('   cd client && npm start');
console.log('');
console.log('4. Open browser:');
console.log('   http://localhost:3000');
console.log('');
console.log('🎉 Your MyHostelPal app will be ready!');
