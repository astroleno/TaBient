// TaBient 音色系统 - MIDI 风格音色
// 类似 MIDI 128 种音色的扩展系统

console.log('🎹 [TABIENT TIMBRES] 音色系统加载');

// 高级音色定义 - 类似 MIDI 音色库
const TIMBRES = {
  // 钢琴类
  'acoustic-grand': {
    name: '大钢琴',
    category: 'piano',
    waveform: 'sine',
    harmonics: [1, 0.3, 0.1, 0.05, 0.02],
    attack: 0.001,
    decay: 0.1,
    sustain: 0.3,
    release: 0.3,
    filter: { frequency: 2000, Q: 1 }
  },
  
  'electric-piano': {
    name: '电钢琴',
    category: 'piano',
    waveform: 'triangle',
    harmonics: [1, 0.5, 0.2, 0.1],
    attack: 0.01,
    decay: 0.05,
    sustain: 0.4,
    release: 0.2,
    filter: { frequency: 1500, Q: 2 }
  },
  
  // 吉他类
  'acoustic-guitar': {
    name: '木吉他',
    category: 'guitar',
    waveform: 'sawtooth',
    harmonics: [1, 0.4, 0.3, 0.2, 0.1, 0.05],
    attack: 0.005,
    decay: 0.15,
    sustain: 0.2,
    release: 0.2,
    filter: { frequency: 800, Q: 0.5 }
  },
  
  'electric-guitar': {
    name: '电吉他',
    category: 'guitar',
    waveform: 'sawtooth',
    harmonics: [1, 0.8, 0.6, 0.4, 0.3],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.1,
    filter: { frequency: 1200, Q: 3 },
    distortion: 0.3
  },
  
  'bass-guitar': {
    name: '贝斯',
    category: 'bass',
    waveform: 'sawtooth',
    harmonics: [1, 0.6, 0.3, 0.1],
    attack: 0.01,
    decay: 0.05,
    sustain: 0.6,
    release: 0.1,
    filter: { frequency: 300, Q: 1 }
  },
  
  // 弦乐类
  'violin': {
    name: '小提琴',
    category: 'strings',
    waveform: 'sawtooth',
    harmonics: [1, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    attack: 0.05,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
    filter: { frequency: 2500, Q: 1 },
    vibrato: { frequency: 6, depth: 0.1 }
  },
  
  'cello': {
    name: '大提琴',
    category: 'strings',
    waveform: 'sawtooth',
    harmonics: [1, 0.5, 0.3, 0.2, 0.1],
    attack: 0.08,
    decay: 0.3,
    sustain: 0.6,
    release: 0.4,
    filter: { frequency: 1500, Q: 1 },
    vibrato: { frequency: 5, depth: 0.08 }
  },
  
  // 管乐类
  'flute': {
    name: '长笛',
    category: 'wind',
    waveform: 'sine',
    harmonics: [1, 0.2, 0.1, 0.05],
    attack: 0.02,
    decay: 0.1,
    sustain: 0.5,
    release: 0.2,
    filter: { frequency: 3000, Q: 0.8 }
  },
  
  'saxophone': {
    name: '萨克斯',
    category: 'wind',
    waveform: 'sawtooth',
    harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.1],
    attack: 0.03,
    decay: 0.15,
    sustain: 0.6,
    release: 0.2,
    filter: { frequency: 1800, Q: 1.5 }
  },
  
  'trumpet': {
    name: '小号',
    category: 'brass',
    waveform: 'sawtooth',
    harmonics: [1, 0.8, 0.6, 0.4, 0.3, 0.2],
    attack: 0.01,
    decay: 0.05,
    sustain: 0.7,
    release: 0.1,
    filter: { frequency: 2000, Q: 2 }
  },
  
  // 合成器类
  'synth-lead': {
    name: '合成器主音',
    category: 'synth',
    waveform: 'sawtooth',
    harmonics: [1, 0.7, 0.5, 0.3],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.1,
    filter: { frequency: 1000, Q: 3 }
  },
  
  'synth-pad': {
    name: '合成器背景',
    category: 'synth',
    waveform: 'sine',
    harmonics: [1, 0.3, 0.2, 0.1],
    attack: 0.2,
    decay: 0.3,
    sustain: 0.6,
    release: 0.5,
    filter: { frequency: 800, Q: 1 }
  },
  
  'synth-bass': {
    name: '合成器贝斯',
    category: 'synth',
    waveform: 'sawtooth',
    harmonics: [1, 0.5, 0.3],
    attack: 0.01,
    decay: 0.05,
    sustain: 0.7,
    release: 0.1,
    filter: { frequency: 200, Q: 2 }
  },
  
  // 打击乐类
  'bell': {
    name: '铃声',
    category: 'percussion',
    waveform: 'sine',
    harmonics: [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1],
    attack: 0.001,
    decay: 0.5,
    sustain: 0,
    release: 0.5,
    filter: { frequency: 4000, Q: 5 }
  },
  
  'glockenspiel': {
    name: '钟琴',
    category: 'percussion',
    waveform: 'sine',
    harmonics: [1, 0.9, 0.7, 0.5, 0.3],
    attack: 0.001,
    decay: 0.8,
    sustain: 0,
    release: 0.3,
    filter: { frequency: 6000, Q: 8 }
  },
  
  // 特殊效果类
  'organ': {
    name: '管风琴',
    category: 'organ',
    waveform: 'sawtooth',
    harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.1],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.1,
    filter: { frequency: 1500, Q: 1 }
  },
  
  'harpsichord': {
    name: '大键琴',
    category: 'organ',
    waveform: 'square',
    harmonics: [1, 0.5, 0.3, 0.2, 0.1],
    attack: 0.001,
    decay: 0.05,
    sustain: 0.2,
    release: 0.1,
    filter: { frequency: 3000, Q: 2 }
  },
  
  // 环境音效类
  'water': {
    name: '水滴',
    category: 'ambient',
    waveform: 'sine',
    harmonics: [1, 0.2, 0.1],
    attack: 0.001,
    decay: 0.3,
    sustain: 0,
    release: 0.5,
    filter: { frequency: 1000, Q: 1 },
    reverb: 0.8
  },
  
  'wind': {
    name: '风声',
    category: 'ambient',
    waveform: 'sawtooth',
    harmonics: [1, 0.1, 0.05],
    attack: 0.5,
    decay: 0.5,
    sustain: 0.3,
    release: 1.0,
    filter: { frequency: 500, Q: 0.5 },
    noise: 0.3
  },
  
  // 保留原有的基础音色
  'sine': {
    name: '正弦波',
    category: 'basic',
    waveform: 'sine',
    harmonics: [1],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1
  },
  
  'triangle': {
    name: '三角波',
    category: 'basic',
    waveform: 'triangle',
    harmonics: [1],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1
  },
  
  'square': {
    name: '方波',
    category: 'basic',
    waveform: 'square',
    harmonics: [1],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1
  },
  
  'sawtooth': {
    name: '锯齿波',
    category: 'basic',
    waveform: 'sawtooth',
    harmonics: [1],
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1
  }
};

