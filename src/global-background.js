// TaBient Background Script - 全局音频模式
// 使用 Offscreen Document 统一管理音频播放

console.log('🎵 [TABIENT] 全局音频模式启动');

// 全局变量
let offscreenDocument = null;
let audioEngineReady = false;
let config = {
  enabled: true,
  volume: 0.7,
  intensity: 0.8,
  masterVolume: -12,
  frequency: 440,
  duration: 0.3,
  reverbWet: 0.25,
  delayWet: 0.18,
  delayTime: 0.3,
  delayFeedback: 0.3,
  minTriggerInterval: 0.2,
  scale: 'pentatonic',
  waveform: 'sine'
};

// 音阶定义
const scales = {
  pentatonic: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25],
  major: [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25],
  minor: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440],
  ambient: [174.61, 196, 220, 261.63, 293.66, 349.23, 392, 440]
};

// 统计信息
let lastPlayTime = 0;
let totalPlays = 0;

// 创建 offscreen document
async function createOffscreenDocument() {
  if (offscreenDocument) {
    console.log('📄 Offscreen document 已存在');
    return true;
  }
  
  try {
    console.log('📄 创建 offscreen document...');
    
    // 检查是否已存在
    const existingContexts = await chrome.offscreen.hasDocument();
    if (existingContexts) {
      console.log('📄 Offscreen document 已存在，跳过创建');
      offscreenDocument = true;
      return true;
    }
    
    // 创建 offscreen document
    const offscreenUrl = chrome.runtime.getURL('offscreen-audio.html');
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['AUDIO_PLAYBACK'],
      justification: '统一管理音频播放，避免自动播放策略限制'
    });
    
    offscreenDocument = true;
    console.log('✅ Offscreen document 创建成功');
    return true;
    
  } catch (error) {
    console.error('❌ 创建 offscreen document 失败:', error);
    return false;
  }
}

// 初始化音频系统
async function initAudioSystem() {
  try {
    console.log('🚀 初始化音频系统...');
    
    // 创建 offscreen document
    const offscreenCreated = await createOffscreenDocument();
    if (!offscreenCreated) {
      console.error('❌ 无法创建 offscreen document');
      return false;
    }
    
    // 等待 offscreen document 准备就绪
    await new Promise((resolve) => {
      const checkReady = () => {
        if (audioEngineReady) {
          console.log('✅ 音频引擎已就绪');
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
      
      // 超时保护
      setTimeout(() => {
        if (!audioEngineReady) {
          console.warn('⚠️ 音频引擎初始化超时，继续执行');
          resolve();
        }
      }, 3000);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ 初始化音频系统失败:', error);
    return false;
  }
}

// 播放音频 - 使用 offscreen document
async function playSound(frequency = 440, duration = 0.3) {
  try {
    if (!offscreenDocument || !audioEngineReady) {
      console.log('❌ 音频系统未就绪');
      return false;
    }
    
    // 准备音频效果参数
    const effects = {
      reverbWet: config.reverbWet,
      delayWet: config.delayWet,
      delayTime: config.delayTime,
      delayFeedback: config.delayFeedback,
      waveform: config.waveform
    };
    
    console.log('🎵 播放音频:', { frequency, duration, effects });
    
    // 发送到 offscreen document
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'playSound',
        frequency,
        duration,
        effects,
        _target: 'offscreen'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ 发送到 offscreen document 失败:', chrome.runtime.lastError.message);
          resolve(false);
        } else {
          console.log('✅ 音频播放成功');
          resolve(response && response.success);
        }
      });
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ 播放音频失败:', error);
    return false;
  }
}

// 根据主机名选择频率
function getFrequencyFromHost(hostname) {
  if (!hostname) return scales[config.scale][0];
  
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = ((hash << 5) - hash) + hostname.charCodeAt(i);
    hash |= 0;
  }
  
  const scaleNotes = scales[config.scale];
  return scaleNotes[Math.abs(hash) % scaleNotes.length];
}

