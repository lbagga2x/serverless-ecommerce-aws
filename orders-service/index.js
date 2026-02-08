/*
 * @Author: Lalit Bagga 
 * @Date: 2026-02-08 12:34:28 
 * @Last Modified by: Lalit Bagga
 * @Last Modified time: 2026-02-08 18:46:57
 */
const mysql = require('mysql2/promise');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({ region: 'us-east-1', requestHandler: {
    connectionTimeout: 2000
  } });


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 10000 
});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const path = event.requestContext?.http?.path || event.path || '';
  const method = event.requestContext?.http?.method || event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};
  
  // Get user info from JWT token 
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const userId = claims.sub || 'anonymous';
  const userEmail = claims.email || body.email || 'test@example.com';
  
  let connection;
  
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // POST /orders - Create new order
    if (method === 'POST' && path.includes('/orders') && !path.includes('/orders/')) {
      const { items } = body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return response(400, {
          success: false,
          message: 'Missing required field: items (must be non-empty array)'
        });
      }
      
      // Validate items
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.price || !item.productName) {
          return response(400, {
            success: false,
            message: 'Each item must have: productId, productName, quantity, price'
          });
        }
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Start transaction
      await connection.beginTransaction();
      
      try {
        // 1. Insert order
        const [orderResult] = await connection.execute(
          'INSERT INTO orders (user_id, user_email, status, total) VALUES (?, ?, ?, ?)',
          [userId, userEmail, 'PENDING', total]
        );
        
        const orderId = orderResult.insertId;
        
        // 2. Insert order items
        for (const item of items) {
          await connection.execute(
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.productId, item.productName, item.quantity, item.price]
          );
        }
        
        // 3. Commit transaction
        await connection.commit();
        
        // 4. Send to SQS for async processing
        if (process.env.ORDER_QUEUE_URL) {
          try {
            await sqs.send(new SendMessageCommand({
              QueueUrl: process.env.ORDER_QUEUE_URL,
              MessageBody: JSON.stringify({
                orderId,
                userId,
                userEmail,
                items,
                total
              })
            }));
            console.log(`Order ${orderId} sent to SQS queue`);
          } catch (sqsError) {
            console.error('SQS error (non-fatal):', sqsError);
          }
        }
        
        return response(201, {
          success: true,
          message: 'Order created successfully',
          order: {
            orderId,
            userId,
            userEmail,
            status: 'PENDING',
            total,
            itemCount: items.length
          }
        });
        
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
    
    // GET /orders - Get all orders for user
    if (method === 'GET' && path === '/orders') {
      const [orders] = await connection.execute(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      
      return response(200, {
        success: true,
        count: orders.length,
        orders
      });
    }
    
    // GET /orders/{id} - Get single order with items
    if (method === 'GET' && path.match(/\/orders\/\d+$/)) {
      const orderId = path.split('/').pop();
      
      const [orders] = await connection.execute(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );
      
      if (orders.length === 0) {
        return response(404, {
          success: false,
          message: 'Order not found'
        });
      }
      
      const [items] = await connection.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId]
      );
      
      return response(200, {
        success: true,
        order: { ...orders[0], items }
      });
    }
    
    // PUT /orders/{id}/cancel - Cancel order
    if (method === 'PUT' && path.match(/\/orders\/\d+\/cancel$/)) {
      const orderId = path.split('/')[2];
      
      const [result] = await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND user_id = ? AND status = ?',
        ['CANCELLED', orderId, userId, 'PENDING']
      );
      
      if (result.affectedRows === 0) {
        return response(400, {
          success: false,
          message: 'Order not found or cannot be cancelled'
        });
      }
      
      return response(200, {
        success: true,
        message: 'Order cancelled successfully'
      });
    }
    
    return response(400, {
      success: false,
      message: 'Unsupported endpoint',
      debug: { path, method }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  } finally {
    // Release connection back to the pool
    if (connection) {
      connection.release();
    }
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}