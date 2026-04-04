import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const shouldSkipDb = (name: string) =>
  ["admin", "local", "config"].includes(name);

const batchSize = 500;

const main = async () => {
  const sourceUri = requireEnv("OLD_MONGO_URL");
  const targetUri = requireEnv("MONGO_URL");

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  await sourceClient.connect();
  await targetClient.connect();

  const sourceAdmin = sourceClient.db().admin();
  const dbs = await sourceAdmin.listDatabases();
  const dbNames = dbs.databases
    .map((db) => db.name)
    .filter((name) => !shouldSkipDb(name));

  if (dbNames.length === 0) {
    console.log("No databases found to migrate.");
    await sourceClient.close();
    await targetClient.close();
    return;
  }

  console.log(`Databases to migrate: ${dbNames.join(", ")}`);

  for (const dbName of dbNames) {
    const sourceDb = sourceClient.db(dbName);
    const targetDb = targetClient.db(dbName);

    const collections = await sourceDb
      .listCollections({}, { nameOnly: true })
      .toArray();

    if (collections.length === 0) {
      console.log(`Skipping empty database: ${dbName}`);
      continue;
    }

    console.log(`\nMigrating database: ${dbName}`);

    for (const { name: collName } of collections) {
      if (!collName || collName.startsWith("system.")) continue;

      const sourceColl = sourceDb.collection(collName);
      const targetColl = targetDb.collection(collName);

      const total = await sourceColl.countDocuments();
      if (total === 0) {
        console.log(`  ${collName}: empty, skipped`);
        continue;
      }

      console.log(`  ${collName}: ${total} docs`);

      const cursor = sourceColl.find({});
      let batch: any[] = [];
      let processed = 0;

      for await (const doc of cursor) {
        batch.push({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true,
          },
        });

        if (batch.length >= batchSize) {
          await targetColl.bulkWrite(batch, { ordered: false });
          processed += batch.length;
          console.log(`    migrated ${processed}/${total}`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await targetColl.bulkWrite(batch, { ordered: false });
        processed += batch.length;
      }

      console.log(`    completed ${processed}/${total}`);
    }
  }

  await sourceClient.close();
  await targetClient.close();
  console.log("\nMigration complete.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
