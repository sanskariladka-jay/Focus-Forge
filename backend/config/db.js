const mongoose = require("mongoose");
const dns = require("dns");

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

/**
 * Manually resolve the mongodb+srv:// URI into a standard mongodb:// URI
 * using Google DNS, bypassing the local/restricted DNS server.
 */
async function resolveSrvUri(srvUri) {
  const url = new URL(srvUri);
  const srvHost = url.hostname; // e.g. focus-forge.dwrkntd.mongodb.net

  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.0.0", "8.8.4.4"]);

  // Resolve SRV records
  const srvRecords = await new Promise((resolve, reject) => {
    resolver.resolveSrv(`_mongodb._tcp.${srvHost}`, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });

  // Resolve TXT records for options (authSource, replicaSet, etc.)
  let txtOptions = "";
  try {
    const txtRecords = await new Promise((resolve, reject) => {
      resolver.resolveTxt(srvHost, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    if (txtRecords.length > 0) {
      txtOptions = txtRecords[0].join("");
    }
  } catch {
    // TXT records are optional
  }

  // Build standard mongodb:// connection string
  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
  const auth = url.username
    ? `${url.username}:${url.password}@`
    : "";
  const dbName = url.pathname || "/";
  const existingParams = url.search ? url.search.slice(1) : "";
  const allParams = [txtOptions, existingParams, "ssl=true"]
    .filter(Boolean)
    .join("&");

  return `mongodb://${auth}${hosts}${dbName}?${allParams}`;
}

const connectDB = async (attempt = 1) => {
  try {
    let uri = process.env.MONGO_URI;

    // If using srv:// format, resolve it manually via Google DNS
    if (uri.startsWith("mongodb+srv://")) {
      console.log("Resolving SRV via Google DNS...");
      uri = await resolveSrvUri(uri);
      console.log("SRV resolved successfully.");
    }

    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(
      `MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`,
      error.message
    );
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    } else {
      console.error("Max retries reached. Could not connect to MongoDB.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;