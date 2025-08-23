// 极简 Offscreen Audio Engine
// 移除所有复杂效果，直接播放音频

console.log('🎵 [SIMPLE-OFFSCREEN] 极简音频引擎开始加载');

class SimpleAudioEngine {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🎵 [SIMPLE-OFFSCREEN] 创建 AudioContext...');
      
      // 创建 AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 [SIMPLE-OFFSCREEN] AudioContext 创建成功，状态:', this.audioContext.state);
      
      // 尝试恢复 AudioContext（如果是 suspended 状态）
      if (this.audioContext.state === 'suspended') {
        console.log('🎵 [SIMPLE-OFFSCREEN] 尝试恢复 AudioContext...');
        await this.audioContext.resume();
        console.log('🎵 [SIMPLE-OFFSCREEN] 恢复后状态:', this.audioContext.state);
      }
      
      this.isInitialized = true;
      console.log('✅ [SIMPLE-OFFSCREEN] 音频引擎初始化完成');
      return true;
      
    } catch (error) {
      console.error('❌ [SIMPLE-OFFSCREEN] 初始化失败:', error);
      return false;
    }
  }

  // 极简音频播放 - 直接连接到 destination
  async playSimpleSound(frequency = 440, duration = 0.3, type = 'sine') {
    try {
      console.log('🎵 [SIMPLE-OFFSCREEN] 开始播放简单音频:', { frequency, duration, type });
      
      if (!this.audioContext || !this.isInitialized) {
        console.error('❌ [SIMPLE-OFFSCREEN] 音频引擎未初始化');
        return false;
      }
      
      // 确保 AudioContext 处于运行状态
      if (this.audioContext.state === 'suspended') {
        console.log('🎵 [SIMPLE-OFFSCREEN] 恢复 AudioContext...');
        await this.audioContext.resume();
      }
      
      console.log('🎵 [SIMPLE-OFFSCREEN] AudioContext 状态:', this.audioContext.state);
      
      const now = this.audioContext.currentTime;
      
      // 创建振荡器
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // 设置参数
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      
      // 设置音量包络
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // 快速起音
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // 渐弱结束
      
      // 直接连接到输出 - 不经过任何效果
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // 播放
      oscillator.start(now);
      oscillator.stop(now + duration);
      
      console.log('✅ [SIMPLE-OFFSCREEN] 音频播放命令已发送');
      
      // 监听结束事件
      oscillator.onended = () => {
        console.log('✅ [SIMPLE-OFFSCREEN] 音频播放完成');
      };
      
      return true;
      
    } catch (error) {
      console.error('❌ [SIMPLE-OFFSCREEN] 播放失败:', error);
      return false;
    }
  }

  getState() {
    return {
      isInitialized: this.isInitialized,
      audioContextState: this.audioContext?.state,
      sampleRate: this.audioContext?.sampleRate
    };
  }
}

// 创建全局实例
const simpleEngine = new SimpleAudioEngine();

// 自动初始化
console.log('🎵 [SIMPLE-OFFSCREEN] 开始自动初始化...');
simpleEngine.init().then(success => {
  console.log('🎵 [SIMPLE-OFFSCREEN] 自动初始化结果:', success);
  
  // 通知 background script 音频引擎已就绪
  if (success) {
    console.log('🎵 [SIMPLE-OFFSCREEN] 发送 audioEngineReady 消息...');
    chrome.runtime.sendMessage({
      type: 'audioEngineReady'
    }).then(response => {
      console.log('🎵 [SIMPLE-OFFSCREEN] audioEngineReady 响应:', response);
    }).catch(error => {
      console.log('🎵 [SIMPLE-OFFSCREEN] audioEngineReady 发送失败 (可能是正常的):', error);
    });
  }
}).catch(error => {
  console.error('❌ [SIMPLE-OFFSCREEN] 自动初始化失败:', error);
});

// 消息监听器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [SIMPLE-OFFSCREEN] 收到消息:', message);
  
  // 只处理目标为 offscreen 的消息
  if (message._target !== 'offscreen') {
    console.log('🚫 [SIMPLE-OFFSCREEN] 忽略非目标消息');
    return false;
  }
  
  try {
    if (message.type === 'playSound') {
      const { frequency = 440, duration = 0.3, type = 'sine' } = message;
      console.log('🎵 [SIMPLE-OFFSCREEN] 播放音频请求:', { frequency, duration, type });
      
      // 异步播放
      simpleEngine.playSimpleSound(frequency, duration, type).then(success => {
        console.log('🎵 [SIMPLE-OFFSCREEN] 播放结果:', success);
        sendResponse({ success });
      }).catch(error => {
        console.error('❌ [SIMPLE-OFFSCREEN] 播放异常:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // 异步响应
    }
    
    if (message.type === 'getAudioStatus') {
      const state = simpleEngine.getState();
      console.log('📊 [SIMPLE-OFFSCREEN] 音频状态:', state);
      sendResponse({
        success: true,
        status: {
          inited: state.isInitialized,
          unlocked: true,
          message: state.isInitialized ? 'Simple audio engine running' : 'Audio engine not initialized'
        }
      });
      return false;
    }
    
    if (message.type === 'initAudio') {
      console.log('🎵 [SIMPLE-OFFSCREEN] 初始化请求...');
      simpleEngine.init().then(success => {
        console.log('🎵 [SIMPLE-OFFSCREEN] 初始化结果:', success);
        sendResponse({ success });
      });
      return true;
    }
    
    console.log('❓ [SIMPLE-OFFSCREEN] 未知消息类型:', message.type);
    sendResponse({ success: false, error: 'Unknown message type' });
    return false;
    
  } catch (error) {
    console.error('❌ [SIMPLE-OFFSCREEN] 处理消息异常:', error);
    sendResponse({ success: false, error: error.message });
    return false;
  }
});

console.log('🎵 [SIMPLE-OFFSCREEN] 极简音频引擎加载完成');

// 导出全局函数用于调试
globalThis.testSimpleAudio = () => {
  console.log('🧪 [SIMPLE-OFFSCREEN] 执行调试测试...');
  simpleEngine.playSimpleSound(440, 0.5, 'sine');
};

globalThis.getSimpleAudioState = () => {
  return simpleEngine.getState();
};