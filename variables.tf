variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serverless-ecommerce"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_security_group_id" {
  description = "Security group ID for the DB"
  type        = string
}

variable "db_subnet_ids" {
  description = "List of subnet IDs for the DB"
  type        = list(string)
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = "YOUR_USER_POOL_ID" # Overridden by terraform.tfvars or CLI
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
  default     = "YOUR_CLIENT_ID" # Overridden by terraform.tfvars or CLI
}
