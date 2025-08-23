// TaBient ArtBreeze 风格选项页面

class ArtBreezeOptions {
  constructor() {
    this.config = null;
    this.audioStatus = null;
    this.init();
  }
  
  async init() {
    await this.loadConfig();
    await this.loadAudioStatus();
    this.setupEventListeners();
    this.renderUI();
    this.updateStatusDisplay();
  }
  
  async loadConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
        this.config = response || this.getDefaultConfig();
        resolve();
      });
    });
  }
  
  async saveConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'updateConfig', 
        config: this.config 
      }, (response) => {
        this.showNotification('配置已保存');
        resolve();
      });
    });
  }
  
  async loadAudioStatus() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
        if (response && response.success) {
          this.audioStatus = response.status;
        }
        resolve();
      });
    });
  }
  
  getDefaultConfig() {
    return {
      enabled: true,
      volume: 0.7,
      intensity: 0.8,
      masterVolume: -12,
      reverbWet: 0.25,
      delayWet: 0.18,
      delayTime: 0.3,
      delayFeedback: 0.3,
      minTriggerInterval: 0.2,
      scale: 'pentatonic',
      waveform: 'sine',
      // 新增功能
      timbre: 'sine',
      comboEnabled: true,
      comboThreshold: 1000,
      comboPattern: 'scale-up'
    };
  }
  
  setupEventListeners() {
    // 启用开关
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.config.enabled = e.target.checked;
      this.saveConfig();
      this.showNotification(e.target.checked ? '音效已启用' : '音效已禁用');
    });
    
    // 滑块控件
    this.setupSlider('volumeSlider', 'volumeValue', 'volume', (value) => {
      this.config.masterVolume = -12 + (value * 12);
      return value * 100;
    }, '%');
    
    this.setupSlider('intensitySlider', 'intensityValue', 'intensity', null, '%');
    
    this.setupSlider('intervalSlider', 'intervalValue', 'minTriggerInterval', (value) => {
      return value * 1000;
    }, 'ms');
    
    this.setupSlider('reverbWetSlider', 'reverbWetValue', 'reverbWet', null, '%');
    
    this.setupSlider('delayWetSlider', 'delayWetValue', 'delayWet', null, '%');
    
    this.setupSlider('delayTimeSlider', 'delayTimeValue', 'delayTime', null, 's');
    
    this.setupSlider('delayFeedbackSlider', 'delayFeedbackValue', 'delayFeedback', null, '%');
    
    // 音阶选择
    document.getElementById('scaleSelect').addEventListener('change', (e) => {
      this.config.scale = e.target.value;
      this.saveConfig();
    });
    
    // 音色选择
    document.getElementById('waveformSelect').addEventListener('change', (e) => {
      this.config.waveform = e.target.value;
      this.config.timbre = e.target.value;
      this.saveConfig();
    });
    
    // 连击开关
    document.getElementById('comboToggle').addEventListener('change', (e) => {
      this.config.comboEnabled = e.target.checked;
      this.saveConfig();
      this.showNotification(e.target.checked ? '连击已启用' : '连击已禁用');
    });
    
    // 连击阈值
    this.setupSlider('comboThresholdSlider', 'comboThresholdValue', 'comboThreshold', null, 'ms');
    
    // 连击模式
    document.getElementById('comboPatternSelect').addEventListener('change', (e) => {
      this.config.comboPattern = e.target.value;
      this.saveConfig();
    });
    
    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.applyPreset(e.target.dataset.preset);
      });
    });
    
    // 操作按钮
    document.getElementById('testSoundBtn').addEventListener('click', () => {
      this.testSound();
    });
    
    document.getElementById('testComboBtn').addEventListener('click', () => {
      this.testCombo();
    });
    
    document.getElementById('debugBtn').addEventListener('click', () => {
      this.debugOffscreen();
    });
    
    document.getElementById('diagnoseBtn').addEventListener('click', () => {
      this.diagnoseIssues();
    });
  }
  
  setupSlider(sliderId, valueId, configKey, transformFn, suffix = '') {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      const transformedValue = transformFn ? transformFn(value / 100) : value / 100;
      this.config[configKey] = transformedValue;
      valueDisplay.textContent = Math.round(value) + suffix;
      this.saveConfig();
    });
  }
  
  renderUI() {
    // 基础设置
    document.getElementById('enabledToggle').checked = this.config.enabled;
    document.getElementById('volumeSlider').value = this.config.volume * 100;
    document.getElementById('volumeValue').textContent = Math.round(this.config.volume * 100) + '%';
    document.getElementById('intensitySlider').value = this.config.intensity * 100;
    document.getElementById('intensityValue').textContent = Math.round(this.config.intensity * 100) + '%';
    document.getElementById('intervalSlider').value = this.config.minTriggerInterval * 1000;
    document.getElementById('intervalValue').textContent = Math.round(this.config.minTriggerInterval * 1000) + 'ms';
    document.getElementById('scaleSelect').value = this.config.scale;
    document.getElementById('waveformSelect').value = this.config.waveform || 'sine';
    
    // 连击设置
    document.getElementById('comboToggle').checked = this.config.comboEnabled;
    document.getElementById('comboThresholdSlider').value = this.config.comboThreshold || 1000;
    document.getElementById('comboThresholdValue').textContent = (this.config.comboThreshold || 1000) + 'ms';
    document.getElementById('comboPatternSelect').value = this.config.comboPattern || 'scale-up';
    
    // 音频效果
    document.getElementById('reverbWetSlider').value = this.config.reverbWet * 100;
    document.getElementById('reverbWetValue').textContent = Math.round(this.config.reverbWet * 100) + '%';
    document.getElementById('delayWetSlider').value = this.config.delayWet * 100;
    document.getElementById('delayWetValue').textContent = Math.round(this.config.delayWet * 100) + '%';
    document.getElementById('delayTimeSlider').value = this.config.delayTime;
    document.getElementById('delayTimeValue').textContent = this.config.delayTime + 's';
    document.getElementById('delayFeedbackSlider').value = this.config.delayFeedback * 100;
    document.getElementById('delayFeedbackValue').textContent = Math.round(this.config.delayFeedback * 100) + '%';
    
    this.updateStatusDisplay();
  }
  
  updateStatusDisplay() {
    const statusElement = document.getElementById('statusDisplay');
    
    if (!this.audioStatus) {
      statusElement.innerHTML = '音频引擎: 初始化中...';
      return;
    }
    
    let status = '🎵 音频引擎: ';
    if (this.audioStatus.offscreenReady) {
      status += '<span style="color: #27ae60;">✅ 就绪</span>';
      if (this.audioStatus.lastPlay) {
        status += `<br>最后播放: ${new Date(this.audioStatus.lastPlay).toLocaleTimeString()}`;
      }
      if (this.audioStatus.totalPlays) {
        status += `<br>总播放次数: ${this.audioStatus.totalPlays}`;
      }
    } else {
      status += '<span style="color: #e74c3c;">❌ 未就绪</span>';
    }
    
    statusElement.innerHTML = status;
  }
  
  async testSound() {
    const btn = document.getElementById('testSoundBtn');
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;
    
    try {
      // 简化测试：直接发送播放命令
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'testSound' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        this.showNotification('✅ 测试音效播放成功！');
      } else {
        this.showNotification('❌ 测试失败，请检查浏览器控制台');
      }
    } catch (error) {
      this.showNotification('❌ 测试失败，请尝试切换标签页');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
  
  async testCombo() {
    const btn = document.getElementById('testComboBtn');
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;
    
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'testCombo' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        this.showNotification('🎵 连击测试成功！应该听到了一段旋律');
      } else {
        this.showNotification('❌ 连击测试失败');
      }
    } catch (error) {
      this.showNotification('❌ 连击测试异常');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
  
  async debugOffscreen() {
    const btn = document.getElementById('debugBtn');
    const originalText = btn.textContent;
    btn.textContent = '调试中...';
    btn.disabled = true;
    
    try {
      // 运行 offscreen 诊断
      const results = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'debugOffscreen' }, (response) => {
          resolve(response);
        });
      });
      
      if (results) {
        let message = '🔧 调试结果:\n\n';
        message += `• Chrome Offscreen API: ${results.chromeOffscreenAPI ? '✅' : '❌'}\n`;
        message += `• Document 存在: ${results.documentExists ? '✅' : '❌'}\n`;
        message += `• 文件存在: ${results.fileExists ? '✅' : '❌'}\n`;
        message += `• 连接测试: ${results.connectionTest ? '✅' : '❌'}\n`;
        message += `• 音频功能: ${results.audioContext ? '✅' : '❌'}\n`;
        message += `• 整体状态: ${results.overall ? '✅ 正常' : '❌ 异常'}`;
        
        this.showNotification(message);
        
        // 如果有问题，询问是否自动修复
        if (!results.overall) {
          setTimeout(() => {
            if (confirm('检测到问题，是否尝试自动修复？')) {
              this.autoFixOffscreen();
            }
          }, 1000);
        }
      } else {
        this.showNotification('❌ 调试失败');
      }
    } catch (error) {
      this.showNotification('❌ 调试异常: ' + error.message);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
  
  async autoFixOffscreen() {
    this.showNotification('🔧 开始自动修复...');
    
    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'autoFixOffscreen' }, (response) => {
          resolve(response);
        });
      });
      
      if (result) {
        this.showNotification('✅ 自动修复成功！请重新测试功能');
      } else {
        this.showNotification('❌ 自动修复失败，请重新加载扩展');
      }
    } catch (error) {
      this.showNotification('❌ 自动修复异常: ' + error.message);
    }
  }
  
  async diagnoseIssues() {
    const btn = document.getElementById('diagnoseBtn');
    const originalText = btn.textContent;
    btn.textContent = '诊断中...';
    btn.disabled = true;
    
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'diagnose' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        const results = response.results;
        let status = '🔍 诊断结果:\n\n';
        status += `• 音频引擎: ${results.audioEngine ? '✅ 正常' : '❌ 异常'}\n`;
        status += `• Offscreen文档: ${results.offscreen ? '✅ 正常' : '❌ 异常'}\n`;
        status += `• 权限: ${results.permissions ? '✅ 正常' : '❌ 异常'}\n`;
        status += `• 消息传递: ${results.messaging ? '✅ 正常' : '❌ 异常'}`;
        
        if (results.issues && results.issues.length > 0) {
          status += '\n\n发现的问题:\n';
          results.issues.forEach(issue => {
            status += `• ${issue}\n`;
          });
        } else {
          status += '\n\n✅ 系统运行正常！';
        }
        
        this.showNotification(status);
      } else {
        this.showNotification('❌ 诊断失败: ' + (response.error || '未知错误'));
      }
    } catch (error) {
      this.showNotification('❌ 诊断失败: ' + error.message);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
  
  getPresets() {
    return {
      subtle: {
        name: '轻柔',
        intensity: 0.4,
        reverbWet: 0.1,
        delayWet: 0.05,
        delayTime: 0.2,
        delayFeedback: 0.2,
        volume: 0.3,
        masterVolume: -18,
        waveform: 'sine'
      },
      balanced: {
        name: '平衡',
        intensity: 0.7,
        reverbWet: 0.25,
        delayWet: 0.15,
        delayTime: 0.3,
        delayFeedback: 0.3,
        volume: 0.7,
        masterVolume: -12,
        waveform: 'triangle'
      },
      dramatic: {
        name: '戏剧',
        intensity: 1.0,
        reverbWet: 0.4,
        delayWet: 0.3,
        delayTime: 0.4,
        delayFeedback: 0.4,
        volume: 0.9,
        masterVolume: -6,
        waveform: 'square'
      },
      ambient: {
        name: '环境',
        intensity: 0.6,
        reverbWet: 0.5,
        delayWet: 0.2,
        delayTime: 0.6,
        delayFeedback: 0.2,
        volume: 0.5,
        masterVolume: -9,
        waveform: 'sawtooth'
      }
    };
  }
  
  applyPreset(presetName) {
    const preset = this.getPresets()[presetName];
    if (preset) {
      Object.assign(this.config, preset);
      this.saveConfig();
      this.renderUI();
      
      // 更新预设按钮状态
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-preset="${presetName}"]`).classList.add('active');
      
      this.showNotification(`已应用预设: ${preset.name}`);
    }
  }
  
  showNotification(message) {
    const statusElement = document.getElementById('statusDisplay');
    const originalContent = statusElement.innerHTML;
    
    // 如果是诊断结果，保持格式
    if (message.includes('🔍 诊断结果:')) {
      statusElement.innerHTML = message.replace(/\n/g, '<br>');
    } else {
      statusElement.innerHTML = `📢 ${message}`;
    }
    
    // 3秒后恢复原状
    setTimeout(() => {
      statusElement.innerHTML = originalContent;
    }, 3000);
  }
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'configUpdated') {
    // 配置已更新，刷新 UI
    window.location.reload();
  }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new ArtBreezeOptions();
});