import mongoose from "mongoose";
import { root } from "./root.js";
import { Academy } from "../../models/index.js";

const getURL = (dbName) => {
  return `${process.env[
    "DB_URL"
  ].trim()}/${dbName}?retryWrites=true&w=majority`;
};

const conn = { root };
let isConnected = false;

if (process.env.NODE_ENV.trim() !== "test") {
  Academy.find({}, (err, academies) => {
    academies.forEach((academy) => {
      if (academy.academyId != "root") {
        conn[academy.academyId] = mongoose.createConnection(
          getURL(academy.dbName)
        );
      }
    });
    console.log("✅ MongoDB is connected");
    isConnected = true;
  }).select("+dbName");
}

const addConnection = (academy) => {
  conn[academy.academyId] = mongoose.createConnection(getURL(academy.dbName));
  console.log(`coonection to [${academy.academyId}(${academy.dbName})]is made`);
};

const deleteConnection = async (academyId) => {
  await conn[academyId].db.dropDatabase();
  delete conn[academyId];
  console.log(`coonection to [${academyId}]is removed`);
};

export { conn, addConnection, deleteConnection, isConnected };
