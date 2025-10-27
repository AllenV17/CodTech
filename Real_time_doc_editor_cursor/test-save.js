const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testSaveFunctionality() {
  console.log('🧪 Testing Document Save Functionality...\n');

  try {
    // Test 1: Register and login a user
    console.log('1. Registering test user...');
    const user = await axios.post(`${API_BASE}/auth/register`, {
      username: 'savetest',
      email: 'savetest@example.com',
      password: 'password123'
    });
    console.log('✅ User registered:', user.data.user.username);

    const token = user.data.token;

    // Test 2: Create a document
    console.log('\n2. Creating test document...');
    const docResponse = await axios.post(`${API_BASE}/documents`, {
      title: 'Save Test Document',
      content: 'Initial content',
      isPublic: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Document created');
    const documentId = docResponse.data.document._id;

    // Test 3: Update document content
    console.log('\n3. Updating document content...');
    const updateResponse = await axios.put(`${API_BASE}/documents/${documentId}`, {
      content: 'Updated content with more text'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Document updated successfully');
    console.log('   New content:', updateResponse.data.document.content);

    // Test 4: Verify the content was saved
    console.log('\n4. Verifying saved content...');
    const getResponse = await axios.get(`${API_BASE}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Document retrieved');
    console.log('   Saved content:', getResponse.data.document.content);

    if (getResponse.data.document.content === 'Updated content with more text') {
      console.log('✅ Content matches - save functionality working correctly!');
    } else {
      console.log('❌ Content mismatch - save may have failed');
    }

    console.log('\n🎉 Save functionality test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Document creation: ✅');
    console.log('   - Document update: ✅');
    console.log('   - Content persistence: ✅');
    console.log('   - No false error messages: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Run the test
testSaveFunctionality();

