// TaBient Audio Engine
// 基于 Tone.js 的专业音频合成引擎

import * as Tone from 'tone'

class AudioEngine {
  constructor() {
    this.inited = false
    this.unlocked = false
    this.buses = {}
    this.synthPool = []
    this.lastPlayTime = 0
    this.settings = {
      masterVolume: -12, // dB
      reverbWet: 0.25,
      delayWet: 0.18,
      reverbDecay: 2.2,
      delayTime: 0.18,
      delayFeedback: 0.22,
      intensity: 1.0,
      minTriggerInterval: 0.06 // 60ms 最小间隔
    }
    
    // 音阶定义
    this.scales = {
      pentatonic: ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],
      major: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
      minor: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"],
      ambient: ["F3", "G3", "A3", "C4", "D4", "F4", "G4", "A4"]
    }
    
    this.currentScale = 'pentatonic'
  }

  // 初始化音频引擎
  async init() {
    if (this.inited) return
    
    try {
      // 启动 Tone.js
      await Tone.start()
      this.inited = true
      
      // 创建音频总线
      this.setupBuses()
      
      // 创建合成器池
      this.setupSynthPool()
      
      console.log('TaBient Audio Engine initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      return false
    }
  }

  // 解锁音频（需要用户交互）
  async unlock() {
    if (this.unlocked) return true
    
    try {
      // 在用户交互时调用
      await Tone.start()
      this.unlocked = true
      console.log('Audio unlocked')
      return true
    } catch (error) {
      console.error('Failed to unlock audio:', error)
      return false
    }
  }

  // 设置音频总线
  setupBuses() {
    // 主输出总线
    this.buses.master = new Tone.Channel({ 
      volume: this.settings.masterVolume 
    }).toDestination()

    // 混响发送总线
    this.buses.reverb = new Tone.Reverb({ 
      decay: this.settings.reverbDecay, 
      preDelay: 0.02, 
      wet: this.settings.reverbWet 
    }).connect(this.buses.master)

    // 延时发送总线
    this.buses.delay = new Tone.FeedbackDelay({ 
      delayTime: this.settings.delayTime, 
      feedback: this.settings.delayFeedback, 
      wet: this.settings.delayWet 
    }).connect(this.buses.master)

    // 为不同类型的音效创建专用通道
    this.buses.information = this.createTypeChannel('information')
    this.buses.media = this.createTypeChannel('media')
    this.buses.system = this.createTypeChannel('system')
  }

  // 创建类型专用通道
  createTypeChannel(type) {
    const channel = new Tone.Channel()
    
    switch (type) {
      case 'information':
        // 资讯/文档类：柔和 FM 合成
        channel.connect(this.buses.reverb)
        channel.connect(this.buses.master)
        break
      case 'media':
        // 媒体/创意类：Pluck 合成 + 延时
        channel.connect(this.buses.delay)
        channel.connect(this.buses.master)
        break
      case 'system':
        // 系统/设置类：低频脉冲
        channel.connect(this.buses.master)
        break
    }
    
    return channel
  }

  // 设置合成器池
  setupSynthPool() {
    const poolSize = 8 // 合成器池大小
    
    for (let i = 0; i < poolSize; i++) {
      const synth = this.createSynth(i)
      this.synthPool.push({
        synth: synth,
        inUse: false,
        type: 'information'
      })
    }
  }

  // 创建合成器
  createSynth(index) {
    // 根据索引创建不同类型的合成器
    const types = ['information', 'media', 'system']
    const type = types[index % types.length]
    
    let synth
    switch (type) {
      case 'information':
        // 柔和的 FM 合成
        synth = new Tone.AMSynth({
          harmonicity: 1.5,
          modulationIndex: 2,
          envelope: {
            attack: 0.002,
            decay: 0.12,
            sustain: 0.1,
            release: 0.25
          },
          modulationEnvelope: {
            attack: 0.001,
            decay: 0.08,
            sustain: 0.05,
            release: 0.2
          }
        })
        break
        
      case 'media':
        // Pluck 合成
        synth = new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.9
        })
        break
        
      case 'system':
        // 低频合成
        synth = new Tone.MonoSynth({
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0.1,
            release: 0.1
          },
          filter: {
            Q: 1,
            type: 'lowpass',
            rolloff: -12
          }
        })
        break
    }
    
    return synth
  }

  // 获取下一个可用合成器
  getNextSynth(type = 'information') {
    const availableSynths = this.synthPool.filter(s => !s.inUse)
    if (availableSynths.length === 0) {
      // 如果没有可用的合成器，找到最早使用的
      const oldestSynth = this.synthPool.reduce((oldest, current) => 
        oldest.lastUsed < current.lastUsed ? oldest : current
      )
      return oldestSynth
    }
    
    // 优先选择同类型的合成器
    const typeSynth = availableSynths.find(s => s.type === type)
    return typeSynth || availableSynths[0]
  }

  // 从域名选择音符
  pickNoteFromHost(host) {
    if (!host) return this.scales[this.currentScale][0]
    
    // 稳定可重复的域名→音高映射
    let hash = 0
    for (const char of host) {
      hash = (hash * 131 + char.charCodeAt(0)) >>> 0
    }
    
    const scale = this.scales[this.currentScale]
    return scale[hash % scale.length]
  }

  // 判断网站类型
  getSiteType(host) {
    if (!host) return 'information'
    
    const lowerHost = host.toLowerCase()
    
    // 资讯/文档类
    if (lowerHost.includes('news') || lowerHost.includes('blog') || 
        lowerHost.includes('docs') || lowerHost.includes('wiki') ||
        lowerHost.includes('medium') || lowerHost.includes('github')) {
      return 'information'
    }
    
    // 媒体/创意类
    if (lowerHost.includes('youtube') || lowerHost.includes('vimeo') ||
        lowerHost.includes('soundcloud') || lowerHost.includes('spotify') ||
        lowerHost.includes('behance') || lowerHost.includes('dribbble')) {
      return 'media'
    }
    
    // 社交类
    if (lowerHost.includes('twitter') || lowerHost.includes('facebook') ||
        lowerHost.includes('instagram') || lowerHost.includes('linkedin')) {
      return 'media'
    }
    
    // 默认为信息类
    return 'information'
  }

  // 播放标签切换音效
  playTabSwitch(host, intensity = 1.0) {
    if (!this.inited || !this.unlocked) return false
    
    const now = Tone.now()
    
    // 防抖动保护
    if (now - this.lastPlayTime < this.settings.minTriggerInterval) {
      return false
    }
    
    this.lastPlayTime = now
    
    try {
      const note = this.pickNoteFromHost(host)
      const siteType = this.getSiteType(host)
      const synthObj = this.getNextSynth(siteType)
      
      // 连接到相应的总线
      this.connectSynthToBus(synthObj, siteType)
      
      // 播放音符
      this.triggerNote(synthObj.synth, note, intensity, now)
      
      // 标记为使用中
      synthObj.inUse = true
      synthObj.lastUsed = now
      synthObj.type = siteType
      
      // 设置释放定时器
      setTimeout(() => {
        synthObj.inUse = false
      }, 500)
      
      return true
    } catch (error) {
      console.error('Error playing tab switch sound:', error)
      return false
    }
  }

  // 连接合成器到总线
  connectSynthToBus(synthObj, type) {
    const synth = synthObj.synth
    synth.disconnect()
    
    // 创建专用通道
    const channel = new Tone.Channel()
    channel.connect(this.buses[type])
    synth.connect(channel)
  }

  // 触发音符
  triggerNote(synth, note, intensity, time) {
    // 根据合成器类型调整参数
    if (synth instanceof Tone.AMSynth) {
      // FM 合成器 - 轻微随机化避免机械感
      const detune = (Math.random() * 20 - 10) // ±10 cents
      synth.detune.rampTo(detune, 0.005)
      
      const velocity = Math.min(1, Math.max(0.2, 0.6 * intensity))
      const duration = Math.min(0.6, 0.15 + 0.25 * intensity)
      
      synth.triggerAttackRelease(note, duration, time, velocity)
    } else if (synth instanceof Tone.PluckSynth) {
      // Pluck 合成器
      const velocity = Math.min(1, Math.max(0.3, 0.5 * intensity))
      synth.triggerAttackRelease(note, time + 0.1, velocity)
    } else if (synth instanceof Tone.MonoSynth) {
      // Mono 合成器
      const velocity = Math.min(1, Math.max(0.2, 0.4 * intensity))
      const duration = Math.min(0.3, 0.1 + 0.2 * intensity)
      
      synth.triggerAttackRelease(note, duration, time, velocity)
    }
  }

  // 更新全局设置
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings)
    
    // 更新总线参数
    if (this.buses.master) {
      this.buses.master.volume.value = this.settings.masterVolume
    }
    
    if (this.buses.reverb) {
      this.buses.reverb.wet.value = this.settings.reverbWet
      this.buses.reverb.decay = this.settings.reverbDecay
    }
    
    if (this.buses.delay) {
      this.buses.delay.wet.value = this.settings.delayWet
      this.buses.delay.delayTime = this.settings.delayTime
      this.buses.delay.feedback = this.settings.delayFeedback
    }
  }

  // 设置音阶
  setScale(scaleName) {
    if (this.scales[scaleName]) {
      this.currentScale = scaleName
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      inited: this.inited,
      unlocked: this.unlocked,
      settings: this.settings,
      currentScale: this.currentScale,
      synthPool: this.synthPool.map(s => ({
        inUse: s.inUse,
        type: s.type
      }))
    }
  }

  // 销毁引擎
  dispose() {
    if (this.inited) {
      this.synthPool.forEach(synthObj => {
        synthObj.synth.dispose()
      })
      
      Object.values(this.buses).forEach(bus => {
        if (bus.dispose) bus.dispose()
      })
      
      Tone.context.dispose()
      this.inited = false
      this.unlocked = false
    }
  }
}

// 导出单例实例
const audioEngine = new AudioEngine()

// 导出API
export {
  audioEngine,
  AudioEngine
}

// 便捷函数
export async function initAudio() {
  return await audioEngine.init()
}

export async function unlockAudio() {
  return await audioEngine.unlock()
}

export function playTabSwitch(host, intensity = 1.0) {
  return audioEngine.playTabSwitch(host, intensity)
}

export function updateAudioSettings(settings) {
  audioEngine.updateSettings(settings)
}

export function setAudioScale(scaleName) {
  audioEngine.setScale(scaleName)
}

export function getAudioStatus() {
  return audioEngine.getStatus()
}