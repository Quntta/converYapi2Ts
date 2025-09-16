/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:40
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-16 14:04:02
 * @FilePath: \converYapi2Ts\content.js
 * @Description:
 */

// 添加一个标志变量记录上次发送时间
let lastReportedTime = 0;
const MIN_INTERVAL = 1000; // 最小发送间隔1秒
let lastReportedUrl = '';
let observer = null;

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

    try {
      // 尝试发送消息，如果扩展上下文已失效则捕获错误
      console.log(chrome.runtime.sendMessage)
      chrome.runtime.sendMessage({
        type: 'pageLoaded',
        url: window.location.href,
        domain: window.location.hostname,
        origin: window.location.origin,
      });
      console.log('content.js发送消息:', window.location.href);
    } catch (error) {
      console.warn('发送消息失败，扩展上下文可能已失效:', error);
    }
  }
}

// 页面加载完成后报告状态
window.addEventListener('load', reportPageStatus);

// 初始化lastHref
window.lastHref = window.location.href;

observer = new MutationObserver((mutations) => {
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

// 页面卸载时清理资源，防止在页面卸载后尝试发送消息
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
