// 详细的消息传递诊断脚本
// 在 Chrome 扩展管理页面的控制台中运行

console.log('🔍 开始详细的消息传递诊断...\n');

async function runDetailedDiagnosis() {
    try {
        // 1. 测试基础连接
        console.log('1️⃣ 测试基础连接...');
        const config = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'getConfig' }, resolve);
        });
        console.log('✅ 配置获取成功:', config);
        
        // 2. 测试音频状态
        console.log('\n2️⃣ 测试音频状态...');
        const statusResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'getAudioStatus' }, resolve);
        });
        console.log('📊 音频状态响应:', statusResponse);
        
        // 3. 测试 playSound 消息
        console.log('\n3️⃣ 测试 playSound 消息...');
        const playSoundResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'playSound',
                frequency: 440,
                duration: 0.3,
                type: 'sine'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ playSound 消息错误:', chrome.runtime.lastError);
                    resolve({ error: chrome.runtime.lastError.message });
                } else {
                    resolve(response);
                }
            });
        });
        console.log('🎵 playSound 响应:', playSoundResponse);
        
        // 4. 测试 playTestSound 消息
        console.log('\n4️⃣ 测试 playTestSound 消息...');
        const testSoundResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'playTestSound',
                host: 'test.example.com'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ playTestSound 消息错误:', chrome.runtime.lastError);
                    resolve({ error: chrome.runtime.lastError.message });
                } else {
                    resolve(response);
                }
            });
        });
        console.log('🧪 playTestSound 响应:', testSoundResponse);
        
        // 5. 总结
        console.log('\n📋 诊断总结:');
        console.log('• 配置获取:', config ? '✅ 成功' : '❌ 失败');
        console.log('• 音频状态:', statusResponse?.success ? '✅ 成功' : '❌ 失败');
        console.log('• 直接播放:', playSoundResponse?.success ? '✅ 成功' : '❌ 失败');
        console.log('• 测试播放:', testSoundResponse?.success ? '✅ 成功' : '❌ 失败');
        
        if (playSoundResponse?.error) {
            console.log('❌ 直接播放错误:', playSoundResponse.error);
        }
        if (testSoundResponse?.error) {
            console.log('❌ 测试播放错误:', testSoundResponse.error);
        }
        
    } catch (error) {
        console.error('❌ 诊断过程中出错:', error);
    }
}

// 运行诊断
runDetailedDiagnosis();