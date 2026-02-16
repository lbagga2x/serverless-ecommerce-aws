resource "aws_db_instance" "orders_db" {
  identifier           = "ecommerce-orders-free"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"  # Free tier
  allocated_storage    = 20             # Free tier max
  storage_type         = "gp2"
  
  db_name  = "ecommerce"
  username = "admin"
  password = "Test1234!"  # Change this!
  
  # Use your existing VPC
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = ["sg-0ad1f01d0b42e7ecc"]  # Your existing security group
  
  # Public access for development
  publicly_accessible = true
  
  # Disable backups to stay free
  backup_retention_period = 0
  skip_final_snapshot     = true
  
  # Free tier settings
  multi_az               = false
  storage_encrypted      = false
  
  tags = {
    Name = "ecommerce-orders-free"
  }
}

# Subnet group (required for VPC)
resource "aws_db_subnet_group" "main" {
  name       = "ecommerce-db-subnet-group"
  subnet_ids = [
    "subnet-0f18b65a17bca528d",
    "subnet-0d9ef73520a589835"
  ]
  
  tags = {
    Name = "ecommerce-db-subnet-group"
  }
}

# Output endpoint for Lambda
output "rds_endpoint" {
  value = aws_db_instance.orders_db.endpoint
  description = "RDS endpoint - use this in Lambda"
}