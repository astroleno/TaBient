// TaBient - 极简版本
// 完全移除复杂的 offscreen document 机制

console.log('🎵 [TABIENT] 极简版本启动');

// 全局变量
let audioContext = null;
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
  waveform: 'sine' // 新增：音色选择
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

// 使用标签页播放音频
async function playSoundDirect(frequency = 440, duration = 0.3) {
  try {
    // 准备音频效果参数
    const effects = {
      reverbWet: config.reverbWet,
      delayWet: config.delayWet,
      delayTime: config.delayTime,
      delayFeedback: config.delayFeedback,
      waveform: config.waveform
    };
    
    console.log('🎵 [TABIENT] 通过标签页播放音频:', { frequency, duration, effects });
    
    // 获取当前活动标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      console.log('❌ [TABIENT] 没有找到活动标签页');
      return false;
    }
    
    const activeTab = tabs[0];
    
    // 检查标签页是否可以接受消息
    if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('edge://') || activeTab.url.startsWith('about:')) {
      console.log('❌ [TABIENT] 当前标签页不支持内容脚本:', activeTab.url);
      return false;
    }
    
    // 向标签页发送消息播放音频
    const result = await new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTab.id, {
        type: 'playSound',
        frequency: frequency,
        duration: duration,
        effects: effects
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('❌ [TABIENT] 标签页消息发送失败:', chrome.runtime.lastError.message);
          
          // 尝试注入内容脚本然后重试
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content-script.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('❌ [TABIENT] 注入内容脚本失败:', chrome.runtime.lastError.message);
              resolve(false);
            } else {
              console.log('✅ [TABIENT] 内容脚本注入成功，重试发送消息');
              
              // 等待一下让内容脚本初始化
              setTimeout(() => {
                chrome.tabs.sendMessage(activeTab.id, {
                  type: 'playSound',
                  frequency: frequency,
                  duration: duration,
                  effects: effects
                }, (response2) => {
                  if (chrome.runtime.lastError) {
                    console.log('❌ [TABIENT] 重试发送消息失败:', chrome.runtime.lastError.message);
                    resolve(false);
                  } else {
                    console.log('✅ [TABIENT] 重试发送消息成功');
                    resolve(response2 && response2.success);
                  }
                });
              }, 100);
            }
          });
        } else {
          console.log('✅ [TABIENT] 标签页音频播放成功');
          resolve(response && response.success);
        }
      });
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ [TABIENT] 音频播放失败:', error);
    return false;
  }
}

// 初始化音频系统 - 简化版本
async function initAudio() {
  try {
    if (!audioContext) {
      console.log('🎵 [TABIENT] 音频系统初始化完成 (使用标签页播放)');
      audioContext = { ready: true };
    }
    return true;
  } catch (error) {
    console.error('❌ [TABIENT] 音频系统初始化失败:', error);
    return false;
  }
}

// 播放简单的音效
async function playSound(frequency = 440, duration = 0.3) {
  try {
    console.log('🎵 [TABIENT] 开始播放音频:', { frequency, duration });
    
    const initialized = await initAudio();
    if (!initialized) {
      return false;
    }
    
    // 直接播放音频，不使用 offscreen document
    const result = await playSoundDirect(frequency, duration);
    
    if (result) {
      console.log('✅ [TABIENT] 音频播放成功');
    } else {
      console.log('❌ [TABIENT] 音频播放失败');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ [TABIENT] 音频播放失败:', error);
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
      console.log('🚫 [TABIENT] URL 解析失败:', tab.url);
      return;
    }
    
    // 根据主机名和强度选择频率
    const frequency = getFrequencyFromHost(hostname);
    const duration = Math.min(0.8, 0.2 + (config.intensity * 0.4));
    
    console.log('🎵 [TABIENT] 标签切换:', { hostname, frequency: frequency.toFixed(2), duration: duration.toFixed(3) });
    
    const success = await playSound(frequency, duration);
    if (success) {
      lastPlayTime = now;
      totalPlays++;
    }
    
  } catch (error) {
    console.error('❌ [TABIENT] 处理标签切换失败:', error);
  }
});

// 处理消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [TABIENT] 收到消息:', message);
  console.log('📨 [TABIENT] 发送者:', sender);
  
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
    
    sendResponse({ success: true });
    return false;
  }
  
  if (message.type === 'getStatus') {
    const status = {
      enabled: config.enabled,
      audioContext: audioContext ? 'ready' : 'not_initialized',
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
      audioEngine: !!audioContext,
      audioContext: audioContext ? 'ready' : 'not_initialized',
      permissions: true,
      messaging: true,
      issues: []
    };
    
    // 检查问题
    if (!results.audioEngine) {
      results.issues.push('音频引擎未初始化');
    }
    
    sendResponse({ success: true, results });
    return false;
  }
  
  if (message.type === 'getLogs') {
    // 简单的日志收集
    const logs = [
      `[${new Date().toISOString()}] TaBient 日志`,
      `配置: ${JSON.stringify(config, null, 2)}`,
      `统计: 总播放次数 ${totalPlays}, 最后播放 ${new Date(lastPlayTime).toLocaleString()}`
    ].join('\n');
    
    sendResponse({ logs });
    return false;
  }
  
  return false;
});

// 初始化
console.log('🎵 [TABIENT] 开始初始化...');
initAudio().then(() => {
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
    audioContext: audioContext ? 'ready' : 'not_initialized',
    enabled: config.enabled
  };
};

console.log('🎵 [TABIENT] 极简版本加载完成');