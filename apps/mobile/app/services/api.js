const SecureStore = require('expo-secure-store');

const TOKEN_KEY = 'oficios.session.token';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

async function saveToken(token) {
  if (!token) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function buildQuery(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    params.append(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

async function request(path, options = {}) {
  const token = options.token || (await getToken());
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error || 'Request failed');
    error.details = payload?.details || null;
    error.status = response.status;
    throw error;
  }

  return payload;
}

const api = {
  saveToken,
  getToken,
  clearToken,
  login(body) {
    return request('/auth/login', { method: 'POST', body });
  },
  register(body) {
    return request('/auth/register', { method: 'POST', body });
  },
  socialLogin(body) {
    return request('/auth/social', { method: 'POST', body });
  },
  me(token) {
    return request('/auth/me', { token });
  },
  logout(token) {
    return request('/auth/logout', { method: 'POST', token });
  },
  activateProfessionalRole(body, token) {
    return request('/auth/roles/professional', { method: 'POST', token, body });
  },
  categories() {
    return request('/categories');
  },
  professionals(query) {
    return request(`/professionals${buildQuery(query)}`);
  },
  professional(id, token) {
    return request(`/professionals/${id}`, { token });
  },
  myProfessionalProfile(token) {
    return request('/professionals/me', { token });
  },
  saveProfessionalProfile(body, token) {
    return request('/professionals/me', { method: 'PUT', token, body });
  },
  saveProfessionalCategories(body, token) {
    return request('/professionals/me/categories', { method: 'PUT', token, body });
  },
  saveProfessionalServiceAreas(body, token) {
    return request('/professionals/me/service-areas', { method: 'PUT', token, body });
  },
  saveProfessionalWorkPosts(body, token) {
    return request('/professionals/me/work-posts', { method: 'PUT', token, body });
  },
  createImageUploadIntent(body, token) {
    return request('/uploads/images/intents', { method: 'POST', token, body });
  },
  submitProfessionalProfile(token) {
    return request('/professionals/me/submit', { method: 'POST', token });
  },
  serviceRequests(query, token) {
    return request(`/service-requests${buildQuery(query)}`, { token });
  },
  serviceRequest(id, token) {
    return request(`/service-requests/${id}`, { token });
  },
  createServiceRequest(body, token) {
    return request('/service-requests', { method: 'POST', token, body });
  },
  updateServiceRequestStatus(id, body, token) {
    return request(`/service-requests/${id}/status`, { method: 'PATCH', token, body });
  },
  createServiceRequestMessage(id, body, token) {
    return request(`/service-requests/${id}/messages`, { method: 'POST', token, body });
  },
  reviews(query) {
    return request(`/reviews${buildQuery(query)}`);
  },
  createReview(body, token) {
    return request('/reviews', { method: 'POST', token, body });
  },
  notifications(token) {
    return request('/notifications', { token });
  },
  readNotification(id, token) {
    return request(`/notifications/${id}/read`, { method: 'PATCH', token });
  },
  adminOverview(token) {
    return request('/admin/overview', { token });
  },
  adminCategories(token) {
    return request('/admin/categories', { token });
  },
  adminUsers(query, token) {
    return request(`/admin/users${buildQuery(query)}`, { token });
  },
  adminProfessionals(query, token) {
    return request(`/admin/professionals${buildQuery(query)}`, { token });
  },
  moderateProfessional(id, body, token) {
    return request(`/admin/professionals/${id}/status`, { method: 'PATCH', token, body });
  },
  adminReviews(query, token) {
    return request(`/admin/reviews${buildQuery(query)}`, { token });
  },
  moderateReview(id, body, token) {
    return request(`/admin/reviews/${id}/status`, { method: 'PATCH', token, body });
  },
  adminServiceRequests(query, token) {
    return request(`/admin/service-requests${buildQuery(query)}`, { token });
  },
  createCategory(body, token) {
    return request('/admin/categories', { method: 'POST', token, body });
  },
  updateCategory(id, body, token) {
    return request(`/admin/categories/${id}`, { method: 'PATCH', token, body });
  },
};

module.exports = {
  API_URL,
  api,
};
