const axios = require('axios');

const API_BASE = 'http://localhost:5050/api';

async function testSquadAPI() {
  console.log('🧪 Testing Squad API...\n');

  try {
    // Test 1: Create Squad
    console.log('1. Testing Create Squad...');
    const createResponse = await axios.post(`${API_BASE}/squads`, {
      name: 'Test Squad Alpha',
      leaderId: '507f1f77bcf86cd799439012', // Use different user ID
      leaderName: 'Test Leader 2',
      leaderPubgId: 'TestLeader456'
    });
    
    if (createResponse.data.success) {
      console.log('✅ Squad created successfully:', createResponse.data.data.name);
      const squadId = createResponse.data.data._id;
      console.log('Debug: Squad ID for invite:', squadId);
      
      // Test 2: Get User Squad
      console.log('\n2. Testing Get User Squad...');
      const getResponse = await axios.get(`${API_BASE}/squads/user/507f1f77bcf86cd799439012`);
      
      if (getResponse.data.success) {
        console.log('✅ User squad retrieved:', getResponse.data.data.name);
        console.log('Debug: Retrieved squad ID:', getResponse.data.data._id);
      } else {
        console.log('ℹ️ User not in squad (expected for new user)');
      }
      
      // Test 3: Invite User to Squad
      console.log('\n3. Testing Invite User...');
      console.log('Debug: Attempting to invite to squad:', squadId);
      const inviteResponse = await axios.post(`${API_BASE}/squads/${squadId}/invite`, {
        invitedUserId: '507f1f77bcf86cd799439013' // Use different user ID
      });
      
      if (inviteResponse.data.success) {
        console.log('✅ User invited successfully');
        console.log('Squad now has', inviteResponse.data.data.members.length, 'members');
      } else {
        console.log('❌ Failed to invite user:', inviteResponse.data.error);
      }
      
      // Test 4: Remove User from Squad
      console.log('\n4. Testing Remove User...');
      const removeResponse = await axios.delete(`${API_BASE}/squads/${squadId}/members/507f1f77bcf86cd799439013`);
      
      if (removeResponse.data.success) {
        console.log('✅ User removed successfully');
        console.log('Squad now has', removeResponse.data.data.members.length, 'members');
      } else {
        console.log('❌ Failed to remove user:', removeResponse.data.error);
      }
      
    } else {
      console.log('❌ Failed to create squad:', createResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
  
  console.log('\n🏁 Squad API testing completed!');
}

// Run tests
testSquadAPI();
