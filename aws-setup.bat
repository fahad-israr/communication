@echo off
setlocal enabledelayedexpansion

REM Set your AWS region
set AWS_REGION=us-east-1

echo Creating DynamoDB table...
aws dynamodb create-table --table-name catty-thoughts --attribute-definitions AttributeName=id,AttributeType=S AttributeName=timestamp,AttributeType=S --key-schema AttributeName=id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE --billing-mode PAY_PER_REQUEST --region %AWS_REGION%

echo Creating IAM role for Lambda...
aws iam create-role --role-name catty-portal-role --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":\"sts:AssumeRole\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"}}]}"

REM Attach basic Lambda execution policy
aws iam attach-role-policy --role-name catty-portal-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

REM Get AWS Account ID
for /f "tokens=* USEBACKQ" %%a in (`aws sts get-caller-identity --query Account --output text`) do set AWS_ACCOUNT=%%a

REM Create custom policy for DynamoDB access
aws iam put-role-policy --role-name catty-portal-role --policy-name catty-portal-dynamodb-policy --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"dynamodb:PutItem\"],\"Resource\":\"arn:aws:dynamodb:%AWS_REGION%:%AWS_ACCOUNT%:table/catty-thoughts\"}]}"

echo Waiting for IAM role to be ready...
timeout /t 15

echo Creating Lambda function...
REM First, create a deployment package
cd backend
call npm install
powershell Compress-Archive -Path * -DestinationPath ..\function.zip -Force
cd ..

REM Get the role ARN
for /f "tokens=* USEBACKQ" %%a in (`aws iam get-role --role-name catty-portal-role --query Role.Arn --output text`) do set ROLE_ARN=%%a

REM Create Lambda function
aws lambda create-function --function-name catty-portal --runtime nodejs18.x --handler index.handler --role "!ROLE_ARN!" --zip-file fileb://function.zip --region %AWS_REGION%

REM Create function URL
aws lambda create-function-url-config --function-name catty-portal --auth-type NONE --cors "{\"AllowOrigins\":[\"*\"],\"AllowMethods\":[\"POST\",\"OPTIONS\"],\"AllowHeaders\":[\"*\"],\"ExposeHeaders\":[\"*\"],\"MaxAge\":86400}"

REM Get the function URL
for /f "tokens=* USEBACKQ" %%a in (`aws lambda get-function-url-config --function-name catty-portal --query FunctionUrl --output text`) do set FUNCTION_URL=%%a

echo Setup complete!
echo Your Lambda function URL is: !FUNCTION_URL!
echo Please update your frontend .env file with this URL

REM Cleanup
del function.zip

pause 