#!/usr/bin/env node
/**
 * 测试用户代币API调用
 */

const fetch = require('node-fetch');

async function testUserTokensAPI() {
    const userAddress = '0x87162cB0E3B0869ee7A87e739Ed444Ba8f22A07C';
    const network = 'sepolia';
    const backendUrl = 'http://127.0.0.1:8000';
    
    console.log('🔍 测试用户代币API');
    console.log('=' * 50);
    console.log(`用户地址: ${userAddress}`);
    console.log(`网络: ${network}`);
    console.log(`后端URL: ${backendUrl}`);
    console.log();
    
    try {
        // 直接调用后端API
        const directUrl = `${backendUrl}/api/users/${userAddress}/tokens/?network=${network}`;
        console.log(`📡 直接调用后端API: ${directUrl}`);
        
        const directResponse = await fetch(directUrl);
        console.log(`状态码: ${directResponse.status}`);
        
        if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ 直接API调用成功');
            console.log(`创建的代币数量: ${directData.created?.length || 0}`);
            console.log(`持有的代币数量: ${directData.holding?.length || 0}`);
            
            if (directData.created && directData.created.length > 0) {
                console.log('\n📋 创建的代币:');
                directData.created.forEach((token, index) => {
                    console.log(`  ${index + 1}. ${token.name} (${token.symbol})`);
                    console.log(`     地址: ${token.address}`);
                    console.log(`     图片: ${token.imageUrl || '未设置'}`);
                    console.log(`     创建时间: ${token.createdAt}`);
                });
            } else {
                console.log('❌ 没有找到创建的代币');
            }
        } else {
            console.log(`❌ 直接API调用失败: ${directResponse.status}`);
            const errorText = await directResponse.text();
            console.log(`错误信息: ${errorText}`);
        }
        
        console.log();
        
        // 通过前端代理调用API
        const proxyUrl = `http://localhost:3000/api/users/${userAddress}/tokens/?network=${network}`;
        console.log(`📡 通过前端代理调用: ${proxyUrl}`);
        
        const proxyResponse = await fetch(proxyUrl);
        console.log(`状态码: ${proxyResponse.status}`);
        
        if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            console.log('✅ 代理API调用成功');
            console.log(`创建的代币数量: ${proxyData.created?.length || 0}`);
            console.log(`持有的代币数量: ${proxyData.holding?.length || 0}`);
            
            // 比较两个响应
            const directCreatedCount = directData?.created?.length || 0;
            const proxyCreatedCount = proxyData?.created?.length || 0;
            
            if (directCreatedCount === proxyCreatedCount) {
                console.log('✅ 直接调用和代理调用结果一致');
            } else {
                console.log('⚠️  直接调用和代理调用结果不一致');
                console.log(`   直接调用: ${directCreatedCount} 个代币`);
                console.log(`   代理调用: ${proxyCreatedCount} 个代币`);
            }
        } else {
            console.log(`❌ 代理API调用失败: ${proxyResponse.status}`);
            const errorText = await proxyResponse.text();
            console.log(`错误信息: ${errorText}`);
        }
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
    }
}

// 运行测试
testUserTokensAPI().catch(console.error);
