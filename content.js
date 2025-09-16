/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:40
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-12 09:46:55
 * @FilePath: \converYapi2Ts\content.js
 * @Description:
 */

// 添加一个标志变量记录上次发送时间
let lastReportedTime = 0;
const MIN_INTERVAL = 1000; // 最小发送间隔1秒
let lastReportedUrl = '';

// 定期检查页面加载状态，并向background.js报告
function reportPageStatus() {
  const now = Date.now();
  // 如果距离上次发送不足最小间隔，或者URL相同，则不发送
  if (now - lastReportedTime < MIN_INTERVAL || lastReportedUrl === window.location.href) {
    return;
  }
  
  if (document.readyState === 'complete') {
    lastReportedTime = now;
    lastReportedUrl = window.location.href;
    chrome.runtime.sendMessage({
      type: 'pageLoaded',
      url: window.location.href,
      domain: window.location.hostname,
      origin: window.location.origin,
    });
    console.log('content.js发送消息:', window.location.href);
  }
}

// 页面加载完成后报告状态
window.addEventListener('load', reportPageStatus);

// 初始化lastHref
window.lastHref = window.location.href;

const observer = new MutationObserver((mutations) => {
  // 检查URL是否变化
  if (window.lastHref !== window.location.href) {
    window.lastHref = window.location.href;
    reportPageStatus();
  }
});

// 观察整个文档的变化，但限制范围以减少不必要的触发
observer.observe(document, {
  childList: true,
  subtree: true
});
