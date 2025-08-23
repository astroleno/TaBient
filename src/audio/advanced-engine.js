// TaBient 高级音频引擎
// 支持复杂音色和连击乐曲功能

console.log('🎵 [TABIENT ADVANCED ENGINE] 高级音频引擎启动');

// 导入音色系统
import './timbres.js';

class AdvancedAudioEngine {
  constructor() {
    this.audioContext = null;
    this.currentTimbre = 'sine';
    this.comboNotes = [];
    this.lastComboTime = 0;
    this.comboThreshold = 1000; // 1秒内连击
    this.isPlaying = false;
    
    // 连击乐曲预设
    this.comboPatterns = {
      'scale-up': [0, 2, 4, 5, 7], // 上行音阶
      'scale-down': [7, 5, 4, 2, 0], // 下行音阶
      'arpeggio': [0, 2, 4, 2, 0], // 琶音
      'chord': [0, 2, 4], // 和弦
      'melody': [0, 4, 2, 5, 7, 4, 2, 0], // 简单旋律
      'random': [0, 3, 1, 4, 2, 5] // 随机音程
    };
  }
  
  // 初始化音频上下文
  async initAudioContext() {
    if (this.audioContext) return true;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 [ADVANCED] AudioContext 创建成功，状态:', this.audioContext.state);
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('🎵 [ADVANCED] AudioContext 恢复成功');
      }
      
