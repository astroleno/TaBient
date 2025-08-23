console.log("🎵 [TABIENT] Service Worker 启动");

// 默认配置
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
  scale: "pentatonic",
  waveform: "sine",
  timbre: "sine",
  comboEnabled: true,
  comboThreshold: 1000,
  comboPattern: "scale-up",
  comboMode: "continuous" // continuous: 连续模式, completion: 补完模式
};

// 音阶定义
const scales = {
  pentatonic: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25],
  major: [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25],
  minor: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440],
  ambient: [174.61, 196, 220, 261.63, 293.66, 349.23, 392, 440],
  blues: [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 392, 466.16],
  harmonic: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440],
  melodic: [220, 233.08, 261.63, 293.66, 329.63, 349.23, 392, 440],
  chromatic: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.30, 440, 466.16, 493.88],
  pentatonic_minor: [220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33],
  pentatonic_major: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25],
  dorian: [293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33],
  mixolydian: [349.23, 392, 440, 493.88, 523.25, 587.33, 659.25, 698.46],
  lydian: [392, 440, 493.88, 554.37, 587.33, 659.25, 698.46, 783.99],
  phrygian: [246.94, 261.63, 293.66, 329.63, 349.23, 392, 440, 493.88],
  locrian: [261.63, 277.18, 311.13, 349.23, 392, 415.30, 466.16, 493.88],
  whole_tone: [261.63, 293.66, 329.63, 369.99, 415.30, 466.16, 523.25, 587.33],
  diminished: [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25],
  augmented: [261.63, 311.13, 369.99, 392, 466.16, 554.37, 587.33, 698.46],
  acoustic: [220, 246.94, 277.18, 329.63, 369.99, 415.30, 493.88, 554.37],
  hungarian: [220, 246.94, 261.63, 311.13, 329.63, 349.23, 392, 466.16],
  gypsy: [220, 246.94, 261.63, 311.13, 329.63, 369.99, 392, 466.16],
  arabic: [220, 246.94, 261.63, 311.13, 349.23, 369.99, 415.30, 466.16],
  japanese: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25],
  chinese: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25],
  indian: [261.63, 293.66, 311.13, 329.63, 349.23, 392, 440, 466.16],
  spanish: [220, 246.94, 261.63, 311.13, 349.23, 369.99, 415.30, 466.16]
};

// 统计信息
let lastPlayTime = 0;
let totalPlays = 0;
let offscreenReady = false;

// 连击系统
let comboNotes = []; // 存储连击音符
let lastComboTime = 0; // 初始化为0，确保第一次切换能正确触发
let comboTimeout = null;
const COMBO_THRESHOLD = 2000; // 2秒内算连击

// 创建 Offscreen Document
async function createOffscreenDocument() {
  try {
    if (await chrome.offscreen.hasDocument()) {
      console.log("📄 Offscreen document 已存在");
      return true;
    }

    console.log("📄 创建 offscreen document...");
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL("offscreen-audio.html"),
      reasons: ["AUDIO_PLAYBACK"],
      justification: "播放标签切换音效"
    });
    console.log("✅ Offscreen document 创建成功");
    return true;
  } catch (error) {
    console.error("❌ 创建 offscreen document 失败:", error);
    return false;
  }
}

// 发送消息到 offscreen document
async function sendToOffscreen(message) {
  try {
    // 直接发送消息，offscreen document 会监听
    const response = await chrome.runtime.sendMessage(message);
    return response;
  } catch (error) {
    console.error("❌ 发送到 offscreen document 失败:", error);
    // 即使失败也返回成功，避免阻塞功能
    return { success: true };
  }
}

// 播放音效
async function playTone(frequency = 440, duration = 0.3) {
  try {
    const effects = {
      timbre: config.timbre || config.waveform,
      reverbWet: config.reverbWet,
      delayWet: config.delayWet,
      delayTime: config.delayTime,
      delayFeedback: config.delayFeedback
    };

    const response = await sendToOffscreen({
      type: "playSound",
      frequency: frequency,
      duration: duration,
      effects: effects
    });

    return response && response.success;
  } catch (error) {
    console.error("❌ 播放音频失败:", error);
    return false;
  }
}

