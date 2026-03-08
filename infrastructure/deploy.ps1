# CodeSensei AWS Deployment Script (PowerShell)
Write-Host "🥋 Deploying CodeSensei to AWS..." -ForegroundColor Cyan

$REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-2" }
$STACK_NAME = "codesensei-stack"

Write-Host "📦 Installing Lambda dependencies..." -ForegroundColor Yellow
$lambdaDirs = @("explain", "followup", "complexity", "history", "health")
foreach ($dir in $lambdaDirs) {
    $path = Join-Path $PSScriptRoot "..\lambda\$dir"
    Write-Host "  Installing $dir..."
    Push-Location $path
    npm install --production
    Pop-Location
}

Write-Host "📂 Copying shared module into each Lambda..." -ForegroundColor Yellow
$sharedDir = Join-Path $PSScriptRoot "..\lambda\shared"
foreach ($dir in $lambdaDirs) {
    $targetShared = Join-Path $PSScriptRoot "..\lambda\$dir\shared"
    if (Test-Path $targetShared) { Remove-Item $targetShared -Recurse -Force }
    Copy-Item $sharedDir $targetShared -Recurse
    Write-Host "  Copied shared -> $dir/shared"
}

Write-Host "🔨 Building SAM application..." -ForegroundColor Yellow
Push-Location (Join-Path $PSScriptRoot "..")
sam build --template infrastructure/template.yaml

Write-Host "🚀 Deploying to AWS..." -ForegroundColor Green
sam deploy `
    --stack-name $STACK_NAME `
    --region $REGION `
    --capabilities CAPABILITY_IAM `
    --no-confirm-changeset `
    --no-fail-on-empty-changeset `
    --resolve-s3

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Stack outputs:" -ForegroundColor Cyan
aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $REGION `
    --query 'Stacks[0].Outputs' `
    --output table

$API_URL = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $REGION `
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' `
    --output text

Write-Host ""
Write-Host "🌐 Your API URL: $API_URL" -ForegroundColor Green
Write-Host ""
Write-Host "👉 Set this in VS Code Settings: codesensei.apiUrl = $API_URL" -ForegroundColor Yellow
Pop-Location
