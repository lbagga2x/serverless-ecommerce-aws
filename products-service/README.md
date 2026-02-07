# AWS Serverless E-Commerce API

A production-ready serverless API built with AWS services for managing an e-commerce product catalog.

## Architecture
```
API Gateway → Lambda → DynamoDB
```

## Tech Stack
- **API Gateway (HTTP API)** - RESTful endpoints
- **AWS Lambda** - Serverless compute (Node.js 18)
- **DynamoDB** - NoSQL database
- **AWS SDK v3** - AWS service integration

## Features
✅ Full CRUD operations
✅ Serverless architecture (pay-per-request)
✅ Auto-scaling
✅ Single-digit millisecond latency

## API Endpoints

**Base URL:** `https://****.amazonaws.com`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | Get all products |
| GET | /products/{id} | Get single product |
| POST | /products | Create product |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |

## Example Usage

### Get All Products
```bash
curl https://****.amazonaws.com/products
```

### Create Product
```bash
curl -X POST https://****.amazonaws.com/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 16",
    "price": 999.99,
    "stock": 100,
    "category": "Electronics"
  }'
```

## Cost
- DynamoDB: Pay-per-request (~$0.25 per million requests)
- Lambda: Free tier covers 1M requests/month
- API Gateway: Free tier covers 1M requests/month

**Estimated monthly cost: <$5 for development/testing**

## What I Learned
- Designing serverless architectures
- Working with NoSQL databases (DynamoDB)
- RESTful API design patterns
- AWS SDK v3 migration
- Infrastructure as code concepts
- API Gateway routing and integration