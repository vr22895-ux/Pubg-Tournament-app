const axios = require('axios');

const API_BASE = 'http://localhost:5050/api';

async function testSquadEdgeCases() {
  console.log('🧪 Testing Squad Edge Cases...\n');

  const testResults = [];

  // Test 1: Create squad with empty name
  try {
    console.log('1. Testing Create Squad with Empty Name...');
    const response = await axios.post(`${API_BASE}/squads`, {
      name: '',
      leaderId: '507f1f77bcf86cd799439011',
      leaderName: 'Test Leader',
      leaderPubgId: 'TestLeader123'
    });
    testResults.push({ test: 'Empty Squad Name', passed: false, error: 'Should have failed' });
  } catch (error) {
    if (error.response?.status === 400) {
      testResults.push({ test: 'Empty Squad Name', passed: true, error: null });
      console.log('✅ Correctly rejected empty squad name');
    } else {
      testResults.push({ test: 'Empty Squad Name', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 2: Create squad with very long name
  try {
    console.log('\n2. Testing Create Squad with Very Long Name...');
    const longName = 'A'.repeat(100);
    const response = await axios.post(`${API_BASE}/squads`, {
      name: longName,
      leaderId: '507f1f77bcf86cd799439011',
      leaderName: 'Test Leader',
      leaderPubgId: 'TestLeader123'
    });
    testResults.push({ test: 'Very Long Squad Name', passed: false, error: 'Should have failed' });
  } catch (error) {
    if (error.response?.status === 400) {
      testResults.push({ test: 'Very Long Squad Name', passed: true, error: null });
      console.log('✅ Correctly rejected very long squad name');
    } else {
      testResults.push({ test: 'Very Long Squad Name', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 3: Create squad with invalid leader ID
  try {
    console.log('\n3. Testing Create Squad with Invalid Leader ID...');
    const response = await axios.post(`${API_BASE}/squads`, {
      name: 'Test Squad',
      leaderId: 'invalid-id',
      leaderName: 'Test Leader',
      leaderPubgId: 'TestLeader123'
    });
    testResults.push({ test: 'Invalid Leader ID', passed: false, error: 'Should have failed' });
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      testResults.push({ test: 'Invalid Leader ID', passed: true, error: null });
      console.log('✅ Correctly rejected invalid leader ID');
    } else {
      testResults.push({ test: 'Invalid Leader ID', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 4: Create squad with missing required fields
  try {
    console.log('\n4. Testing Create Squad with Missing Fields...');
    const response = await axios.post(`${API_BASE}/squads`, {
      name: 'Test Squad'
      // Missing leaderId, leaderName, leaderPubgId
    });
    testResults.push({ test: 'Missing Required Fields', passed: false, error: 'Should have failed' });
  } catch (error) {
    if (error.response?.status === 400) {
      testResults.push({ test: 'Missing Required Fields', passed: true, error: null });
      console.log('✅ Correctly rejected missing required fields');
    } else {
      testResults.push({ test: 'Missing Required Fields', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 5: Invite user to non-existent squad
  try {
    console.log('\n5. Testing Invite to Non-existent Squad...');
    const response = await axios.post(`${API_BASE}/squads/507f1f77bcf86cd799439999/invite`, {
      invitedUserId: '507f1f77bcf86cd799439012'
    });
    testResults.push({ test: 'Invite to Non-existent Squad', passed: false, error: 'Should have failed' });
  } catch (error) {
    if (error.response?.status === 404) {
      testResults.push({ test: 'Invite to Non-existent Squad', passed: true, error: null });
      console.log('✅ Correctly rejected invite to non-existent squad');
    } else {
      testResults.push({ test: 'Invite to Non-existent Squad', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 6: Remove user from non-existent squad
  try {
    console.log('\n6. Testing Remove from Non-existent Squad...');
    const response = await axios.delete(`${API_BASE}/squads/507f1f77bcf86cd799439999/members/507f1f77bcf86cd799439012`);
    testResults.push({ test: 'Remove from Non-existent Squad', passed: false, error: 'Should have failed' });
  } catch (error) {
    if (error.response?.status === 404) {
      testResults.push({ test: 'Remove from Non-existent Squad', passed: true, error: null });
      console.log('✅ Correctly rejected remove from non-existent squad');
    } else {
      testResults.push({ test: 'Remove from Non-existent Squad', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 7: Get squad for non-existent user
  try {
    console.log('\n7. Testing Get Squad for Non-existent User...');
    const response = await axios.get(`${API_BASE}/squads/user/507f1f77bcf86cd799439999`);
    if (response.data.success === false) {
      testResults.push({ test: 'Get Squad for Non-existent User', passed: true, error: null });
      console.log('✅ Correctly handled non-existent user');
    } else {
      testResults.push({ test: 'Get Squad for Non-existent User', passed: false, error: 'Should have failed' });
    }
  } catch (error) {
    if (error.response?.status === 404) {
      testResults.push({ test: 'Get Squad for Non-existent User', passed: true, error: null });
      console.log('✅ Correctly rejected non-existent user');
    } else {
      testResults.push({ test: 'Get Squad for Non-existent User', passed: false, error: 'Unexpected error' });
    }
  }

  // Test 8: Create multiple squads for same user
  try {
    console.log('\n8. Testing Create Multiple Squads for Same User...');
    
    // Create first squad
    const squad1Response = await axios.post(`${API_BASE}/squads`, {
      name: 'First Squad',
      leaderId: '507f1f77bcf86cd799439011',
      leaderName: 'Test Leader',
      leaderPubgId: 'TestLeader123'
    });
    
    if (squad1Response.data.success) {
      console.log('✅ First squad created');
      
      // Try to create second squad
      try {
        const squad2Response = await axios.post(`${API_BASE}/squads`, {
          name: 'Second Squad',
          leaderId: '507f1f77bcf86cd799439011',
          leaderName: 'Test Leader',
          leaderPubgId: 'TestLeader123'
        });
        testResults.push({ test: 'Multiple Squads for Same User', passed: false, error: 'Should have failed' });
      } catch (error) {
        if (error.response?.status === 400) {
          testResults.push({ test: 'Multiple Squads for Same User', passed: true, error: null });
          console.log('✅ Correctly prevented multiple squads for same user');
        } else {
          testResults.push({ test: 'Multiple Squads for Same User', passed: false, error: 'Unexpected error' });
        }
      }
    } else {
      testResults.push({ test: 'Multiple Squads for Same User', passed: false, error: 'Failed to create first squad' });
    }
  } catch (error) {
    testResults.push({ test: 'Multiple Squads for Same User', passed: false, error: error.message });
  }

  // Test 9: Invite user to full squad
  try {
    console.log('\n9. Testing Invite to Full Squad...');
    
    // Create a squad with 4 members (max)
    const fullSquadResponse = await axios.post(`${API_BASE}/squads`, {
      name: 'Full Squad',
      leaderId: '507f1f77bcf86cd799439013',
      leaderName: 'Full Leader',
      leaderPubgId: 'FullLeader123'
    });
    
    if (fullSquadResponse.data.success) {
      const squadId = fullSquadResponse.data.data._id;
      
      // Add 3 more members to make it full
      for (let i = 0; i < 3; i++) {
        await axios.post(`${API_BASE}/squads/${squadId}/invite`, {
          invitedUserId: `507f1f77bcf86cd79943901${4 + i}`
        });
      }
      
      // Try to invite one more
      try {
        const inviteResponse = await axios.post(`${API_BASE}/squads/${squadId}/invite`, {
          invitedUserId: '507f1f77bcf86cd799439020'
        });
        testResults.push({ test: 'Invite to Full Squad', passed: false, error: 'Should have failed' });
      } catch (error) {
        if (error.response?.status === 400) {
          testResults.push({ test: 'Invite to Full Squad', passed: true, error: null });
          console.log('✅ Correctly prevented invite to full squad');
        } else {
          testResults.push({ test: 'Invite to Full Squad', passed: false, error: 'Unexpected error' });
        }
      }
    } else {
      testResults.push({ test: 'Invite to Full Squad', passed: false, error: 'Failed to create full squad' });
    }
  } catch (error) {
    testResults.push({ test: 'Invite to Full Squad', passed: false, error: error.message });
  }

  // Test 10: Remove leader from squad
  try {
    console.log('\n10. Testing Remove Leader from Squad...');
    
    // Create a squad
    const squadResponse = await axios.post(`${API_BASE}/squads`, {
      name: 'Leader Test Squad',
      leaderId: '507f1f77bcf86cd799439021',
      leaderName: 'Leader Test',
      leaderPubgId: 'LeaderTest123'
    });
    
    if (squadResponse.data.success) {
      const squadId = squadResponse.data.data._id;
      
      // Try to remove the leader
      try {
        const removeResponse = await axios.delete(`${API_BASE}/squads/${squadId}/members/507f1f77bcf86cd799439021`);
        testResults.push({ test: 'Remove Leader from Squad', passed: false, error: 'Should have failed' });
      } catch (error) {
        if (error.response?.status === 400) {
          testResults.push({ test: 'Remove Leader from Squad', passed: true, error: null });
          console.log('✅ Correctly prevented leader removal');
        } else {
          testResults.push({ test: 'Remove Leader from Squad', passed: false, error: 'Unexpected error' });
        }
      }
    } else {
      testResults.push({ test: 'Remove Leader from Squad', passed: false, error: 'Failed to create test squad' });
    }
  } catch (error) {
    testResults.push({ test: 'Remove Leader from Squad', passed: false, error: error.message });
  }

  // Print test results summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = testResults.filter(result => result.passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All edge case tests passed! Squad system is robust.');
  } else {
    console.log('⚠️ Some edge case tests failed. Review implementation.');
  }
}

// Run edge case tests
testSquadEdgeCases();
