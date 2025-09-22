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

// 🔹 Middlewares
servidor.use(cors());
servidor.use(express.json());

// 🔹 Middleware de autorización
function autorizar(peticion, respuesta, siguiente) {
  const authHeader = peticion.headers.authorization;
  if (!authHeader) return respuesta.sendStatus(401);

  const token = authHeader.split(" ")[1];
  if (!token) return respuesta.sendStatus(401);

  jwt.verify(token, process.env.SECRET, (err, datos) => {
    if (err) return respuesta.sendStatus(401);
    peticion.usuario = datos.id;
    siguiente();
  });
}

// 🔹 LOGIN
servidor.post("/login", async (peticion, respuesta) => {
  const { usuario, password } = peticion.body;
  if (!usuario || !password) return respuesta.status(400).json({ error: "usuario o password vacío" });

  try {
    const datos = await buscarUsuario(usuario);
    if (!datos) return respuesta.sendStatus(401);

    const valido = await bcrypt.compare(password, datos.password);
    if (!valido) return respuesta.sendStatus(403);

    const token = jwt.sign({ id: datos._id }, process.env.SECRET);
    respuesta.json({ token });
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: "error en el servidor" });
  }
});

// 🔹 Todas las rutas de tareas requieren autorización
servidor.use(autorizar);

// 🔹 Rutas de tareas
servidor.get("/tareas", async (siguiente, respuesta) => {
  try {
    const tareas = await leerTareas(siguiente.usuario);
    respuesta.json(tareas);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: "error en el servidor" });
  }
});

servidor.post("/tareas/nueva", async (siguiente, respuesta) => {
  const { tarea } = siguiente.body;
  if (!tarea || tarea.toString().trim() === "") return respuesta.status(400).json({ error: "tarea vacía" });

  try {
    const id = await crearTarea(tarea, siguiente.usuario);
    respuesta.status(201).json({ id });
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: "error en el servidor" });
  }
});

servidor.delete("/tareas/borrar/:id", async (peticion, respuesta) => {
  const id = peticion.params.id;
  if (!id) return respuesta.status(400).json({ error: "ID inválido" });

  try {
    const cantidad = await borrarTarea(id);
    if (!cantidad) return respuesta.status(404).json({ error: "tarea no encontrada" });
    respuesta.sendStatus(204);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: "error en el servidor" });
  }
});

servidor.put("/tareas/actualizar/texto/:id", async (siguiente, respuesta) => {
  const id = siguiente.params.id;
  const { tarea } = siguiente.body;
  if (!id || !tarea || tarea.toString().trim() === "") return respuesta.status(400).json({ error: "ID o texto inválido" });

  try {
    const cantidad = await editarTexto(id, tarea);
    if (!cantidad) return respuesta.status(404).json({ error: "tarea no encontrada" });
    respuesta.sendStatus(204);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: "error en el servidor" });
  }
});

servidor.put("/tareas/actualizar/estado/:id", async (siguiente, respuesta) => {
  const id = siguiente.params.id;
  if (!id) return respuesta.status(400).json({ error: "ID inválido" });

  try {
    const cantidad = await editarEstado(id);
    if (!cantidad) return respuesta.status(404).json({ error: "tarea no encontrada" });
    respuesta.sendStatus(204);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: "error en el servidor" });
  }
});

// 🔹 Manejo de rutas no encontradas
servidor.use((siguiente, respuesta) => {
  respuesta.status(404).json({ error: "recurso no encontrado" });
});

// 🔹 Crear usuario de prueba al iniciar servidor
(async () => {
  try {
    await crearUsuario("vikis", "1234");
    console.log("Usuario de prueba creado o ya existente");
  } catch (error) {
    console.error("Error creando usuario:", error);
  }
})();

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
servidor.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
