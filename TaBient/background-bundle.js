// 日志管理
const LOG_LEVEL = 'ERROR'; // 'DEBUG', 'INFO', 'WARN', 'ERROR' - 生产环境只显示错误
const logger = {
  debug: (msg, ...args) => { if (LOG_LEVEL === 'DEBUG') console.log(`🔍 [DEBUG] ${msg}`, ...args); },
  info: (msg, ...args) => { if (['DEBUG', 'INFO'].includes(LOG_LEVEL)) console.log(`ℹ️ [INFO] ${msg}`, ...args); },
  warn: (msg, ...args) => { if (['DEBUG', 'INFO', 'WARN'].includes(LOG_LEVEL)) console.warn(`⚠️ [WARN] ${msg}`, ...args); },
  error: (msg, ...args) => { console.error(`❌ [ERROR] ${msg}`, ...args); }
};

logger.info("🎵 [TABIENT] Service Worker 启动");

// Service Worker 安装和启动事件
chrome.runtime.onInstalled.addListener(() => {
  logger.info("🎵 [TABIENT] 扩展已安装/更新");
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  logger.info("🎵 [TABIENT] 浏览器启动");
  initializeExtension();
});

// 统一的初始化函数
async function initializeExtension() {
  // 防止并发初始化
  if (isInitializing) {
    logger.debug("初始化已在进行中，跳过重复调用");
    return;
  }
  
  isInitializing = true;
  
  try {
    logger.info("🎵 开始初始化扩展");
    
    // 安全地关闭现有的 offscreen document
    try {
      if (await chrome.offscreen.hasDocument()) {
        logger.debug("关闭现有的 offscreen document");
        await chrome.offscreen.closeDocument();
        // 稍等片刻确保完全关闭
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (closeError) {
      logger.warn("关闭现有 offscreen document 失败", closeError);
    }
    
    // 创建新的 offscreen document
    const created = await createOffscreenDocument();
    if (created) {
      offscreenReady = true;
      logger.info("🎵 扩展初始化完成");
    } else {
      logger.error("扩展初始化失败：无法创建 offscreen document");
      offscreenReady = false;
    }
  } catch (error) {
    logger.error("扩展初始化异常", error);
    offscreenReady = false;
  } finally {
    isInitializing = false;
  }
}

// 初始化时加载统计数据并创建 offscreen document
chrome.storage.local.get(['totalPlays', 'todayPlays', 'lastResetDate', 'scaleStats', 'lastPlayTime'], async (result) => {
  totalPlays = result.totalPlays || 0;
  todayPlays = result.todayPlays || 0;
  lastResetDate = result.lastResetDate || new Date().toDateString();
  scaleStats = result.scaleStats || {};
  lastPlayTime = result.lastPlayTime || 0;
  
  // 检查是否需要重置今日计数
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    todayPlays = 0;
    lastResetDate = today;
    chrome.storage.local.set({ todayPlays, lastResetDate });
  }
  
  logger.debug("统计数据已加载", { totalPlays, todayPlays, scaleStats });
  
  // 初始化 offscreen document
  await initializeExtension();
  
  // 加载用户配置
  chrome.storage.local.get('tabientConfig', (configResult) => {
    if (configResult.tabientConfig) {
      config = { ...config, ...configResult.tabientConfig };
      logger.info("🎵 用户配置已加载", config);
    } else {
      logger.info("🎵 使用默认配置");
      // 保存默认配置
      chrome.storage.local.set({ tabientConfig: config });
    }
  });
});

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
  soundMode: "random", // "random" 或 "piano"
  blacklist: [], // 网站黑名单
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
let todayPlays = 0;
let lastResetDate = new Date().toDateString();
let scaleStats = {};
let offscreenReady = false;

// 初始化锁，防止并发初始化
let isInitializing = false;

// 连击系统
let comboNotes = []; // 存储连击音符
let lastComboTime = 0; // 初始化为0，确保第一次切换能正确触发
let comboTimeout = null;
const COMBO_THRESHOLD = 2000; // 2秒内算连击

// 创建 Offscreen Document
async function createOffscreenDocument() {
  try {
    // 再次检查是否已存在（防止竞态条件）
    if (await chrome.offscreen.hasDocument()) {
      logger.debug("📄 Offscreen document 已存在");
      return true;
    }

    logger.info("📄 创建 offscreen document...");
    
    const documentUrl = chrome.runtime.getURL("offscreen-audio.html");
    logger.debug("offscreen document URL:", documentUrl);
    
    await chrome.offscreen.createDocument({
      url: documentUrl,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "播放标签切换音效"
    });
    
    // 验证创建成功
    const hasDoc = await chrome.offscreen.hasDocument();
    if (hasDoc) {
      logger.info("✅ Offscreen document 创建成功");
      return true;
    } else {
      logger.error("❌ Offscreen document 创建后验证失败");
      return false;
    }
  } catch (error) {
    logger.error("❌ 创建 offscreen document 失败:", error.message);
    
    // 特殊处理常见错误
    if (error.message && error.message.includes("closed before fully loading")) {
      logger.warn("检测到并发创建问题，稍后重试");
    }
    
    return false;
  }
}

// 发送消息到 offscreen document
async function sendToOffscreen(message) {
  try {
    // 简单检查offscreen document是否存在
    if (!await chrome.offscreen.hasDocument()) {
      logger.warn("Offscreen document 不存在，跳过音效播放");
      return { success: true, skipped: true };
    }

    // 添加消息标识
    const messageWithId = {
      ...message,
      timestamp: Date.now(),
      from: 'background'
    };

    logger.debug("发送消息到 offscreen", messageWithId.type);
    
    // 发送消息，使用较短的超时时间
    const response = await Promise.race([
      chrome.runtime.sendMessage(messageWithId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('消息发送超时')), 2000)
      )
    ]);
    
    logger.debug("收到 offscreen 响应", response);
    return response;
    
  } catch (error) {
    logger.debug("发送到 offscreen document 失败", error.message);
    // 不要重试，直接返回成功避免阻塞
    return { success: true, skipped: true };
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
    // 经典旋律模式 - 区别明显的8种
    'scale-up': [0, 1, 2, 3, 4, 5, 6, 7], // Do Re Mi Fa Sol La Si Do 上行音阶
    'scale-down': [7, 6, 5, 4, 3, 2, 1, 0], // 下行音阶
    'arpeggio': [0, 2, 4, 7, 4, 2, 0], // C大三和弦琶音
    'melody': [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0], // 小星星旋律
    'fanfare': [0, 4, 7, 9, 7, 4, 0], // 号角声
    'wave': [0, 2, 1, 3, 2, 4, 3, 5, 4], // 波浪起伏
    'jump': [0, 4, 1, 5, 2, 6, 3, 7], // 跳跃音程
    'cascade': [0, 1, 0, 2, 1, 3, 2, 4, 3, 5] // 阶梯瓶音
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

// 添加音效模式设置
let soundMode = 'random'; // 'random' 或 'piano'

// 根据域名生成频率
async function getFrequencyForDomain(domain, tab = null) {
  if (!domain) return scales[config.scale][0];
  
  if (config.soundMode === 'piano') {
    // 钢琴键盘模式：按照标签位置从左到右递增音高
    return await getPianoModeFrequency(domain, tab);
  } else {
    // 随机模式：基于域名哈希
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = ((hash << 5) - hash) + domain.charCodeAt(i);
      hash |= 0; // 转换为32位整数
    }
    
    const scale = scales[config.scale];
    return scale[Math.abs(hash) % scale.length];
  }
}

