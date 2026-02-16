/*
 * @Author: Lalit Bagga 
 * @Date: 2026-02-08 18:58:34 
 * @Last Modified by: Lalit Bagga
 * @Last Modified time: 2026-02-09 12:35:07
 */
const mysql = require('mysql2/promise');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const sfn = new SFNClient({ region: 'us-east-1' });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

exports.handler = async (event) => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));
  
  let connection;
  
  for (const record of event.Records) {
    try {
      const order = JSON.parse(record.body);
      const { orderId, userId, userEmail, items, total } = order;
      
      console.log(`Processing order ${orderId}...`);
      
      // 1. Check inventory in DynamoDB
      console.log('Checking inventory...');
      const inventoryOk = await checkInventory(items);
      
      if (!inventoryOk) {
        console.log(`Order ${orderId}: Inventory check failed`);
        await updateOrderStatus(orderId, 'CANCELLED');
        // TODO: Send notification to user
        continue;
      }
      
      // 2. Process payment (mock - always succeeds)
      console.log('Processing payment...');
      const paymentOk = await processPayment(orderId, total);
      
      if (!paymentOk) {
        console.log(`Order ${orderId}: Payment failed`);
        await updateOrderStatus(orderId, 'CANCELLED');
        continue;
      }
      
      // 3. Reduce inventory in DynamoDB
      console.log('Updating inventory...');
      await reduceInventory(items);
      
      // 4. Update order status to PROCESSING
      await updateOrderStatus(orderId, 'PROCESSING');
      
      // 5. Trigger Step Functions workflow (if configured)
      if (process.env.STEP_FUNCTION_ARN) {
        console.log('Starting Step Functions workflow...');
        
        await sfn.send(new StartExecutionCommand({
          stateMachineArn: process.env.STEP_FUNCTION_ARN,
          input: JSON.stringify({
            orderId,
            userId,
            userEmail,
            items,
            total
          })
        }));
        
        console.log(`Order ${orderId}: Workflow started`);
      }
      
      console.log(`✅ Order ${orderId} processed successfully`);
      
    } catch (error) {
      console.error('Error processing order:', error);
      // Message will return to queue for retry
      throw error;
    }
  }
  
  if (connection) {
    await connection.end();
  }
};


// Check if all products have enough stock
async function checkInventory(items) {
  for (const item of items) {
    try {
      const result = await dynamo.send(new GetCommand({
        TableName: 'Products',
        Key: { productId: item.productId }
      }));
      
      if (!result.Item) {
        console.log(`Product ${item.productId} not found`);
        return false;
      }
      
      if (result.Item.stock < item.quantity) {
        console.log(`Product ${item.productId}: insufficient stock (need ${item.quantity}, have ${result.Item.stock})`);
        return false;
      }
    } catch (error) {
      console.error(`Error checking inventory for ${item.productId}:`, error);
      return false;
    }
  }
  
  return true;
}

// Mock payment processing (always succeeds for now)
async function processPayment(orderId, amount) {
  console.log(`Processing payment for order ${orderId}: $${amount}`);
  
  // Simulate payment API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In real app, you'd call Stripe, PayPal, etc.
  // For demo, 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    console.log(`Payment successful: $${amount}`);
  } else {
    console.log('Payment failed (simulated failure)');
  }
  
  return success;
}

// Reduce stock in DynamoDB
async function reduceInventory(items) {
  for (const item of items) {
    try {
      await dynamo.send(new UpdateCommand({
        TableName: 'Products',
        Key: { productId: item.productId },
        UpdateExpression: 'SET stock = stock - :quantity',
        ExpressionAttributeValues: {
          ':quantity': item.quantity
        }
      }));
      
      console.log(`Reduced stock for ${item.productId} by ${item.quantity}`);
    } catch (error) {
      console.error(`Error reducing inventory for ${item.productId}:`, error);
      throw error;
    }
  }
}

// Update order status in RDS
async function updateOrderStatus(orderId, status) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    console.log(`Order ${orderId} status updated to ${status}`);
  } catch (error) {
    console.error(`Error updating order status:`, error);
    throw error;
  } finally {
    await connection.end();
  }
}