// TaBient 完整功能选项页面

class FullOptions {
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
    this.updateAudioStatus();
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
        this.updateStatus('配置已保存');
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
      scale: 'pentatonic'
    };
  }
  
  setupEventListeners() {
    // 基础设置
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.config.enabled = e.target.checked;
      this.saveConfig();
      this.updateStatus(e.target.checked ? '插件已启用' : '插件已禁用');
    });
    
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      this.config.volume = e.target.value / 100;
      this.config.masterVolume = -12 + (this.config.volume * 12);
      document.getElementById('volumeValue').textContent = e.target.value + '%';
      this.saveConfig();
    });
    
    document.getElementById('intensitySlider').addEventListener('input', (e) => {
      this.config.intensity = e.target.value / 100;
      document.getElementById('intensityValue').textContent = e.target.value + '%';
      this.saveConfig();
    });
    
    document.getElementById('intervalSlider').addEventListener('input', (e) => {
      this.config.minTriggerInterval = parseFloat(e.target.value) / 1000;
      document.getElementById('intervalValue').textContent = e.target.value + 'ms';
      this.saveConfig();
    });
    
    document.getElementById('scaleSelect').addEventListener('change', (e) => {
      this.config.scale = e.target.value;
      this.saveConfig();
    });
    
    // 音频效果
    document.getElementById('reverbWetSlider').addEventListener('input', (e) => {
      this.config.reverbWet = e.target.value / 100;
      document.getElementById('reverbWetValue').textContent = e.target.value + '%';
      this.saveConfig();
    });
    
    document.getElementById('delayWetSlider').addEventListener('input', (e) => {
      this.config.delayWet = e.target.value / 100;
      document.getElementById('delayWetValue').textContent = e.target.value + '%';
      this.saveConfig();
    });
    
    document.getElementById('delayTimeSlider').addEventListener('input', (e) => {
      this.config.delayTime = parseFloat(e.target.value);
      document.getElementById('delayTimeValue').textContent = e.target.value + 's';
      this.saveConfig();
    });
    
    document.getElementById('delayFeedbackSlider').addEventListener('input', (e) => {
      this.config.delayFeedback = e.target.value / 100;
      document.getElementById('delayFeedbackValue').textContent = e.target.value + '%';
      this.saveConfig();
    });
    
    // 按钮事件
    document.getElementById('testSoundBtn').addEventListener('click', () => {
      this.testSound();
    });
    
    document.getElementById('refreshStatusBtn').addEventListener('click', () => {
      this.refreshStatus();
    });
    
    document.getElementById('diagnoseBtn').addEventListener('click', () => {
      this.diagnoseIssues();
    });
    
    document.getElementById('downloadLogBtn').addEventListener('click', () => {
      this.downloadLog();
    });
    
    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.applyPreset(e.target.dataset.preset);
      });
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
    
    // 音频效果
    document.getElementById('reverbWetSlider').value = this.config.reverbWet * 100;
    document.getElementById('reverbWetValue').textContent = Math.round(this.config.reverbWet * 100) + '%';
    document.getElementById('delayWetSlider').value = this.config.delayWet * 100;
    document.getElementById('delayWetValue').textContent = Math.round(this.config.delayWet * 100) + '%';
    document.getElementById('delayTimeSlider').value = this.config.delayTime;
    document.getElementById('delayTimeValue').textContent = this.config.delayTime + 's';
    document.getElementById('delayFeedbackSlider').value = this.config.delayFeedback * 100;
    document.getElementById('delayFeedbackValue').textContent = Math.round(this.config.delayFeedback * 100) + '%';
    
    this.updateAudioStatus();
    this.updateStatus(this.config.enabled ? '插件已启用，音频引擎运行中' : '插件已禁用');
  }
  
  updateAudioStatus() {
    const statusElement = document.getElementById('audioStatus');
    
    if (!this.audioStatus) {
      statusElement.textContent = '音频状态: 未知';
      return;
    }
    
    let status = '音频状态: ';
    if (this.audioStatus.offscreenReady) {
      status += '✅ 就绪';
      if (this.audioStatus.lastPlay) {
        status += ` | 最后播放: ${new Date(this.audioStatus.lastPlay).toLocaleTimeString()}`;
      }
    } else {
      status += '❌ 未就绪';
    }
    
    statusElement.textContent = status;
  }
  
  async testSound() {
    this.updateStatus('正在测试音效...');
    
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'testSound' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        this.updateStatus('✅ 测试音效播放成功！');
      } else {
        this.updateStatus('❌ 测试音效播放失败: ' + (response.error || '未知错误'));
      }
    } catch (error) {
      this.updateStatus('❌ 测试失败: ' + error.message);
    }
  }
  
  async refreshStatus() {
    await this.loadAudioStatus();
    this.updateAudioStatus();
    this.updateStatus('音频状态已刷新');
  }
  
  async diagnoseIssues() {
    this.updateStatus('正在诊断...');
    
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'diagnose' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        const results = response.results;
        let status = '诊断完成:\n\n';
        status += `• 音频引擎: ${results.audioEngine ? '✅ 正常' : '❌ 异常'}\n`;
        status += `• Offscreen文档: ${results.offscreen ? '✅ 正常' : '❌ 异常'}\n`;
        status += `• 权限: ${results.permissions ? '✅ 正常' : '❌ 异常'}\n`;
        status += `• 消息传递: ${results.messaging ? '✅ 正常' : '❌ 异常'}\n`;
        
        if (results.issues && results.issues.length > 0) {
          status += '\n发现的问题:\n';
          results.issues.forEach(issue => {
            status += `• ${issue}\n`;
          });
        }
        
        // 显示详细诊断结果
        const statusElement = document.getElementById('status');
        const diagnosticDiv = document.createElement('div');
        diagnosticDiv.className = 'diagnostic-results';
        diagnosticDiv.textContent = status;
        statusElement.innerHTML = '';
        statusElement.appendChild(diagnosticDiv);
        
      } else {
        this.updateStatus('❌ 诊断失败: ' + (response.error || '未知错误'));
      }
    } catch (error) {
      this.updateStatus('❌ 诊断失败: ' + error.message);
    }
  }
  
  downloadLog() {
    this.updateStatus('正在生成日志文件...');
    
    try {
      chrome.runtime.sendMessage({ type: 'getLogs' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('获取日志失败:', chrome.runtime.lastError);
          this.generateAndDownloadSimpleLog();
        } else if (response && response.logs) {
          this.downloadLogContent(response.logs, 'full');
        } else {
          this.generateAndDownloadSimpleLog();
        }
      });
    } catch (error) {
      console.error('下载日志失败:', error);
      this.updateStatus('下载日志失败: ' + error.message);
    }
  }
  
  generateAndDownloadSimpleLog() {
    const timestamp = new Date().toISOString();
    let content = `=== TaBient 简单日志 ===\n`;
    content += `生成时间: ${timestamp}\n\n`;
    content += `=== 配置信息 ===\n`;
    content += `启用: ${this.config.enabled}\n`;
    content += `音量: ${this.config.volume}\n`;
    content += `强度: ${this.config.intensity}\n`;
    content += `混响: ${this.config.reverbWet}\n`;
    content += `延时: ${this.config.delayWet}\n`;
    content += `音阶: ${this.config.scale}\n\n`;
    content += `=== 音频状态 ===\n`;
    content += `状态: ${this.audioStatus ? '正常' : '未知'}\n`;
    content += `\n=== 测试结果 ===\n`;
    content += `请查看浏览器控制台获取详细日志信息\n`;
    
    this.downloadLogContent(content, 'simple');
  }
  
  downloadLogContent(content, type) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabient-${type}-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.updateStatus(`${type === 'full' ? '完整' : '简单'}日志已下载`);
  }
  
  getPresets() {
    return {
      subtle: {
        name: '轻柔',
        intensity: 0.6,
        reverbWet: 0.15,
        delayWet: 0.1,
        masterVolume: -18,
        volume: 0.3
      },
      balanced: {
        name: '平衡',
        intensity: 0.8,
        reverbWet: 0.25,
        delayWet: 0.18,
        masterVolume: -12,
        volume: 0.7
      },
      dramatic: {
        name: '戏剧',
        intensity: 1.0,
        reverbWet: 0.4,
        delayWet: 0.3,
        masterVolume: -6,
        volume: 0.9
      },
      ambient: {
        name: '环境',
        intensity: 0.7,
        reverbWet: 0.5,
        delayWet: 0.4,
        masterVolume: -9,
        volume: 0.6
      }
    };
  }
  
  applyPreset(presetName) {
    const preset = this.getPresets()[presetName];
    if (preset) {
      Object.assign(this.config, preset);
      this.saveConfig();
      this.renderUI();
      this.updateStatus(`已应用预设: ${preset.name}`);
    }
  }
  
  updateStatus(message) {
    const statusElement = document.getElementById('status');
    const originalContent = statusElement.innerHTML;
    
    statusElement.textContent = message;
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
  new FullOptions();
});