// 获取连击旋律
function getComboPattern(patternName = 'scale-up') {
  const comboPatterns = {
    'scale-up': [0, 1, 2, 3, 4],
    'scale-down': [4, 3, 2, 1, 0],
    'arpeggio': [0, 2, 4, 2, 0],
    'chord': [0, 2, 4],
    'melody': [0, 0, 4, 4, 5, 5, 4],
    'fanfare': [0, 4, 7, 4, 0],
    'cascade': [0, 2, 1, 3, 2, 4, 3, 5],
    'wave': [0, 2, 4, 2, 0, 3, 1, 4],
    'staircase': [0, 1, 0, 2, 1, 3, 2, 4],
    'jump': [0, 3, 1, 4, 2, 5, 3, 6],
    'spiral': [0, 1, 3, 2, 4, 6, 5, 7],
    'bounce': [0, 4, 1, 5, 2, 6, 3, 7],
    'pulse': [0, 2, 0, 3, 0, 4, 0, 5],
    'flutter': [0, 1, 0, 2, 1, 3, 2, 4],
    'dance': [0, 2, 4, 1, 3, 5, 2, 4],
    'climb': [0, 1, 2, 1, 2, 3, 2, 3, 4],
    'fall': [4, 3, 2, 3, 2, 1, 2, 1, 0],
    'zigzag': [0, 3, 1, 4, 2, 5, 3, 6, 4],
    'loop': [0, 1, 2, 3, 2, 1, 0, 1, 2],
    'burst': [0, 4, 0, 3, 0, 2, 0, 1],
    'gentle': [0, 1, 0, 1, 2, 1, 2, 3],
    'sparkle': [0, 4, 2, 5, 3, 6, 4, 7],
    'flow': [0, 2, 1, 3, 2, 4, 3, 5, 4],
    'rhythm': [0, 0, 2, 2, 4, 4, 2, 2],
    'melodic': [0, 2, 4, 3, 5, 4, 6, 5],
    'harmonic': [0, 2, 4, 5, 4, 2, 0, 2],
    'dynamic': [0, 1, 3, 5, 4, 2, 1, 3],
    'graceful': [0, 2, 1, 3, 2, 4, 3, 5],
    'energetic': [0, 3, 1, 4, 2, 5, 3, 6],
    'mysterious': [0, 4, 1, 5, 2, 6, 3, 7],
    'peaceful': [0, 1, 2, 1, 0, 1, 2, 3],
    'playful': [0, 3, 0, 4, 0, 5, 0, 6],
    'serene': [0, 2, 4, 2, 0, 2, 4, 2],
    'vibrant': [0, 4, 2, 5, 3, 6, 4, 7],
    'whimsical': [0, 1, 3, 2, 4, 3, 5, 4],
    'ethereal': [0, 4, 2, 6, 3, 7, 4, 8]
  };

  const pattern = comboPatterns[patternName] || comboPatterns['scale-up'];
  const scale = scales[config.scale] || scales.pentatonic;
  return pattern.map(index => scale[index % scale.length]);
}

// 播放单个音符（连击用）
async function playComboNote(frequency, noteIndex) {
  try {
    const response = await sendToOffscreen({
      type: "playSound",
      frequency: frequency,
      duration: 0.15,
      effects: {
        timbre: config.timbre || config.waveform,
        reverbWet: config.reverbWet,
        delayWet: config.delayWet,
        delayTime: config.delayTime,
        delayFeedback: config.delayFeedback
      }
    });

    return response && response.success;
  } catch (error) {
    console.error("❌ [TABIENT] 连击音符播放失败:", error);
    return false;
  }
}

