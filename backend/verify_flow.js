const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const userEmail = `user_v2_${timestamp}@example.com`;
const collectorEmail = `col_v2_${timestamp}@example.com`;

async function testFlow() {
  try {
    console.log('--- Testing End-to-End Flow (V2: Collector first) ---');

    // 1. Register Collector FIRST
    console.log(`Registering Collector: ${collectorEmail}...`);
    const colRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Collector V2',
        email: collectorEmail,
        password: 'password123',
        phone: '0987654321',
        address: 'HSR Layout, Bengaluru',
        role: 'collector',
        area: 'HSR Layout',
        district: 'Bengaluru',
        location: { type: 'Point', coordinates: [77.63, 12.91] } // Set location for geo-matching
      })
    });
    const colReg = await colRegRes.json();
    if (!colReg.token) throw new Error('Collector registration failed: ' + JSON.stringify(colReg));
    const collectorToken = colReg.token;
    const collectorId = colReg._id; 
    console.log('Collector registered. ID:', collectorId);

    // 2. Register User
    console.log(`Registering User: ${userEmail}...`);
    const userRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User V2',
        email: userEmail,
        password: 'password123',
        phone: '1234567890',
        address: 'HSR Layout, Bengaluru',
        role: 'user',
        area: 'HSR Layout',
        district: 'Bengaluru'
      })
    });
    const userReg = await userRegRes.json();
    const userToken = userReg.token;
    console.log('User registered.');

    // 3. Create Pickup Request
    console.log('Creating Pickup Request...');
    const pickupResRaw = await fetch(`${API_URL}/user/pickup-request`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` 
      },
      body: JSON.stringify({
        wasteType: 'plastic',
        quantity: 15,
        pickupAddress: 'HSR Layout Sector 2, Bengaluru',
        area: 'HSR Layout',
        district: 'Bengaluru',
        location: { type: 'Point', coordinates: [77.63, 12.91] }
      })
    });
    const pickupRes = await pickupResRaw.json();
    console.log('Pickup Request Created. Assigned:', pickupRes.assigned);
    const requestId = pickupRes.data._id;
    const assignedCollectorId = pickupRes.data.assignedCollector;

    // 4. Fetch Collector Incoming Tasks
    console.log('Fetching Collector Pickup Requests...');
    const tasksResRaw = await fetch(`${API_URL}/collector/pickup-requests`, {
      headers: { 'Authorization': `Bearer ${collectorToken}` }
    });
    const tasksRes = await tasksResRaw.json();
    
    const tasks = tasksRes.data;
    console.log(`Found ${tasks.length} tasks for this collector.`);
    
    const isAssignedToThisCollector = assignedCollectorId && tasks.some(t => t._id === requestId);
    
    if (isAssignedToThisCollector) {
      console.log('✅ SUCCESS: Request is visible on the collectors dashboard!');
    } else {
        console.log('--- Debug Info ---');
        console.log('Request assigned to:', assignedCollectorId);
        console.log('Expected collector profile User ID:', userReg._id); // Wait, collector token is for collector
        // The collector profile ID is different from User ID.
        console.log('My Collector User ID (from login):', colReg._id);
        
        const myTasks = tasks.map(t => t._id);
        console.log('Tasks on my dashboard:', myTasks);
        
        if (myTasks.includes(requestId)) {
            console.log('✅ SUCCESS: Found it anyway (might be via area fallback if not assigned)');
        } else {
            console.log('❌ FAILURE: Still not visible.');
        }
    }

  } catch (error) {
    console.error('Error in test flow:', error.message);
  }
}

testFlow();
