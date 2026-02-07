/*
 * @Author: Lalit Bagga 
 * @Date: 2026-02-07 11:04:31 
 * @Last Modified by: Lalit Bagga
 * @Last Modified time: 2026-02-07 11:05:56
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'Products';

const mockProducts = [
  {
    productId: 'prod_001',
    name: 'MacBook Pro 16"',
    price: 2499.99,
    stock: 15,
    category: 'Electronics',
    description: 'Apple M3 Max, 36GB RAM',
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_002',
    name: 'iPhone 15 Pro',
    price: 1299.99,
    stock: 50,
    category: 'Electronics',
    description: 'Titanium, 256GB',
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_003',
    name: 'AirPods Pro',
    price: 329.99,
    stock: 100,
    category: 'Electronics',
    description: 'USB-C, Active Noise Cancellation',
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_004',
    name: 'Magic Mouse',
    price: 99.99,
    stock: 75,
    category: 'Accessories',
    description: 'Wireless, Rechargeable',
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_005',
    name: 'iPad Air',
    price: 799.99,
    stock: 30,
    category: 'Electronics',
    description: '11-inch, M2 chip',
    createdAt: new Date().toISOString()
  }
];

async function seedDatabase() {
  console.log('Starting to seed Products table...\n');
  
  for (const product of mockProducts) {
    try {
      await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: product
      }));
      
      console.log(`✅ Added: ${product.name}`);
    } catch (error) {
      console.error(`❌ Failed to add ${product.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Database seeded successfully!');
}

seedDatabase();