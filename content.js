/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:40
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-26 10:48:18
 * @FilePath: /converYapi2Ts/content.js
 * @Description: 内容脚本，用于监听页面状态变化并向background.js报告
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

// 显示复制成功的提示消息
function showCopySuccessMessage() {
  // 找到所有的复制按钮
  const copyButtons = document.querySelectorAll('button[data-copy-button="true"]');
  copyButtons.forEach(button => {
    // 保存原始文本
    const originalText = button.dataset.originalText;
    // 修改按钮文本显示成功
    button.textContent = '复制成功！';
    button.style.backgroundColor = 'rgb(200, 230, 201)';
    button.style.color = 'rgb(52, 168, 83)';

    // 2秒后恢复原始状态
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = 'rgb(210, 234, 251)';
      button.style.color = 'rgb(16, 142, 233)';
    }, 2000);
  });
}

// 显示复制失败的提示消息
function showCopyErrorMessage(errorMessage) {
  console.error('复制失败:', errorMessage);
  // 可以根据需要添加更友好的错误提示
}

// 页面加载完成后报告状态
window.addEventListener('load', function () {
  reportPageStatus();
  // 页面加载完成后设置元素观察器
  setupInterfaceTitleObserver();
});

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

  // 断开caseContainer的变化观察器
  if (window.caseContainerObserver) {
    window.caseContainerObserver.disconnect();
    window.caseContainerObserver = null;
  }
});


// 监听.caseContainer .interface-title元素是否显示
function setupInterfaceTitleObserver() {
  // 如果已经有observer存在，先断开连接
  if (window.caseContainerObserver) {
    window.caseContainerObserver.disconnect();
  }

  // 创建MutationObserver监听.caseContainer元素的变化
  window.caseContainerObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      // 检查是否有新的节点被添加
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 遍历所有新增的节点
        mutation.addedNodes.forEach(node => {
          // 检查是否是元素节点
          if (node.nodeType === 1) {
            // 如果新增的节点本身就是我们要找的元素
            if (node.matches('.caseContainer .interface-title')) {
              if (!node.dataset.observed) {
                node.dataset.observed = 'true';
                const text = node.textContent.trim();
                // console.log('新观察到接口标题元素:', text, node);
                if (text === '基本信息') {
                  insertCopyButton(node);
                }
              }
            }

            // 或者检查新增节点的子树中是否有我们要找的元素
            const childTitles = node.querySelectorAll('.caseContainer .interface-title');
            childTitles.forEach(title => {
              if (!title.dataset.observed) {
                title.dataset.observed = 'true';
                const text = title.textContent.trim();
                // console.log('新观察到接口标题元素:', text, title);
                if (text === '基本信息') {
                  insertCopyButton(title);
                }
              }
            });
          }
        });
      }
    });
  });

  // 开始观察整个文档的变化，以捕获动态添加的.caseContainer和.interface-title元素
  window.caseContainerObserver.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

function insertCopyButton(element) {
  var copyButton = document.createElement('button');
  copyButton.textContent = '复制ts类型';
  copyButton.className = 'copy-button';
  copyButton.style.marginLeft = '20px'
  copyButton.style.color = 'rgb(16, 142, 233)'
  copyButton.style.backgroundColor = 'rgb(210, 234, 251)'
  copyButton.style.padding = '4px 6px'
  copyButton.style.marginRight = '8px'
  copyButton.style.borderRadius = '4px'
  copyButton.style.verticalAlign = 'middle'
  copyButton.style.fontSize = '13px'
  copyButton.style.border = 'none'
  copyButton.style.outline = 'none'
  copyButton.style.cursor = 'pointer'
  element.appendChild(copyButton);
  // 为按钮添加唯一标识符，方便后续操作
  copyButton.dataset.copyButton = 'true';

  // 存储原始文本，用于状态变化
  copyButton.dataset.originalText = copyButton.textContent;
  copyButton.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('点击复制按钮');
    try {
      // 发送消息时包含当前页面的URL信息，避免依赖background.js中的全局状态
      chrome.runtime.sendMessage({
        type: 'copyItem',
        url: window.location.href,
        origin: window.location.origin,
        domain: window.location.hostname
      }, (response) => {
        // 接收background.js的响应
        // if (chrome.runtime.lastError) {
        //   console.warn('接收响应失败:', chrome.runtime.lastError);
        //   showCopyErrorMessage('与扩展通信失败');
        //   return;
        // }
        console.log('content.js收到响应:', response);
        // 根据响应状态显示不同的提示
        if (response && response.success) {
          showCopySuccessMessage();
        } else if (response && response.error) {
          showCopyErrorMessage(response.error);
        } else {
          console.warn('未收到有效响应');
          showCopyErrorMessage('未收到有效响应');
        }
      });
      console.log('content.js发送copyItem消息:', window.location.href);
    } catch (error) {
      console.warn('发送复制消息失败:', error);
    }
  });
}
