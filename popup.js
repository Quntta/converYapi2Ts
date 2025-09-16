/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:14:58
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-11 19:59:10
 * @FilePath: \converYapi2Ts\popup.js
 * @Description: 
 */
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