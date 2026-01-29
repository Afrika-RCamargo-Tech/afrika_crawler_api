import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { connectToDatabase } from './database';
import { UpdateModel } from './models/Update';

const app = new Hono();

// Habilita CORS para seu futuro frontend poder chamar essa API
app.use('/*', cors());

// Middleware para garantir conexão com o banco antes de responder
app.use('*', async (c, next) => {
  // Nota: Em serverless (Vercel), a conexão deve ser gerenciada com cuidado.
  // Como estamos rodando com Bun, ele gerencia bem o pool.
  await connectToDatabase();
  await next();
});

// Rota 1: Health Check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Afrika Crawler API is running 🚀' });
});

// Rota 2: Listar Updates (com paginação e filtros)
app.get('/updates', async (c) => {
  const tool = c.req.query('tool'); // ex: ?tool=Veracode
  const limit = Number(c.req.query('limit')) || 20;
  
  const query: any = {};
  if (tool) {
    // Busca Case Insensitive
    query.tool = { $regex: new RegExp(tool, 'i') };
  }

  try {
    const updates = await UpdateModel.find(query)
      .sort({ date: -1 }) // Mais recentes primeiro
      .limit(limit)
      .select('-_id -__v -uniqueId'); // Esconde campos internos do Mongo

    return c.json(updates);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Export para Bun (local)
export default { 
  port: 3000, 
  fetch: app.fetch 
};

