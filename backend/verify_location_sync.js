const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const dealerEmail = `dealer_loc_${timestamp}@example.com`;

async function testLocationSync() {
  try {
    console.log('--- Testing Hierarchical Location Sync ---');

    // 1. Register Dealer with Location Hierarchy
    console.log(`Registering Dealer: ${dealerEmail}...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Loc Test Dealer',
        email: dealerEmail,
        password: 'password123',
        phone: '1234567890',
        address: '123 Main St',
        role: 'scrapDealer',
        area: 'Koramangala',
        district: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        location: { type: 'Point', coordinates: [77.62, 12.93] }
      })
    });
    const regData = await regRes.json();
    if (!regData.token) throw new Error('Registration failed: ' + JSON.stringify(regData));
    const token = regData.token;
    console.log('Dealer registered successfully.');

    // 2. Verify Dealer Profile via GET
    console.log('Fetching Profile to verify initial location...');
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    const user = profileData.data;

    if (user.area === 'Koramangala' && user.district === 'Bengaluru') {
      console.log('✅ SUCCESS: User document saved hierarchical location.');
    } else {
      console.log('❌ FAILURE: User document location mismatch:', { area: user.area, district: user.district });
    }

    // 3. Update Profile
    console.log('Updating profile location...');
    const updateRes = await fetch(`${API_URL}/dealer/update-profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        area: 'Indiranagar',
        district: 'Bengaluru East',
        name: 'Updated Dealer Name'
      })
    });
    const updateData = await updateRes.json();
    console.log('Update Response:', updateData.message);

    // 4. Verify Final Sync
    const finalProfileRes = await fetch(`${API_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalProfileData = await finalProfileRes.json();
    const finalUser = finalProfileData.data;

    if (finalUser.area === 'Indiranagar' && finalUser.name === 'Updated Dealer Name') {
      console.log('✅ SUCCESS: Profile update synced to User document.');
    } else {
      console.log('❌ FAILURE: Profile sync failed:', { area: finalUser.area, name: finalUser.name });
    }

  } catch (error) {
    console.error('Error in location sync test:', error.message);
  }
}

testLocationSync();
