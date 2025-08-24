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
    
    // 创建音色合成器
    const audioNodes = createTimbre(timbre, frequency, duration, currentTime);
    
    // 连接音频节点
    const finalGain = audioContext.createGain();
    audioNodes.output.connect(finalGain);
    finalGain.connect(audioContext.destination);
    
    // 设置主音量包络
    finalGain.gain.setValueAtTime(0, currentTime);
    finalGain.gain.linearRampToValueAtTime(0.15, currentTime + 0.01);
    finalGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
    
    // 播放
    audioNodes.start(currentTime);
    audioNodes.stop(currentTime + duration);
    
    console.log("✅ [OFFSCREEN] 音频播放成功");
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log("✅ [OFFSCREEN] 音频播放完成");
        resolve(true);
      }, duration * 1000 + 100);
    });
  } catch (error) {
    console.error("❌ [OFFSCREEN] 音频播放失败:", error);
    return false;
  }
}

// 创建具有特色的音色合成器
function createTimbre(timbre, frequency, duration, startTime) {
  switch (timbre) {
    case 'piano': // 传统钢琴
      return createPianoTimbre(frequency, duration, startTime);
    case 'guitar': // 电声吉他
      return createGuitarTimbre(frequency, duration, startTime);
    case 'bell': // 清脆铃声
      return createBellTimbre(frequency, duration, startTime);
    case 'organ': // 管风琴
      return createOrganTimbre(frequency, duration, startTime);
    case 'sine': // 清淡正弦
      return createBasicTimbre('sine', frequency, duration, startTime, 0.8);
    case 'triangle': // 温柔三角
      return createBasicTimbre('triangle', frequency, duration, startTime, 0.9);
    case 'square': // 硬朗方波
      return createSquareTimbre(frequency, duration, startTime);
    case 'sawtooth': // 尖锐锯齿
      return createSawtoothTimbre(frequency, duration, startTime);
    default:
      return createBasicTimbre('sine', frequency, duration, startTime, 0.8);
  }
}

// 创建钢琴音色
function createPianoTimbre(frequency, duration, startTime) {
  const fundamental = audioContext.createOscillator();
  const harmonics = [];
  const gains = [];
  
  // 基频
  fundamental.type = 'sine';
  fundamental.frequency.setValueAtTime(frequency, startTime);
  
  // 泛音
  const harmonicRatios = [1, 2, 3, 4, 5];
  const harmonicGains = [1.0, 0.4, 0.2, 0.15, 0.1];
  
  for (let i = 0; i < harmonicRatios.length; i++) {
    const harmonic = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(frequency * harmonicRatios[i], startTime);
    
    // 钢琴的特征包络
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(harmonicGains[i] * 0.3, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    harmonic.connect(gain);
    harmonics.push(harmonic);
    gains.push(gain);
  }
  
  // 输出混音器
  const mixer = audioContext.createGain();
  gains.forEach(gain => gain.connect(mixer));
  
  return {
    output: mixer,
    start: (time) => harmonics.forEach(h => h.start(time)),
    stop: (time) => harmonics.forEach(h => h.stop(time))
  };
}

// 创建电吉他音色
function createGuitarTimbre(frequency, duration, startTime) {
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const distortion = audioContext.createWaveShaper();
  const gain = audioContext.createGain();
  
  // 基础波形
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // 失真效果
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
  }
  distortion.curve = curve;
  distortion.oversample = '4x';
  
  // 低通滤波器模拟放大器
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, startTime);
  filter.Q.setValueAtTime(1, startTime);
  
  // 包络
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  // 连接
  oscillator.connect(distortion);
  distortion.connect(filter);
  filter.connect(gain);
  
  return {
    output: gain,
    start: (time) => oscillator.start(time),
    stop: (time) => oscillator.stop(time)
  };
}

