import mongoose from 'mongoose';
import dns from 'dns';

export async function connectToDatabase() {
  // O Bun carrega o .env automaticamente
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("❌ MONGODB_URI não definida no .env");
  }

  // --- SEU FIX DE DNS ---
  // Necessário em alguns ambientes corporativos ou conexões específicas
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    console.log("🔧 DNS configurado para usar servidores públicos");
  } catch (e) {
    console.warn("⚠️ Não foi possível definir servidores DNS manuais (pode ser ignorado se rodar ok).");
  }
  // ----------------------

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Conectado ao MongoDB Atlas.");
  } catch (error: any) {
    console.error("❌ Erro fatal ao conectar no Banco:", error.message);
    process.exit(1); // Encerra o script com erro
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}