import { copyToClipboard, escapeHtml } from './utils.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 获取当前活动标签页的信息
  getCurrentTabInfo();
  // 绑定复制按钮事件
  // document.getElementById('copyLocalStorage').addEventListener('click', copyLocalStorageData);
  document.getElementById('copyCookies').addEventListener('click', copyCookiesData);
});

// 获取当前活动标签页的信息
function getCurrentTabInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      const url = tab.url;
      const domain = new URL(url).hostname;
      
      // 显示页面信息
      const pageInfoElement = document.getElementById('pageInfo');
      pageInfoElement.innerHTML = `
        <div>URL: ${escapeHtml(url)}</div>
        <div>域名: ${escapeHtml(domain)}</div>
        <div>标题: ${escapeHtml(tab.title || '无标题')}</div>
      `;
      
      // 获取并显示cookie信息
      getCookies(domain);
      
      // 从本地存储获取localStorage信息
      // getLocalStorageData();
    }
  });
}

// 获取指定域名的cookie信息
function getCookies(domain) {
  chrome.cookies.getAll({ domain }, (cookies) => {
    const cookieElement = document.getElementById('cookieData');
    
    if (cookies && cookies.length > 0) {
      let cookieHtml = '';
      cookies.forEach(cookie => {
        cookieHtml += `
          <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
            <div><strong>名称:</strong> ${escapeHtml(cookie.name)}</div>
            <div><strong>值:</strong> ${escapeHtml(cookie.value)}</div>
            <div><strong>路径:</strong> ${escapeHtml(cookie.path)}</div>
            <div><strong>过期时间:</strong> ${cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleString() : '会话结束'}</div>
          </div>
        `;
      });
      cookieElement.innerHTML = cookieHtml;
    } else {
      cookieElement.innerHTML = '<span class="no-data">未找到cookie</span>';
    }
  });
}

// 获取localStorage信息
function getLocalStorageData() {
  // 先尝试从background存储中获取
  chrome.storage.local.get('currentLocalStorage', (result) => {
    const localStorageElement = document.getElementById('localStorageData');
    
    if (result.currentLocalStorage && Object.keys(result.currentLocalStorage).length > 0) {
      displayLocalStorage(result.currentLocalStorage);
    } else {
      // 如果没有，就通过scripting API直接获取
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: getLocalStorageFromTab
          }).then((results) => {
            if (results && results[0] && results[0].result) {
              displayLocalStorage(results[0].result);
            } else {
              localStorageElement.innerHTML = '<span class="no-data">获取localStorage失败</span>';
            }
          }).catch(err => {
            console.error('获取localStorage失败:', err);
            localStorageElement.innerHTML = '<span class="no-data">获取localStorage失败</span>';
          });
        }
      });
    }
  });
}

// 从当前标签页获取localStorage的函数
function getLocalStorageFromTab() {
  try {
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localStorageData[key] = localStorage.getItem(key);
    }
    return localStorageData;
  } catch (error) {
    console.error('获取localStorage失败:', error);
    return {};
  }
}

// 显示localStorage数据
function displayLocalStorage(data) {
  const localStorageElement = document.getElementById('localStorageData');
  
  if (data && Object.keys(data).length > 0) {
    let localStorageHtml = '';
    Object.keys(data).forEach(key => {
      localStorageHtml += `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
          <div><strong>键:</strong> ${escapeHtml(key)}</div>
          <div><strong>值:</strong> ${escapeHtml(data[key])}</div>
        </div>
      `;
    });
    localStorageElement.innerHTML = localStorageHtml;
  } else {
    localStorageElement.innerHTML = '<span class="no-data">localStorage为空</span>';
  }
}

// 复制localStorage数据到剪贴板
function copyLocalStorageData() {
  chrome.storage.local.get('currentLocalStorage', (result) => {
    if (result.currentLocalStorage) {
      const dataStr = JSON.stringify(result.currentLocalStorage, null, 2);
      copyToClipboard(dataStr, 'LocalStorage数据已复制到剪贴板');
    } else {
      // 尝试重新获取
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: getLocalStorageFromTab
          }).then((results) => {
            if (results && results[0] && results[0].result) {
              const dataStr = JSON.stringify(results[0].result, null, 2);
              copyToClipboard(dataStr, 'LocalStorage数据已复制到剪贴板');
            }
          });
        }
      });
    }
  });
}

// 复制cookie数据到剪贴板
function copyCookiesData() {
  console.log('copyCookiesData');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const url = tabs[0].url;
      const domain = new URL(url).hostname;
      
      chrome.cookies.getAll({ domain }, (cookies) => {
        if (cookies && cookies.length > 0) {
          const cookiesObj = {};
          cookies.forEach(cookie => {
            cookiesObj[cookie.name] = cookie.value;
          });
          const dataStr = JSON.stringify(cookiesObj, null, 2);
          copyToClipboard(dataStr, 'Cookie数据已复制到剪贴板');
        }
      });
    }
  });
}