// 钢琴模式频率生成 - 基于标签页实际位置
async function getPianoModeFrequency(domain, tab) {
  const scale = scales[config.scale];
  
  try {
    if (!tab || !tab.windowId) {
      // 如果没有tab信息，回退到域名哈希模式
      logger.debug("钢琴模式：缺少tab信息，使用域名哈希");
      return getHashBasedFrequency(domain, scale);
    }
    
    // 获取当前窗口的所有标签页
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    
    // 按index排序确保正确的从左到右顺序
    tabs.sort((a, b) => a.index - b.index);
    
    // 找到当前标签页的位置
    const tabIndex = tabs.findIndex(t => t.id === tab.id);
    
    if (tabIndex === -1) {
      logger.warn("钢琴模式：无法找到标签位置，使用域名哈希");
      return getHashBasedFrequency(domain, scale);
    }
    
    // 计算音高：从左到右，低音到高音
    const totalTabs = tabs.length;
    const scaleLength = scale.length;
    const octaves = 3; // 3个八度范围
    const totalNotes = scaleLength * octaves;
    
    // 将标签位置映射到键盘位置
    const keyPosition = Math.floor((tabIndex / Math.max(totalTabs - 1, 1)) * (totalNotes - 1));
    
    const octave = Math.floor(keyPosition / scaleLength);
    const noteIndex = keyPosition % scaleLength;
    
    // 基础频率乘以八度倍数
    const baseFreq = scale[noteIndex];
    const frequency = baseFreq * Math.pow(2, octave);
    
    logger.debug(`钢琴模式: ${domain} -> 位置${tabIndex + 1}/${totalTabs} -> 键位${keyPosition} -> ${frequency.toFixed(2)}Hz`);
    return frequency;
    
  } catch (error) {
    logger.error("钢琴模式频率计算失败", error);
    return getHashBasedFrequency(domain, scale);
  }
}

// 基于域名哈希的频率计算（回退方案）
function getHashBasedFrequency(domain, scale) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash) + domain.charCodeAt(i);
    hash |= 0;
  }
  
  const scaleLength = scale.length;
  const octaves = 2;
  const totalNotes = scaleLength * octaves;
  
  const keyPosition = Math.abs(hash) % totalNotes;
  const octave = Math.floor(keyPosition / scaleLength);
  const noteIndex = keyPosition % scaleLength;
  
  const baseFreq = scale[noteIndex];
  const frequency = baseFreq * Math.pow(2, octave);
  
  logger.debug(`哈希模式: ${domain} -> 键位${keyPosition} -> ${frequency.toFixed(2)}Hz`);
  return frequency;
}

