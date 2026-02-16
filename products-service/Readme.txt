

1. Create DynamoDB table in us-east-1:
aws dynamodb create-table \
  --table-name Products \
  --attribute-definitions AttributeName=productId,AttributeType=S \
  --key-schema AttributeName=productId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1


2. Seed data in us-east-1 dynamodb table:

3. Create the Lambda Function in file (index.js) and test it locally using AWS CLI:

4. Package Lambda for Deployment and verify the zip file
    `zip -r function.zip index.js node_modules/ package.json`
verify zip file:
    unzip -l function.zip | head -20

5. Create IAM Role for Lambda with DynamoDB access in us-east-1:
 trust-policy.json
 
 {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

6. Create the IAM Role using AWS CLI:
aws iam create-role \
  --role-name lambda-products-role \
  --assume-role-policy-document file://trust-policy.json

7. Attach policy to the role:
# Basic Lambda execution (for CloudWatch logs)
aws iam attach-role-policy \
  --role-name lambda-products-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# DynamoDB access
aws iam attach-role-policy \
  --role-name lambda-products-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

8. Deploy Lambda to AWS

    aws lambda create-function \
    --function-name products-service \
    --runtime nodejs18.x \
    --role arn:aws:iam::533567531086:role/lambda-products-role \
    --handler index.handler \
    --zip-file fileb://products-service/function.zip \
    --timeout 10 \
    --memory-size 256 \
    --region us-east-1 \
    --environment Variables="{TABLE_NAME=Products}"

To Invoke the Lambda function locally, you can use the AWS CLI command as follows:
aws lambda invoke \
  --function-name products-service \
  --cli-binary-format raw-in-base64-out \
  --payload '{"httpMethod":"GET","pathParameters":null,"body":null}' \
  --region us-east-1 \
  response.json


9. Lamda should be working and create API gateway and connect all the routes to the Lambda function. Make sure to integerate it 