import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

// Conectar a MongoDB
await mongoose.connect(process.env.DB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error al conectar:", err));

// Definir esquema y modelo local
const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Usuario = mongoose.model("Usuario", usuarioSchema);

async function listarUsuarios() {
  try {
    const usuarios = await Usuario.find();
    console.log("Usuarios en la base de datos:");
    usuarios.forEach(u => {
      console.log(`- ID: ${u._id} | Usuario: ${u.usuario} | Contraseña: ${u.password}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

listarUsuarios();
