const API_BASE = 'http://localhost:3001/api';

export const localClient = {
  // Clientes
  async getClientes() {
    const response = await fetch(`${API_BASE}/clientes`);
    return response.json();
  },

  async createCliente(data) {
    const response = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateCliente(id, data) {
    const response = await fetch(`${API_BASE}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteCliente(id) {
    const response = await fetch(`${API_BASE}/clientes/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Ordens de Serviço
  async getOrdens() {
    const response = await fetch(`${API_BASE}/ordens`);
    return response.json();
  },

  async createOrdem(data) {
    const response = await fetch(`${API_BASE}/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateOrdem(id, data) {
    const response = await fetch(`${API_BASE}/ordens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteOrdem(id) {
    const response = await fetch(`${API_BASE}/ordens/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Configurações
  async getConfiguracoes() {
    const response = await fetch(`${API_BASE}/configuracoes`);
    return response.json();
  },

  async createConfiguracao(data) {
    const response = await fetch(`${API_BASE}/configuracoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateConfiguracao(id, data) {
    const response = await fetch(`${API_BASE}/configuracoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteConfiguracao(id) {
    const response = await fetch(`${API_BASE}/configuracoes/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Mock upload for now
  async uploadFile(file) {
    return { url: 'mock-url' };
  }
};