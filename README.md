# 浮声 TaBient

<div align="center">
  <img src="" alt="TaBient Logo" width="150"/>
</div>

<p align="center">
  <strong>🎶 一个让 Chrome 标签切换时有氛围音效的小插件。</strong>
  <br>
  为日常浏览增添一丝轻盈与趣味。
</p>

<p align="center">
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
    <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-orange.svg" alt="Manifest V3">
</p>

[]

---

## ✨ 功能亮点

* **🎵 即时音效反馈**：每次切换标签页时，自动播放对应音效，告别无声的机械操作。
* **🧩 高度可定制**：按网站域名（如 `youtube.com`）匹配专属音效，打造你的个性化浏览环境。
* **🔊 自由控制**：支持自定义上传音效、独立调节音量，并提供一键全局静音开关。
* **💡 悬停预览 (开发中)**：在插件面板中悬停于标签页列表上，即可提前预览其绑定的音效。
* **☁️ 轻若无物**：极致的性能优化，对浏览器运行无任何负担。

---

## 🛠 技术栈

* **平台**: Chrome Extension (Manifest V3)
* **语言**: TypeScript / JavaScript
* **核心 API**: `chrome.tabs`, `chrome.offscreen`, `chrome.storage`, `chrome.sidePanel`
* **构建工具**: Vite (推荐) / Webpack
* **界面 (可选)**: React + Tailwind CSS (用于复杂的设置面板)

---

## 📦 安装与使用

#### 方法一：从 Chrome 网上应用店安装 (推荐)

> (即将上架，敬请期待...)

#### 方法二：从源码本地安装 (开发者)

1.  **克隆本仓库到本地**
    ```bash
    git clone [https://github.com/yourname/tabient.git](https://github.com/yourname/tabient.git)
    ```

2.  **安装项目依赖**
    ```bash
    cd tabient
    npm install
    ```

3.  **构建项目**
    ```bash
    npm run build
    ```
    这会在根目录下生成一个 `dist` 文件夹。

4.  **在 Chrome 中加载插件**
    * 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions` 并回车。
    * 打开页面右上角的 **“开发者模式”** 开关。
    * 点击左上角的 **“加载已解压的扩展程序”**，然后选择刚刚生成的 `dist` 文件夹。
    * 完成！现在切换标签页，开始享受“浮声”带来的乐趣吧 🎵

---

## 📐 目录结构
好的，你提供的这两份草稿都非常有价值，包含了清晰的思路和具体的功能点。

我的任务是将它们整合、优化并专业化，为你生成一套可以直接使用的、结构清晰的项目文档。

下面是整合优化后的 PRD (产品需求文档)、技术栈详情 和 README.md。

1. README.md (项目主页)
这份文件面向所有对项目感兴趣的人，包括普通用户和开发者。它需要简洁、有吸引力，并提供关键信息。

Markdown

# 浮声 TaBient

<div align="center">
  <img src="" alt="TaBient Logo" width="150"/>
</div>

<p align="center">
  <strong>🎶 一个让 Chrome 标签切换时有氛围音效的小插件。</strong>
  <br>
  为日常浏览增添一丝轻盈与趣味。
</p>

<p align="center">
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
    <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-orange.svg" alt="Manifest V3">
</p>

[]

---

## ✨ 功能亮点

* **🎵 即时音效反馈**：每次切换标签页时，自动播放对应音效，告别无声的机械操作。
* **🧩 高度可定制**：按网站域名（如 `youtube.com`）匹配专属音效，打造你的个性化浏览环境。
* **🔊 自由控制**：支持自定义上传音效、独立调节音量，并提供一键全局静音开关。
* **💡 悬停预览 (开发中)**：在插件面板中悬停于标签页列表上，即可提前预览其绑定的音效。
* **☁️ 轻若无物**：极致的性能优化，对浏览器运行无任何负担。

---

## 🛠 技术栈

* **平台**: Chrome Extension (Manifest V3)
* **语言**: TypeScript / JavaScript
* **核心 API**: `chrome.tabs`, `chrome.offscreen`, `chrome.storage`, `chrome.sidePanel`
* **构建工具**: Vite (推荐) / Webpack
* **界面 (可选)**: React + Tailwind CSS (用于复杂的设置面板)

---

## 📦 安装与使用

#### 方法一：从 Chrome 网上应用店安装 (推荐)

> (即将上架，敬请期待...)

#### 方法二：从源码本地安装 (开发者)

1.  **克隆本仓库到本地**
    ```bash
    git clone [https://github.com/yourname/tabient.git](https://github.com/yourname/tabient.git)
    ```

2.  **安装项目依赖**
    ```bash
    cd tabient
    npm install
    ```

3.  **构建项目**
    ```bash
    npm run build
    ```
    这会在根目录下生成一个 `dist` 文件夹。

4.  **在 Chrome 中加载插件**
    * 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions` 并回车。
    * 打开页面右上角的 **“开发者模式”** 开关。
    * 点击左上角的 **“加载已解压的扩展程序”**，然后选择刚刚生成的 `dist` 文件夹。
    * 完成！现在切换标签页，开始享受“浮声”带来的乐趣吧 🎵

---

## 📐 目录结构

/tabient
├─ src/                      # 源码目录
│  ├─ background.ts          # 后台服务，监听事件
│  ├─ offscreen/             # 离屏文档，用于播放音频
│  │  ├─ offscreen.html
│  │  └─ offscreen.ts
│  ├─ options/               # 选项页 UI 与逻辑
│  │  ├─ options.html
│  │  └─ options.ts
│  └─ assets/
│     └─ sounds/             # 内置音效文件
├─ public/                   # 公共静态资源
│  └─ manifest.json          # 插件配置文件
├─ dist/                     # 构建输出目录
└─ README.md


---

## 🚧 产品路线图 (Roadmap)

-   [x] **MVP 版本**
    -   [x] 实现标签切换时的音效播放
    -   [x] 基于域名的音效匹配规则
    -   [x] 简单的选项页（开关、音量、规则管理）
-   [ ] **V1.1 - 个性化增强**
    -   [ ] 支持用户上传自定义音效文件
    -   [ ] 扩展内置音效库（如氛围声、自然声、机械声等主题）
-   [ ] **V1.2 - 交互升级**
    -   [ ] 通过 Side Panel 实现悬停标签预览音效功能
    -   [ ] 实现一键静音或按时段静音模式
-   [ ] **未来规划**
    -   [ ] 音效主题包一键切换
    -   [ ] 支持 Edge 等其他 Chromium 内核浏览器

---

## 📄 许可

本项目基于 [MIT License](./LICENSE) 授权。