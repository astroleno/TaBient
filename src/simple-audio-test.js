// 极简音频测试 - 直接在 background script 中实现
// 不依赖复杂的 offscreen document 机制

console.log('🎵 [SIMPLE-TEST] 极简音频测试开始');

// 全局变量
let audioContext = null;

// 初始化音频上下文
async function initAudioContext() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 [SIMPLE-TEST] AudioContext 创建成功，状态:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🎵 [SIMPLE-TEST] AudioContext 恢复成功');
      }
    }
    return true;
  } catch (error) {
    console.error('❌ [SIMPLE-TEST] AudioContext 初始化失败:', error);
    return false;
  }
}

// 直接播放音频
async function playSimpleSound(frequency = 440, duration = 0.3) {
  try {
    console.log('🎵 [SIMPLE-TEST] 开始播放音频:', { frequency, duration });
    
    const initialized = await initAudioContext();
    if (!initialized) {
      return false;
    }
    
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    console.log('✅ [SIMPLE-TEST] 音频播放成功');
    
    oscillator.onended = () => {
      console.log('✅ [SIMPLE-TEST] 音频播放完成');
    };
    
    return true;
  } catch (error) {
    console.error('❌ [SIMPLE-TEST] 音频播放失败:', error);
    return false;
  }
}

// 监听简单的测试消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'directSimpleTest') {
    console.log('🧪 [SIMPLE-TEST] 收到直接测试请求');
    
    playSimpleSound(440, 0.5).then(success => {
      console.log('🧪 [SIMPLE-TEST] 测试结果:', success);
      sendResponse({ success });
    }).catch(error => {
      console.error('❌ [SIMPLE-TEST] 测试异常:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // 保持消息通道开放
  }
});

console.log('🎵 [SIMPLE-TEST] 极简音频测试加载完成');

// 导出全局函数用于调试
globalThis.testDirectAudio = () => {
  console.log('🧪 [SIMPLE-TEST] 执行直接调试测试...');
  playSimpleSound(440, 0.5);
};