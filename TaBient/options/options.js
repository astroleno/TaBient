class OptionsManager {
  constructor() {
    this.config = null;
    this.audioStatus = null;
    this.init();
  }

  async init() {
    await this.loadConfig();
    await this.loadAudioStatus();
    this.setupEventListeners();
    this.setupScrollNavigation();
    this.renderUI();
    this.updateStatusDisplay();
  }

  async loadConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "getConfig" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('无法获取配置，使用默认值');
          this.config = this.getDefaultConfig();
        } else {
          this.config = response || this.getDefaultConfig();
        }
        console.log('加载的配置:', this.config);
        resolve();
      });
    });
  }

  async saveConfig() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "updateConfig", config: this.config }, response => {
        this.showNotification("配置已保存");
        resolve();
      });
    });
  }

  async loadAudioStatus() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "getStatus" }, response => {
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
      scale: "pentatonic",
      waveform: "sine",
      timbre: "sine",
      soundMode: "random",
      blacklist: [],
      comboEnabled: true,
      comboThreshold: 1000,
      comboPattern: "scale-up",
      comboMode: "continuous"
    };
  }

  setupEventListeners() {
    // 启用开关
    const enabledToggle = document.getElementById("enabledToggle");
    if (enabledToggle) {
      enabledToggle.addEventListener("change", (e) => {
        this.config.enabled = e.target.checked;
        this.saveConfig();
        this.showNotification(e.target.checked ? "音效已启用" : "音效已禁用");
      });
    }

    // 滑块控件
    this.setupSlider("volumeSlider", "volumeValue", "volume", null, "%");
    this.setupSlider("intensitySlider", "intensityValue", "intensity", null, "%");

    this.setupSlider("reverbWetSlider", "reverbWetValue", "reverbWet", null, "%");
    this.setupSlider("delayWetSlider", "delayWetValue", "delayWet", null, "%");
    this.setupSlider("delayTimeSlider", "delayTimeValue", "delayTime", null, "s");
    this.setupSlider("delayFeedbackSlider", "delayFeedbackValue", "delayFeedback", null, "%");

    // 选择控件
    const scaleSelect = document.getElementById("scaleSelect");
    if (scaleSelect) {
      scaleSelect.addEventListener("change", (e) => {
        this.config.scale = e.target.value;
        this.saveConfig();
      });
    }

    const timbreSelect = document.getElementById("timbreSelect");
    if (timbreSelect) {
      timbreSelect.addEventListener("change", (e) => {
        this.config.timbre = e.target.value;
        this.config.waveform = e.target.value;
        this.saveConfig();
      });
    }

    const comboPatternSelect = document.getElementById("comboPatternSelect");
    if (comboPatternSelect) {
      comboPatternSelect.addEventListener("change", (e) => {
        this.config.comboPattern = e.target.value;
        this.saveConfig();
      });
    }

    const comboModeSelect = document.getElementById("comboModeSelect");
    if (comboModeSelect) {
      comboModeSelect.addEventListener("change", (e) => {
        this.config.comboMode = e.target.value;
        this.saveConfig();
      });
    }

    const soundModeSelect = document.getElementById("soundModeSelect");
    if (soundModeSelect) {
      soundModeSelect.addEventListener("change", (e) => {
        this.config.soundMode = e.target.value;
        this.saveConfig();
        this.showNotification(e.target.value === 'piano' ? '已切换为钢琴模式' : '已切换为随机模式');
      });
    }

    // 预设按钮
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.applyPreset(e.target.dataset.preset);
      });
    });

    // 测试音效按钮
    const testSoundBtn = document.getElementById("testSoundBtn");
    if (testSoundBtn) {
      testSoundBtn.addEventListener("click", () => {
        this.testSound();
      });
    }

    // 重置按钮
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetToDefaults();
      });
    }

    // 黑名单功能
    const addBlacklistBtn = document.getElementById("addBlacklistBtn");
    const blacklistInput = document.getElementById("blacklistInput");
    if (addBlacklistBtn && blacklistInput) {
      addBlacklistBtn.addEventListener("click", () => {
        this.addToBlacklist();
      });
      
      blacklistInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.addToBlacklist();
        }
      });
    }

    // 配置导入导出
    const exportConfigBtn = document.getElementById("exportConfigBtn");
    const importConfigBtn = document.getElementById("importConfigBtn");
    const importFileInput = document.getElementById("importFileInput");
    
    if (exportConfigBtn) {
      exportConfigBtn.addEventListener("click", () => {
        this.exportConfig();
      });
    }
    
    if (importConfigBtn && importFileInput) {
      importConfigBtn.addEventListener("click", () => {
        importFileInput.click();
      });
      
      importFileInput.addEventListener("change", (e) => {
        this.importConfig(e.target.files[0]);
      });
    }
  }

  setupSlider(sliderId, valueId, configKey, transform = null, suffix = "") {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (!slider || !valueDisplay) return;

    slider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      // 修复：对于百分比滑块，需要正确转换为0-1范围
      const configValue = transform ? transform(value) : (suffix === "%" ? value / 100 : value);
      this.config[configKey] = configValue;
      valueDisplay.textContent = Math.round(value) + suffix;
      this.saveConfig();
    });
  }

  renderUI() {
    console.log('渲染UI，当前配置:', this.config);
    
    // 启用开关
    const enabledToggle = document.getElementById("enabledToggle");
    if (enabledToggle) {
      enabledToggle.checked = this.config.enabled;
      console.log('设置启用状态:', this.config.enabled);
    }

    // 滑块值
    this.setSliderValue("volumeSlider", "volumeValue", this.config.volume * 100, "%");
    this.setSliderValue("intensitySlider", "intensityValue", this.config.intensity * 100, "%");
    this.setSliderValue("reverbWetSlider", "reverbWetValue", this.config.reverbWet * 100, "%");
    this.setSliderValue("delayWetSlider", "delayWetValue", this.config.delayWet * 100, "%");
    this.setSliderValue("delayTimeSlider", "delayTimeValue", this.config.delayTime, "s");
    this.setSliderValue("delayFeedbackSlider", "delayFeedbackValue", this.config.delayFeedback * 100, "%");

    // 选择值
    this.setSelectValue("scaleSelect", this.config.scale || "pentatonic");
    this.setSelectValue("timbreSelect", this.config.timbre || "sine");
    this.setSelectValue("comboPatternSelect", this.config.comboPattern || "scale-up");
    this.setSelectValue("comboModeSelect", this.config.comboMode || "continuous");
    this.setSelectValue("soundModeSelect", this.config.soundMode || "random");

    this.renderBlacklist();
    this.updateStatistics();
    this.updateStatusDisplay();
  }

  setSliderValue(sliderId, valueId, value, suffix) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (slider && valueDisplay) {
      const displayValue = isNaN(value) ? 0 : value;
      slider.value = displayValue;
      valueDisplay.textContent = Math.round(displayValue) + suffix;
      console.log('设置滑块 ' + sliderId + ':', displayValue);
    } else {
      console.log('未找到滑块元素:', sliderId, valueId);
    }
  }

  setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (select) {
      select.value = value;
    }
  }

  updateStatusDisplay() {
    const statusDisplay = document.getElementById("statusDisplay");
    if (!statusDisplay) return;

    if (!this.audioStatus) {
      statusDisplay.innerHTML = "音频引擎: 初始化中...";
      return;
    }

    let status = "🎵 音频引擎: ";
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
    statusDisplay.innerHTML = status;
  }

  async testSound() {
    this.showNotification("🔊 测试音效...");
    try {
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: "testSound" }, resolve);
      });
      
      if (response && response.success) {
        this.showNotification("✅ 测试音效播放成功！");
      } else {
        this.showNotification("❌ 测试失败，请检查浏览器控制台");
      }
    } catch (error) {
      this.showNotification("❌ 测试失败，请尝试切换标签页");
    }
  }

  getPresets() {
    return {
      subtle: {
        name: "轻柔",
        intensity: 0.4,
        reverbWet: 0.1,
        delayWet: 0.05,
        delayTime: 0.2,
        delayFeedback: 0.2,
        volume: 0.3,
        masterVolume: -18,
        waveform: "sine"
      },
      balanced: {
        name: "平衡",
        intensity: 0.7,
        reverbWet: 0.25,
        delayWet: 0.15,
        delayTime: 0.3,
        delayFeedback: 0.3,
        volume: 0.7,
        masterVolume: -12,
        waveform: "triangle"
      },
      dramatic: {
        name: "戏剧",
        intensity: 1.0,
        reverbWet: 0.4,
        delayWet: 0.3,
        delayTime: 0.4,
        delayFeedback: 0.4,
        volume: 0.9,
        masterVolume: -6,
        waveform: "square"
      },
      ambient: {
        name: "环境",
        intensity: 0.6,
        reverbWet: 0.5,
        delayWet: 0.2,
        delayTime: 0.6,
        delayFeedback: 0.2,
        volume: 0.5,
        masterVolume: -9,
        waveform: "sawtooth"
      }
    };
  }

  applyPreset(presetName) {
    const preset = this.getPresets()[presetName];
    if (preset) {
      Object.assign(this.config, preset);
      this.saveConfig();
      this.renderUI();
      
      // 更新按钮状态
      document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.classList.remove("active");
      });
      document.querySelector(`[data-preset="${presetName}"]`).classList.add("active");
      
      this.showNotification(`已应用预设: ${preset.name}`);
    }
  }

  // 重置到默认设置
  resetToDefaults() {
    if (confirm("确定要重置所有设置到默认值吗？")) {
      this.config = this.getDefaultConfig();
      this.saveConfig();
      this.renderUI();
      
      // 清除预设按钮选中状态
      document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.classList.remove("active");
      });
      
      this.showNotification("✅ 已重置为默认设置");
    }
  }

  // 添加到黑名单
  addToBlacklist() {
    const input = document.getElementById("blacklistInput");
    const domain = input.value.trim().toLowerCase();
    
    if (!domain) {
      this.showNotification("❌ 请输入网站域名");
      return;
    }
    
    // 验证域名格式
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      this.showNotification("❌ 请输入有效的域名格式（如：example.com）");
      return;
    }
    
    if (!this.config.blacklist) {
      this.config.blacklist = [];
    }
    
    if (this.config.blacklist.includes(domain)) {
      this.showNotification("⚠️ 该网站已在黑名单中");
      return;
    }
    
    this.config.blacklist.push(domain);
    this.saveConfig();
    this.renderBlacklist();
    input.value = "";
    this.showNotification(`✅ 已将 ${domain} 添加到黑名单`);
  }

  // 从黑名单移除
  removeFromBlacklist(domain) {
    const index = this.config.blacklist.indexOf(domain);
    if (index > -1) {
      this.config.blacklist.splice(index, 1);
      this.saveConfig();
      this.renderBlacklist();
      this.showNotification(`✅ 已将 ${domain} 从黑名单移除`);
    }
  }

  // 渲染黑名单
  renderBlacklist() {
    const container = document.getElementById("blacklistItems");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!this.config.blacklist || this.config.blacklist.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #999; font-size: 11px; padding: 10px;">暂无黑名单网站</div>';
      return;
    }
    
    this.config.blacklist.forEach(domain => {
      const item = document.createElement("div");
      item.className = "blacklist-item";
      item.innerHTML = `
        <span>${domain}</span>
        <button onclick="window.optionsManager.removeFromBlacklist('${domain}')" title="移除">
          ✕
        </button>
      `;
      container.appendChild(item);
    });
  }

  // 导出配置
  exportConfig() {
    try {
      const configData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        config: this.config
      };
      
      const dataStr = JSON.stringify(configData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `tabient-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showNotification("✅ 配置已导出");
    } catch (error) {
      this.showNotification("❌ 导出失败：" + error.message);
    }
  }

  // 导入配置
  async importConfig(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 验证数据格式
      if (!data.config) {
        throw new Error("无效的配置文件格式");
      }
      
      // 确认导入
      if (confirm(`确定要导入配置吗？\n\n文件日期：${data.timestamp ? new Date(data.timestamp).toLocaleString() : '未知'}\n版本：${data.version || '未知'}\n\n现有配置将被覆盖。`)) {
        // 合并配置，保留默认值
        this.config = { ...this.getDefaultConfig(), ...data.config };
        
        // 保存和渲染
        await this.saveConfig();
        this.renderUI();
        
        // 清除预设按钮状态
        document.querySelectorAll(".preset-btn").forEach(btn => {
          btn.classList.remove("active");
        });
        
        this.showNotification("✅ 配置已导入");
      }
    } catch (error) {
      this.showNotification("❌ 导入失败：" + error.message);
    } finally {
      // 清空文件选择
      const input = document.getElementById("importFileInput");
      if (input) input.value = "";
    }
  }

  // 更新统计信息
  async updateStatistics() {
    try {
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: "getStatistics" }, resolve);
      });
      
      if (response && response.success) {
        const stats = response.statistics;
        
        // 更新显示
        const elements = {
          todayCount: document.getElementById("todayCount"),
          totalCount: document.getElementById("totalCount"),
          favoriteScale: document.getElementById("favoriteScale"),
          lastPlayTime: document.getElementById("lastPlayTime")
        };
        
        if (elements.todayCount) {
          elements.todayCount.textContent = stats.todayPlays || 0;
        }
        
        if (elements.totalCount) {
          elements.totalCount.textContent = stats.totalPlays || 0;
        }
        
        if (elements.favoriteScale) {
          const scaleNames = {
            'pentatonic': '五声',
            'major': '大调',
            'minor': '小调',
            'ambient': '环境',
            'blues': '布鲁斯'
          };
          elements.favoriteScale.textContent = scaleNames[stats.favoriteScale] || '未知';
        }
        
        if (elements.lastPlayTime) {
          if (stats.lastPlayTime) {
            const time = new Date(stats.lastPlayTime);
            elements.lastPlayTime.textContent = time.toLocaleTimeString();
          } else {
            elements.lastPlayTime.textContent = '未播放';
          }
        }
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  }

  showNotification(message) {
    const statusDisplay = document.getElementById("statusDisplay");
    if (!statusDisplay) return;
    
    const originalContent = statusDisplay.innerHTML;
    statusDisplay.innerHTML = `📢 ${message}`;
    
    setTimeout(() => {
      statusDisplay.innerHTML = originalContent;
    }, 3000);
  }

  // Safari样式滚动导航功能
  setupScrollNavigation() {
    const scrollNav = document.getElementById("scrollNav");
    const scrollNavItems = document.querySelectorAll(".scroll-nav-item");
    const sections = document.querySelectorAll(".control-group[id]");
    
    if (!scrollNav || !sections.length) return;

    let lastScrollTop = 0;
    let isScrolling = false;

    // 滚动检测
    window.addEventListener("scroll", () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 显示/隐藏导航栏
      if (scrollTop > 100) {
        scrollNav.classList.add("visible");
      } else {
        scrollNav.classList.remove("visible");
      }

      // 高亮当前section
      this.updateActiveNavItem();
      
      lastScrollTop = scrollTop;
    });

    // 导航项点击事件
    scrollNavItems.forEach(item => {
      item.addEventListener("click", (e) => {
        const targetId = e.target.getAttribute("data-target");
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });
  }

  // 更新当前激活的导航项
  updateActiveNavItem() {
    const scrollNavItems = document.querySelectorAll(".scroll-nav-item");
    const sections = document.querySelectorAll(".control-group[id]");
    
    let currentSectionId = "";
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollTop >= sectionTop - 50 && scrollTop < sectionTop + sectionHeight - 50) {
        currentSectionId = section.id;
      }
    });
    
    // 更新活动状态
    scrollNavItems.forEach(item => {
      if (item.getAttribute("data-target") === currentSectionId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}

// 监听配置更新
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "configUpdated") {
    window.location.reload();
  }
});

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  window.optionsManager = new OptionsManager();
});