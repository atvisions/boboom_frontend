#!/bin/bash

# AWS S3 + CloudFront 简单部署脚本
# 使用 AWS CLI 进行部署

set -e

# 配置变量
ENVIRONMENT=${1:-production}
# 根据环境设置正确的存储桶名称
if [ "$ENVIRONMENT" = "production" ]; then
    BUCKET_NAME="boboom-frontend-production"
else
    BUCKET_NAME="boboom-frontend-${ENVIRONMENT}"
fi
REGION="us-east-1"
BUILD_DIR="out"

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

# 检查依赖
check_dependencies() {
    echo_info "检查依赖..."
    
    if ! command -v aws &> /dev/null; then
        echo_error "AWS CLI 未安装，请先安装 AWS CLI"
        echo "安装方法: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo_error "AWS CLI 未配置，请先运行 'aws configure'"
        exit 1
    fi
    
    echo_success "依赖检查通过"
}

# 检查构建文件
check_build() {
    echo_info "检查构建文件..."
    
    if [ ! -d "$BUILD_DIR" ]; then
        echo_error "构建目录不存在: $BUILD_DIR"
        echo "请先运行: npm run build"
        exit 1
    fi
    
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        echo_error "index.html 文件不存在"
        echo "请确保构建成功完成"
        exit 1
    fi
    
    echo_success "构建文件检查通过"
}

# 创建 S3 存储桶
setup_s3_bucket() {
    echo_info "设置 S3 存储桶: $BUCKET_NAME"
    
    # 检查存储桶是否存在
    if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        echo_success "S3 存储桶已存在: $BUCKET_NAME"
    else
        echo_info "创建 S3 存储桶: $BUCKET_NAME"
        if [ "$REGION" = "us-east-1" ]; then
            # us-east-1 不需要 LocationConstraint
            aws s3api create-bucket \
                --bucket "$BUCKET_NAME" \
                --region "$REGION"
        else
            # 其他区域需要 LocationConstraint
            aws s3api create-bucket \
                --bucket "$BUCKET_NAME" \
                --region "$REGION" \
                --create-bucket-configuration LocationConstraint="$REGION"
        fi
        echo_success "S3 存储桶创建完成"
    fi
    
    # 配置静态网站托管
    echo_info "配置静态网站托管..."
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html

    # 禁用阻止公共访问设置
    echo_info "禁用阻止公共访问设置..."
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

    # 配置公共读取权限
    echo_info "配置存储桶策略..."
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy \
        --bucket "$BUCKET_NAME" \
        --policy file:///tmp/bucket-policy.json
    
    rm /tmp/bucket-policy.json
    echo_success "S3 存储桶配置完成"
}

# 上传文件到 S3
upload_files() {
    echo_info "上传文件到 S3..."
    
    # 同步文件到 S3，设置缓存控制
    aws s3 sync "$BUILD_DIR/" "s3://$BUCKET_NAME/" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "*.html" \
        --exclude "*.json"
    
    # HTML 文件使用短缓存
    aws s3 sync "$BUILD_DIR/" "s3://$BUCKET_NAME/" \
        --delete \
        --cache-control "public, max-age=300, s-maxage=300" \
        --include "*.html" \
        --content-type "text/html"
    
    # JSON 文件使用中等缓存
    aws s3 sync "$BUILD_DIR/" "s3://$BUCKET_NAME/" \
        --delete \
        --cache-control "public, max-age=3600, s-maxage=3600" \
        --include "*.json" \
        --content-type "application/json"
    
    echo_success "文件上传完成"
}

