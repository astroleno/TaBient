// TaBient 极简选项页面

class SimpleOptions {
  constructor() {
    this.config = null;
    this.init();
  }
  
  async init() {
    await this.loadConfig();
    this.setupEventListeners();
    this.renderUI();
    this.refreshStatus();
  }
  
  async loadConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
        this.config = response;
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
  
  setupEventListeners() {
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.config.enabled = e.target.checked;
      this.saveConfig();
      this.updateStatus(e.target.checked ? '插件已启用' : '插件已禁用');
    });
    
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      this.config.volume = e.target.value / 100;
      document.getElementById('volumeValue').textContent = e.target.value + '%';
      this.saveConfig();
    });
    
    document.getElementById('frequencySlider').addEventListener('input', (e) => {
      this.config.frequency = parseInt(e.target.value);
      document.getElementById('frequencyValue').textContent = e.target.value + ' Hz';
      this.saveConfig();
    });
    
    document.getElementById('durationSlider').addEventListener('input', (e) => {
      this.config.duration = parseFloat(e.target.value);
      document.getElementById('durationValue').textContent = e.target.value + ' 秒';
      this.saveConfig();
    });
    
    document.getElementById('testSoundBtn').addEventListener('click', () => {
      this.testSound();
    });
    
    document.getElementById('refreshStatusBtn').addEventListener('click', () => {
      this.refreshStatus();
    });
  }
  
  renderUI() {
    document.getElementById('enabledToggle').checked = this.config.enabled;
    document.getElementById('volumeSlider').value = this.config.volume * 100;
    document.getElementById('volumeValue').textContent = Math.round(this.config.volume * 100) + '%';
    document.getElementById('frequencySlider').value = this.config.frequency;
    document.getElementById('frequencyValue').textContent = this.config.frequency + ' Hz';
    document.getElementById('durationSlider').value = this.config.duration;
    document.getElementById('durationValue').textContent = this.config.duration + ' 秒';
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
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        const status = response.status;
        let statusText = `状态: ${status.enabled ? '启用' : '禁用'}<br>`;
        statusText += `音频引擎: ${status.audioContext}<br>`;
        statusText += `音调: ${status.config.frequency} Hz<br>`;
        statusText += `音量: ${Math.round(status.config.volume * 100)}%`;
        
        document.getElementById('status').innerHTML = statusText;
      } else {
        document.getElementById('status').textContent = '状态获取失败';
      }
    } catch (error) {
      document.getElementById('status').textContent = '状态刷新失败: ' + error.message;
    }
  }
  
  updateStatus(message) {
    const statusElement = document.getElementById('status');
    const originalContent = statusElement.innerHTML;
    
    statusElement.innerHTML = message;
    setTimeout(() => {
      statusElement.innerHTML = originalContent;
    }, 3000);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new SimpleOptions();
});