// 创建铃声音色
function createBellTimbre(frequency, duration, startTime) {
  const oscillators = [];
  const gains = [];
  const mixer = audioContext.createGain();
  
  // 金属铃声的非谐波泛音
  const partials = [1.0, 2.76, 5.40, 8.93, 13.34, 18.64];
  const amplitudes = [1.0, 0.6, 0.4, 0.25, 0.15, 0.1];
  
  for (let i = 0; i < partials.length; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * partials[i], startTime);
    
    // 铃声的长衰减包络
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(amplitudes[i] * 0.3, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.5);
    
    osc.connect(gain);
    gain.connect(mixer);
    
    oscillators.push(osc);
    gains.push(gain);
  }
  
  return {
    output: mixer,
    start: (time) => oscillators.forEach(osc => osc.start(time)),
    stop: (time) => oscillators.forEach(osc => osc.stop(time + duration * 0.5))
  };
}

// 创建管风琴音色
function createOrganTimbre(frequency, duration, startTime) {
  const fundamental = audioContext.createOscillator();
  const subharmonic = audioContext.createOscillator();
  const harmonic = audioContext.createOscillator();
  const mixer = audioContext.createGain();
  const gain1 = audioContext.createGain();
  const gain2 = audioContext.createGain();
  const gain3 = audioContext.createGain();
  
  // 基频、低八度、高八度
  fundamental.type = 'sine';
  fundamental.frequency.setValueAtTime(frequency, startTime);
  
  subharmonic.type = 'sine';
  subharmonic.frequency.setValueAtTime(frequency * 0.5, startTime);
  
  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(frequency * 2, startTime);
  
  // 音量比例
  gain1.gain.setValueAtTime(0.4, startTime);
  gain2.gain.setValueAtTime(0.6, startTime);
  gain3.gain.setValueAtTime(0.3, startTime);
  
  fundamental.connect(gain1);
  subharmonic.connect(gain2);
  harmonic.connect(gain3);
  
  gain1.connect(mixer);
  gain2.connect(mixer);
  gain3.connect(mixer);
  
  return {
    output: mixer,
    start: (time) => {
      fundamental.start(time);
      subharmonic.start(time);
      harmonic.start(time);
    },
    stop: (time) => {
      fundamental.stop(time);
      subharmonic.stop(time);
      harmonic.stop(time);
    }
  };
}

// 创建有滤波的方波
function createSquareTimbre(frequency, duration, startTime) {
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // 低通滤波器软化方波
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(frequency * 4, startTime);
  filter.Q.setValueAtTime(2, startTime);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.12, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscillator.connect(filter);
  filter.connect(gain);
  
  return {
    output: gain,
    start: (time) => oscillator.start(time),
    stop: (time) => oscillator.stop(time)
  };
}

// 创建有滤波的锯齿波
function createSawtoothTimbre(frequency, duration, startTime) {
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // 低通滤波器去除尖锐的高频
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(frequency * 6, startTime);
  filter.Q.setValueAtTime(1, startTime);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscillator.connect(filter);
  filter.connect(gain);
  
  return {
    output: gain,
    start: (time) => oscillator.start(time),
    stop: (time) => oscillator.stop(time)
  };
}

// 创建基础音色
function createBasicTimbre(waveType, frequency, duration, startTime, volumeMultiplier = 1.0) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  const volume = volumeMultiplier * 0.15;
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscillator.connect(gain);
  
  return {
    output: gain,
    start: (time) => oscillator.start(time),
    stop: (time) => oscillator.stop(time)
  };
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
      const timbre = effects.timbre || currentTimbre || "sine";
      const audioNodes = createTimbre(timbre, frequency, duration, startTime);
      
      const finalGain = audioContext.createGain();
      audioNodes.output.connect(finalGain);
      finalGain.connect(audioContext.destination);
      
      finalGain.gain.setValueAtTime(0, startTime);
      finalGain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
      finalGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      audioNodes.start(startTime);
      audioNodes.stop(startTime + duration);
      
      setTimeout(() => {
        resolve(true);
      }, (startTime - audioContext.currentTime + duration) * 1000 + 50);
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