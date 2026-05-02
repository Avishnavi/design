const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw { response: { data } };
  }
  return { data };
};

export const userAPI = {
  getHistory: () => fetchAPI('/user/pickup-history'),
  createPickup: (data) => fetchAPI('/user/pickup-request', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  getProfile: () => fetchAPI('/user/profile'),
  updateProfile: (data) => fetchAPI('/user/update-profile', { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  getNearbyDealers: (lat, lng, wasteType, area, district) => {
    const params = new URLSearchParams({
      lat,
      lng,
      wasteType: wasteType || '',
      area: area || '',
      district: district || ''
    });
    return fetchAPI(`/user/nearby-dealers?${params.toString()}`);
  },
};

export default fetchAPI;
