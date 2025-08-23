// TaBient 日志收集器
// 自动收集所有日志信息并保存到文件

class TabientLogger {
  constructor() {
    this.logs = []
    this.startTime = Date.now()
    this.init()
  }

  init() {
    // 监听所有 console.log 输出
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    console.log = (...args) => {
      this.addLog('LOG', ...args)
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      this.addLog('ERROR', ...args)
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      this.addLog('WARN', ...args)
      originalWarn.apply(console, args)
    }

    console.info = (...args) => {
      this.addLog('INFO', ...args)
      originalInfo.apply(console, args)
    }

    // 监听未捕获的错误
    window.addEventListener('error', (event) => {
      this.addLog('ERROR', `未捕获的错误: ${event.message}`, event.filename, event.lineno)
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('ERROR', `未处理的 Promise 拒绝: ${event.reason}`)
    })

    console.log('📝 [LOGGER] 日志收集器已启动')
  }

  addLog(level, ...args) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
    }

    this.logs.push(logEntry)

    // 限制日志数量，避免内存过大
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500)
    }
  }

  exportToText() {
    const header = `=== TaBient 扩展日志 ===\n生成时间: ${new Date().toISOString()}\n运行时长: ${Date.now() - this.startTime}ms\n日志条数: ${this.logs.length}\n\n`
    
    const content = this.logs.map(log => {
      return `[${log.timestamp}] [${log.level}] ${log.message}`
    }).join('\n')

    return header + content
  }

  exportToJSON() {
    return JSON.stringify({
      metadata: {
        generatedAt: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        logCount: this.logs.length
      },
      logs: this.logs
    }, null, 2)
  }

  downloadLog() {
    const content = this.exportToText()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `tabient-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📥 [LOGGER] 日志文件已下载')
  }

  getSummary() {
    const logCounts = {
      LOG: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0
    }

    this.logs.forEach(log => {
      logCounts[log.level] = (logCounts[log.level] || 0) + 1
    })

    return {
      totalLogs: this.logs.length,
      errorCount: logCounts.ERROR,
      warnCount: logCounts.WARN,
      duration: Date.now() - this.startTime,
      lastLogs: this.logs.slice(-10) // 最后10条日志
    }
  }
}

// 创建全局日志实例
if (typeof window !== 'undefined') {
  window.tabientLogger = new TabientLogger()
  
  // 添加全局函数供调用
  window.downloadTabientLog = () => {
    window.tabientLogger.downloadLog()
  }
  
  window.getTabientLogSummary = () => {
    return window.tabientLogger.getSummary()
  }
  
  console.log('🎯 [LOGGER] TaBient 日志系统已就绪')
  console.log('💡 [LOGGER] 使用 downloadTabientLog() 下载日志文件')
  console.log('💡 [LOGGER] 使用 getTabientLogSummary() 获取日志摘要')
}