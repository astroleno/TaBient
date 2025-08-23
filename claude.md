# TaBient Chrome Extension - 开发规范

## 项目概述
TaBient 是一个为 Chrome 标签页切换添加氛围音效的轻量级插件。

## 技术栈
- **平台**: Chrome Extension (Manifest V3)
- **语言**: JavaScript (ES6+)
- **核心 API**: `chrome.tabs`, `chrome.offscreen`, `chrome.storage`, `chrome.sidePanel`
- **构建工具**: Vite
- **音频处理**: Web Audio API

## 项目规则

### 1. 代码规范
- 使用 JavaScript (ES6+)，**不使用 TypeScript**
- 代码风格遵循 Standard JS 规范
- 使用有意义的变量名和函数名
- 添加必要的注释，特别是复杂的音频处理逻辑

### 2. 文件命名规范
- 小写字母，用连字符分隔
- 组件文件使用 `.js` 扩展名
- 配置文件使用 `.json` 扩展名

### 3. 目录结构
```
src/
├── background.js          # 后台脚本
├── offscreen/             # 离屏音频处理
│   ├── offscreen.html
│   └── offscreen.js
├── options/               # 设置页面
│   ├── options.html
│   └── options.js
└── assets/
    └── sounds/           # 内置音效文件
```

### 4. Chrome API 使用规范
- 严格遵守 Manifest V3 规范
- 使用 `chrome.offscreen` API 处理音频播放
- 使用 `chrome.storage` 本地存储用户配置
- 请求最小必要权限

### 5. 音频处理规范
- 使用 Web Audio API 进行音频处理
- 支持音量、混响、延时等效果
- 确保音频播放延迟 < 100ms
- 内存占用控制在 30MB 以内

### 6. 性能要求
- 后台脚本保持轻量
- 避免内存泄漏
- 合理使用 Service Worker 生命周期

### 7. 隐私与安全
- 不收集任何用户数据
- 所有配置存储在本地
- 不注入或修改页面内容

### 8. Chrome Store 审核
- 提供清晰的隐私政策
- 确保功能描述准确
- 提供完整的使用说明

## 开发工作流
1. 修改代码后使用 `npm run build` 构建
2. 在 `chrome://extensions` 加载 `dist` 目录测试
3. 确保所有功能正常工作后提交代码

## 测试清单
- [ ] 标签切换音效播放
- [ ] 基于域名的音效匹配
- [ ] 设置页面功能正常
- [ ] 音效控制（音量、混响、延时）
- [ ] 内存占用 < 30MB
- [ ] 音频延迟 < 100ms