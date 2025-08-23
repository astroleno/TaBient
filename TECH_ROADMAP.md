# TaBient 技术发展路线图

## 📋 概述

基于 ChatGPT 和 Gemini 的技术建议，结合当前代码架构，制定了 TaBient 音频系统的技术发展路线。本文档详细描述了未来可实现的功能方向、优先级和实施建议。

## 🎯 实现方向和优先级

### 🔥 **优先级 1：核心架构优化**

#### 1.1 **精确时序控制 (Precise Timing)**
**问题**：当前使用 `async/await` + `setTimeout` 控制音序，精度不足，可能导致音频卡顿。

**解决方案**：
- 使用 `audioContext.currentTime` 进行精确调度
- 基于硬件时钟的样本级别精确控制
- 一次性计算所有音频事件的开始时间

**实现代码**：
```javascript
class ComboPlayer {
  scheduleCombo(patternData, baseFreq, scale, timbreId) {
    const { pattern, rhythm, type } = patternData;
    const frequencies = pattern.map(noteIndex => scale[noteIndex] || baseFreq);
    const baseNoteDuration = 0.2;
    let currentTime = this.audioContext.currentTime;

    if (type === 'chord') {
      // 和弦模式：同时播放
      const duration = baseNoteDuration * (rhythm[0] || 1);
      frequencies.forEach(freq => {
        this.timbreRenderer.render(freq, duration, timbreId, currentTime);
      });
    } else {
      // 旋律模式：精确调度
      for (let i = 0; i < frequencies.length; i++) {
        const duration = baseNoteDuration * (rhythm[i] || 1);
        this.timbreRenderer.render(frequencies[i], duration, timbreId, currentTime);
        currentTime += duration + 0.05; // 50ms 间隔
      }
    }
  }
}
```

**预期效果**：
- ✅ 绝对稳定的节奏
- ✅ 消除音频卡顿
- ✅ 提升整体音频质量

#### 1.2 **音源池 (Voice Pooling)**
**问题**：每次播放都创建新的 OscillatorNode 和 GainNode，高频触发时给垃圾回收带来压力。

**解决方案**：
- 预创建一定数量的音源对象
- 播放时从池中获取可用音源
- 播放完成后释放回池中而非销毁

**实现代码**：
```javascript
class VoicePool {
  constructor(audioContext, poolSize = 8) {
    this.audioContext = audioContext;
    this.pool = [];
    this.initPool(poolSize);
  }

  initPool(size) {
    for (let i = 0; i < size; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      
      this.pool.push({
        oscillator,
        gain,
        inUse: false
      });
    }
  }

  acquire() {
    const voice = this.pool.find(v => !v.inUse);
    if (voice) {
      voice.inUse = true;
      return voice;
    }
    return null; // 池已满
  }

  release(voice) {
    voice.inUse = false;
  }
}
```

**预期效果**：
- ✅ 显著提升性能和稳定性
- ✅ 减少垃圾回收压力
- ✅ 支持高频触发场景

### 🎵 **优先级 2：连击系统增强**

#### 2.1 **节奏系统实现**
**现状**：`COMBO_PATTERNS` 中定义了 `rhythm` 属性但未在播放器中实现。

**解决方案**：
- 解析 `rhythm` 数组控制音符时长
- 动态计算每个音符的持续时间和间隔
- 实现更有音乐感的节奏变化

**扩展的连击模式定义**：
```javascript
const COMBO_PATTERNS = {
  'scale-up': {
    name: '上行音阶',
    type: 'melody',
    pattern: [0, 2, 4, 5, 7],
    rhythm: [0.5, 0.5, 0.5, 0.5, 1], // 最后一个音长一些
    description: '经典的上行音阶'
  },
  'chord': {
    name: '和弦',
    type: 'chord',
    pattern: [0, 4, 7], // 大三和弦
    rhythm: [2],
    description: '三和弦同时播放'
  },
  'melody': {
    name: '简单旋律',
    type: 'melody',
    pattern: [0, 0, 7, 7, 9, 9, 7, -1, 5, 5, 4, 4, 2, 2, 0],
    rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    description: '一闪一闪亮晶晶'
  }
};
```

#### 2.2 **和弦并发模式**
**现状**：当前只能串行播放音符，无法同时播放和弦。

**解决方案**：
- 增加 `type: 'chord'` 模式
- 同时创建多个音符的音源
- 在同一时间点启动所有音符

### 🎛️ **优先级 3：音色合成增强**

#### 3.1 **ADSR 包络多样性**
**现状**：所有音色的包络曲线都比较类似。

**解决方案**：为不同音色类型定制包络参数

