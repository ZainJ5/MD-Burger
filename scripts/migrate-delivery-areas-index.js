// Migration script to remove the unique constraint on delivery areas
// This allows the same delivery area name to be used for different branches

const mongoose = require('mongoose');

// Update this with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

async function migrateIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('deliveryareas');

    // Get existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop all unique indexes on name field
    const indexesToDrop = ['name_1', 'name_1_branch_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        console.log(`\nDropping index: ${indexName}...`);
        await collection.dropIndex(indexName);
        console.log(`✓ Successfully dropped ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`Index ${indexName} does not exist, skipping...`);
        } else {
          console.error(`Error dropping ${indexName}:`, error.message);
        }
      }
    }

    // Create new non-unique index (for query optimization)
    console.log('\nCreating non-unique index on name and branch...');
    await collection.createIndex({ name: 1, branch: 1 });
    console.log('✓ Successfully created non-unique index');

    // Show final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\n✓ Migration completed successfully!');
    console.log('You can now add the same delivery area name for different branches.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

migrateIndexes();
