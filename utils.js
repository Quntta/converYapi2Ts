/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 11:44:10
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-15 20:07:56
 * @FilePath: \converYapi2Ts\utils.js
 * @Description:
 */


export const cacheKey = 'yapi2ts'
export const projectCacheKey = 'yapi2tsProject'

/**
 * 复制文本到剪贴板的通用函数
 * @param {string} text - 要复制的文本
 * @param {string} successMessage - 成功提示消息（可选）
 * @param {Function} callback - 回调函数（可选）
 */
export function copyToClipboard(text, successMessage = '', callback = null) {
  try {
    // 首先尝试使用现代的 Clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        console.log('使用Clipboard API复制成功');
        if (successMessage) {
          alert(successMessage);
        }
        if (callback) callback(true);
      })
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      console.log('使用document.execCommand复制成功:', success);

      if (success && successMessage) {
        alert(successMessage);
      }
      document.body.removeChild(textArea);
    }
  } catch (err) {
    console.error('复制操作发生错误:', err);
    if (callback) callback(false);
  }
}

/**
 * HTML转义函数
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getEffectUrl() {
  // 从缓存中获取
  const effectUrl = localStorage.getItem('effectUrl');
  if (effectUrl) {
    return effectUrl;
  }
}

export function getDoMain() {
  // 从当前域名获取
  const doMain = window.location.hostname;
  if (doMain) {
    return doMain;
  }
}

/**
 * 验证URL是否符合YAPI接口地址格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} - 验证结果，true表示符合格式，false表示不符合
 * @description 只校验url的yapi开头，中间部分不校验，校验结尾包含 /api/ 和 数字或字母
 */
const URL_TYPE_CONFIG = [
  { type: 'single' },
  { type: 'group' },
]
export function getUrlType(url) {
  const reg1 = /^https?:\/\/yapi.*\/api\/\d+$/;
  const reg2 = /^https?:\/\/yapi.*\/api\/cat_\d+$/;
  if (reg1.test(url)) {
    return {
      ...URL_TYPE_CONFIG[0],
      id: Number(url.split('/').pop())
    }
  }
  if (reg2.test(url)) {
    return {
      ...URL_TYPE_CONFIG[1],
      catid: Number(url.split('/').pop().split('_').pop())
    }
  }
  return null;
}

/**
 * 设置存储数据（使用Chrome扩展的存储API）
 * @param {string} key - 存储键名
 * @param {any} value - 存储值
 * @returns {Promise<void>} 返回Promise表示操作完成状态
 */
export function setLocalStorage(key, value) {
  return new Promise((resolve, reject) => {
    try {
      // 在Chrome扩展中，应使用chrome.storage API而非localStorage
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error('chrome.storage设置失败:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('chrome.storage设置成功:', key, value);
          resolve();
        }
      });
    } catch (error) {
      console.error('存储数据失败:', error);
      reject(error);
    }
  });
}

/**
 * 获取存储数据（使用Chrome扩展的存储API）
 * @param {string|string[]} keys - 要获取的键名，可以是单个键名或键名数组
 * @returns {Promise<any>} 返回包含存储数据的Promise
 */
export function getLocalStorage(keys = null) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.error('chrome.storage获取失败:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('chrome.storage获取成功:', result);
          resolve(result);
        }
      });
    } catch (error) {
      console.error('获取存储数据失败:', error);
      reject(error);
    }
  });
}

export function getSingleCacheById(id) {
  return getLocalStorage(`single_${id}`);
}

// 类型生成相关函数已移至typeMapping.js文件
