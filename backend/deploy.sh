#!/bin/bash

# Create a temporary directory for the deployment package
mkdir -p deploy

# Copy the function code
cp index.js deploy/
cp package.json deploy/

# Install production dependencies
cd deploy
npm install --production

# Create the deployment package
zip -r ../deployment.zip .

# Clean up
cd ..
rm -rf deploy

# Deploy to Lambda
aws lambda update-function-code --function-name catty-portal --zip-file fileb://deployment.zip

# Clean up the deployment package
rm deployment.zip

echo "Deployment complete!" 