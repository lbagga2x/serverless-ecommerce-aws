const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

  
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path || '';
  const body = event.body ? JSON.parse(event.body) : {};
  
  // Get user info from Cognito (passed by API Gateway authorizer)
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  const userGroups = claims?.['cognito:groups'] || [];
  const isAdmin = userGroups.includes('Admins');
  const userId = claims?.sub;
  const userEmail = claims?.email;
  
  console.log('User:', userEmail, 'Groups:', userGroups, 'IsAdmin:', isAdmin);
  
  // Admin-only operations
  const adminOperations = ['POST', 'PUT', 'DELETE'];
  if (adminOperations.includes(method) && path.includes('/products')) {
    if (!isAdmin) {
      return response(403, {
        success: false,
        message: 'Forbidden - Admin access required'
      });
    }
  }
  
  // GET /products - Anyone can view (public or authenticated)
  if (method === 'GET' && path === '/products') {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.TABLE_NAME
    }));
    
    return response(200, {
      success: true,
      count: result.Items.length,
      products: result.Items
    });
  }
  
  // GET /products/{id} - Anyone can view
  if (method === 'GET' && path.match(/\/products\/[^/]+$/)) {
    const productId = path.split('/').pop();
    
    const result = await dynamo.send(new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId }
    }));
    
    if (!result.Item) {
      return response(404, {
        success: false,
        message: 'Product not found'
      });
    }
    
    return response(200, {
      success: true,
      product: result.Item
    });
  }
  
  // POST /products - ADMIN ONLY (already checked above)
  if (method === 'POST' && path === '/products') {
    const { name, price, stock, category, description } = body;
    
    if (!name || !price || stock === undefined) {
      return response(400, {
        success: false,
        message: 'Missing required fields: name, price, stock'
      });
    }
    
    const productId = `prod_${Date.now()}`;
    
    await dynamo.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        productId,
        name,
        price,
        stock,
        category: category || 'Uncategorized',
        description: description || '',
        createdAt: new Date().toISOString(),
        createdBy: userEmail  // Track who created it
      }
    }));
    
    return response(201, {
      success: true,
      message: 'Product created successfully',
      product: { productId, name, price, stock }
    });
  }
  
  // PUT /products/{id} - ADMIN ONLY
  if (method === 'PUT' && path.match(/\/products\/[^/]+$/)) {
    const productId = path.split('/').pop();
    
    // Build update expression dynamically
    const updates = [];
    const values = {};
    const names = {};
    
    if (body.name) {
      updates.push('#name = :name');
      values[':name'] = body.name;
      names['#name'] = 'name';
    }
    if (body.price !== undefined) {
      updates.push('price = :price');
      values[':price'] = body.price;
    }
    if (body.stock !== undefined) {
      updates.push('stock = :stock');
      values[':stock'] = body.stock;
    }
    if (body.category) {
      updates.push('category = :category');
      values[':category'] = body.category;
    }
    if (body.description) {
      updates.push('description = :description');
      values[':description'] = body.description;
    }
    
    if (updates.length === 0) {
      return response(400, {
        success: false,
        message: 'No fields to update'
      });
    }
    
    updates.push('updatedAt = :updatedAt');
    values[':updatedAt'] = new Date().toISOString();
    
    updates.push('updatedBy = :updatedBy');
    values[':updatedBy'] = userEmail;
    
    await dynamo.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names })
    }));
    
    return response(200, {
      success: true,
      message: 'Product updated successfully'
    });
  }
  
  // DELETE /products/{id} - ADMIN ONLY
  if (method === 'DELETE' && path.match(/\/products\/[^/]+$/)) {
    const productId = path.split('/').pop();
    
    await dynamo.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId }
    }));
    
    return response(200, {
      success: true,
      message: 'Product deleted successfully'
    });
  }
  
  return response(400, {
    success: false,
    message: 'Unsupported endpoint'
  });
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