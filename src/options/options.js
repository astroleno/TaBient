// TaBient Options Page JavaScript
// 支持 Tone.js 音频引擎的高级设置管理

class OptionsManager {
  constructor() {
    this.config = null
    this.audioStatus = null
    this.init()
  }
  
  async init() {
    await this.loadConfig()
    await this.loadAudioStatus()
    this.setupEventListeners()
    this.renderUI()
  }
  
  // 加载配置
  async loadConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
        this.config = response
        resolve()
      })
    })
  }
  
  // 加载音频状态
  async loadAudioStatus() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getAudioStatus' }, (response) => {
        if (response && response.success) {
          this.audioStatus = response.status
        }
        resolve()
      })
    })
  }
  
  // 保存配置
  async saveConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'updateConfig', 
        config: this.config 
      }, (response) => {
        this.updateStatus('配置已保存')
        resolve()
      })
    })
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 启用/禁用开关
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.config.enabled = e.target.checked
      this.saveConfig().then(() => {
        this.updateStatus(e.target.checked ? '插件已启用' : '插件已禁用')
        // 强制刷新页面以确保配置生效
        setTimeout(() => {
          window.location.reload()
        }, 500)
      })
    })
    
    // 主音量控制
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      const volume = e.target.value / 100
      this.config.volume = volume
      this.config.masterVolume = -12 + (volume * 12) // 转换为 dB
      document.getElementById('volumeValue').textContent = e.target.value + '%'
      this.saveConfig()
    })
    
    // 强度控制
    document.getElementById('intensitySlider').addEventListener('input', (e) => {
      this.config.intensity = e.target.value / 100
      document.getElementById('intensityValue').textContent = e.target.value + '%'
      this.saveConfig()
    })
    
    // 混响控制
    document.getElementById('reverbWetSlider').addEventListener('input', (e) => {
      this.config.reverbWet = e.target.value / 100
      document.getElementById('reverbWetValue').textContent = e.target.value + '%'
      this.saveConfig()
    })
    
    // 延时控制
    document.getElementById('delayWetSlider').addEventListener('input', (e) => {
      this.config.delayWet = e.target.value / 100
      document.getElementById('delayWetValue').textContent = e.target.value + '%'
      this.saveConfig()
    })
    
        
    // 音阶选择
    document.getElementById('scaleSelect').addEventListener('change', (e) => {
      this.config.scale = e.target.value
      this.saveConfig()
    })
    
    // 音色选择
    document.getElementById('timbreSelect').addEventListener('change', (e) => {
      this.config.timbre = e.target.value
      this.saveConfig()
    })
    
    // 连击模式选择
    document.getElementById('comboPatternSelect').addEventListener('change', (e) => {
      this.config.comboPattern = e.target.value
      this.saveConfig()
    })
    
      }
  
  // 渲染UI
  renderUI() {
    // 设置基础配置
    document.getElementById('enabledToggle').checked = this.config.enabled
    document.getElementById('volumeSlider').value = this.config.volume * 100
    document.getElementById('volumeValue').textContent = Math.round(this.config.volume * 100) + '%'
    
    // 设置高级音频参数
    document.getElementById('intensitySlider').value = this.config.intensity * 100
    document.getElementById('intensityValue').textContent = Math.round(this.config.intensity * 100) + '%'
    
    document.getElementById('reverbWetSlider').value = this.config.reverbWet * 100
    document.getElementById('reverbWetValue').textContent = Math.round(this.config.reverbWet * 100) + '%'
    
    document.getElementById('delayWetSlider').value = this.config.delayWet * 100
    document.getElementById('delayWetValue').textContent = Math.round(this.config.delayWet * 100) + '%'
    
    document.getElementById('scaleSelect').value = this.config.scale
    
    // 设置音色
    document.getElementById('timbreSelect').value = this.config.timbre || 'sine'
    
    // 设置连击模式
    document.getElementById('comboPatternSelect').value = this.config.comboPattern || 'scale-up'
    
    // 更新状态
    this.updateAudioStatus()
    this.updateStatus(this.config.enabled ? '插件已启用，音频引擎运行中' : '插件已禁用')
  }
  
  // 更新音频状态显示
  updateAudioStatus() {
    if (!this.audioStatus) {
      document.getElementById('audioStatus').innerHTML = '音频状态未知'
      return
    }
    
    const status = this.audioStatus
    let statusText = ''
    
    if (status.inited) {
      statusText = '✓ 音频引擎已就绪'
      if (status.settings) {
        statusText += ` (${status.currentScale})`
      }
    } else {
      statusText = '✗ 音频引擎未初始化'
    }
    
    document.getElementById('audioStatus').innerHTML = statusText
  }
  
  // 测试音效
  async testSound() {
    this.updateStatus('正在测试音效...')
    
    try {
      // 方法1: 先尝试简单的测试消息
      console.log('🧪 测试方法1: 简单测试消息')
      const simpleResponse = await chrome.runtime.sendMessage({
        type: 'simpleAudioTest'
      })
      
      if (simpleResponse && simpleResponse.success) {
        this.updateStatus('✅ 测试音效播放成功！')
        return
      }
      
      // 方法2: 如果简单测试失败，尝试原始方法
      console.log('🧪 测试方法2: 原始测试消息')
      const response = await chrome.runtime.sendMessage({
        type: 'playTestSound',
        host: 'test.example.com'
      })
      
      if (response && response.success) {
        this.updateStatus('✅ 测试音效播放成功！')
      } else {
        this.updateStatus('❌ 测试音效播放失败')
      }
      
    } catch (error) {
      console.error('Test sound error:', error)
      this.updateStatus('❌ 测试音效播放失败: ' + error.message)
    }
  }
  
    
  // 刷新音频状态
  async refreshAudioStatus() {
    await this.loadAudioStatus()
    this.updateAudioStatus()
    this.updateStatus('音频状态已刷新')
  }
  
  // 更新状态显示
  updateStatus(message) {
    const status = document.getElementById('status')
    const originalText = status.textContent
    status.textContent = message
    
    // 3秒后恢复默认状态
    setTimeout(() => {
      status.textContent = originalText
    }, 3000)
  }
  
  // 诊断问题
  async diagnoseIssues() {
    this.updateStatus('正在诊断...')
    
    try {
      // 获取基础状态
      const statusResponse = await chrome.runtime.sendMessage({ type: 'getAudioStatus' })
      
      // 测试直接音频
      const directTest = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'playSound',
          frequency: 440,
          duration: 0.3,
          type: 'sine'
        }, (response) => {
          resolve(response)
        })
      })
      
      // 显示诊断结果
      let diagnosisText = '诊断结果:\n'
      diagnosisText += `• 音频状态: ${statusResponse?.success ? '正常' : '异常'}\n`
      diagnosisText += `• 直接测试: ${directTest?.success ? '成功' : '失败'}\n`
      diagnosisText += `• 引擎就绪: ${statusResponse?.status?.inited ? '是' : '否'}\n`
      
      if (directTest?.success) {
        diagnosisText += '✅ 音频系统正常工作！'
      } else {
        diagnosisText += '❌ 音频播放失败'
        diagnosisText += `\n• 错误: ${directTest?.error || '未知错误'}`
      }
      
      this.updateStatus(diagnosisText)
      
      // 触发后台诊断
      chrome.runtime.sendMessage({ type: 'runDiagnosis' })
      
    } catch (error) {
      this.updateStatus('诊断失败: ' + error.message)
    }
  }
  
  // 获取配置预设
  getPresets() {
    return {
      subtle: {
        name: ' subtle',
        intensity: 0.6,
        reverbWet: 0.15,
        delayWet: 0.1,
        masterVolume: -18
      },
      balanced: {
        name: 'balanced',
        intensity: 0.8,
        reverbWet: 0.25,
        delayWet: 0.18,
        masterVolume: -12
      },
      dramatic: {
        name: 'dramatic',
        intensity: 1.0,
        reverbWet: 0.4,
        delayWet: 0.3,
        masterVolume: -6
      }
    }
  }
  
  // 应用预设
  applyPreset(presetName) {
    const preset = this.getPresets()[presetName]
    if (preset) {
      Object.assign(this.config, preset)
      this.saveConfig()
      this.renderUI()
      this.updateStatus(`已应用预设: ${preset.name}`)
    }
  }
  
  // 下载日志
  downloadLog() {
    this.updateStatus('正在生成日志文件...')
    
    try {
      // 尝试从 background script 获取日志
      chrome.runtime.sendMessage({ type: 'getLogs' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('获取日志失败:', chrome.runtime.lastError)
          // 生成简单日志
          const simpleLog = this.generateSimpleLog()
          this.downloadLogContent(simpleLog, 'simple')
        } else if (response && response.logs) {
          this.downloadLogContent(response.logs, 'full')
        } else {
          // 生成简单日志
          const simpleLog = this.generateSimpleLog()
          this.downloadLogContent(simpleLog, 'simple')
        }
      })
    } catch (error) {
      console.error('下载日志失败:', error)
      this.updateStatus('下载日志失败: ' + error.message)
    }
  }

  // 下载日志内容
  downloadLogContent(content, type) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `tabient-${type}-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    this.updateStatus(`${type === 'full' ? '完整' : '简单'}日志已下载`)
  }
  
  // 生成简单日志
  generateSimpleLog() {
    const timestamp = new Date().toISOString()
    let log = `=== TaBient 简单日志 ===\n`
    log += `生成时间: ${timestamp}\n\n`
    
    // 配置信息
    log += `=== 配置信息 ===\n`
    log += `启用: ${this.config.enabled}\n`
    log += `音量: ${this.config.volume}\n`
    log += `强度: ${this.config.intensity}\n`
    log += `混响: ${this.config.reverbWet}\n`
    log += `延时: ${this.config.delayWet}\n`
    log += `音阶: ${this.config.scale}\n\n`
    
    // 音频状态
    log += `=== 音频状态 ===\n`
    if (this.audioStatus) {
      log += `初始化: ${this.audioStatus.inited}\n`
      log += `解锁: ${this.audioStatus.unlocked}\n`
      log += `消息: ${this.audioStatus.message}\n`
    } else {
      log += `音频状态: 未知\n`
    }
    
    log += `\n=== 测试结果 ===\n`
    log += `请查看浏览器控制台获取详细日志信息\n`
    
    return log
  }
}

// 全局变量和函数
let optionsManager

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  optionsManager = new OptionsManager()
})

// 全局函数（供HTML调用）
function applyPreset(presetName) {
  optionsManager.applyPreset(presetName)
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'configUpdated') {
    optionsManager.loadConfig().then(() => {
      optionsManager.renderUI()
    })
  }
})