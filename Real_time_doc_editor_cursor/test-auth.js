const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('   User:', registerResponse.data.user.username);
    console.log('   Token received:', !!registerResponse.data.token);

    const token = registerResponse.data.token;

    // Test 2: Login with the same user
    console.log('\n2. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('   User:', loginResponse.data.user.username);
    console.log('   Token received:', !!loginResponse.data.token);

    // Test 3: Get current user with token
    console.log('\n3. Testing get current user...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get user successful');
    console.log('   User ID:', meResponse.data.user.id);
    console.log('   Username:', meResponse.data.user.username);

    // Test 4: Create a document
    console.log('\n4. Testing document creation...');
    const documentData = {
      title: 'Test Document',
      content: 'This is a test document content.',
      isPublic: false
    };

    const docResponse = await axios.post(`${API_BASE}/documents`, documentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Document created successfully');
    console.log('   Document ID:', docResponse.data.document._id);
    console.log('   Title:', docResponse.data.document.title);

    // Test 5: Get documents
    console.log('\n5. Testing get documents...');
    const docsResponse = await axios.get(`${API_BASE}/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Documents retrieved successfully');
    console.log('   Number of documents:', docsResponse.data.documents.length);

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start MongoDB: mongod');
    console.log('   2. Start backend: npm run dev');
    console.log('   3. Start frontend: npm run client');
    console.log('   4. Open http://localhost:3000');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.log('\n🔧 Make sure:');
    console.log('   1. MongoDB is running');
    console.log('   2. Backend server is running (npm run dev)');
    console.log('   3. All dependencies are installed');
  }
}

// Run the test
testAuth();

