// TaBient Offscreen Audio Player
// 使用 Tone.js 音频引擎的专业音频播放器

import { 
  initAudio, 
  unlockAudio, 
  playTabSwitch, 
  updateAudioSettings, 
  setAudioScale,
  getAudioStatus 
} from '../audio/engine.js'

class OffscreenAudioManager {
  constructor() {
    this.initialized = false
    this.setupMessageListener()
  }

  // 设置消息监听器
  setupMessageListener() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      try {
        switch (message.type) {
          case 'initAudio':
            await this.handleInitAudio()
            sendResponse({ success: true })
            break
            
          case 'unlockAudio':
            await this.handleUnlockAudio()
            sendResponse({ success: true })
            break
            
          case 'playTabSwitch':
            const result = await this.handlePlayTabSwitch(message.host, message.intensity)
            sendResponse({ success: result })
            break
            
          case 'updateAudioSettings':
            this.handleUpdateAudioSettings(message.settings)
            sendResponse({ success: true })
            break
            
          case 'setAudioScale':
            this.handleSetAudioScale(message.scaleName)
            sendResponse({ success: true })
            break
            
          case 'getAudioStatus':
            const status = this.handleGetAudioStatus()
            sendResponse({ success: true, status })
            break
            
          default:
            sendResponse({ success: false, error: 'Unknown message type' })
        }
      } catch (error) {
        console.error('Error handling message:', error)
        sendResponse({ success: false, error: error.message })
      }
    })
  }

  // 处理音频初始化
  async handleInitAudio() {
    if (!this.initialized) {
      const success = await initAudio()
      if (success) {
        this.initialized = true
        console.log('Audio engine initialized in offscreen document')
      } else {
        console.error('Failed to initialize audio engine')
      }
      return success
    }
    return true
  }

  // 处理解锁音频
  async handleUnlockAudio() {
    const success = await unlockAudio()
    if (success) {
      console.log('Audio unlocked in offscreen document')
    } else {
      console.error('Failed to unlock audio')
    }
    return success
  }

  // 处理播放标签切换音效
  async handlePlayTabSwitch(host, intensity = 1.0) {
    if (!this.initialized) {
      await this.handleInitAudio()
    }
    
    const result = playTabSwitch(host, intensity)
    if (result) {
      console.log(`Playing tab switch sound for: ${host}`)
    }
    return result
  }

  // 处理更新音频设置
  handleUpdateAudioSettings(settings) {
    updateAudioSettings(settings)
    console.log('Audio settings updated:', settings)
  }

  // 处理设置音阶
  handleSetAudioScale(scaleName) {
    setAudioScale(scaleName)
    console.log(`Audio scale set to: ${scaleName}`)
  }

  // 处理获取音频状态
  handleGetAudioStatus() {
    const status = getAudioStatus()
    console.log('Audio status requested:', status)
    return status
  }

  // 获取音频引擎的详细状态
  getDetailedStatus() {
    if (!this.initialized) {
      return {
        initialized: false,
        message: 'Audio engine not initialized'
      }
    }
    
    const status = getAudioStatus()
    return {
      initialized: true,
      unlocked: status.unlocked,
      settings: status.settings,
      currentScale: status.currentScale,
      synthPoolStatus: status.synthPool,
      message: 'Audio engine running normally'
    }
  }
}

// 等待 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Offscreen document loaded with new audio engine')
  window.offscreenAudioManager = new OffscreenAudioManager()
  
  // 自动初始化音频引擎
  window.offscreenAudioManager.handleInitAudio().then(() => {
    console.log('Auto-initialization complete')
  }).catch(error => {
    console.error('Auto-initialization failed:', error)
  })
})

// 处理页面卸载
window.addEventListener('beforeunload', () => {
  if (window.offscreenAudioManager) {
    console.log('Offscreen document unloading')
    // 清理工作可以在这里进行
  }
})

// 提供全局访问点
window.getAudioEngineStatus = function() {
  if (window.offscreenAudioManager) {
    return window.offscreenAudioManager.getDetailedStatus()
  }
  return { error: 'Audio manager not available' }
}

window.testTabSwitchSound = function(host = 'example.com', intensity = 1.0) {
  if (window.offscreenAudioManager) {
    return window.offscreenAudioManager.handlePlayTabSwitch(host, intensity)
  }
  return false
}