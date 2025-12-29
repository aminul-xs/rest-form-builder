// API Service
const API = {
  baseUrl: window.formBuilderConfig?.apiUrl || '/wp-json/form-builder/v1',
  nonce: window.formBuilderConfig?.nonce || '',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': this.nonce,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  },

  getForms() {
    return this.request('/forms');
  },

  getForm(id) {
    return this.request(`/forms/${id}`);
  },

  createForm(data) {
    return this.request('/forms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateForm(id, data) {
    return this.request(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteForm(id) {
    return this.request(`/forms/${id}`, {
      method: 'DELETE'
    });
  }
};


export default API;