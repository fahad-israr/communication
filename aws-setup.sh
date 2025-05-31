#!/bin/bash

# Set your AWS region
AWS_REGION="us-east-1"  # Change this to your preferred region

echo "Creating DynamoDB table..."
aws dynamodb create-table \
    --table-name catty-thoughts \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

echo "Creating IAM role for Lambda..."
# Create IAM role
aws iam create-role \
    --role-name catty-portal-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }'

# Attach basic Lambda execution policy
aws iam attach-role-policy \
    --role-name catty-portal-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for DynamoDB access
aws iam put-role-policy \
    --role-name catty-portal-role \
    --policy-name catty-portal-dynamodb-policy \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:'$AWS_REGION':'$(aws sts get-caller-identity --query Account --output text)':table/catty-thoughts"
        }]
    }'

# Wait for role creation to propagate
echo "Waiting for IAM role to be ready..."
sleep 15

echo "Creating Lambda function..."
# First, create a deployment package
cd backend
npm install
zip -r ../function.zip ./*

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name catty-portal-role --query Role.Arn --output text)

# Create Lambda function
cd ..
aws lambda create-function \
    --function-name catty-portal \
    --runtime nodejs18.x \
    --handler index.handler \
    --role "$ROLE_ARN" \
    --zip-file fileb://function.zip \
    --region $AWS_REGION

# Create function URL
aws lambda create-function-url-config \
    --function-name catty-portal \
    --auth-type NONE \
    --cors '{
        "AllowOrigins": ["*"],
        "AllowMethods": ["POST", "OPTIONS"],
        "AllowHeaders": ["*"],
        "ExposeHeaders": ["*"],
        "MaxAge": 86400
    }'

# Get the function URL
FUNCTION_URL=$(aws lambda get-function-url-config --function-name catty-portal --query FunctionUrl --output text)

echo "Setup complete!"
echo "Your Lambda function URL is: $FUNCTION_URL"
echo "Please update your frontend .env file with this URL"

# Cleanup
rm function.zip 