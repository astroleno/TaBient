// TaBient Offscreen Document 调试工具
// 用于诊断和修复 offscreen document 连接问题

console.log('🔧 [TABIENT DEBUG] 调试工具启动');

class OffscreenDebug {
  constructor() {
    this.logs = [];
    this.testResults = {};
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
  
  error(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    this.logs.push(logEntry);
    console.error(logEntry);
  }
  
  // 完整的 offscreen document 诊断
  async diagnoseOffscreen() {
    this.log('🔍 开始完整的 offscreen document 诊断...');
    
    const results = {
      chromeOffscreenAPI: false,
      documentExists: false,
      documentAccessible: false,
      fileExists: false,
      connectionTest: false,
      audioContext: false,
      overall: false
    };
    
    try {
      // 1. 检查 chrome.offscreen API
      this.log('1️⃣ 检查 chrome.offscreen API...');
      if (chrome.offscreen) {
        results.chromeOffscreenAPI = true;
        this.log('✅ chrome.offscreen API 可用');
      } else {
        this.error('❌ chrome.offscreen API 不可用');
        return results;
      }
      
      // 2. 检查 document 是否存在
      this.log('2️⃣ 检查 offscreen document 是否存在...');
      try {
        const exists = await chrome.offscreen.hasDocument();
        results.documentExists = exists;
        this.log(`📄 Offscreen document 存在状态: ${exists}`);
      } catch (error) {
        this.error(`❌ 检查 document 失败: ${error.message}`);
      }
      
      // 3. 检查文件是否存在
      this.log('3️⃣ 检查 offscreen-audio.html 文件...');
      try {
        const fileUrl = chrome.runtime.getURL('offscreen-audio.html');
        const response = await fetch(fileUrl);
        if (response.ok) {
          results.fileExists = true;
          this.log('✅ offscreen-audio.html 文件存在');
        } else {
          this.error(`❌ 文件响应错误: ${response.status}`);
        }
      } catch (error) {
        this.error(`❌ 文件检查失败: ${error.message}`);
      }
      
      // 4. 尝试创建 document（如果不存在）
      if (!results.documentExists && results.fileExists) {
        this.log('4️⃣ 尝试创建 offscreen document...');
        try {
          const fileUrl = chrome.runtime.getURL('offscreen-audio.html');
          await chrome.offscreen.createDocument({
            url: fileUrl,
            reasons: ['AUDIO_PLAYBACK'],
            justification: '调试测试'
          });
          
          // 等待创建完成
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const verifyExists = await chrome.offscreen.hasDocument();
          results.documentExists = verifyExists;
          this.log(`✅ Offscreen document 创建成功: ${verifyExists}`);
        } catch (error) {
          this.error(`❌ 创建 document 失败: ${error.message}`);
        }
      }
      
      // 5. 测试连接
      if (results.documentExists) {
        this.log('5️⃣ 测试与 offscreen document 的连接...');
        try {
          const connectionResult = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              type: 'ping',
              _target: 'offscreen'
            }, (response) => {
              if (chrome.runtime.lastError) {
                resolve({
                  success: false,
                  error: chrome.runtime.lastError.message
                });
              } else {
                resolve({
                  success: true,
                  response: response
                });
              }
            });
          });
          
          if (connectionResult.success) {
            results.connectionTest = true;
            this.log('✅ 连接测试成功');
          } else {
            this.error(`❌ 连接测试失败: ${connectionResult.error}`);
          }
        } catch (error) {
          this.error(`❌ 连接测试异常: ${error.message}`);
        }
      }
      
      // 6. 测试音频功能
      if (results.connectionTest) {
        this.log('6️⃣ 测试音频功能...');
        try {
          const audioResult = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              type: 'testSound',
              frequency: 440,
              duration: 0.1,
              _target: 'offscreen'
            }, (response) => {
              if (chrome.runtime.lastError) {
                resolve({
                  success: false,
                  error: chrome.runtime.lastError.message
                });
              } else {
                resolve({
                  success: response && response.success,
                  response: response
                });
              }
            });
          });
          
          if (audioResult.success) {
            results.audioContext = true;
            this.log('✅ 音频功能测试成功');
          } else {
            this.error(`❌ 音频功能测试失败: ${audioResult.error}`);
          }
        } catch (error) {
          this.error(`❌ 音频功能测试异常: ${error.message}`);
        }
      }
      
      // 7. 综合评估
      results.overall = results.chromeOffscreenAPI && 
                      results.documentExists && 
                      results.fileExists && 
                      results.connectionTest;
      
      this.log('📋 诊断结果汇总:');
      this.log(`  • Chrome Offscreen API: ${results.chromeOffscreenAPI ? '✅' : '❌'}`);
      this.log(`  • Document 存在: ${results.documentExists ? '✅' : '❌'}`);
      this.log(`  • 文件存在: ${results.fileExists ? '✅' : '❌'}`);
      this.log(`  • 连接测试: ${results.connectionTest ? '✅' : '❌'}`);
      this.log(`  • 音频功能: ${results.audioContext ? '✅' : '❌'}`);
      this.log(`  • 整体状态: ${results.overall ? '✅ 正常' : '❌ 异常'}`);
      
    } catch (error) {
      this.error(`❌ 诊断过程中出现异常: ${error.message}`);
    }
    
    this.testResults = results;
    return results;
  }
  
  // 自动修复常见问题
  async autoFix() {
    this.log('🔧 开始自动修复...');
    
    try {
      // 1. 清理现有的 offscreen document
      this.log('1️⃣ 清理现有的 offscreen document...');
      try {
        // Chrome 没有直接删除的方法，我们只能重新创建
        this.log('📝 注意: Chrome 没有直接删除 offscreen document 的方法');
      } catch (error) {
        this.log(`⚠️ 清理时出现警告: ${error.message}`);
      }
      
      // 2. 重新创建 document
      this.log('2️⃣ 重新创建 offscreen document...');
      const fileUrl = chrome.runtime.getURL('offscreen-audio.html');
      
      // 先检查是否存在
      const exists = await chrome.offscreen.hasDocument();
      if (exists) {
        this.log('📄 Document 已存在，跳过创建');
      } else {
        await chrome.offscreen.createDocument({
          url: fileUrl,
          reasons: ['AUDIO_PLAYBACK'],
          justification: '自动修复'
        });
        this.log('✅ Offscreen document 重新创建成功');
      }
      
      // 3. 等待初始化
      this.log('3️⃣ 等待初始化...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. 测试连接
      this.log('4️⃣ 测试连接...');
      const testResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'ping',
          _target: 'offscreen'
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve({ success: true });
          }
        });
      });
      
      if (testResult.success) {
        this.log('✅ 自动修复成功！');
        return true;
      } else {
        this.error(`❌ 自动修复失败: ${testResult.error}`);
        return false;
      }
      
    } catch (error) {
      this.error(`❌ 自动修复过程中出现异常: ${error.message}`);
      return false;
    }
  }
  
  // 获取日志
  getLogs() {
    return this.logs.join('\n');
  }
  
  // 获取测试结果
  getResults() {
    return this.testResults;
  }
}

// 创建全局实例
const offscreenDebug = new OffscreenDebug();

// 导出全局函数
globalThis.diagnoseOffscreen = () => offscreenDebug.diagnoseOffscreen();
globalThis.autoFixOffscreen = () => offscreenDebug.autoFix();
globalThis.getOffscreenLogs = () => offscreenDebug.getLogs();
globalThis.getOffscreenResults = () => offscreenDebug.getResults();

console.log('🔧 [TABIENT DEBUG] 调试工具加载完成');