      return true;
    } catch (error) {
      console.error('❌ [ADVANCED] AudioContext 初始化失败:', error);
      return false;
    }
  }
  
  // 创建复杂音色
  createComplexTimbre(frequency, timbreId, startTime, duration) {
    const timbre = globalThis.TimbreSystem.getTimbre(timbreId);
    if (!timbre) {
      console.warn('⚠️ [ADVANCED] 未找到音色:', timbreId);
      return this.createSimpleOscillator(frequency, 'sine', startTime, duration);
    }
    
    const now = startTime || this.audioContext.currentTime;
    const gainNode = this.audioContext.createGain();
    
    // 创建主振荡器
    const mainOsc = this.audioContext.createOscillator();
    mainOsc.type = timbre.waveform;
    mainOsc.frequency.setValueAtTime(frequency, now);
    
    // 创建泛音
    const oscillators = [mainOsc];
    const harmonicGains = [];
    
    if (timbre.harmonics && timbre.harmonics.length > 1) {
      timbre.harmonics.forEach((harmonic, index) => {
        if (index === 0) return; // 跳过基频
        
        const harmOsc = this.audioContext.createOscillator();
        const harmGain = this.audioContext.createGain();
        
        harmOsc.type = timbre.waveform;
        harmOsc.frequency.setValueAtTime(frequency * (index + 1), now);
        harmGain.gain.setValueAtTime(harmonic * 0.1, now);
        
        harmOsc.connect(harmGain);
        harmGain.connect(gainNode);
        
        oscillators.push(harmOsc);
        harmonicGains.push(harmGain);
      });
    }
    
    // 应用包络
    this.applyEnvelope(gainNode, now, duration, timbre);
    
    // 应用滤波器
    if (timbre.filter) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(timbre.filter.frequency, now);
      filter.Q.setValueAtTime(timbre.filter.Q, now);
      
      mainOsc.connect(filter);
      filter.connect(gainNode);
      
      // 连接泛音到滤波器
      harmonicGains.forEach(harmGain => {
        harmGain.connect(filter);
      });
    } else {
      mainOsc.connect(gainNode);
    }
    
    // 添加失真效果
    if (timbre.distortion) {
      const waveshaper = this.audioContext.createWaveShaper();
      waveshaper.curve = this.makeDistortionCurve(timbre.distortion);
      
      // 重新连接到失真效果
      if (timbre.filter) {
        const filter = gainNode.disconnect();
        filter.connect(waveshaper);
        waveshaper.connect(this.audioContext.destination);
      } else {
        gainNode.connect(waveshaper);
        waveshaper.connect(this.audioContext.destination);
      }
    } else {
      gainNode.connect(this.audioContext.destination);
    }
    
    // 添加颤音效果
    if (timbre.vibrato) {
      this.addVibrato(mainOsc, timbre.vibrato, now, duration);
    }
    
    // 启动所有振荡器
    oscillators.forEach(osc => {
      osc.start(now);
      osc.stop(now + duration);
    });
    
    return { mainOsc, gainNode, oscillators };
  }
  
  // 创建简单振荡器（后备方案）
  createSimpleOscillator(frequency, waveform, startTime, duration) {
    const now = startTime || this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, now);
    
    // 简单包络
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return { oscillator, gainNode };
  }
  
  // 应用包络
  applyEnvelope(gainNode, startTime, duration, timbre) {
    const now = startTime;
    const attack = timbre.attack || 0.01;
    const decay = timbre.decay || 0.1;
    const sustain = timbre.sustain || 0.3;
    const release = timbre.release || 0.1;
    
    // ADSR 包络
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.15 * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(0.15 * sustain, now + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  }
  
  // 添加颤音
  addVibrato(oscillator, vibrato, startTime, duration) {
    const now = startTime;
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    
    lfo.frequency.setValueAtTime(vibrato.frequency, now);
    lfoGain.gain.setValueAtTime(vibrato.depth * oscillator.frequency.value, now);
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    lfo.start(now);
    lfo.stop(now + duration);
  }
  
  // 创建失真曲线
  makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }
  
  // 播放单个音符
  async playNote(frequency, duration = 0.3, timbreId = null) {
    const initialized = await this.initAudioContext();
    if (!initialized) return false;
    
    const timbre = timbreId || this.currentTimbre;
    const now = this.audioContext.currentTime;
    
    console.log('🎵 [ADVANCED] 播放音符:', { frequency, duration, timbre });
    
    this.createComplexTimbre(frequency, timbre, now, duration);
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), duration * 1000);
    });
  }
  
  // 处理连击
  async handleCombo(frequency) {
    const now = Date.now();
    
    // 检查是否在连击时间窗口内
    if (now - this.lastComboTime < this.comboThreshold) {
      this.comboNotes.push({
        frequency,
        time: now,
        noteIndex: this.comboNotes.length
      });
      
      console.log('🎵 [ADVANCED] 连击计数:', this.comboNotes.length);
      
      // 触发连击效果
      if (this.comboNotes.length >= 3) {
        await this.triggerComboPattern();
      }
    } else {
      // 重置连击
      this.comboNotes = [{ frequency, time: now, noteIndex: 0 }];
    }
    
    this.lastComboTime = now;
    
    // 清理旧的连击记录
    this.comboNotes = this.comboNotes.filter(note => now - note.time < this.comboThreshold);
  }
  
  // 触发连击乐曲
  async triggerComboPattern() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    const pattern = this.comboPatterns['scale-up']; // 默认上行音阶
    const baseFreq = this.comboNotes[0].frequency;
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C大调
    
    console.log('🎵 [ADVANCED] 触发连击乐曲!');
    
    // 播放连击旋律
    for (let i = 0; i < pattern.length; i++) {
      const noteIndex = pattern[i];
      const frequency = scale[noteIndex] || baseFreq;
      
      await this.playNote(frequency, 0.2, this.currentTimbre);
      await this.sleep(100); // 音符间隔
    }
    
    this.isPlaying = false;
  }
  
  // 设置连击阈值
  setComboThreshold(milliseconds) {
    this.comboThreshold = milliseconds;
    console.log('🎵 [ADVANCED] 连击阈值设置为:', milliseconds, 'ms');
  }
  
  // 设置音色
  setTimbre(timbreId) {
    if (globalThis.TimbreSystem.getTimbre(timbreId)) {
      this.currentTimbre = timbreId;
      console.log('🎵 [ADVANCED] 音色设置为:', timbreId);
    } else {
      console.warn('⚠️ [ADVANCED] 无效音色:', timbreId);
    }
  }
  
  // 辅助函数：延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 获取状态
  getStatus() {
    return {
      ready: !!this.audioContext,
      currentTimbre: this.currentTimbre,
      comboCount: this.comboNotes.length,
      comboThreshold: this.comboThreshold,
      isPlaying: this.isPlaying
    };
  }
}

// 创建全局实例
const advancedEngine = new AdvancedAudioEngine();

// 导出全局函数
globalThis.AdvancedAudioEngine = advancedEngine;
globalThis.playAdvancedNote = (frequency, duration, timbre) => 
  advancedEngine.playNote(frequency, duration, timbre);
globalThis.setAdvancedTimbre = (timbre) => 
  advancedEngine.setTimbre(timbre);
globalThis.setComboThreshold = (threshold) => 
  advancedEngine.setComboThreshold(threshold);
globalThis.handleComboNote = (frequency) => 
  advancedEngine.handleCombo(frequency);

console.log('🎵 [TABIENT ADVANCED ENGINE] 高级音频引擎加载完成');