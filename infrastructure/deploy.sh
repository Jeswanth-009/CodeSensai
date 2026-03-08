#!/bin/bash
set -e

echo "🥋 Deploying CodeSensei to AWS..."

REGION=${AWS_REGION:-"us-east-1"}
STACK_NAME="codesensei-stack"
S3_BUCKET="codesensei-sam-deployments-$(aws sts get-caller-identity --query Account --output text)"

echo "📦 Creating S3 bucket for SAM deployments..."
aws s3 mb s3://$S3_BUCKET --region $REGION 2>/dev/null || true

echo "📦 Installing Lambda dependencies..."
for dir in ../lambda/explain ../lambda/followup ../lambda/complexity ../lambda/history ../lambda/health; do
  echo "  Installing $dir..."
  cd $dir && npm install --production && cd -
done

echo "🔨 Building SAM application..."
cd ..
sam build --template infrastructure/template.yaml

echo "🚀 Deploying to AWS..."
sam deploy \
  --stack-name $STACK_NAME \
  --s3-bucket $S3_BUCKET \
  --region $REGION \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo "✅ Deployment complete!"
echo ""
echo "📋 Stack outputs:"
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs' \
  --output table

API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo ""
echo "🌐 Your API URL: $API_URL"
echo ""
echo "👉 Update this in extension/src/sidebarProvider.ts:"
echo "   const API_BASE_URL = \"$API_URL\";"
