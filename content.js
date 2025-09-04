/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:40
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-03 15:27:48
 * @FilePath: \converYapi2Ts\content.js
 * @Description: 
 */

// 当接收到来自background.js的消息时执行
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getLocalStorage') {
    // 获取localStorage数据
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localStorageData[key] = localStorage.getItem(key);
    }
    
    // 发送回background.js
    sendResponse({ localStorageData });
  }
  return true; // 保持消息通道开放，以便异步响应
});

// 定期检查页面加载状态，并向background.js报告
function reportPageStatus() {
  console.log('reportPageStatus', document.readyState);
  if (document.readyState === 'complete') {
    chrome.runtime.sendMessage({ 
      type: 'pageLoaded',
      url: window.location.href,
      domain: window.location.hostname
    });
  }
}

// 页面加载完成后报告状态
window.addEventListener('load', reportPageStatus);

// 初始检查页面状态
reportPageStatus();