**打击类乐器**：
```javascript
'drum-hit': {
  name: '打击乐',
  envelope: {
    attack: 0.001,    // 超短 Attack
    decay: 0.05,      // 快速 Decay
    sustain: 0,       // 无 Sustain
    release: 0.05     // 短 Release
  }
}
```

**弦乐/人声类**：
```javascript
'string-pad': {
  name: '弦乐铺垫',
  envelope: {
    attack: 0.3,      // 较长 Attack
    decay: 0.2,
    sustain: 0.7,     // 中高 Sustain
    release: 0.8      // 长 Release
  }
}
```

#### 3.2 **LFO 效果器**
**颤音 (Vibrato)**：
```javascript
// 在 TimbreRenderer.render 中添加
if (timbre.lfo && timbre.lfo.type === 'vibrato') {
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  
  lfo.frequency.setValueAtTime(timbre.lfo.frequency, now);
  lfoGain.gain.setValueAtTime(timbre.lfo.depth, now);
  
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency); // LFO 连接到主振荡器频率
  
  lfo.start(now);
  lfo.stop(now + duration);
}
```

**颤音 (Tremolo)**：
```javascript
if (timbre.lfo && timbre.lfo.type === 'tremolo') {
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  
  lfo.frequency.setValueAtTime(timbre.lfo.frequency, now);
  lfoGain.gain.setValueAtTime(timbre.lfo.depth, now);
  
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain); // LFO 连接到音量
  
  lfo.start(now);
  lfo.stop(now + duration);
}
```

#### 3.3 **效果器链**
**混响 (Reverb)**：
```javascript
// 使用 ConvolverNode 和脉冲响应
const convolver = audioContext.createConvolver();
const reverbGain = audioContext.createGain();

// 加载脉冲响应 (需要预录制的 IR 文件)
const impulseResponse = await loadImpulseResponse('ir-hall.wav');
convolver.buffer = impulseResponse;

reverbGain.gain.value = reverbWet;
source.connect(convolver);
convolver.connect(reverbGain);
reverbGain.connect(audioContext.destination);
```

**延迟 (Delay)**：
```javascript
const delay = audioContext.createDelay();
const delayGain = audioContext.createGain();
const feedbackGain = audioContext.createGain();

delay.delayTime.value = delayTime;
delayGain.gain.value = delayWet;
feedbackGain.gain.value = delayFeedback;

source.connect(delay);
delay.connect(feedbackGain);
feedbackGain.connect(delay); // 反馈回路
delay.connect(delayGain);
delayGain.connect(audioContext.destination);
```

### 🎼 **优先级 4：音乐性提升**

#### 4.1 **动态调性控制**
- 每次连击触发时随机选择大调/小调音阶
- 避免听觉疲劳，增加变化性

```javascript
const SCALES = {
  major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
  minor: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
  // 更多调式...
};

function getRandomScale() {
  const scaleTypes = Object.keys(SCALES);
  const randomType = scaleTypes[Math.floor(Math.random() * scaleTypes.length)];
  return SCALES[randomType];
}
```

#### 4.2 **力度变化**
- 音量随连击数递增
- 旋律中的轻重缓急

```javascript
function calculateVelocity(comboCount, baseGain = 0.15) {
  return baseGain * (1 + comboCount * 0.1); // 每次连击增加 10% 音量
}
```

#### 4.3 **旋律生成算法**
**随机变奏**：
```javascript
function addVariation(noteIndex, scale) {
  // 在固定 pattern 上 ±1 音阶的抖动
  const variation = Math.random() < 0.5 ? -1 : 1;
  const newIndex = Math.max(0, Math.min(scale.length - 1, noteIndex + variation));
  return scale[newIndex];
}
```

**马尔可夫链**：
```javascript
class MelodyGenerator {
  constructor() {
    this.transitionMatrix = this.buildTransitionMatrix();
  }
  
  buildTransitionMatrix() {
    // 构建音符转移概率矩阵
    return {
      0: { 2: 0.4, 4: 0.3, 7: 0.2, 5: 0.1 },
      2: { 4: 0.5, 0: 0.3, 7: 0.2 },
      // 更多转移规则...
    };
  }
  
  generateNextNote(currentNoteIndex) {
    const transitions = this.transitionMatrix[currentNoteIndex];
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [nextIndex, probability] of Object.entries(transitions)) {
      cumulative += probability;
      if (rand <= cumulative) {
        return parseInt(nextIndex);
      }
    }
    
    return currentNoteIndex; // 默认保持当前音符
  }
}
```

**动机重复**：
```javascript
function generateMotif(basePattern, repetitions = 2) {
  const motif = [];
  for (let i = 0; i < repetitions; i++) {
    const variation = i === 0 ? basePattern : 
      basePattern.map(note => addVariation(note, currentScale));
    motif.push(...variation);
  }
  return motif;
}
```

