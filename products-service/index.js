/*
 * @Author: Lalit Bagga 
 * @Date: 2026-02-07 11:16:45 
 * @Last Modified by: Lalit Bagga
 * @Last Modified time: 2026-02-07 16:02:32
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'Products';

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
   // Parse the event (handles both direct invoke and API Gateway)
  let httpMethod, pathParameters, body;
  
  if (event.httpMethod) {
    // Direct Lambda invoke format
    httpMethod = event.httpMethod;
    pathParameters = event.pathParameters;
    body = event.body;
  } else if (event.requestContext) {
    // API Gateway format
    httpMethod = event.requestContext.http?.method || event.requestContext.httpMethod;
    pathParameters = event.pathParameters;
    body = event.body;
  } else {
    return response(400, {
      success: false,
      message: 'Invalid event format',
      debug: event
    });
  }

  try {
    // GET /products - List all products
    if (httpMethod === 'GET' && !pathParameters) {
      const result = await dynamo.send(new ScanCommand({
        TableName: TABLE_NAME
      }));
      
      return response(200, {
        success: true,
        count: result.Items.length,
        products: result.Items
      });
    }

    // GET /products/{id} - Get single product
    if (httpMethod === 'GET' && pathParameters?.id) {
      const result = await dynamo.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { productId: pathParameters.id }
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

    // POST /products - Create new product
    if (httpMethod === 'POST') {
      const product = JSON.parse(body);
      
      // Validate required fields
      if (!product.name || !product.price) {
        return response(400, {
          success: false,
          message: 'Missing required fields: name, price'
        });
      }
      
      // Add metadata
      product.productId = 'prod_' + Date.now();
      product.createdAt = new Date().toISOString();
      
      await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: product
      }));
      
      return response(201, {
        success: true,
        message: 'Product created successfully',
        product: product
      });
    }

    // PUT /products/{id} - Update product
    if (httpMethod === 'PUT' && pathParameters?.id) {
      const updates = JSON.parse(body);
      
      // Build update expression
      const updateExpression = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};
      
      Object.keys(updates).forEach((key, index) => {
        if (key !== 'productId') { // Don't update the key
          updateExpression.push(`#field${index} = :value${index}`);
          expressionAttributeNames[`#field${index}`] = key;
          expressionAttributeValues[`:value${index}`] = updates[key];
        }
      });
      
      if (updateExpression.length === 0) {
        return response(400, {
          success: false,
          message: 'No fields to update'
        });
      }
      
      await dynamo.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { productId: pathParameters.id },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }));
      
      return response(200, {
        success: true,
        message: 'Product updated successfully'
      });
    }

    // DELETE /products/{id} - Delete product
    if (httpMethod === 'DELETE' && pathParameters?.id) {
      await dynamo.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { productId: pathParameters.id }
      }));
      
      return response(200, {
        success: true,
        message: 'Product deleted successfully'
      });
    }

    // Unsupported method
    return response(400, { 
      success: false, 
      message: 'Unsupported HTTP method or path' 
    });

  } catch (error) {
    console.error('Error:', error);
    return response(500, { 
      success: false, 
      error: error.message 
    });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}