import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config({ path: "./.env" });

const url = process.env.DB_URI;
const dbName = "coloresdb"; // tu DB

// 🔹 Buscar usuario
export async function buscarUsuario(usuario) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const usuariosCol = db.collection("usuarios");
    const resultado = await usuariosCol.findOne({ usuario });
    return resultado;
  } finally {
    await client.close();
  }
}

// 🔹 Crear usuario
export async function crearUsuario(usuario, password) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const usuariosCol = db.collection("usuarios");

    const existe = await usuariosCol.findOne({ usuario });
    if (!existe) {
      const hash = await bcrypt.hash(password, 10);
      const nuevo = { usuario, password: hash };
      await usuariosCol.insertOne(nuevo);
    }
  } finally {
    await client.close();
  }
}

// 🔹 Leer tareas de un usuario
export async function leerTareas(idUsuario) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const tareasCol = db.collection("tareas");
    const tareas = await tareasCol.find({ usuario: new ObjectId(idUsuario) }).toArray();
    return tareas;
  } finally {
    await client.close();
  }
}

// 🔹 Crear tarea
export async function crearTarea(texto, idUsuario) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const tareasCol = db.collection("tareas");

    const tarea = { texto, estado: false, usuario: new ObjectId(idUsuario) };
    const result = await tareasCol.insertOne(tarea);
    return result.insertedId;
  } finally {
    await client.close();
  }
}

// 🔹 Borrar tarea
export async function borrarTarea(id) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const tareasCol = db.collection("tareas");

    const result = await tareasCol.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount;
  } finally {
    await client.close();
  }
}

// 🔹 Editar texto
export async function editarTexto(id, nuevoTexto) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const tareasCol = db.collection("tareas");

    const result = await tareasCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { texto: nuevoTexto } }
    );
    return result.modifiedCount;
  } finally {
    await client.close();
  }
}

// 🔹 Cambiar estado
export async function editarEstado(id) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const tareasCol = db.collection("tareas");

    const tarea = await tareasCol.findOne({ _id: new ObjectId(id) });
    if (!tarea) return 0;

    const result = await tareasCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: !tarea.estado } }
    );
    return result.modifiedCount;
  } finally {
    await client.close();
  }
}