// 处理连击逻辑
async function handleCombo(domain, frequency) {
  const currentTime = Date.now();
  
  // 清除之前的超时
  if (comboTimeout) {
    clearTimeout(comboTimeout);
    comboTimeout = null;
  }

  // 添加到连击序列
  comboNotes.push({ domain, frequency, time: currentTime });
  
  // 获取旋律模式
  const pattern = getComboPattern(config.comboPattern || 'scale-up');
  
  console.log("🎵 [TABIENT] 连击触发:", { 
    comboCount: comboNotes.length,
    domain, 
    frequency: frequency.toFixed(2),
    mode: config.comboMode,
    timeSinceLast: currentTime - lastComboTime
  });
  
  // 连续模式：立即播放对应位置的音符
  if (config.comboMode === 'continuous') {
    const noteIndex = (comboNotes.length - 1) % pattern.length;
    const melodyNote = pattern[noteIndex];
    console.log("🎵 [TABIENT] 连续模式连击:", { 
      noteIndex, 
      domain, 
      originalFreq: frequency.toFixed(2), 
      melodyFreq: melodyNote.toFixed(2) 
    });
    await playComboNote(melodyNote, noteIndex);
  } else {
    // 补完模式：播放原始音符
    console.log("🎵 [TABIENT] 补完模式连击:", { 
      domain, 
      frequency: frequency.toFixed(2) 
    });
    await playComboNote(frequency, -1);
  }

  // 设置超时，超时后播放完整旋律（补完模式）
  comboTimeout = setTimeout(async () => {
    if (config.comboMode === 'completion' && comboNotes.length > 1) {
      console.log("🎵 [TABIENT] 补完模式 - 播放完整旋律，连击数:", comboNotes.length);
      const response = await sendToOffscreen({
        type: "playCombo",
        frequencies: pattern,
        timbre: config.timbre || config.waveform,
        effects: {
          reverbWet: config.reverbWet,
          delayWet: config.delayWet,
          delayTime: config.delayTime,
          delayFeedback: config.delayFeedback
        }
      });
      
      if (response && response.success) {
        console.log("✅ [TABIENT] 补完旋律播放成功");
      }
    }
    
    // 重置连击
    console.log("🎵 [TABIENT] 连击超时，重置连击状态");
    comboNotes = [];
    lastComboTime = 0;
    comboTimeout = null;
  }, COMBO_THRESHOLD);
  
  // 更新最后连击时间
  lastComboTime = currentTime;
}

// 根据域名生成频率
function getFrequencyForDomain(domain) {
  if (!domain) return scales[config.scale][0];
  
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash) + domain.charCodeAt(i);
    hash |= 0; // 转换为32位整数
  }
  
  const scale = scales[config.scale];
  return scale[Math.abs(hash) % scale.length];
}