// 音色分组
const TIMBRE_CATEGORIES = {
  piano: ['acoustic-grand', 'electric-piano'],
  guitar: ['acoustic-guitar', 'electric-guitar', 'bass-guitar'],
  strings: ['violin', 'cello'],
  wind: ['flute', 'saxophone'],
  brass: ['trumpet'],
  synth: ['synth-lead', 'synth-pad', 'synth-bass'],
  percussion: ['bell', 'glockenspiel'],
  organ: ['organ', 'harpsichord'],
  ambient: ['water', 'wind'],
  basic: ['sine', 'triangle', 'square', 'sawtooth']
};

// 默认音色预设
const TIMBRE_PRESETS = {
  'classic': {
    name: '经典',
    description: '经典钢琴音色',
    timbre: 'acoustic-grand',
    settings: {
      volume: 0.7,
      reverbWet: 0.15,
      delayWet: 0.05
    }
  },
  
  'modern': {
    name: '现代',
    description: '现代合成器音色',
    timbre: 'synth-lead',
    settings: {
      volume: 0.6,
      reverbWet: 0.25,
      delayWet: 0.15
    }
  },
  
  'ambient': {
    name: '环境',
    description: '环境氛围音色',
    timbre: 'synth-pad',
    settings: {
      volume: 0.5,
      reverbWet: 0.4,
      delayWet: 0.1
    }
  },
  
  'bass': {
    name: '贝斯',
    description: '深沉贝斯音色',
    timbre: 'bass-guitar',
    settings: {
      volume: 0.8,
      reverbWet: 0.1,
      delayWet: 0.05
    }
  },
  
  'bright': {
    name: '明亮',
    description: '明亮铃声音色',
    timbre: 'glockenspiel',
    settings: {
      volume: 0.4,
      reverbWet: 0.3,
      delayWet: 0.1
    }
  },
  
  'warm': {
    name: '温暖',
    description: '温暖弦乐音色',
    timbre: 'cello',
    settings: {
      volume: 0.6,
      reverbWet: 0.35,
      delayWet: 0.08
    }
  }
};

// 导出音色系统
globalThis.TimbreSystem = {
  TIMBRES,
  TIMBRE_CATEGORIES,
  TIMBRE_PRESETS,
  
  // 获取音色
  getTimbre(id) {
    return TIMBRES[id] || TIMBRES['sine'];
  },
  
  // 获取分类音色
  getCategoryTimbres(category) {
    return TIMBRE_CATEGORIES[category] || [];
  },
  
  // 获取所有音色
  getAllTimbres() {
    return Object.keys(TIMBRES);
  },
  
  // 获取所有分类
  getCategories() {
    return Object.keys(TIMBRE_CATEGORIES);
  },
  
  // 获取预设
  getPreset(id) {
    return TIMBRE_PRESETS[id] || TIMBRE_PRESETS['classic'];
  },
  
  // 获取所有预设
  getPresets() {
    return Object.keys(TIMBRE_PRESETS);
  }
};

console.log('🎹 [TABIENT TIMBRES] 音色系统加载完成，共', Object.keys(TIMBRES).length, '种音色');