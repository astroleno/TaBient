// Offscreen Document Audio Engine
// 专门用于处理音频的 offscreen document

// 音频引擎类
class OffscreenAudioEngine {
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
      console.log('🎵 [AUDIO ENGINE] 开始初始化音频引擎...')
      
      // 创建 AudioContext - 在 offscreen document 中可用
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log('🎵 [AUDIO ENGINE] AudioContext 创建成功:', this.audioContext.state)
      
      // 创建主音量控制
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      console.log('🎵 [AUDIO ENGINE] 主音量控制创建成功')
      
      // 创建混响效果
      this.convolver = this.audioContext.createConvolver()
      this.reverbGain = this.audioContext.createGain()
      this.reverbGain.connect(this.convolver)
      this.convolver.connect(this.masterGain)
      console.log('🎵 [AUDIO ENGINE] 混响效果创建成功')
      
      // 创建延时效果
      this.delayNode = this.audioContext.createDelay(1.0)
      this.delayFeedback = this.audioContext.createGain()
      this.delayGain = this.audioContext.createGain()
      
      // 连接延时效果链
      this.delayNode.connect(this.delayFeedback)
      this.delayFeedback.connect(this.delayNode)
      this.delayNode.connect(this.delayGain)
      this.delayGain.connect(this.masterGain)
      console.log('🎵 [AUDIO ENGINE] 延时效果创建成功')
      
      // 生成混响脉冲响应
      await this.generateImpulseResponse()
      console.log('🎵 [AUDIO ENGINE] 混响脉冲响应生成成功')
      
      this.isInitialized = true
      console.log('✅ [AUDIO ENGINE] Offscreen audio engine initialized')
      
      // 通知 background script 音频引擎已就绪
      chrome.runtime.sendMessage({ type: 'audioEngineReady' })
      
      return true
    } catch (error) {
      console.error('❌ [AUDIO ENGINE] Failed to initialize offscreen audio engine:', error)
      return false
    }
  }

  async generateImpulseResponse() {
    try {
      const length = this.audioContext.sampleRate * 2
      const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate)
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel)
        for (let i = 0; i < length; i++) {
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
      if (this.masterGain && settings.masterVolume !== undefined) {
        this.masterGain.gain.value = Math.pow(10, settings.masterVolume / 20)
      }
      
      if (this.reverbGain && settings.reverbWet !== undefined) {
        this.reverbGain.gain.value = settings.reverbWet
      }
      
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
    console.log('🎵 [AUDIO ENGINE] playSynthSound 被调用:', { frequency, duration, type, isInitialized: this.isInitialized })
    
    if (!this.isInitialized) {
      console.log('🚫 [AUDIO ENGINE] 音频引擎未初始化')
      return null
    }
    
    try {
      // 检查 AudioContext 状态，如果是 suspended 则尝试恢复
      if (this.audioContext.state === 'suspended') {
        console.log('🔓 [AUDIO ENGINE] AudioContext 处于 suspended 状态，尝试恢复...')
        this.audioContext.resume().then(() => {
          console.log('✅ [AUDIO ENGINE] AudioContext 恢复成功')
        }).catch(err => {
          console.error('❌ [AUDIO ENGINE] AudioContext 恢复失败:', err)
        })
      }
      
      const now = this.audioContext.currentTime
      console.log('🎵 [AUDIO ENGINE] AudioContext 当前时间:', now, '状态:', this.audioContext.state)
      
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, now)
      
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)
      
      oscillator.connect(gainNode)
      gainNode.connect(this.reverbGain)
      gainNode.connect(this.delayGain)
      gainNode.connect(this.masterGain)
      
      oscillator.start(now)
      oscillator.stop(now + duration)
      
      console.log('✅ [AUDIO ENGINE] 音频播放成功启动')
      return { oscillator, gainNode }
    } catch (error) {
      console.error('❌ [AUDIO ENGINE] Error playing synth sound:', error)
      return null
    }
  }

  playPluckSound(frequency, duration = 0.3) {
    if (!this.isInitialized) return null
    
    try {
      const now = this.audioContext.currentTime
      
      const bufferSize = this.audioContext.sampleRate * duration
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.1))
      }
      
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = frequency
      filter.Q.value = 10
      
      const gainNode = this.audioContext.createGain()
      gainNode.gain.setValueAtTime(0.2, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)
      
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

