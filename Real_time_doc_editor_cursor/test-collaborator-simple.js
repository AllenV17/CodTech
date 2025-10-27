// Simple test using fetch instead of axios
async function testCollaboratorFunctionality() {
  console.log('🧪 Testing Collaborator Functionality...\n');

  try {
    // Test 1: Register two users
    console.log('1. Registering two test users...');
    
    const user1Response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'owner',
        email: 'owner@test.com',
        password: 'password123'
      })
    });
    const user1 = await user1Response.json();
    console.log('✅ User 1 (Owner) registered:', user1.user.username);

    const user2Response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'collaborator',
        email: 'collaborator@test.com',
        password: 'password123'
      })
    });
    const user2 = await user2Response.json();
    console.log('✅ User 2 (Collaborator) registered:', user2.user.username);

    const token1 = user1.token;
    const token2 = user2.token;

    // Test 2: User 1 creates a document
    console.log('\n2. User 1 creates a document...');
    const docResponse = await fetch('http://localhost:5000/api/documents', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: 'Collaboration Test Document',
        content: 'This is a test document for collaboration',
        isPublic: false
      })
    });
    const doc = await docResponse.json();
    console.log('✅ Document created by User 1');
    const documentId = doc.document._id;

    // Test 3: Test finding user by email
    console.log('\n3. Testing find user by email...');
    const emailResponse = await fetch(`http://localhost:5000/api/auth/by-email/collaborator@test.com`);
    const emailUser = await emailResponse.json();
    console.log('✅ User found by email');
    console.log('   Username:', emailUser.user.username);
    console.log('   User ID:', emailUser.user._id);

    // Test 4: User 1 adds User 2 as collaborator
    console.log('\n4. User 1 adds User 2 as collaborator...');
    const collaboratorResponse = await fetch(`http://localhost:5000/api/documents/${documentId}/collaborators`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        userId: user2.user.id,
        permissions: 'write'
      })
    });
    
    if (collaboratorResponse.ok) {
      const collaboratorData = await collaboratorResponse.json();
      console.log('✅ Collaborator added successfully');
      console.log('   Collaborators:', collaboratorData.document.collaborators.length);
    } else {
      const error = await collaboratorResponse.json();
      console.log('❌ Failed to add collaborator:', error.message);
    }

    console.log('\n🎉 Collaborator test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCollaboratorFunctionality();

