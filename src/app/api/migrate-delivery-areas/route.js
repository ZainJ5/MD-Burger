import connectDB from '@/app/lib/mongoose';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('deliveryareas');

    const result = {
      steps: [],
      success: false
    };

    // Get existing indexes
    const indexes = await collection.indexes();
    result.steps.push({
      step: 'Current indexes',
      data: indexes
    });

    // List of problematic unique indexes to drop
    const indexesToDrop = ['name_1', 'name_1_branch_1'];
    
    for (const indexName of indexesToDrop) {
      const indexExists = indexes.some(idx => idx.name === indexName);
      
      if (indexExists) {
        try {
          await collection.dropIndex(indexName);
          result.steps.push({
            step: `Dropped index: ${indexName}`,
            status: 'success'
          });
        } catch (error) {
          result.steps.push({
            step: `Drop index: ${indexName}`,
            status: 'error',
            error: error.message
          });
        }
      } else {
        result.steps.push({
          step: `Check index: ${indexName}`,
          status: 'skipped',
          message: 'Index does not exist'
        });
      }
    }

    // Create new non-unique compound index for query optimization
    try {
      await collection.createIndex({ name: 1, branch: 1 });
      result.steps.push({
        step: 'Created non-unique compound index (name + branch)',
        status: 'success'
      });
    } catch (error) {
      result.steps.push({
        step: 'Create non-unique compound index',
        status: 'error',
        error: error.message
      });
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    result.steps.push({
      step: 'Final indexes',
      data: finalIndexes
    });

    result.success = true;
    result.message = 'Migration completed successfully! You can now add the same delivery area name for different branches.';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}