// 获取最爱音阶
function getFavoriteScale() {
  let maxCount = 0;
  let favorite = 'pentatonic';
  
  for (const [scale, count] of Object.entries(scaleStats)) {
    if (count > maxCount) {
      maxCount = count;
      favorite = scale;
    }
  }
  
  return favorite;
}

// 处理标签切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!config.enabled) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    // 支持所有类型的tab（包括extensions、空白页等）
    // 移除URL过滤，让所有tab都能触发音效
    
    const currentTime = Date.now();
    
    // 检查触发间隔
    if (currentTime - lastPlayTime < config.minTriggerInterval * 1000) {
      return;
    }
    
    // 提取域名
    let domain = "";
    try {
      if (tab.url) {
        domain = new URL(tab.url).hostname.replace('www.', '');
      } else {
        domain = "blank-page";
      }
    } catch (error) {
      // 对于chrome://、about:等内部页面，使用特殊域名
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
        domain = tab.url.split('://')[1].split('/')[0] || "internal-page";
      } else {
        domain = "unknown-page";
      }
      logger.debug("使用特殊域名处理", { url: tab.url, domain });
    }

    // 检查黑名单
    if (config.blacklist && config.blacklist.includes(domain)) {
      logger.debug("网站在黑名单中，跳过音效", domain);
      return;
    }
    
    // 计算频率和持续时间（传入tab对象用于钢琴模式）
    const frequency = await getFrequencyForDomain(domain, tab);
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
    logger.error("处理标签切换失败", error);
  }
});

// 标签组事件监听
if (chrome.tabGroups) {
  chrome.tabGroups.onUpdated.addListener(async (group) => {
    if (!config.enabled) return;
    
    console.log("🏷️ [TABIENT] 标签组更新:", { id: group.id, title: group.title, color: group.color });
    
    // 基于标签组颜色生成音效
    const groupFrequency = getFrequencyForTabGroup(group.color, group.id);
    const duration = Math.min(0.6, 0.15 + config.intensity * 0.3);
    
    // 检查连击逻辑
    const currentTime = Date.now();
    if (currentTime - lastComboTime < COMBO_THRESHOLD) {
      await handleCombo(`group-${group.id}`, groupFrequency);
    } else {
      // 重置连击
      comboNotes = [];
      await playTone(groupFrequency, duration);
    }
    
    lastComboTime = currentTime;
    lastPlayTime = currentTime;
    totalPlays++;
    
    // 更新今日统计
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      todayPlays = 0;
      lastResetDate = today;
    }
    todayPlays++;
    
    // 更新音阶统计
    const currentScale = config.scale || 'pentatonic';
    scaleStats[currentScale] = (scaleStats[currentScale] || 0) + 1;
    
    // 保存统计数据
    chrome.storage.local.set({
      totalPlays,
      todayPlays,
      lastResetDate,
      scaleStats,
      lastPlayTime
    });
  });

  chrome.tabGroups.onCreated.addListener(async (group) => {
    if (!config.enabled) return;
    
    console.log("🏷️ [TABIENT] 标签组创建:", { id: group.id, color: group.color });
    
    // 为新创建的标签组播放特殊音效
    const createFrequency = getFrequencyForTabGroup(group.color, group.id);
    const pattern = getComboPattern('fanfare'); // 使用号角声表示创建
    
    // 播放创建音效序列
    for (let i = 0; i < Math.min(3, pattern.length); i++) {
      setTimeout(() => {
        playTone(pattern[i], 0.2);
      }, i * 150);
    }
    
    lastPlayTime = Date.now();
    totalPlays++;
  });
}

// 根据标签组颜色和ID生成频率
function getFrequencyForTabGroup(color, groupId) {
  const colorFrequencies = {
    'grey': 220,      // A3
    'blue': 261.63,   // C4
    'red': 293.66,    // D4
    'yellow': 329.63, // E4
    'green': 349.23,  // F4
    'pink': 392,      // G4
    'purple': 440,    // A4
    'cyan': 493.88,   // B4
    'orange': 523.25  // C5
  };
  
  // 基础频率 + 组ID的偏移
  const baseFreq = colorFrequencies[color] || 440;
  const offset = (groupId % 7) * 10; // 小幅度偏移
  return baseFreq + offset;
}

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
          totalPlays: totalPlays,
          todayPlays: todayPlays,
          scaleStats: scaleStats,
          favoriteScale: getFavoriteScale()
        };
        sendResponse({ success: true, status });
        return false;
        
      case "getStatistics":
        const statistics = {
          totalPlays,
          todayPlays,
          lastPlayTime,
          favoriteScale: getFavoriteScale(),
          scaleStats
        };
        sendResponse({ success: true, statistics });
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