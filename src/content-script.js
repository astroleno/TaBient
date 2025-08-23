// TaBient Content Script - 简化版本，只负责消息转发
console.log('🎵 [TABIENT CONTENT] 内容脚本启动');

// 监听来自 Service Worker 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [TABIENT CONTENT] 收到消息:', message);
  
  if (message.type === 'forwardToOffscreen') {
    // 转发消息到 offscreen document
    console.log('🎵 [TABIENT CONTENT] 转发消息到 offscreen document');
    
    chrome.runtime.sendMessage({
      ...message,
      _target: 'offscreen'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ [TABIENT CONTENT] 转发失败:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ [TABIENT CONTENT] 转发成功');
        sendResponse(response);
      }
    });
    
    return true; // 保持消息通道开放
  }
  
  return false;
});

console.log('🎵 [TABIENT CONTENT] 内容脚本加载完成');