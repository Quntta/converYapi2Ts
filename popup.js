/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:14:58
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-22 11:40:40
 * @FilePath: \converYapi2Ts\popup.js
 * @Description:
 */
import { copyToClipboard, escapeHtml, handleGetTreeCacheData } from './utils.js';

var apiList = []
// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 获取当前活动标签页的信息
  getCurrentTabInfo();
  // 绑定复制按钮事件
  document.getElementById('copyCookies').addEventListener('click', copyCookiesData);
});

// 获取当前活动标签页的信息
function getCurrentTabInfo() {
  // 获取并显示页面信息
  getPageInfo();

  // 获取并显示接口列表
  getApiList();

  // 获取并显示cookie信息
  getCookies();
}

/**
 * 获取并显示树形结构的接口列表
 */
async function getApiList() {
  // 获取树形结构数据
  apiList = await handleGetTreeCacheData();

  // 渲染树形结构
  const apiListElement = document.getElementById('apiList');
  if (apiList && apiList.length > 0) {
    apiListElement.innerHTML = renderTree(apiList);

    // 为所有复制按钮添加事件监听
    attachCopyButtonListeners();
  } else {
    apiListElement.innerHTML = '<span class="no-data">未找到接口</span>';
  }
}

/**
 * 渲染树形结构
 * @param {Array} treeData - 树形数据
 * @returns {string} HTML字符串
 */
function renderTree(treeData) {
  let html = '<div class="tree-container">';

  // 遍历第一层：项目纬度
  treeData.forEach(project => {
    html += `
      <div class="tree-node project-node">
        <div class="node-header">
          <span class="toggle-icon">▶</span>
          <span class="node-name">${escapeHtml(project.name)}</span>
        </div>
        <div class="tree-children">`;

    // 遍历第二层：分类纬度
    if (project.children && project.children.length > 0) {
      project.children.forEach(category => {
        html += `
          <div class="tree-node category-node">
            <div class="node-header">
              <span class="toggle-icon">▶</span>
              <span class="node-name">${escapeHtml(category.name)}</span>
              <button class="copy-button" data-type="category" data-id="${category._id}">复制</button>
            </div>
            <div class="tree-children">`;

        // 遍历第三层：接口纬度
        if (category.children && category.children.length > 0) {
          category.children.forEach(api => {
            html += `
              <div class="tree-node api-node">
                <div class="node-header">
                  <span class="api-method">${escapeHtml(api.method || '')}</span>
                  <span class="node-name">${escapeHtml(api.title)}</span>
                  <button class="copy-button" data-type="api" data-id="${api.id}">复制</button>
                </div>
              </div>`;
          });
        } else {
          html += '<div class="no-data">无接口</div>';
        }

        html += '</div></div>';
      });
    } else {
      html += '<div class="no-data">无分类</div>';
    }

    html += '</div></div>';
  });

  html += '</div>';
  return html;
}

/**
 * 为所有复制按钮添加事件监听
 */
function attachCopyButtonListeners() {
  const copyButtons = document.querySelectorAll('.copy-button');
  copyButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      // 使用currentTarget确保获取到的是绑定事件的元素本身
      const type = event.currentTarget.dataset.type;
      const id = event.currentTarget.dataset.id;
      const buttonElement = event.currentTarget;

      // 阻止事件冒泡
      event.stopPropagation();

      // 保存原始按钮文字并修改为"成功"
      const originalText = buttonElement.textContent;
      buttonElement.textContent = '成功';
      buttonElement.disabled = true;

      // 执行复制操作
      if (type === 'api') {
        await copyApiDtoAndVo(id);
      } else if (type === 'category') {
        await copyCategoryDtosAndVos(id);
      }

      // 1.5秒后恢复原始状态
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
      }, 1500);
    });
  });

  // 为折叠/展开按钮添加事件监听
  const toggleIcons = document.querySelectorAll('.toggle-icon');
  toggleIcons.forEach(icon => {
    icon.addEventListener('click', (event) => {
      const node = event.target.closest('.tree-node');
      const children = node.querySelector('.tree-children');

      if (children) {
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
        event.target.textContent = children.style.display === 'none' ? '▶' : '▼';
      }

      event.stopPropagation();
    });
  });
}

function concatText(texts) {
  return texts.filter(text => text).join('\n\n');
}

/**
 * 复制单个接口的DTO和VO
 * @param {string} apiId - 接口ID
 */
async function copyApiDtoAndVo(apiId) {
  // 查找对应接口
  let targetApi = null;
  for (const project of apiList) {
    for (const category of project.children || []) {
      targetApi = category.children?.find(api => api.id == apiId);
      if (targetApi) break;
    }
    if (targetApi) break;
  }

  if (targetApi) {
    const content = concatText([targetApi.DTO, targetApi.VO]);
    copyToClipboard(content, `接口[${targetApi.title}]的DTO和VO已复制到剪贴板`);
  }
}

/**
 * 复制分类下所有接口的DTO和VO
 * @param {string} categoryId - 分类ID
 */
async function copyCategoryDtosAndVos(categoryId) {
  // 查找对应分类
  let targetCategory = null;
  const texts = []
  for (const project of apiList) {
    targetCategory = project.children?.find(category => category._id == categoryId);
    if (targetCategory) break;
  }
  if (targetCategory && targetCategory.children && targetCategory.children.length > 0) {
    targetCategory.children.forEach(api => {
      texts.push(...[api.DTO, api.VO])
    });

    console.log('texts', texts)

    const content = concatText(texts);
    if (content) {
      copyToClipboard(content, `分类[${targetCategory.name}]下所有接口的DTO和VO已复制到剪贴板`);
    }
  }
}

function getPageInfo() {
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
    }
  });
}

// 获取指定域名的cookie信息
function getCookies() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      const url = tab.url;
      const domain = new URL(url).hostname;
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
  })
}

// 复制cookie数据到剪贴板
function copyCookiesData() {
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
