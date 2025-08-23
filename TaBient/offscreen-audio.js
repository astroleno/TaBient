console.log("🎵 [OFFSCREEN] Offscreen 音频处理器启动");

let audioContext = null;
let currentTimbre = "sine";

// 初始化 AudioContext
async function initAudioContext() {
  try {
    if (audioContext) {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log("🎵 [OFFSCREEN] AudioContext 恢复成功");
      }
      return true;
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log("🎵 [OFFSCREEN] AudioContext 创建成功，状态:", audioContext.state);
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log("🎵 [OFFSCREEN] AudioContext 恢复成功");
    }
    
    return true;
  } catch (error) {
    console.error("❌ [OFFSCREEN] AudioContext 初始化失败:", error);
    return false;
  }
}

// 播放单个音调
async function playTone(frequency = 440, duration = 0.3, effects = {}) {
  try {
    console.log("🎵 [OFFSCREEN] 开始播放音频:", { frequency, duration, effects });
    
    if (!await initAudioContext()) {
      return false;
    }

    const currentTime = audioContext.currentTime;
    const timbre = effects.timbre || currentTimbre || "sine";
    
    console.log("🎵 [OFFSCREEN] 使用音色:", timbre);
    
    // 创建振荡器
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 设置音色
    oscillator.type = getValidOscillatorType(timbre);
    oscillator.frequency.setValueAtTime(frequency, currentTime);
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
    
    // 连接音频节点
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 播放
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
    
    console.log("✅ [OFFSCREEN] 音频播放成功");
    
    return new Promise(resolve => {
      oscillator.onended = () => {
        console.log("✅ [OFFSCREEN] 音频播放完成");
        resolve(true);
      };
    });
  } catch (error) {
    console.error("❌ [OFFSCREEN] 音频播放失败:", error);
    return false;
  }
}

// 获取有效的振荡器类型
function getValidOscillatorType(timbre) {
  const validTypes = ['sine', 'square', 'sawtooth', 'triangle'];
  
  // 如果是基本音色，直接使用
  if (validTypes.includes(timbre)) {
    return timbre;
  }
  
  // 如果是高级音色，映射到基本音色
  const timbreMapping = {
    'acoustic-grand': 'sine',
    'electric-guitar': 'sawtooth',
    'bell': 'triangle',
    'piano': 'triangle',
    'guitar': 'sawtooth'
  };
  
  return timbreMapping[timbre] || 'sine';
}

// 播放连击序列
async function playComboSequence(frequencies, timbre, effects = {}) {
  try {
    console.log("🎵 [OFFSCREEN] 播放连击序列:", frequencies);
    
    if (!await initAudioContext()) {
      return false;
    }

    const currentTime = audioContext.currentTime;
    const noteDuration = 0.2;
    const noteInterval = 0.1;
    const promises = [];

    for (let i = 0; i < frequencies.length; i++) {
      const frequency = frequencies[i];
      const startTime = currentTime + i * (noteDuration + noteInterval);
      const promise = playNoteAtTime(frequency, noteDuration, { ...effects, timbre }, startTime);
      promises.push(promise);
    }

    const results = await Promise.all(promises);
    console.log("✅ [OFFSCREEN] 连击序列播放完成");
    return results.every(result => result);
  } catch (error) {
    console.error("❌ [OFFSCREEN] 连击序列播放失败:", error);
    return false;
  }
}

// 在指定时间播放音符
async function playNoteAtTime(frequency, duration, effects, startTime) {
  return new Promise(resolve => {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      const timbre = effects.timbre || currentTimbre || "sine";
      oscillator.type = getValidOscillatorType(timbre);
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
      console.error("❌ [OFFSCREEN] 音符播放失败:", error);
      resolve(false);
    }
  });
}

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 [OFFSCREEN] 收到消息:", message.type);
  
  try {
    switch (message.type) {
      case "playSound":
        console.log("🎵 [OFFSCREEN] 处理播放音频请求");
        const { frequency = 440, duration = 0.3, effects = {} } = message;
        playTone(frequency, duration, effects).then(success => {
          console.log("🎵 [OFFSCREEN] 播放结果:", success);
          sendResponse({ success });
        }).catch(error => {
          console.error("❌ [OFFSCREEN] 播放异常:", error);
          sendResponse({ success: false, error: error.message });
        });
        return true;
        
      case "playCombo":
        console.log("🎵 [OFFSCREEN] 处理连击音频请求");
        const { frequencies, timbre, effects: comboEffects = {} } = message;
        playComboSequence(frequencies, timbre, comboEffects).then(success => {
          console.log("🎵 [OFFSCREEN] 连击播放结果:", success);
          sendResponse({ success });
        }).catch(error => {
          console.error("❌ [OFFSCREEN] 连击播放异常:", error);
          sendResponse({ success: false, error: error.message });
        });
        return true;
        
      case "updateSettings":
        console.log("⚙️ [OFFSCREEN] 更新设置");
        if (message.settings && message.settings.timbre) {
          currentTimbre = message.settings.timbre;
          console.log("🎵 [OFFSCREEN] 更新音色为:", currentTimbre);
        }
        sendResponse({ success: true });
        return false;
        
      case "setTimbre":
        console.log("🎵 [OFFSCREEN] 设置音色:", message.timbre);
        currentTimbre = message.timbre;
        sendResponse({ success: true });
        return false;
        
      case "ping":
        console.log("📡 [OFFSCREEN] 收到 ping 消息");
        sendResponse({ success: true, status: "ok" });
        return false;
        
      default:
        console.log("❓ [OFFSCREEN] 未知消息类型:", message.type);
        sendResponse({ success: false, error: "Unknown message type" });
        return false;
    }
  } catch (error) {
    console.error("❌ [OFFSCREEN] 消息处理异常:", error);
    sendResponse({ success: false, error: error.message });
    return false;
  }
});

// 自动初始化
console.log("🎵 [OFFSCREEN] 开始自动初始化...");
initAudioContext().then(success => {
  console.log("🎵 [OFFSCREEN] 自动初始化结果:", success);
  if (success) {
    chrome.runtime.sendMessage({ type: "audioEngineReady" });
  }
}).catch(error => {
  console.error("❌ [OFFSCREEN] 自动初始化失败:", error);
});

console.log("🎵 [OFFSCREEN] 音频处理器加载完成");

// 调试测试函数
globalThis.testOffscreenAudio = () => {
  console.log("🧪 [OFFSCREEN] 执行调试测试...");
  playTone(440, 0.5);
};