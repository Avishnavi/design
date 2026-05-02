import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[DEBUG] Calling API:', config.baseURL + config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (email, password, role) => api.post('/auth/login', { email, password, role }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Response Interceptor to handle unauthorized/forbidden errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and refresh if unauthorized
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const collectorAPI = {
  getDashboard: () => api.get('/collector/dashboard'),
  getPickupRequests: () => api.get('/collector/pickup-requests'),
  getPickupHistory: () => api.get('/collector/pickup-history'),
  getMonthlyPickups: () => api.get('/collector/monthly-pickups'),
  acceptRequest: (requestId) => api.post('/collector/accept-request', { requestId }),
  updateStatus: (requestId, status) => api.post('/collector/update-status', { requestId, status }),
  updateLocation: (coordinates) => api.post('/collector/update-location', { coordinates }),
  updateProfile: (profileData) => api.put('/collector/profile', profileData),
};

export default api;