// 创建全局音频引擎实例
const audioEngine = new OffscreenAudioEngine()

// 立即输出日志以确认 offscreen document 正在运行
console.log('🚀 [OFFSCREEN] Offscreen document JavaScript 已加载并运行!')

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 先处理所有消息，用于调试
  console.log('📨 [OFFSCREEN] 收到任何消息:', message)
  console.log('📨 [OFFSCREEN] 消息类型:', message?.type)
  console.log('📨 [OFFSCREEN] 目标:', message?._target)
  
  // 只处理目标为 offscreen 的消息
  if (message._target !== 'offscreen') {
    console.log('🚫 [OFFSCREEN] 忽略非目标消息:', message)
    return false // 不处理非目标消息
  }
  
  console.log('📨 [OFFSCREEN] 收到消息:', message)
  console.log('📨 [OFFSCREEN] 消息类型:', message?.type)
  console.log('📨 [OFFSCREEN] 发送者:', sender?.tab?.url || 'background')
  
  try {
    if (message.type === 'initAudio') {
      console.log('🎵 初始化音频引擎...')
      // 异步初始化
      audioEngine.init().then(success => {
        console.log('🎵 音频引擎初始化结果:', success)
        sendResponse({ success })
      })
      return true // 表示会异步响应
    }
    
    if (message.type === 'updateSettings') {
      console.log('🎛️ 更新音频设置:', message.settings)
      audioEngine.updateSettings(message.settings)
      sendResponse({ success: true })
      return false // 同步响应，不需要保持消息通道
    }
    
    if (message.type === 'playSound') {
      const { frequency, duration, type } = message
      console.log('🎵 [OFFSCREEN] 播放音频:', { frequency, duration, type })
      console.log('🎵 [OFFSCREEN] 音频引擎状态:', audioEngine.isReady() ? '就绪' : '未就绪')
      
      let result
      if (type === 'pluck') {
        console.log('🎵 [OFFSCREEN] 播放 pluck 音频')
        result = audioEngine.playPluckSound(frequency, duration)
      } else {
        console.log('🎵 [OFFSCREEN] 播放 synth 音频')
        result = audioEngine.playSynthSound(frequency, duration, type)
      }
      
      console.log('🎵 [OFFSCREEN] 音频播放结果:', result !== null ? '成功' : '失败')
      console.log('🎵 [OFFSCREEN] 返回响应:', { success: result !== null })
      sendResponse({ success: result !== null })
      return false // 同步响应，不需要保持消息通道
    }
    
    if (message.type === 'getAudioStatus') {
      const status = {
        inited: audioEngine.isReady(),
        unlocked: true,
        message: audioEngine.isReady() ? 'Audio engine running' : 'Audio engine not initialized'
      }
      console.log('📊 获取音频状态:', status)
      sendResponse({
        success: true,
        status: status
      })
      return false // 同步响应，不需要保持消息通道
    }
    
    console.log('❓ 未知消息类型:', message.type)
    sendResponse({ success: false, error: 'Unknown message type' })
    return false
    
  } catch (error) {
    console.error('❌ Offscreen 处理消息时出错:', error)
    sendResponse({ success: false, error: error.message })
    return false
  }
})

// 初始化音频引擎
console.log('🚀 [OFFSCREEN] Offscreen document 开始初始化...')
audioEngine.init().then(success => {
  console.log('🎯 [OFFSCREEN] 音频引擎初始化完成:', success)
}).catch(error => {
  console.error('❌ [OFFSCREEN] 音频引擎初始化失败:', error)
})

// 确保脚本运行的最终确认
console.log('🎯 [OFFSCREEN] 脚本执行完成，准备接收消息')