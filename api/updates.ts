import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Schema do Update
const updateSchema = new mongoose.Schema({
  tool: { type: String, required: true },
  version: { type: String, required: true },
  date: { type: Date, required: true },
  description: String,
  link: String,
  uniqueId: { type: String, unique: true },
}, { timestamps: true });

const UpdateModel = mongoose.models.Update || mongoose.model('Update', updateSchema);

// Conexão com MongoDB
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  
  const uri = process.env.MONGODB_URI!;
  await mongoose.connect(uri);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    const { tool, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    const query: any = {};
    if (tool) {
      query.tool = { $regex: new RegExp(tool as string, 'i') };
    }

    const updates = await UpdateModel.find(query)
      .sort({ date: -1 })
      .limit(limitNum)
      .select('-_id -__v -uniqueId')
      .lean();

    return res.status(200).json(updates);
  } catch (error: any) {
    console.error('Error fetching updates:', error);
    return res.status(500).json({ error: error.message });
  }
}
