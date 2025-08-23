#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 复制静态文件到构建目录
function copyStaticFiles() {
  const publicDir = path.join(__dirname, 'public')
  const distDir = path.join(__dirname, 'dist')
  
  // 确保dist目录存在
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  
  // 复制manifest.json
  const manifestSource = path.join(publicDir, 'manifest.json')
  const manifestDest = path.join(distDir, 'manifest.json')
  if (fs.existsSync(manifestSource)) {
    fs.copyFileSync(manifestSource, manifestDest)
    console.log('✓ Copied manifest.json')
  }
  
  // 复制HTML文件
  const htmlFiles = [
    'src/artbreeze-style-options.html',
    'src/offscreen-audio.html'
  ]
  
  // 不再需要复杂的文件复制
  
  // 不再需要 Service Worker 复制
  
  htmlFiles.forEach(file => {
    const source = path.join(__dirname, file)
    const dest = path.join(distDir, file.replace('src/', ''))
    
    if (fs.existsSync(source)) {
      const destDir = path.dirname(dest)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      fs.copyFileSync(source, dest)
      console.log(`✓ Copied ${file}`)
    }
  })
  
  // 复制资源文件
  const assetsSource = path.join(__dirname, 'src/assets')
  const assetsDest = path.join(distDir, 'assets')
  
  if (fs.existsSync(assetsSource)) {
    copyDir(assetsSource, assetsDest)
    console.log('✓ Copied assets directory')
  }
  
  // 复制图标文件
  const iconsSource = path.join(__dirname, 'ref/artbreeze-ChromeStoreBeta/icons')
  const iconsDest = path.join(distDir, 'assets')
  
  if (fs.existsSync(iconsSource)) {
    // 复制并重命名图标文件
    const iconFiles = [
      { source: 'logo16.png', dest: 'icon16.png' },
      { source: 'logo48.png', dest: 'icon48.png' },
      { source: 'logo128.png', dest: 'icon128.png' }
    ]
    
    iconFiles.forEach(icon => {
      const sourcePath = path.join(iconsSource, icon.source)
      const destPath = path.join(iconsDest, icon.dest)
      
      if (fs.existsSync(sourcePath)) {
        if (!fs.existsSync(iconsDest)) {
          fs.mkdirSync(iconsDest, { recursive: true })
        }
        fs.copyFileSync(sourcePath, destPath)
        console.log(`✓ Copied ${icon.source} as ${icon.dest}`)
      }
    })
  }
}

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  })
}

// 执行复制
copyStaticFiles()
console.log('Static files copied successfully!')