// 处理标签切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!config.enabled) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return;
    }
    
    // 防抖动保护
    const now = Date.now();
    if (now - lastPlayTime < (config.minTriggerInterval * 1000)) {
      return;
    }
    
    // 提取主机名
    let hostname = '';
    try {
      const url = new URL(tab.url);
      hostname = url.hostname.replace('www.', '');
    } catch (e) {
      console.log('🚫 URL 解析失败:', tab.url);
      return;
    }
    
    // 根据主机名和强度选择频率
    const frequency = getFrequencyFromHost(hostname);
    const duration = Math.min(0.8, 0.2 + (config.intensity * 0.4));
    
    console.log('🎵 标签切换:', { hostname, frequency: frequency.toFixed(2), duration: duration.toFixed(3) });
    
    const success = await playSound(frequency, duration);
    if (success) {
      lastPlayTime = now;
      totalPlays++;
    }
    
  } catch (error) {
    console.error('❌ 处理标签切换失败:', error);
  }
});

// 处理消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [TABIENT] 收到消息:', message);
  
  // 如果消息目标是 offscreen document，不处理
  if (message._target === 'offscreen') {
    return false;
  }
  
  if (message.type === 'testSound') {
    console.log('🧪 [TABIENT] 执行音频测试');
    
    playSound(440, 0.5).then(success => {
      console.log('🧪 [TABIENT] 测试结果:', success);
      sendResponse({ success });
    }).catch(error => {
      console.error('❌ [TABIENT] 测试异常:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // 保持消息通道开放
  }
  
  if (message.type === 'getConfig') {
    sendResponse(config);
    return false;
  }
  
  if (message.type === 'updateConfig') {
    const oldConfig = { ...config };
    config = { ...config, ...message.config };
    console.log('⚙️ [TABIENT] 配置已更新:', config);
    
    // 通知 options 页面配置已更新
    if (oldConfig.enabled !== config.enabled) {
      chrome.runtime.sendMessage({ type: 'configUpdated' });
    }
    
    // 发送新的配置到 offscreen document
    if (offscreenDocument && audioEngineReady) {
      chrome.runtime.sendMessage({
        type: 'updateSettings',
        settings: config,
        _target: 'offscreen'
      });
    }
    
    sendResponse({ success: true });
    return false;
  }
  
  if (message.type === 'getStatus') {
    const status = {
      enabled: config.enabled,
      offscreenReady: offscreenDocument && audioEngineReady,
      config: config,
      lastPlay: lastPlayTime,
      totalPlays: totalPlays
    };
    sendResponse({ success: true, status });
    return false;
  }
  
  if (message.type === 'diagnose') {
    console.log('🔍 [TABIENT] 开始诊断...');
    
    const results = {
      audioEngine: audioEngineReady,
      offscreenDocument: offscreenDocument,
      permissions: true,
      messaging: true,
      issues: []
    };
    
    // 检查问题
    if (!results.audioEngine) {
      results.issues.push('音频引擎未初始化');
    }
    if (!results.offscreenDocument) {
      results.issues.push('Offscreen document 未创建');
    }
    
    sendResponse({ success: true, results });
    return false;
  }
  
  if (message.type === 'getLogs') {
    const logs = [
      `[${new Date().toISOString()}] TaBient 日志`,
      `配置: ${JSON.stringify(config, null, 2)}`,
      `统计: 总播放次数 ${totalPlays}, 最后播放 ${new Date(lastPlayTime).toLocaleString()}`
    ].join('\n');
    
    sendResponse({ logs });
    return false;
  }
  
  // 处理来自 offscreen document 的消息
  if (message.type === 'audioEngineReady') {
    audioEngineReady = true;
    console.log('✅ Offscreen document 音频引擎已就绪');
    
    // 发送初始配置
    chrome.runtime.sendMessage({
      type: 'updateSettings',
      settings: config,
      _target: 'offscreen'
    });
    
    sendResponse({ success: true });
    return false;
  }
  
  return false;
});

// 初始化
console.log('🎵 [TABIENT] 开始初始化...');
initAudioSystem().then(() => {
  console.log('✅ [TABIENT] 初始化完成');
}).catch(error => {
  console.error('❌ [TABIENT] 初始化失败:', error);
});

// 导出全局函数用于调试
globalThis.testTabientSound = () => {
  console.log('🧪 [TABIENT] 手动测试音频');
  playSound(440, 0.5);
};

globalThis.getTabientStatus = () => {
  return {
    config: config,
    offscreenReady: offscreenDocument && audioEngineReady,
    enabled: config.enabled
  };
};

console.log('🎵 [TABIENT] 全局音频模式加载完成');