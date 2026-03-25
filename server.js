import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes for Clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({ include: { ordens: true } });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const cliente = await prisma.cliente.create({ data: req.body });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Cliente deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes for Ordens de Serviço
app.get('/api/ordens', async (req, res) => {
  try {
    const ordens = await prisma.ordemServico.findMany({ include: { cliente: true } });
    res.json(ordens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ordens', async (req, res) => {
  try {
    const ordem = await prisma.ordemServico.create({ data: req.body });
    res.json(ordem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/ordens/:id', async (req, res) => {
  try {
    const ordem = await prisma.ordemServico.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(ordem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ordens/:id', async (req, res) => {
  try {
    await prisma.ordemServico.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Ordem deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes for Configurações
app.get('/api/configuracoes', async (req, res) => {
  try {
    const configs = await prisma.configuracao.findMany();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/configuracoes', async (req, res) => {
  try {
    const config = await prisma.configuracao.create({ data: req.body });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/configuracoes/:id', async (req, res) => {
  try {
    const config = await prisma.configuracao.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/configuracoes/:id', async (req, res) => {
  try {
    await prisma.configuracao.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Configuração deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});