# 设置 CloudFront 分发
setup_cloudfront() {
    echo_info "设置 CloudFront 分发..."

    # 使用现有的CloudFront分发ID
    if [ "$ENVIRONMENT" = "production" ]; then
        DISTRIBUTION_ID="E2JQHE60J8I0EQ"
        DOMAIN_NAME="d7o0a9w3bjh84.cloudfront.net"
        echo_success "使用现有的 CloudFront 分发: $DISTRIBUTION_ID"
        echo "  域名: $DOMAIN_NAME"
        echo "  URL: https://$DOMAIN_NAME"
    else
        # 检查是否已存在分发（仅用于非生产环境）
        DISTRIBUTION_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Comment=='BOBOOM Frontend $ENVIRONMENT'].Id" \
            --output text)

        if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
            echo_success "CloudFront 分发已存在: $DISTRIBUTION_ID"
        else
            echo_info "创建 CloudFront 分发..."

            # 创建分发配置
            cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "boboom-frontend-$ENVIRONMENT-$(date +%s)",
    "Comment": "BOBOOM Frontend $ENVIRONMENT",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 2,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            },
            {
                "Id": "API-Backend",
                "DomainName": "api.boboom.fun",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "https-only",
                    "OriginSslProtocols": {
                        "Quantity": 1,
                        "Items": ["TLSv1.2"]
                    }
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "ForwardedValues": {
            "QueryString": true,
            "QueryStringCacheKeys": {
                "Quantity": 1,
                "Items": ["address"]
            },
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 0
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "Compress": true,
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["HEAD", "GET"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["HEAD", "GET"]
            }
        }
    },
    "CacheBehaviors": {
        "Quantity": 2,
        "Items": [
            {
                "PathPattern": "/api/*",
                "TargetOriginId": "API-Backend",
                "ViewerProtocolPolicy": "https-only",
                "AllowedMethods": {
                    "Quantity": 7,
                    "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                },
                "ForwardedValues": {
                    "QueryString": true,
                    "Cookies": {
                        "Forward": "all"
                    },
                    "Headers": {
                        "Quantity": 4,
                        "Items": ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method", "Authorization"]
                    }
                },
                "MinTTL": 0,
                "DefaultTTL": 0,
                "MaxTTL": 0,
                "Compress": false
            },
            {
                "PathPattern": "/media/*",
                "TargetOriginId": "API-Backend",
                "ViewerProtocolPolicy": "https-only",
                "AllowedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                },
                "ForwardedValues": {
                    "QueryString": false,
                    "Cookies": {
                        "Forward": "none"
                    }
                },
                "MinTTL": 0,
                "DefaultTTL": 86400,
                "MaxTTL": 31536000,
                "Compress": true
            }
        ]
    },
    "CustomErrorResponses": {
        "Quantity": 3,
        "Items": [
            {
                "ErrorCode": 404,
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
                "ErrorCode": 400,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 0
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF
        
            RESULT=$(aws cloudfront create-distribution \
                --distribution-config file:///tmp/cloudfront-config.json)

            DISTRIBUTION_ID=$(echo "$RESULT" | jq -r '.Distribution.Id')
            DOMAIN_NAME=$(echo "$RESULT" | jq -r '.Distribution.DomainName')

            rm /tmp/cloudfront-config.json

            echo_success "CloudFront 分发创建完成:"
            echo "  ID: $DISTRIBUTION_ID"
            echo "  域名: $DOMAIN_NAME"
            echo "  URL: https://$DOMAIN_NAME"
        fi
    fi
    
    # 清除缓存
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        echo_info "清除 CloudFront 缓存..."
        aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*" > /dev/null
        echo_success "缓存清除请求已提交"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo_success "🚀 部署完成！"
    echo ""
    echo "📊 部署信息:"
    echo "  环境: $ENVIRONMENT"
    echo "  S3 存储桶: $BUCKET_NAME"
    echo "  S3 网站 URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        DOMAIN_NAME=$(aws cloudfront get-distribution \
            --id "$DISTRIBUTION_ID" \
            --query 'Distribution.DomainName' \
            --output text)
        echo "  CloudFront URL: https://$DOMAIN_NAME"
    fi
    
    echo ""
    echo "💡 提示:"
    echo "  - CloudFront 分发可能需要 10-15 分钟才能完全部署"
    echo "  - 首次访问可能需要等待几分钟"
    echo "  - 可以先通过 S3 网站 URL 进行测试"
}

# 主函数
main() {
    echo_info "开始 AWS S3 + CloudFront 部署"
    echo_info "环境: $ENVIRONMENT"
    echo ""
    
    check_dependencies
    check_build
    setup_s3_bucket
    upload_files
    setup_cloudfront
    show_deployment_info
}

# 运行主函数
main
