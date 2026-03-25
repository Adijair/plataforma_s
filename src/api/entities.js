import { localClient } from './localClient';

export const Cliente = {
  list: () => localClient.getClientes(),
  create: (data) => localClient.createCliente(data),
  update: (id, data) => localClient.updateCliente(id, data),
  delete: (id) => localClient.deleteCliente(id),
};

export const OrdemServico = {
  list: () => localClient.getOrdens(),
  create: (data) => localClient.createOrdem(data),
  update: (id, data) => localClient.updateOrdem(id, data),
  delete: (id) => localClient.deleteOrdem(id),
};

export const Configuracao = {
  list: () => localClient.getConfiguracoes(),
  create: (data) => localClient.createConfiguracao(data),
  update: (id, data) => localClient.updateConfiguracao(id, data),
  delete: (id) => localClient.deleteConfiguracao(id),
};

export const User = null; // auth not used for local mode