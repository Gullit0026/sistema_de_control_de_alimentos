const { MongoClient } = require('mongodb');

let cliente;
let db;

async function conectar() {
  if (db) return db;

  cliente = new MongoClient(process.env.MONGODB_URI);
  await cliente.connect();
  db = cliente.db(process.env.MONGODB_DB);

  console.log(`MongoDB conectado — base de datos: ${process.env.MONGODB_DB}`);
  return db;
}

function obtenerDb() {
  if (!db) {
    throw new Error('La base de datos no está conectada. Llama a conectar() primero.');
  }
  return db;
}

module.exports = { conectar, obtenerDb };
