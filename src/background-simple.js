// TaBient Background Script - Direct Audio API Version
// 直接使用 Web Audio API，不使用 offscreen document

// 简单的日志记录功能
const TabientLogger = {
  logs: [],
  
  log: function(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  },
  
  error: function(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    this.logs.push(logEntry);
    console.error(logEntry);
  },
  
  getLogs: function() {
    return this.logs.join('\n');
  }
};

// 默认配置
const DEFAULT_CONFIG = {
  enabled: true,
  masterVolume: -12,
  reverbWet: 0.25,
  delayWet: 0.18,
  intensity: 1.0,
  minTriggerInterval: 0, // 瞬发，无延迟
  scale: 'pentatonic',
  volume: 0.7,
  timbre: 'sine',
  comboEnabled: true,
  comboThreshold: 1000,
  comboPattern: 'scale-up'
};

// 当前配置
let currentConfig = { ...DEFAULT_CONFIG };
let lastPlayTime = 0;

// 连击系统
let comboNotes = [];
let lastComboTime = 0;
let comboThreshold = 1000;
let isPlayingCombo = false;

// 音阶定义
const SCALES = {
  pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
  minor: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
  ambient: [174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00]
};

// 连击乐曲模式
const COMBO_PATTERNS = {
  'scale-up': [0, 2, 4, 5, 7],
  'scale-down': [7, 5, 4, 2, 0],
  'arpeggio': [0, 2, 4, 2, 0],
  'chord': [0, 2, 4],
  'melody': [0, 4, 2, 5, 7, 4, 2, 0],
  'random': [0, 3, 1, 4, 2, 5],
  'fanfare': [0, 4, 7, 4, 0],
  'cascade': [0, 2, 4, 2, 0, 2, 4]
};

// 初始化扩展
chrome.runtime.onInstalled.addListener(() => {
  TabientLogger.log('🎯 TaBient extension installed with Direct Audio API');
  
  // 加载配置
  chrome.storage.local.get(['tabientConfig'], (result) => {
    if (!result.tabientConfig) {
      chrome.storage.local.set({ tabientConfig: DEFAULT_CONFIG });
      currentConfig = DEFAULT_CONFIG;
    } else {
      currentConfig = { ...DEFAULT_CONFIG, ...result.tabientConfig };
    }
    
    TabientLogger.log('✅ 初始化完成，直接音频引擎就绪');
  });
});

// 监听配置变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.tabientConfig) {
    currentConfig = { ...DEFAULT_CONFIG, ...changes.tabientConfig.newValue };
    TabientLogger.log('🔄 配置已更新');
  }
});

// 从域名选择音符
function pickNoteFromHost(host) {
  if (!host) return SCALES[currentConfig.scale][0];
  
  let hash = 0;
  for (const char of host) {
    hash = (hash * 131 + char.charCodeAt(0)) >>> 0;
  }
  
  const scale = SCALES[currentConfig.scale];
  return scale[hash % scale.length];
}

// 处理连击
async function handleCombo(frequency) {
  const now = Date.now();
  
  if (now - lastComboTime < comboThreshold) {
    comboNotes.push({
      frequency,
      time: now,
      noteIndex: comboNotes.length
    });
    
    if (comboNotes.length >= 3 && !isPlayingCombo) {
      await triggerComboPattern();
    }
  } else {
    comboNotes = [{ frequency, time: now, noteIndex: 0 }];
  }
  
  lastComboTime = now;
  comboNotes = comboNotes.filter(note => now - note.time < comboThreshold);
}

// 触发连击乐曲
async function triggerComboPattern() {
  if (isPlayingCombo) return;
  
  isPlayingCombo = true;
  
  const patternName = currentConfig.comboPattern || 'scale-up';
  const pattern = COMBO_PATTERNS[patternName] || COMBO_PATTERNS['scale-up'];
  const baseFreq = comboNotes[0].frequency;
  const scale = SCALES[currentConfig.scale];
  
  TabientLogger.log('🎵 触发连击乐曲!', { pattern: patternName, notes: comboNotes.length });
  
  const frequencies = pattern.map(noteIndex => {
    return scale[noteIndex] || baseFreq;
  });
  
  try {
    await playComboSequence(frequencies);
    TabientLogger.log('🎵 连击播放完成');
  } catch (error) {
    TabientLogger.error('❌ 连击播放异常:', error);
  }
  
  comboNotes = [];
  isPlayingCombo = false;
}

