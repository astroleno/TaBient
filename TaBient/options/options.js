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
    this.renderUI();
    this.updateStatusDisplay();
  }

  async loadConfig() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "getConfig" }, config => {
        this.config = config || this.getDefaultConfig();
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
    this.setupSlider("volumeSlider", "volumeValue", "volume", (val) => {
      this.config.masterVolume = -12 + val * 12;
      return val * 100;
    }, "%");

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

    // 预设按钮
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.applyPreset(e.target.dataset.preset);
      });
    });
  }

  setupSlider(sliderId, valueId, configKey, transform = null, suffix = "") {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (!slider || !valueDisplay) return;

    slider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      const configValue = transform ? transform(value / 100) : value / 100;
      this.config[configKey] = configValue;
      valueDisplay.textContent = Math.round(value) + suffix;
      this.saveConfig();
    });
  }

  renderUI() {
    // 启用开关
    const enabledToggle = document.getElementById("enabledToggle");
    if (enabledToggle) {
      enabledToggle.checked = this.config.enabled;
    }

    // 滑块值
    this.setSliderValue("volumeSlider", "volumeValue", this.config.volume * 100, "%");
    this.setSliderValue("intensitySlider", "intensityValue", this.config.intensity * 100, "%");
    this.setSliderValue("reverbWetSlider", "reverbWetValue", this.config.reverbWet * 100, "%");
    this.setSliderValue("delayWetSlider", "delayWetValue", this.config.delayWet * 100, "%");
    this.setSliderValue("delayTimeSlider", "delayTimeValue", this.config.delayTime, "s");
    this.setSliderValue("delayFeedbackSlider", "delayFeedbackValue", this.config.delayFeedback * 100, "%");

    // 选择值
    this.setSelectValue("scaleSelect", this.config.scale);
    this.setSelectValue("timbreSelect", this.config.timbre || "sine");
    this.setSelectValue("comboPatternSelect", this.config.comboPattern || "scale-up");
    this.setSelectValue("comboModeSelect", this.config.comboMode || "continuous");

    this.updateStatusDisplay();
  }

  setSliderValue(sliderId, valueId, value, suffix) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (slider && valueDisplay) {
      slider.value = value;
      valueDisplay.textContent = Math.round(value) + suffix;
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

  showNotification(message) {
    const statusDisplay = document.getElementById("statusDisplay");
    if (!statusDisplay) return;
    
    const originalContent = statusDisplay.innerHTML;
    statusDisplay.innerHTML = `📢 ${message}`;
    
    setTimeout(() => {
      statusDisplay.innerHTML = originalContent;
    }, 3000);
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
  new OptionsManager();
});