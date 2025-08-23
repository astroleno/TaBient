// TaBient Service Worker
// Chrome Extension Manifest V3 Service Worker

// Load the bundled background script
(async () => {
  try {
    // Dynamically import the bundled background script
    const module = await import('./background-bundle.js')
    
    // The background script logic will be executed through the module
    console.log('TaBient service worker loaded with Tone.js audio engine')
    
  } catch (error) {
    console.error('Failed to load background bundle:', error)
  }
})()