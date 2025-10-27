const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCollaboratorFunctionality() {
  console.log('🧪 Testing Collaborator Functionality...\n');

  try {
    // Test 1: Register two users
    console.log('1. Registering two test users...');
    
    const user1 = await axios.post(`${API_BASE}/auth/register`, {
      username: 'owner',
      email: 'owner@test.com',
      password: 'password123'
    });
    console.log('✅ User 1 (Owner) registered:', user1.data.user.username);

    const user2 = await axios.post(`${API_BASE}/auth/register`, {
      username: 'collaborator',
      email: 'collaborator@test.com',
      password: 'password123'
    });
    console.log('✅ User 2 (Collaborator) registered:', user2.data.user.username);

    const token1 = user1.data.token;
    const token2 = user2.data.token;

    // Test 2: User 1 creates a document
    console.log('\n2. User 1 creates a document...');
    const docResponse = await axios.post(`${API_BASE}/documents`, {
      title: 'Collaboration Test Document',
      content: 'This is a test document for collaboration',
      isPublic: false
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('✅ Document created by User 1');
    const documentId = docResponse.data.document._id;

    // Test 3: User 1 adds User 2 as collaborator
    console.log('\n3. User 1 adds User 2 as collaborator...');
    const collaboratorResponse = await axios.post(`${API_BASE}/documents/${documentId}/collaborators`, {
      userId: user2.data.user.id,
      permissions: 'write'
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('✅ Collaborator added successfully');
    console.log('   Collaborators:', collaboratorResponse.data.document.collaborators.length);

    // Test 4: User 2 tries to access the document
    console.log('\n4. User 2 accesses the document...');
    const accessResponse = await axios.get(`${API_BASE}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log('✅ User 2 can access the document');
    console.log('   Document title:', accessResponse.data.document.title);

    // Test 5: User 2 updates the document
    console.log('\n5. User 2 updates the document...');
    const updateResponse = await axios.put(`${API_BASE}/documents/${documentId}`, {
      content: 'Updated by collaborator!'
    }, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log('✅ User 2 successfully updated the document');
    console.log('   New content:', updateResponse.data.document.content);

    // Test 6: Test finding user by email
    console.log('\n6. Testing find user by email...');
    const emailResponse = await axios.get(`${API_BASE}/auth/by-email/collaborator@test.com`);
    console.log('✅ User found by email');
    console.log('   Username:', emailResponse.data.user.username);

    console.log('\n🎉 All collaborator tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - User registration: ✅');
    console.log('   - Document creation: ✅');
    console.log('   - Adding collaborator: ✅');
    console.log('   - Collaborator access: ✅');
    console.log('   - Collaborator editing: ✅');
    console.log('   - Find user by email: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
    console.error('Full error:', error.response?.data);
  }
}

// Run the test
testCollaboratorFunctionality();

