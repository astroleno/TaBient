// 极简音频测试
// 完全移除复杂逻辑，只测试基础音频播放

console.log('🎵 [SIMPLE] 极简音频测试开始');

// 全局变量
let audioContext = null;
let testOscillator = null;

// 初始化音频上下文
async function initAudio() {
  try {
    console.log('🎵 [SIMPLE] 创建 AudioContext...');
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('🎵 [SIMPLE] AudioContext 状态:', audioContext.state);
    
    // 如果处于 suspended 状态，尝试恢复
    if (audioContext.state === 'suspended') {
      console.log('🎵 [SIMPLE] 尝试恢复 AudioContext...');
      await audioContext.resume();
      console.log('🎵 [SIMPLE] 恢复后状态:', audioContext.state);
    }
    
    return true;
  } catch (error) {
    console.error('❌ [SIMPLE] AudioContext 创建失败:', error);
    return false;
  }
}

// 播放简单测试音
async function playTestTone() {
  try {
    console.log('🎵 [SIMPLE] 开始播放测试音...');
    
    if (!audioContext) {
      const initialized = await initAudio();
      if (!initialized) {
        console.error('❌ [SIMPLE] 音频初始化失败');
        return false;
      }
    }
    
    // 确保音频上下文处于运行状态
    if (audioContext.state === 'suspended') {
      console.log('🎵 [SIMPLE] 恢复 AudioContext...');
      await audioContext.resume();
    }
    
    console.log('🎵 [SIMPLE] AudioContext 状态:', audioContext.state);
    
    // 创建简单的振荡器
    testOscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 设置参数
    testOscillator.type = 'sine';
    testOscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // 连接节点
    testOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 播放
    const startTime = audioContext.currentTime;
    testOscillator.start(startTime);
    testOscillator.stop(startTime + 0.5);
    
    console.log('✅ [SIMPLE] 测试音已开始播放');
    
    // 监听结束事件
    testOscillator.onended = () => {
      console.log('✅ [SIMPLE] 测试音播放完成');
    };
    
    return true;
    
  } catch (error) {
    console.error('❌ [SIMPLE] 播放测试音失败:', error);
    console.error('❌ [SIMPLE] 错误详情:', error.message);
    return false;
  }
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [SIMPLE] 收到消息:', message);
  
  if (message.type === 'simpleTest') {
    console.log('🎵 [SIMPLE] 执行简单测试...');
    playTestTone().then(result => {
      console.log('🎵 [SIMPLE] 测试结果:', result);
      sendResponse({ success: result });
    });
    return true; // 保持消息通道开放
  }
  
  if (message.type === 'initSimpleAudio') {
    console.log('🎵 [SIMPLE] 初始化音频...');
    initAudio().then(result => {
      console.log('🎵 [SIMPLE] 初始化结果:', result);
      sendResponse({ success: result, state: audioContext?.state });
    });
    return true;
  }
  
  if (message.type === 'getAudioState') {
    console.log('🎵 [SIMPLE] 获取音频状态...');
    sendResponse({ 
      hasContext: !!audioContext, 
      state: audioContext?.state,
      sampleRate: audioContext?.sampleRate 
    });
  }
});

// 自动初始化
console.log('🎵 [SIMPLE] 自动初始化音频...');
initAudio().then(result => {
  console.log('🎵 [SIMPLE] 自动初始化结果:', result);
});

// 导出函数供测试使用
globalThis.simpleAudioTest = playTestTone;
globalThis.initSimpleAudio = initAudio;

console.log('🎵 [SIMPLE] 极简音频测试脚本加载完成');