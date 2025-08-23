console.log("🎵 [TABIENT CONTENT] 内容脚本启动");

// 简化的内容脚本，只处理必要的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 [TABIENT CONTENT] 收到消息:", message);
  
  // 不需要转发消息，直接返回
  sendResponse({ success: true });
  
  return false;
});

console.log("🎵 [TABIENT CONTENT] 内容脚本加载完成");