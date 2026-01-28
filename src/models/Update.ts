import mongoose from 'mongoose';

export interface IToolUpdate {
  tool: string;
  version: string;
  date: Date;
  description: string;
  link: string;
  uniqueId: string;
}

const UpdateSchema = new mongoose.Schema({
  tool: { type: String, required: true },
  version: { type: String, required: true },
  date: { type: Date, required: true },
  description: String,
  link: String,
  // uniqueId garante que não salvaremos a mesma versão duas vezes
  uniqueId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const UpdateModel = mongoose.model<IToolUpdate>('Update', UpdateSchema);