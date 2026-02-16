# Load environment variables from .env file if it exists
-include .env

# Variables - Dynamically set based on current directory
FUNCTION_NAME ?= $(notdir $(CURDIR))
REGION ?= us-east-1

# Auth config (placeholders for public repo - override via .env or CLI)
USER_POOL_ID ?= YOUR_USER_POOL_ID
CLIENT_ID ?= YOUR_CLIENT_ID
# Tip: Keep your secret in a local .env file or pass via: make deploy CLIENT_SECRET=xxx
CLIENT_SECRET ?= YOUR_CLIENT_SECRET

.PHONY: deploy update-config zip info

# Main command: run 'make deploy'
deploy: zip
	@echo "Uploading code to $(FUNCTION_NAME)..."
	aws lambda update-function-code \
		--function-name $(FUNCTION_NAME) \
		--zip-file fileb://function.zip \
		--region $(REGION)

# Syncs your variables: run 'make update-config'
update-config:
	@echo "Syncing environment variables..."
	aws lambda update-function-configuration \
		--function-name $(FUNCTION_NAME) \
		--region $(REGION) \
		--environment "Variables={USER_POOL_ID=$(USER_POOL_ID),CLIENT_ID=$(CLIENT_ID),CLIENT_SECRET=$(CLIENT_SECRET)}"

# Internal zip command
zip:
	@echo "Zipping code..."
	zip -r function.zip . -x "*.git*" "Makefile" "function.zip"

# Show current configuration
info:
	@echo "Function Name: $(FUNCTION_NAME)"
	@echo "Region: $(REGION)"
	@echo "Working Directory: $(CURDIR)"