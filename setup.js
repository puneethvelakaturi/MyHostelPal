#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏠 MyHostelPal Setup Script');
console.log('============================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  fs.copyFileSync('env.example', '.env');
  console.log('✅ .env file created! Please update it with your credentials.\n');
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

console.log('🚀 Setup Instructions:');
console.log('=====================');
console.log('1. Update .env file with your API keys and credentials');
console.log('2. Install dependencies:');
console.log('   - Backend: npm install');
console.log('   - Frontend: cd client && npm install');
console.log('3. Start the application:');
console.log('   - Backend: npm run dev');
console.log('   - Frontend: cd client && npm start');
console.log('\n📚 For detailed setup instructions, see README.md');
console.log('\n🎉 Happy coding with MyHostelPal!');
