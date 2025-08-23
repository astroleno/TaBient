// Offscreen Document 诊断脚本
// 在 Chrome 扩展管理页面的控制台中运行

console.log('🔍 检查 Offscreen Document 状态...\n');

async function checkOffscreenDocument() {
    try {
        // 1. 检查是否有 offscreen 权限
        console.log('1️⃣ 检查 offscreen API...');
        if (chrome.offscreen) {
            console.log('✅ chrome.offscreen API 可用');
            
            // 2. 检查是否有现有的 offscreen document
            console.log('\n2️⃣ 检查现有 offscreen document...');
            const hasDocument = await chrome.offscreen.hasDocument();
            console.log('📄 现有 document:', hasDocument);
            
            // 3. 尝试创建 offscreen document
            if (!hasDocument) {
                console.log('\n3️⃣ 创建 offscreen document...');
                try {
                    await chrome.offscreen.createDocument({
                        url: chrome.runtime.getURL('offscreen/offscreen-audio.html'),
                        reasons: ['AUDIO_PLAYBACK'],
                        justification: '测试 offscreen document 创建'
                    });
                    console.log('✅ Offscreen document 创建成功');
                } catch (error) {
                    console.error('❌ 创建失败:', error);
                }
            }
            
            // 4. 再次检查
            console.log('\n4️⃣ 再次检查 document 状态...');
            const hasDocumentAfter = await chrome.offscreen.hasDocument();
            console.log('📄 创建后状态:', hasDocumentAfter);
            
            // 5. 测试消息传递
            console.log('\n5️⃣ 测试消息传递到 offscreen document...');
            const messageResponse = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    type: 'getAudioStatus'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ 消息传递错误:', chrome.runtime.lastError);
                        resolve({ error: chrome.runtime.lastError.message });
                    } else {
                        resolve(response);
                    }
                });
            });
            console.log('📨 消息传递响应:', messageResponse);
            
        } else {
            console.error('❌ chrome.offscreen API 不可用');
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error);
    }
}

checkOffscreenDocument();