### 🎹 **优先级 5：高级音色扩展**

#### 5.1 **FM 合成**
**经典 DX7 风格铃声**：
```javascript
class FMSynthesizer {
  render(frequency, duration, carrierConfig, modulatorConfig) {
    const carrier = audioContext.createOscillator();
    const modulator = audioContext.createOscillator();
    const modulatorGain = audioContext.createGain();
    
    // 配置载波
    carrier.type = carrierConfig.type || 'sine';
    carrier.frequency.setValueAtTime(frequency, now);
    
    // 配置调制波
    modulator.type = modulatorConfig.type || 'sine';
    modulator.frequency.setValueAtTime(frequency * modulatorConfig.ratio, now);
    modulatorGain.gain.setValueAtTime(modulatorConfig.depth, now);
    
    // FM 连接：调制波 → 载波频率
    modulator.connect(modulatorGain);
    modulatorGain.connect(carrier.frequency);
    
    carrier.connect(audioContext.destination);
    
    carrier.start(now);
    carrier.stop(now + duration);
    modulator.start(now);
    modulator.stop(now + duration);
  }
}
```

#### 5.2 **采样器支持**
**真实乐器音色**：
```javascript
class Sampler {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.samples = new Map();
  }
  
  async loadSample(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      this.samples.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sample ${name}:`, error);
    }
  }
  
  playSample(name, pitch = 1, startTime = 0) {
    const sample = this.samples.get(name);
    if (!sample) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = sample;
    source.playbackRate.value = pitch;
    
    source.connect(audioContext.destination);
    source.start(startTime);
  }
}
```

## 🚀 **建议实施顺序**

### **第一阶段：基础架构优化 (1-2 周)**
1. **精确时序控制** - 使用 `audioContext.currentTime`
2. **音源池实现** - 预创建音源对象
3. **节奏系统** - 实现 `rhythm` 数组支持

**目标**：解决性能问题，建立稳定的基础架构

### **第二阶段：连击体验提升 (1 周)**
1. **和弦模式** - 支持同时播放多个音符
2. **扩展连击模式** - 增加更多音乐性模式
3. **基础包络优化** - 为不同音色定制包络

**目标**：大幅提升用户体验和音乐性

### **第三阶段：音色丰富 (2-3 周)**
1. **LFO 效果器** - 颤音、颤音效果
2. **效果器链** - 混响、延迟、失真
3. **高级音色定义** - FM 合成、复杂音色

**目标**：建立专业级音色库

### **第四阶段：音乐性算法 (2-3 周)**
1. **动态调性** - 随机切换调式
2. **力度变化** - 连击力度递增
3. **旋律生成** - 随机变奏、马尔可夫链

**目标**：让系统具有真正的音乐创作能力

### **第五阶段：高级功能 (1-2 周)**
1. **采样器支持** - 真实乐器音色
2. **音色编辑器** - 用户自定义音色
3. **模式编辑器** - 用户自定义连击模式

**目标**：完整的音乐创作工具

## 📊 **技术影响评估**

### **性能影响**
- ✅ **音源池**：显著提升高频触发性能
- ✅ **精确调度**：减少 CPU 占用，提升稳定性
- ⚠️ **复杂音色**：可能增加 CPU 使用，需要优化
- ⚠️ **效果器链**：需要平衡音质和性能

### **用户体验影响**
- 🔥 **节奏系统**：立即提升音乐性和趣味性
- 🔥 **和弦模式**：大幅丰富听觉体验
- 🔥 **动态调性**：避免听觉疲劳
- 🎵 **音色丰富**：提供更多选择和个性化

### **开发复杂度**
- 🟢 **第一阶段**：中等复杂度，主要是架构优化
- 🟡 **第二阶段**：中等复杂度，需要音乐理论支持
- 🟡 **第三阶段**：较高复杂度，需要音频合成知识
- 🔴 **第四阶段**：高复杂度，需要算法设计能力
- 🔴 **第五阶段**：高复杂度，需要完整的系统设计

## 🎯 **总结**

这个技术路线图将 TaBient 从一个功能性的音频工具提升为一个具有专业水准和艺术表现力的乐器。通过分阶段实施，可以：

1. **确保系统稳定性**：优先解决基础架构问题
2. **快速提升用户体验**：连击和节奏系统改进
3. **逐步扩展功能边界**：音色和音乐性算法
4. **保持代码可维护性**：模块化设计和清晰架构

建议从第一阶段开始，这是整个音频系统的基础，也是性能和体验的关键。每个阶段完成后都会带来显著的用户体验提升。