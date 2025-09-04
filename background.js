/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:24
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-03 14:15:33
 * @FilePath: \converYapi2Ts\background.js
 * @Description: 
 */
import { copyToClipboard } from './utils.js';

// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copyInterface',
    title: '复制接口',
    contexts: ['page', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyInterface') {
    console.log('复制接口', info);
    // 向剪贴板中写入内容
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyToClipboard,
      args: ['哈哈哈哈']
    });
    
    // 获取当前页面的cookie和localStorage
    getCurrentPageInfo(tab.url);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // if (message.action === 'pageLoaded') {
  //   copyToClipboard(message.text);
  // }
  console.log('background.js收到消息:', message, sender, sendResponse);
});

// 获取当前页面的cookie和localStorage信息
function getCurrentPageInfo(url) {
  if (!url) return;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // 获取cookie
    chrome.cookies.getAll({ domain }, (cookies) => {
      console.log('当前域名下的Cookie:', cookies);
      // 可以将cookie信息存储到本地存储或者发送到popup页面
      chrome.storage.local.set({ 'currentCookies': cookies });
    });
    
    // 通过content script获取localStorage
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: getLocalStorage
        });
      }
    });
  } catch (error) {
    console.error('获取页面信息失败:', error);
  }
}

// 获取localStorage的函数
function getLocalStorage() {
  try {
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localStorageData[key] = localStorage.getItem(key);
    }
    console.log('当前页面的localStorage:', localStorageData);
    // 将localStorage信息发送回background script
    chrome.runtime.sendMessage({ type: 'localStorageData', data: localStorageData });
  } catch (error) {
    console.error('获取localStorage失败:', error);
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'localStorageData') {
    // 存储localStorage信息
    chrome.storage.local.set({ 'currentLocalStorage': message.data });
  }
});