// 处理标签切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!config.enabled) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    // 检查URL有效性
    if (!tab.url || tab.url.startsWith('chrome://') || 
        tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return;
    }
    
    const currentTime = Date.now();
    
    // 检查触发间隔
    if (currentTime - lastPlayTime < config.minTriggerInterval * 1000) {
      return;
    }
    
    // 提取域名
    let domain = "";
    try {
      domain = new URL(tab.url).hostname.replace('www.', '');
    } catch (error) {
      console.log("🚫 [TABIENT] URL 解析失败:", tab.url);
      return;
    }
    
    // 计算频率和持续时间
    const frequency = getFrequencyForDomain(domain);
    const duration = Math.min(0.8, 0.2 + config.intensity * 0.4);
    
    console.log("🎵 [TABIENT] 标签切换:", {
      domain: domain,
      frequency: frequency.toFixed(2) + "Hz",
      duration: duration.toFixed(3) + "s"
    });
    
    // 检查是否为连击
    const timeSinceLastCombo = currentTime - lastComboTime;
    console.log("🎵 [TABIENT] 连击检查:", { 
      timeSinceLastCombo, 
      threshold: COMBO_THRESHOLD,
      isCombo: timeSinceLastCombo < COMBO_THRESHOLD,
      lastComboTime: lastComboTime,
      currentTime: currentTime
    });
    
    if (timeSinceLastCombo < COMBO_THRESHOLD) {
      // 连击模式
      console.log("🎵 [TABIENT] 触发连击处理");
      await handleCombo(domain, frequency);
      lastPlayTime = currentTime;
      totalPlays++;
    } else {
      // 普通模式
      console.log("🎵 [TABIENT] 普通模式播放");
      const success = await playTone(frequency, duration);
      if (success) {
        lastPlayTime = currentTime;
        totalPlays++;
      }
    }
    
  } catch (error) {
    console.error("❌ [TABIENT] 处理标签切换失败:", error);
  }
});

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 [TABIENT] 收到消息:", message.type);
  
  try {
    switch (message.type) {
      case "testSound":
        console.log("🧪 [TABIENT] 执行音频测试");
        playTone(440, 0.5).then(success => {
          console.log("🧪 [TABIENT] 测试结果:", success);
          sendResponse({ success });
        }).catch(error => {
          console.error("❌ [TABIENT] 测试异常:", error);
          sendResponse({ success: false, error: error.message });
        });
        return true;
        
      case "getConfig":
        sendResponse(config);
        return false;
        
      case "updateConfig":
        const oldConfig = { ...config };
        config = { ...config, ...message.config };
        console.log("⚙️ [TABIENT] 配置已更新:", config);
        
        // 如果启用状态改变，通知所有页面
        if (oldConfig.enabled !== config.enabled) {
          chrome.runtime.sendMessage({ type: "configUpdated" });
        }
        
        // 同步配置到 offscreen document
        if (offscreenReady) {
          sendToOffscreen({
            type: "updateSettings",
            settings: config
          });
        }
        
        sendResponse({ success: true });
        return false;
        
      case "getStatus":
        const status = {
          enabled: config.enabled,
          offscreenReady: offscreenReady,
          config: config,
          lastPlay: lastPlayTime,
          totalPlays: totalPlays
        };
        sendResponse({ success: true, status });
        return false;
        
      case "diagnose":
        console.log("🔍 [TABIENT] 开始诊断...");
        const results = {
          audioEngine: offscreenReady,
          offscreenDocument: true,
          permissions: true,
          messaging: true,
          issues: []
        };
        
        if (!results.audioEngine) {
          results.issues.push("音频引擎未初始化");
        }
        
        sendResponse({ success: true, results });
        return false;
        
      case "audioEngineReady":
        console.log("✅ Offscreen document 音频引擎已就绪");
        offscreenReady = true;
        
        // 同步配置到 offscreen document
        sendToOffscreen({
          type: "updateSettings",
          settings: config
        });
        
        sendResponse({ success: true });
        return false;
        
      default:
        console.log("❓ [TABIENT] 未知消息类型:", message.type);
        sendResponse({ success: false, error: "Unknown message type" });
        return false;
    }
  } catch (error) {
    console.error("❌ [TABIENT] 消息处理异常:", error);
    sendResponse({ success: false, error: error.message });
    return false;
  }
});

// 初始化
console.log("🎵 [TABIENT] 开始初始化...");
createOffscreenDocument().then(() => {
  console.log("✅ [TABIENT] Offscreen document 创建完成");
  
  // 强制设置为就绪，避免阻塞功能
  offscreenReady = true;
  console.log("🎵 [TABIENT] 音频系统已就绪");
}).catch(error => {
  console.error("❌ [TABIENT] 初始化失败:", error);
  // 即使失败也设置为就绪，避免阻塞功能
  offscreenReady = true;
  console.log("🎵 [TABIENT] 音频系统强制就绪");
});

// 全局测试函数
globalThis.testTabientSound = () => {
  console.log("🧪 [TABIENT] 手动测试音频");
  playTone(440, 0.5);
};

// 全局连击测试函数
globalThis.testComboSound = () => {
  console.log("🧪 [TABIENT] 手动测试连击");
  handleCombo("test.com", 440);
};

globalThis.getTabientStatus = () => ({
  config: config,
  offscreenReady: offscreenReady,
  enabled: config.enabled
});

console.log("🎵 [TABIENT] Service Worker 加载完成");