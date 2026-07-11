const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('creatoriq_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Check if response is empty
  const contentType = response.headers.get("content-type");
  let data = {};
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    register: (name, email, password, agencyName) => 
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, agency_name: agencyName }),
      }),
    login: (email, password) => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request('/auth/me'),
  },
  creators: {
    list: () => request('/creators'),
    create: (creator) => 
      request('/creators', {
        method: 'POST',
        body: JSON.stringify(creator),
      }),
    update: (id, fields) => 
      request(`/creators/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      }),
    delete: (id) => 
      request(`/creators/${id}`, {
        method: 'DELETE',
      }),
  },
  agency: {
    get: () => request('/agency/profile'),
    update: (profile) => 
      request('/agency/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },
  analytics: {
    get: () => request('/analytics'),
  },
  social: {
    list: () => request('/social-media'),
    toggle: (platformId, connected) => 
      request('/social-media/toggle', {
        method: 'POST',
        body: JSON.stringify({ platform_id: platformId, connected }),
      }),
  },
  settings: {
    get: () => request('/settings'),
    update: (settings) => 
      request('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
  status: {
    list: () => request('/status'),
    create: (clientName) => 
      request('/status', {
        method: 'POST',
        body: JSON.stringify({ client_name: clientName }),
      }),
  }
};
