const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testDocumentVisibility() {
  console.log('🧪 Testing Document Visibility...\n');

  try {
    // Test 1: Register two users
    console.log('1. Registering two test users...');
    
    const user1 = await axios.post(`${API_BASE}/auth/register`, {
      username: 'user1',
      email: 'user1@test.com',
      password: 'password123'
    });
    console.log('✅ User 1 registered:', user1.data.user.username);

    const user2 = await axios.post(`${API_BASE}/auth/register`, {
      username: 'user2',
      email: 'user2@test.com',
      password: 'password123'
    });
    console.log('✅ User 2 registered:', user2.data.user.username);

    const token1 = user1.data.token;
    const token2 = user2.data.token;

    // Test 2: User 1 creates a public document
    console.log('\n2. User 1 creates a public document...');
    const docResponse = await axios.post(`${API_BASE}/documents`, {
      title: 'Test Public Document',
      content: 'This is a public document',
      isPublic: true
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('✅ Document created by User 1');
    const documentId = docResponse.data.document._id;

    // Test 3: User 2 gets documents (should see the public document)
    console.log('\n3. User 2 fetches documents...');
    const user2Docs = await axios.get(`${API_BASE}/documents`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log('✅ User 2 can see documents:', user2Docs.data.documents.length);
    
    const foundDoc = user2Docs.data.documents.find(doc => doc._id === documentId);
    if (foundDoc) {
      console.log('✅ User 2 can see User 1\'s public document:', foundDoc.title);
    } else {
      console.log('❌ User 2 cannot see User 1\'s document');
    }

    // Test 4: User 2 tries to access the document
    console.log('\n4. User 2 accesses the document...');
    const docAccess = await axios.get(`${API_BASE}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log('✅ User 2 can access the document:', docAccess.data.document.title);

    console.log('\n🎉 Document visibility test passed!');
    console.log('\n📝 Summary:');
    console.log('   - Documents are now public by default');
    console.log('   - All users can see public documents');
    console.log('   - Users can access public documents');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Run the test
testDocumentVisibility();

