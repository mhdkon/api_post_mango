import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  buscarUsuario,
  crearUsuario,
  leerTareas,
  crearTarea,
  borrarTarea,
  editarTexto,
  editarEstado
} from "./datos.js";

const servidor = express();
const PORT = process.env.PORT || 3000;

servidor.use(cors());
servidor.use(express.json());

// 🔹 Middleware de autorización
function autorizar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET, (err, datos) => {
    if (err) return res.sendStatus(401);
    req.usuario = datos.id;
    next();
  });
}

// 🔹 LOGIN
servidor.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.status(400).json({ error: "usuario o password vacío" });

  try {
    const datos = await buscarUsuario(usuario);
    if (!datos) return res.sendStatus(401);

    const valido = await bcrypt.compare(password, datos.password);
    if (!valido) return res.sendStatus(403);

    const token = jwt.sign({ id: datos._id }, process.env.SECRET);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error en el servidor" });
  }
});

// 🔹 Todas las rutas de tareas requieren autorización
servidor.use(autorizar);

// 🔹 Rutas de tareas
servidor.get("/tareas", async (req, res) => {
  try {
    const tareas = await leerTareas(req.usuario);
    res.json(tareas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error en el servidor" });
  }
});

servidor.post("/tareas/nueva", async (req, res) => {
  const { tarea } = req.body;
  if (!tarea || tarea.toString().trim() === "") return res.status(400).json({ error: "tarea vacía" });

  try {
    const id = await crearTarea(tarea, req.usuario);
    res.status(201).json({ id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error en el servidor" });
  }
});

servidor.delete("/tareas/borrar/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "ID inválido" });

  try {
    const cantidad = await borrarTarea(id);
    if (!cantidad) return res.status(404).json({ error: "tarea no encontrada" });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error en el servidor" });
  }
});

servidor.put("/tareas/actualizar/texto/:id", async (req, res) => {
  const id = req.params.id;
  const { tarea } = req.body;
  if (!id || !tarea || tarea.toString().trim() === "") return res.status(400).json({ error: "ID o texto inválido" });

  try {
    const cantidad = await editarTexto(id, tarea);
    if (!cantidad) return res.status(404).json({ error: "tarea no encontrada" });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error en el servidor" });
  }
});

servidor.put("/tareas/actualizar/estado/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "ID inválido" });

  try {
    const cantidad = await editarEstado(id);
    if (!cantidad) return res.status(404).json({ error: "tarea no encontrada" });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error en el servidor" });
  }
});

// 🔹 Manejo de rutas no encontradas
servidor.use((req, res) => {
  res.status(404).json({ error: "recurso no encontrado" });
});

