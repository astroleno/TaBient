# TaBient Chrome Store 打包说明

## 📦 准备打包

### 1. 文件检查清单

确保 `TaBient` 文件夹包含以下文件：

```
TaBient/
├── manifest.json              ✅ 扩展清单
├── background-bundle.js       ✅ 后台服务脚本
├── artbreeze-style-options.html ✅ 设置页面
├── offscreen-audio.html       ✅ 音频播放页面
├── offscreen-audio.js         ✅ 音频处理脚本
├── options/
│   └── options.js            ✅ 设置界面逻辑
└── assets/
    ├── icon16.png           ✅ 16x16图标
    ├── icon48.png           ✅ 48x48图标
    └── icon128.png          ✅ 128x128图标
```

### 2. 不包含的文件

以下文件**不应该**包含在打包中：
- ❌ `content-script.js` (已删除)
- ❌ `sounds/` 文件夹 (未使用)
- ❌ `README.md` 文件
- ❌ 开发工具配置文件
- ❌ 调试文件

### 3. 创建ZIP包

1. 选中 `TaBient` 文件夹中的**所有内容**（不是文件夹本身）
2. 创建ZIP压缩文件，命名为 `TaBient-v1.0.0.zip`
3. 确保ZIP文件大小 < 10MB

## 🚀 Chrome Store 提交步骤

### 第一步：开发者账户
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 支付$5一次性开发者注册费（如未注册）

### 第二步：上传扩展
1. 点击"添加新项"
2. 上传 `TaBient-v1.0.0.zip` 文件
3. 等待上传和初步验证完成

### 第三步：填写商店信息

#### 基本信息
- **名称**: 浮声 TaBient
- **简短描述**: 为Chrome标签页切换添加优美的音效，支持多种音阶、音色和智能钢琴模式，让浏览更具韵律感。
- **详细描述**: [复制 CHROME_STORE_SUBMISSION.md 中的详细描述]
- **分类**: 
  - 主要：Productivity（工具）
  - 次要：Audio/Video（音频/视频）

#### 图标和截图
- **应用图标**: 使用 `assets/icon128.png`
- **小图标**: 自动生成或使用其他尺寸
- **截图**: 需要准备（见下方说明）

#### 隐私信息
- **隐私政策URL**: 上传 `PRIVACY_POLICY.md` 到GitHub或网站，提供链接
- **权限说明**: [复制 CHROME_STORE_SUBMISSION.md 中的权限说明]

#### 其他设置
- **语言**: 中文（简体）
- **区域**: 全球（或特定区域）
- **价格**: 免费

### 第四步：准备截图（重要！）

需要准备5张截图，每张1280x800px或1920x1200px：

1. **主界面截图**: 扩展popup的设置界面
2. **钢琴模式演示**: 显示钢琴模式设置
3. **音效控制界面**: 展示各种音频参数
4. **黑名单管理**: 网站黑名单功能
5. **统计信息页面**: 使用统计展示

### 第五步：发布设置
- **可见性**: 公开
- **发布状态**: 立即发布审核通过后
- **测试**: 可选择先发布为"未列出"进行测试

## ✅ 最终检查清单

提交前确认：

- [ ] ZIP文件包含正确的文件
- [ ] manifest.json版本正确 (1.0.0)
- [ ] 所有图标文件存在且清晰
- [ ] 权限设置合理（无host_permissions和content_scripts）
- [ ] 隐私政策链接有效
- [ ] 描述信息准确完整
- [ ] 截图准备完毕
- [ ] 测试功能正常

## 📋 Chrome Store 表单填写模板

### 商店信息部分

```
名称: 浮声 TaBient

简短描述:
为Chrome标签页切换添加优美的音效，支持多种音阶、音色和智能钢琴模式，让浏览更具韵律感。

分类:
主要: 工具 (Productivity)
次要: 音频/视频 (Audio/Video)

语言: 中文（简体）

详细描述:
[粘贴 CHROME_STORE_SUBMISSION.md 中的详细描述部分]
```

### 隐私部分

```
单一用途:
为Chrome标签页切换添加音效体验

权限理由:
[粘贴 CHROME_STORE_SUBMISSION.md 中的权限说明部分]

数据使用声明:
本扩展不收集任何用户数据，所有设置仅存储在本地设备。

隐私政策:
[提供 PRIVACY_POLICY.md 的在线链接]
```

## 🎯 审核建议

- **首次提交**: 可能需要1-3天审核
- **常见拒绝原因**: 权限过度、描述不清、隐私政策缺失
- **通过要点**: 功能明确、权限合理、界面友好
- **后续更新**: 重要更新需要重新审核

## 📞 支持信息

如果审核被拒绝：
1. 仔细阅读拒绝原因
2. 参考Chrome Web Store政策
3. 修改后重新提交
4. 可通过开发者支持渠道申诉

---

**准备就绪！** 您的TaBient扩展已经优化完毕，符合Chrome Store的所有要求，可以提交审核了！🚀