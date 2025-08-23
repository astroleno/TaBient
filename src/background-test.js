// 简化测试用 Background Script
// 专门用于测试基础音频功能

console.log('🧪 [TEST] 简化测试 Background Script 开始执行');

let offscreenDocument = null;
let audioEngineReady = false;

// 创建简化的 offscreen document
async function createSimpleOffscreenDocument() {
  if (offscreenDocument) {
    console.log('📄 [TEST] Offscreen document 已存在');
    return true;
  }
  
  try {
    console.log('📄 [TEST] 创建简化 offscreen document...');
    
    // 检查 API 可用性
    if (!chrome.offscreen) {
      console.error('❌ [TEST] chrome.offscreen API 不可用');
      return false;
    }
    
    // 检查是否已存在
    const existing = await chrome.offscreen.hasDocument();
    if (existing) {
      console.log('📄 [TEST] Offscreen document 已存在，跳过创建');
      offscreenDocument = true;
      return true;
    }
    
    // 创建简化的 offscreen document
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen/simple-audio-test.html'),
      reasons: ['AUDIO_PLAYBACK'],
      justification: '测试基础音频功能'
    });
    
    offscreenDocument = true;
    console.log('✅ [TEST] 简化 offscreen document 创建成功');
    return true;
    
  } catch (error) {
    console.error('❌ [TEST] 创建 offscreen document 失败:', error);
    return false;
  }
}

// 初始化测试
async function initTest() {
  console.log('🧪 [TEST] 开始初始化测试...');
  
  // 创建 offscreen document
  const offscreenCreated = await createSimpleOffscreenDocument();
  if (!offscreenCreated) {
    console.error('❌ [TEST] Offscreen document 创建失败');
    return;
  }
  
  // 等待一下确保文档加载完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试初始化
  console.log('🎵 [TEST] 测试音频初始化...');
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'initSimpleAudio',
      _target: 'offscreen'
    });
    
    console.log('🎵 [TEST] 初始化响应:', response);
    
    if (response && response.success) {
      audioEngineReady = true;
      console.log('✅ [TEST] 音频初始化成功');
    } else {
      console.error('❌ [TEST] 音频初始化失败');
    }
  } catch (error) {
    console.error('❌ [TEST] 初始化测试失败:', error);
  }
}

// 简化的音频测试函数
async function testSimpleAudio() {
  console.log('🎵 [TEST] 开始简单音频测试...');
  
  if (!offscreenDocument) {
    console.error('❌ [TEST] Offscreen document 未创建');
    return false;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'simpleTest',
      _target: 'offscreen'
    });
    
    console.log('🎵 [TEST] 测试响应:', response);
    return response && response.success;
    
  } catch (error) {
    console.error('❌ [TEST] 音频测试失败:', error);
    return false;
  }
}

// 获取音频状态
async function getAudioState() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'getAudioState',
      _target: 'offscreen'
    });
    
    console.log('📊 [TEST] 音频状态:', response);
    return response;
  } catch (error) {
    console.error('❌ [TEST] 获取状态失败:', error);
    return null;
  }
}

// 消息监听器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 [TEST] 收到消息:', message);
  
  if (message.type === 'testSimpleAudio') {
    testSimpleAudio().then(result => {
      sendResponse({ success: result });
    });
    return true;
  }
  
  if (message.type === 'getTestState') {
    sendResponse({
      offscreenDocument: offscreenDocument,
      audioEngineReady: audioEngineReady
    });
    return true;
  }
  
  if (message.type === 'initTest') {
    initTest().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.type === 'getAudioState') {
    getAudioState().then(state => {
      sendResponse(state);
    });
    return true;
  }
});

// 自动初始化
console.log('🧪 [TEST] 自动开始测试...');
initTest().then(() => {
  console.log('🧪 [TEST] 初始化完成');
  
  // 延迟测试
  setTimeout(() => {
    console.log('🎵 [TEST] 开始自动音频测试...');
    testSimpleAudio().then(result => {
      console.log('🎵 [TEST] 自动测试结果:', result);
    });
  }, 2000);
});

// 提供全局测试函数
globalThis.testSimpleAudio = testSimpleAudio;
globalThis.initAudioTest = initTest;
globalThis.getTestState = function() {
  return {
    offscreenDocument: offscreenDocument,
    audioEngineReady: audioEngineReady
  };
};

console.log('🧪 [TEST] 简化测试 Background Script 加载完成');