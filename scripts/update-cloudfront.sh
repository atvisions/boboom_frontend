#!/bin/bash

# 更新 CloudFront 分发配置以支持动态路由
# 使用方法: ./scripts/update-cloudfront.sh

set -e

DISTRIBUTION_ID="E2JQHE60J8I0EQ"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo_info "开始更新 CloudFront 分发配置..."
echo_info "分发 ID: $DISTRIBUTION_ID"

# 获取当前配置
echo_info "获取当前分发配置..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/current-distribution.json

# 提取配置和ETag
ETAG=$(cat /tmp/current-distribution.json | jq -r '.ETag')
echo_info "当前 ETag: $ETAG"

# 提取分发配置
cat /tmp/current-distribution.json | jq '.DistributionConfig' > /tmp/distribution-config.json

# 更新错误页面配置
echo_info "更新错误页面配置..."
cat /tmp/distribution-config.json | jq '
.CustomErrorResponses = {
  "Quantity": 3,
  "Items": [
    {
      "ErrorCode": 400,
      "ResponsePagePath": "/index.html", 
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    },
    {
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200", 
      "ErrorCachingMinTTL": 0
    },
    {
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    }
  ]
}' > /tmp/updated-distribution-config.json

# 应用更新
echo_info "应用配置更新..."
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file:///tmp/updated-distribution-config.json \
    --if-match $ETAG

echo_success "CloudFront 配置更新完成！"

# 清除缓存
echo_info "清除 CloudFront 缓存..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null

echo_success "缓存清除请求已提交"

# 清理临时文件
rm -f /tmp/current-distribution.json /tmp/distribution-config.json /tmp/updated-distribution-config.json

echo_success "✨ 更新完成！"
echo_warning "注意: CloudFront 配置更新可能需要 10-15 分钟才能生效"
echo_info "CloudFront URL: https://d7o0a9w3bjh84.cloudfront.net"
