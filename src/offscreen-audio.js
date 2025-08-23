// TaBient Offscreen Audio Handler
// 简化的音频处理器

console.log('🎵 [OFFSCREEN] Offscreen 音频处理器启动');

let audioContext = null;
let currentTimbre = 'sine';

// 初始化音频上下文
async function initAudioContext() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 [OFFSCREEN] AudioContext 创建成功，状态:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🎵 [OFFSCREEN] AudioContext 恢复成功');
      }
    }
    return true;
  } catch (error) {
    console.error('❌ [OFFSCREEN] AudioContext 初始化失败:', error);
    return false;
  }
}

// 播放音频 - 简化版本
async function playSound(frequency = 440, duration = 0.3, effects = {}) {
  try {
    console.log('🎵 [OFFSCREEN] 开始播放音频:', { frequency, duration });
    
    const initialized = await initAudioContext();
    if (!initialized) {
      return false;
    }
    
    const now = audioContext.currentTime;
    const timbre = effects.timbre || currentTimbre || 'sine';
    
    // 创建音源
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 设置振荡器
    oscillator.type = timbre;
    oscillator.frequency.setValueAtTime(frequency, now);
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // 连接音频图
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 调度播放
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    console.log('✅ [OFFSCREEN] 音频播放成功');
    
    return new Promise((resolve) => {
      oscillator.onended = () => {
        console.log('✅ [OFFSCREEN] 音频播放完成');
        resolve(true);
      };
    });
    
  } catch (error) {
    console.error('❌ [OFFSCREEN] 音频播放失败:', error);
    return false;
  }
}

// 播放连击序列 - 简化版本
async function playComboSequence(frequencies, timbre, effects) {
  try {
    console.log('🎵 [OFFSCREEN] 播放连击序列:', frequencies);
    
    const initialized = await initAudioContext();
    if (!initialized) {
      return false;
    }
    
    const now = audioContext.currentTime;
    const noteDuration = 0.2;
    const noteInterval = 0.1;
    
    const promises = [];
    
    for (let i = 0; i < frequencies.length; i++) {
      const frequency = frequencies[i];
      const startTime = now + (i * (noteDuration + noteInterval));
      
      const promise = playSoundAtTime(frequency, noteDuration, { ...effects, timbre }, startTime);
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    console.log('✅ [OFFSCREEN] 连击序列播放完成');
    return results.every(result => result);
    
  } catch (error) {
    console.error('❌ [OFFSCREEN] 连击序列播放失败:', error);
    return false;
  }
}

// 在指定时间播放音符
async function playSoundAtTime(frequency, duration, effects, startTime) {
  return new Promise((resolve) => {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      const timbre = effects.timbre || currentTimbre || 'sine';
      
      oscillator.type = timbre;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
      
      oscillator.onended = () => {
        resolve(true);
      };
      
    } catch (error) {
      console.error('❌ [OFFSCREEN] 音符播放失败:', error);
      resolve(false);
    }
  });
}

// 简化的消息监听器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [OFFSCREEN] 收到消息:', message.type);
  
  try {
    if (message.type === 'playSound') {
      console.log('🎵 [OFFSCREEN] 处理播放音频请求');
      const { frequency = 440, duration = 0.3, effects = {} } = message;
      
      playSound(frequency, duration, effects).then(success => {
        console.log('🎵 [OFFSCREEN] 播放结果:', success);
        sendResponse({ success });
      }).catch(error => {
        console.error('❌ [OFFSCREEN] 播放异常:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // 保持消息通道开放
    }
    
    if (message.type === 'playCombo') {
      console.log('🎵 [OFFSCREEN] 处理连击音频请求');
      const { frequencies, timbre, effects = {} } = message;
      
      playComboSequence(frequencies, timbre, effects).then(success => {
        console.log('🎵 [OFFSCREEN] 连击播放结果:', success);
        sendResponse({ success });
      }).catch(error => {
        console.error('❌ [OFFSCREEN] 连击播放异常:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true;
    }
    
    if (message.type === 'ping') {
      console.log('📡 [OFFSCREEN] 收到 ping 消息');
      sendResponse({ success: true, status: 'ok' });
      return false;
    }
    
    if (message.type === 'setTimbre') {
      console.log('🎵 [OFFSCREEN] 设置音色:', message.timbre);
      currentTimbre = message.timbre;
      sendResponse({ success: true });
      return false;
    }
    
    if (message.type === 'updateSettings') {
      console.log('⚙️ [OFFSCREEN] 更新设置');
      sendResponse({ success: true });
      return false;
    }
    
    if (message.type === 'getTimbres') {
      console.log('🎵 [OFFSCREEN] 获取可用音色');
      sendResponse({ 
        success: true, 
        timbres: {
          basic: ['sine', 'triangle', 'square', 'sawtooth'],
          advanced: ['acoustic-grand', 'electric-guitar', 'bell']
        }
      });
      return false;
    }
    
    console.log('❓ [OFFSCREEN] 未知消息类型:', message.type);
    sendResponse({ success: false, error: 'Unknown message type' });
    return false;
    
  } catch (error) {
    console.error('❌ [OFFSCREEN] 消息处理异常:', error);
    sendResponse({ success: false, error: error.message });
    return false;
  }
});

// 自动初始化
console.log('🎵 [OFFSCREEN] 开始自动初始化...');
initAudioContext().then(success => {
  console.log('🎵 [OFFSCREEN] 自动初始化结果:', success);
  if (success) {
    // 通知 background script 音频引擎已就绪
    chrome.runtime.sendMessage({
      type: 'audioEngineReady'
    });
  }
}).catch(error => {
  console.error('❌ [OFFSCREEN] 自动初始化失败:', error);
});

console.log('🎵 [OFFSCREEN] 音频处理器加载完成');

// 导出全局函数用于调试
globalThis.testOffscreenAudio = () => {
  console.log('🧪 [OFFSCREEN] 执行调试测试...');
  playSound(440, 0.5);
};