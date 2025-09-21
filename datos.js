import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config({ path: "./.env" });

const url = process.env.DB_URI;
if (!url) throw new Error("❌ DB_URI no está definida");

const client = new MongoClient(url);
await client.connect();
console.log("✅ Conectado a MongoDB");

const db = client.db("coloresdb"); // tu DB
const usuariosCol = db.collection("usuarios");
const tareasCol = db.collection("tareas");

// 🔹 Buscar usuario
export async function buscarUsuario(usuario) {
  return await usuariosCol.findOne({ usuario });
}

// 🔹 Crear usuario
export async function crearUsuario(usuario, password) {
  const existe = await usuariosCol.findOne({ usuario });
  if (!existe) {
    const hash = await bcrypt.hash(password, 10);
    const nuevo = { usuario, password: hash };
    await usuariosCol.insertOne(nuevo);
  }
}

// 🔹 Leer tareas de un usuario
export async function leerTareas(idUsuario) {
  return await tareasCol.find({ usuario: new ObjectId(idUsuario) }).toArray();
}

// 🔹 Crear tarea
export async function crearTarea(texto, idUsuario) {
  const tarea = { texto, estado: false, usuario: new ObjectId(idUsuario) };
  const result = await tareasCol.insertOne(tarea);
  return result.insertedId;
}

// 🔹 Borrar tarea
export async function borrarTarea(id) {
  const result = await tareasCol.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount;
}

// 🔹 Editar texto
export async function editarTexto(id, nuevoTexto) {
  const result = await tareasCol.updateOne(
    { _id: new ObjectId(id) },
    { $set: { texto: nuevoTexto } }
  );
  return result.modifiedCount;
}

// 🔹 Cambiar estado
export async function editarEstado(id) {
  const tarea = await tareasCol.findOne({ _id: new ObjectId(id) });
  if (!tarea) return 0;
  const result = await tareasCol.updateOne(
    { _id: new ObjectId(id) },
    { $set: { estado: !tarea.estado } }
  );
  return result.modifiedCount;
}