// 直接使用 Web Audio API 播放音频
async function playDirectAudio(frequency, duration) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    const timbre = currentConfig.timbre || 'sine';
    oscillator.type = timbre;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    TabientLogger.log('✅ 音频播放成功');
    return true;
    
  } catch (error) {
    TabientLogger.error('❌ 直接音频播放失败:', error);
    return false;
  }
}

// 播放连击序列
async function playComboSequence(frequencies) {
  for (let i = 0; i < frequencies.length; i++) {
    const frequency = frequencies[i];
    const duration = 0.2;
    
    await playDirectAudio(frequency, duration);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 直接播放音频 - 主函数
async function playSyntheticSound(host, intensity = 1.0) {
  if (!currentConfig.enabled) {
    TabientLogger.log('🚫 插件已禁用');
    return false;
  }
  
  const now = Date.now();
  
  if (now - lastPlayTime < (currentConfig.minTriggerInterval * 1000)) {
    TabientLogger.log('🚫 防抖动保护，跳过播放');
    return false;
  }
  
  lastPlayTime = now;
  
  try {
    const frequency = pickNoteFromHost(host);
    const duration = Math.min(0.6, 0.15 + 0.25 * intensity);
    
    TabientLogger.log('🎵 播放音频:', {
      host,
      frequency: frequency.toFixed(2),
      duration: duration.toFixed(3)
    });
    
    return await playDirectAudio(frequency, duration);
    
  } catch (error) {
    TabientLogger.error('❌ 播放音频失败:', error);
    return false;
  }
}

// 监听标签切换事件
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!currentConfig.enabled) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    if (!tab.url || tab.url.startsWith('chrome://') || 
        tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return;
    }
    
    let domain;
    try {
      const url = new URL(tab.url);
      domain = url.hostname.replace('www.', '');
    } catch (urlError) {
      return;
    }
    
    TabientLogger.log('🎵 标签切换:', domain);
    
    const frequency = pickNoteFromHost(domain);
    await handleCombo(frequency);
    await playSyntheticSound(domain, currentConfig.intensity);
    
  } catch (error) {
    TabientLogger.error('❌ 处理标签切换失败:', error);
  }
});

// 处理消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getConfig') {
    sendResponse(currentConfig);
    return false;
  }
  
  if (message.type === 'updateConfig') {
    currentConfig = { ...DEFAULT_CONFIG, ...message.config };
    chrome.storage.local.set({ tabientConfig: currentConfig });
    TabientLogger.log('✅ 配置已更新');
    sendResponse({ success: true });
    return false;
  }
  
  if (message.type === 'getStatus') {
    sendResponse({
      success: true,
      status: {
        enabled: currentConfig.enabled,
        config: currentConfig,
        lastPlayTime: lastPlayTime,
        totalPlays: comboNotes.length
      }
    });
    return false;
  }
  
  if (message.type === 'testSound') {
    playDirectAudio(440, 0.5).then(success => {
      sendResponse({ success });
    });
    return true;
  }
  
  if (message.type === 'testCombo') {
    comboNotes = [
      { frequency: 440, time: Date.now() - 200 },
      { frequency: 523, time: Date.now() - 100 },
      { frequency: 659, time: Date.now() }
    ];
    triggerComboPattern().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  return false;
});

// 提供调试函数
globalThis.getTabientStatus = function() {
  return {
    config: currentConfig,
    enabled: currentConfig.enabled,
    audioEngine: 'Direct Web Audio API',
    lastPlayTime: lastPlayTime
  };
};

globalThis.testTabientSound = function(host = 'example.com') {
  playSyntheticSound(host, currentConfig.intensity);
};

TabientLogger.log('🚀 Background script 加载完成');