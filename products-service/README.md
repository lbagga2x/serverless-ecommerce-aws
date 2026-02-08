# AWS Serverless E-Commerce Microservices API

A production-ready serverless microservices backend built with AWS for managing e-commerce operations including products, users, and orders.

## 🏗️ Architecture
```
                    API Gateway (HTTP API)
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
  Products Service    Users Service      Orders Service
   (Lambda + DynamoDB) (Lambda + Cognito) (Lambda + RDS + SQS)
```

## 🚀 Tech Stack

**Compute & API:**
- AWS API Gateway (HTTP API) - RESTful endpoints
- AWS Lambda (Node.js 18) - Serverless functions
- AWS SDK v3 - Modern AWS service integration

**Data Layer:**
- Amazon DynamoDB - NoSQL for products (key-value access patterns)
- Amazon Cognito - User authentication & authorization
- Amazon RDS Aurora Serverless - SQL for orders (ACID transactions)

**Integration & Orchestration:**
- Amazon SQS - Async order processing queue
- AWS Step Functions - Order fulfillment workflow
- Amazon CloudWatch - Logging & monitoring

## ✨ Features

### Products Service
✅ Full CRUD operations  
✅ DynamoDB single-table design  
✅ Sub-10ms response times  
✅ Auto-scaling with pay-per-request pricing  

### Users Service
✅ Email/password authentication  
✅ JWT token-based authorization  
✅ Secure password policies  
✅ Email verification flow  

### Orders Service (Coming Soon)
🚧 Create orders with transactions  
🚧 Link orders to users  
🚧 Async processing with SQS  
🚧 Step Functions workflow orchestration  

## 📡 API Endpoints

**Base URL:** `https://******.amazonaws.com`

### Products API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products | No |
| GET | `/products/{id}` | Get single product | No |
| POST | `/products` | Create product | No* |
| PUT | `/products/{id}` | Update product | No* |
| DELETE | `/products/{id}` | Delete product | No* |

*Note: In production, these would require admin authentication

### Users API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/signup` | Register new user | No |
| POST | `/users/login` | Login user | No |
| GET | `/users/me` | Get current user info | Yes |

## 🔧 Example Usage

### Products

**Get all products:**
```bash
curl https://***.amazonaws.com/products
```

**Create a product:**
```bash
curl -X POST https://***.amazonaws.com/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 16 Pro",
    "price": 1299.99,
    "stock": 50,
    "category": "Electronics",
    "description": "Latest iPhone with A18 Pro chip"
  }'
```

### Users

**Sign up:**
```bash
curl -X POST https://***.amazonaws.com/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST https://***.amazonaws.com/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Get user info (requires token):**
```bash
curl https://***.amazonaws.com/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 💰 Cost Analysis

**Current setup (development/testing):**
- **DynamoDB:** Pay-per-request (~$0.25 per 1M requests)
- **Lambda:** Free tier covers 1M requests/month
- **API Gateway:** Free tier covers 1M requests/month  
- **Cognito:** Free tier covers 50K MAU (Monthly Active Users)

**Estimated monthly cost: $0-5** for hobby/portfolio projects

**Production estimate (10K users, 100K requests/day):**
- **Total: ~$15-30/month** vs ~$200/month for EC2-based architecture

**Cost savings: 85-90%** compared to traditional infrastructure

## 🎯 Architecture Decisions

### Why DynamoDB for Products?
- Simple key-value access patterns (`productId` → product data)
- No complex relationships needed
- Predictable single-digit millisecond latency
- Auto-scaling without capacity planning
- Most cost-effective for read-heavy workloads

### Why Cognito for Users?
- Eliminates need to build auth from scratch
- Industry-standard JWT tokens
- Built-in password policies and security
- Email verification flows included
- Integrates seamlessly with API Gateway authorizers

### Why RDS Aurora Serverless for Orders? (Planned)
- Orders require ACID transactions (order + order_items)
- Complex queries needed (user order history, analytics)
- Relational data model fits SQL better
- Aurora Serverless scales to zero (cost-effective)

### Why SQS + Step Functions? (Planned)
- Decouple order creation from processing
- Handle inventory checks, payments asynchronously
- Built-in retry logic and dead-letter queues
- Step Functions for complex multi-step workflows

## 🧪 Local Development

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS account

### Setup

1. **Clone repository**
```bash
git clone https://github.com/lbagga2x/aws-ecommerce-api.git
cd aws-ecommerce-api
```

2. **Install dependencies**
```bash
cd products-service && npm install
cd ../users-service && npm install
```

3. **Deploy to AWS**
```bash
# Package Lambda functions
cd products-service
zip -r function.zip index.js node_modules/ package.json

# Deploy (example for products-service)
aws lambda update-function-code \
  --function-name products-service \
  --zip-file fileb://function.zip \
  --region us-east-1
```

## 📚 What I Learned

### Technical Skills
- Designing microservices architectures on AWS
- Choosing appropriate databases for different use cases (NoSQL vs SQL)
- Implementing JWT-based authentication with Cognito
- Working with event-driven patterns (SQS, Step Functions)
- Infrastructure cost optimization strategies
- API Gateway routing and Lambda integrations
- Migrating from AWS SDK v2 to v3

### System Design Concepts
- Single-table design for DynamoDB
- Database transaction handling in distributed systems
- Async processing patterns with message queues
- Idempotency in distributed systems
- Observability and monitoring strategies

## 🚧 Roadmap

- [x] Products CRUD API with DynamoDB
- [x] User authentication with Cognito
- [ ] Orders service with RDS Aurora
- [ ] Async order processing with SQS
- [ ] Order fulfillment workflow with Step Functions
- [ ] API Gateway authorizers for protected routes
- [ ] CloudWatch dashboards and alarms
- [ ] Infrastructure as Code with Terraform
- [ ] CI/CD pipeline with GitHub Actions