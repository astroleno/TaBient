// TaBient 诊断测试脚本
// 在 Chrome 扩展管理页面的控制台中运行此脚本

console.log('🔍 开始 TaBient 诊断测试...\n');

// 1. 检查扩展是否已加载
if (chrome.runtime === undefined) {
    console.error('❌ Chrome 扩展 API 不可用');
    console.log('💡 请确保在扩展页面的控制台中运行此脚本');
} else {
    console.log('✅ Chrome 扩展 API 可用');
    
    // 2. 获取扩展信息
    chrome.runtime.getBackgroundPage((backgroundPage) => {
        if (chrome.runtime.lastError) {
            console.error('❌ 无法访问后台页面:', chrome.runtime.lastError);
            return;
        }
        
        console.log('✅ 成功访问后台页面');
        
        // 3. 检查全局函数是否存在
        if (backgroundPage.diagnoseTabient) {
            console.log('✅ diagnoseTabient 函数存在');
            
            // 4. 运行诊断
            console.log('\n🚀 开始运行诊断...\n');
            backgroundPage.diagnoseTabient().then(() => {
                console.log('\n✅ 诊断完成');
                
                // 5. 获取状态
                if (backgroundPage.getTabientStatus) {
                    const status = backgroundPage.getTabientStatus();
                    console.log('\n📊 当前状态:', status);
                }
                
                // 6. 测试直接音频
                if (backgroundPage.testDirectAudio) {
                    console.log('\n🎵 测试直接音频播放...');
                    backgroundPage.testDirectAudio().then((result) => {
                        console.log('🎵 直接音频测试结果:', result);
                    });
                }
            });
        } else {
            console.error('❌ diagnoseTabient 函数不存在');
            console.log('📋 可用的全局函数:', Object.keys(backgroundPage).filter(key => typeof backgroundPage[key] === 'function'));
        }
    });
}