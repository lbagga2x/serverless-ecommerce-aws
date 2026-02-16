terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Import the existing API (you already did this)



# Import the existing API (you already did this)
import {
  to = aws_apigatewayv2_api.ecommerce_api
  id = "j0g9rdq8uh"
}

resource "aws_apigatewayv2_api" "ecommerce_api" {
  name          = "ecommerce-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }
}

# Create Cognito Authorizer for API Gateway
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.ecommerce_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_client_id]  # Using variable instead of hardcoded ID
    issuer   = "https://cognito-idp.us-east-1.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# Outputs
output "authorizer_id" {
  value = aws_apigatewayv2_authorizer.cognito.id
  description = "Cognito authorizer ID"
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.ecommerce_api.api_endpoint
}




