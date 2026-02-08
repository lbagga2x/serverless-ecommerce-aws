/*
 * @Author: Lalit Bagga 
 * @Date: 2026-02-07 17:37:40 
 * @Last Modified by: Lalit Bagga
 * @Last Modified time: 2026-02-08 11:18:16
 */
const { 
  CognitoIdentityProviderClient, 
  SignUpCommand, 
  InitiateAuthCommand,
  GetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ 
  region: 'us-east-1' 
});

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET; 

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log("DEBUG - Region:", 'us-east-1');
    console.log("DEBUG - ClientID:", CLIENT_ID);
    console.log("DEBUG - PoolID:", USER_POOL_ID);
  
  const path = event.requestContext?.http?.path || event.path || '';
  const method = event.requestContext?.http?.method || event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    // POST /users/signup - Register new user
    if (method === 'POST' && path.includes('/signup')) {
      const { email, password, name } = body;
      
      if (!email || !password || !name) {
        return response(400, {
          success: false,
          message: 'Missing required fields: email, password, name'
        });
      }
      
        

        const signUpCommand = new SignUpCommand({
        ClientId: CLIENT_ID,
        SecretHash: calculateSecretHash(CLIENT_ID, CLIENT_SECRET, email), 
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name }
        ]
        });
      
      const result = await cognito.send(signUpCommand);
      
      return response(201, {
        success: true,
        message: 'User created successfully. Please check your email to verify your account.',
        userId: result.UserSub,
        userConfirmed: result.UserConfirmed
      });
    }
    
    // POST /users/login - Login user
    if (method === 'POST' && path.includes('/login')) {
      const { email, password } = body;
      
      if (!email || !password) {
        return response(400, {
          success: false,
          message: 'Missing required fields: email, password'
        });
      }
      
      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: calculateSecretHash(CLIENT_ID, CLIENT_SECRET, email),
        }
      });
      
      const result = await cognito.send(authCommand);
      
      return response(200, {
        success: true,
        message: 'Login successful',
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        expiresIn: result.AuthenticationResult.ExpiresIn
      });
    }
    
    // GET /users/me - Get current user info (requires auth)
    if (method === 'GET' && path.includes('/me')) {
      const authHeader = event.headers?.authorization || event.headers?.Authorization;
      
      if (!authHeader) {
        return response(401, {
          success: false,
          message: 'Missing authorization header'
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      const getUserCommand = new GetUserCommand({
        AccessToken: token
      });
      
      const result = await cognito.send(getUserCommand);
      
      // Parse user attributes
      const attributes = {};
      result.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });
      
      return response(200, {
        success: true,
        user: {
          username: result.Username,
          email: attributes.email,
          name: attributes.name,
          emailVerified: attributes.email_verified === 'true'
        }
      });
    }
    
    return response(400, {
      success: false,
      message: 'Unsupported endpoint',
      debug: { path, method }
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    // Handle Cognito-specific errors
    if (error.name === 'UsernameExistsException') {
      return response(400, {
        success: false,
        message: 'User already exists'
      });
    }
    
    if (error.name === 'NotAuthorizedException') {
      return response(401, {
        success: false,
        message: 'Invalid email or password'
      })
    }
    
    if (error.name === 'UserNotConfirmedException') {
      return response(400, {
        success: false,
        message: 'Please verify your email before logging in'
      });
    }
    
    return response(500, {
      success: false,
      error: error.message,
      errorType: error.name
    });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

const crypto = require('crypto');

function calculateSecretHash(clientId, clientSecret, username) {
  return crypto
    .createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}





        