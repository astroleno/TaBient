// 简化的 Web Audio API 音频引擎
// 专门为 Chrome Extension Service Worker 设计

class SimpleAudioEngine {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.convolver = null
    this.delayNode = null
    this.delayFeedback = null
    this.delayGain = null
    this.reverbGain = null
    this.isInitialized = false
  }

  async init() {
    try {
      // 创建 AudioContext
      this.audioContext = new (AudioContext || webkitAudioContext)()
      
      // 创建主音量控制
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      
      // 创建混响效果（简化版）
      this.convolver = this.audioContext.createConvolver()
      this.reverbGain = this.audioContext.createGain()
      this.reverbGain.connect(this.convolver)
      this.convolver.connect(this.masterGain)
      
      // 创建延时效果
      this.delayNode = this.audioContext.createDelay(1.0)
      this.delayFeedback = this.audioContext.createGain()
      this.delayGain = this.audioContext.createGain()
      
      // 连接延时效果链
      this.delayNode.connect(this.delayFeedback)
      this.delayFeedback.connect(this.delayNode) // 反馈
      this.delayNode.connect(this.delayGain)
      this.delayGain.connect(this.masterGain)
      
      // 生成简单的混响脉冲响应
      await this.generateImpulseResponse()
      
      this.isInitialized = true
      console.log('Simple audio engine initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      return false
    }
  }

  async generateImpulseResponse() {
    try {
      const length = this.audioContext.sampleRate * 2 // 2秒混响
      const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate)
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel)
        for (let i = 0; i < length; i++) {
          // 指数衰减的混响
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
        }
      }
      
      this.convolver.buffer = impulse
    } catch (error) {
      console.error('Failed to generate impulse response:', error)
    }
  }

  updateSettings(settings) {
    if (!this.isInitialized) return
    
    try {
      // 更新主音量
      if (this.masterGain && settings.masterVolume !== undefined) {
        this.masterGain.gain.value = Math.pow(10, settings.masterVolume / 20) // 转换dB为线性值
      }
      
      // 更新混响
      if (this.reverbGain && settings.reverbWet !== undefined) {
        this.reverbGain.gain.value = settings.reverbWet
      }
      
      // 更新延时
      if (this.delayNode && settings.delayTime !== undefined) {
        this.delayNode.delayTime.value = settings.delayTime
      }
      
      if (this.delayFeedback && settings.delayFeedback !== undefined) {
        this.delayFeedback.gain.value = settings.delayFeedback
      }
      
      if (this.delayGain && settings.delayWet !== undefined) {
        this.delayGain.gain.value = settings.delayWet
      }
    } catch (error) {
      console.error('Error updating audio settings:', error)
    }
  }

  playSynthSound(frequency, duration = 0.2, type = 'sine') {
    if (!this.isInitialized) return null
    
    try {
      const now = this.audioContext.currentTime
      
      // 创建振荡器
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      // 设置振荡器类型
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, now)
      
      // 设置音量包络
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01) // Attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration) // Release
      
      // 连接到效果器
      oscillator.connect(gainNode)
      gainNode.connect(this.reverbGain) // 发送到混响
      gainNode.connect(this.delayGain)  // 发送到延时
      gainNode.connect(this.masterGain) // 直接输出
      
      // 播放
      oscillator.start(now)
      oscillator.stop(now + duration)
      
      return { oscillator, gainNode }
    } catch (error) {
      console.error('Error playing synth sound:', error)
      return null
    }
  }

  playPluckSound(frequency, duration = 0.3) {
    if (!this.isInitialized) return null
    
    try {
      const now = this.audioContext.currentTime
      
      // 创建噪声源用于pluck声音
      const bufferSize = this.audioContext.sampleRate * duration
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      
      // 生成带通滤波的噪声
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.1))
      }
      
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      
      // 创建滤波器
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = frequency
      filter.Q.value = 10
      
      const gainNode = this.audioContext.createGain()
      gainNode.gain.setValueAtTime(0.2, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)
      
      // 连接
      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.reverbGain)
      gainNode.connect(this.delayGain)
      gainNode.connect(this.masterGain)
      
      source.start(now)
      
      return { source, filter, gainNode }
    } catch (error) {
      console.error('Error playing pluck sound:', error)
      return null
    }
  }

  getContext() {
    return this.audioContext
  }

  isReady() {
    return this.isInitialized && this.audioContext && this.audioContext.state === 'running'
  }
}

// 导出音频引擎
export default SimpleAudioEngine