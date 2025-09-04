/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 11:44:10
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-03 13:44:47
 * @FilePath: \converYapi2Ts\utils.js
 * @Description: 
 */


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
