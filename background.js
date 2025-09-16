/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:24
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-16 15:58:02
 * @FilePath: \converYapi2Ts\background.js
 * @Description:
 */
import { copyToClipboard, getUrlType, cacheKey, projectCacheKey, handleGetCacheData, handleSetCacheData } from './utils.js';
import { getSingleInterfaceApi, getGroupInterfaceApi, getProjectBaseApi } from './getInterFace.js';
import { generateTypeScriptTypes } from './typeMapping.js';

var urlObj = null
var urlType = null
var extraFn = null
// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
  // chrome.contextMenus.create({
  //   id: 'copyInterface',
  //   title: '复制接口',
  //   contexts: ['page', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  // });
  const mainMenuId = chrome.contextMenus.create({
    id: 'mainMenu',
    title: 'Yapi2Ts工具',
    contexts: ['page']
  });

  // 创建子菜单项（嵌套在主菜单下）
  chrome.contextMenus.create({
    id: 'copyAsTs',
    title: '复制TS类型',
    parentId: mainMenuId,
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'clearCurrentCache',
    title: '清除当前缓存',
    parentId: mainMenuId,
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'clearAllCache',
    title: '清除全部缓存',
    parentId: mainMenuId,
    contexts: ['page']
  });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'copyAsTs') {
    if (urlType && urlType.type === 'single') {
      const data = await handleGetCacheData(cacheKey, 'id', urlType.id)
      if (data) {
        const copyText = data.DTO + '\n\n' + data.VO
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: copyToClipboard,
          args: [copyText]
        });
      }
    }
  }
  // if (info.menuItemId === 'copyInterface') {
  //   console.log('复制接口', info);
  //   // 向剪贴板中写入内容
  //   setTimeout(() => {
  //     chrome.scripting.executeScript({
  //       target: { tabId: tab.id },
  //       function: copyToClipboard,
  //       args: ['gagaga111']
  //     });
  //   }, 1000);
  //   getLocalStorage('yapi2ts').then(data => {
  //     console.log('获取到的存储数据:', data);
  //   });
  //   setLocalStorage('yapi2ts', [])
  // }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.url) {
    urlObj = {
      ...message
    }
    handleSetInterface()
  }
  console.log('background.js收到消息:', message, sender, sendResponse, new Date().getTime());
});

async function handleSetInterface() {
  if (!urlObj) return;
  urlType = getUrlType(urlObj.url);
  // 查询项目信息并缓存，在拼接url的时候有用
  await handleGetProjectInfo()
  if (!urlType) return;
  if (urlType.type === 'single') {
    handleSetSingle()
  } else if (urlType.type === 'group') {
    handleSetGroup()
  }
}

async function handleSetSingle() {
  const hasCache = await handleGetCacheData(cacheKey, 'id', urlType.id)
  console.log('hasCache', hasCache);
  if (hasCache) {
    return
  }
  const res = await getSingleInterfaceApi(urlType.id, urlObj.origin);
  const result = await generateTypeScriptTypes(res)
  await handleSetCacheData(cacheKey, result, 'id')
  console.log('获取到的单个接口数据:', res, '转换数据:', result);
}

async function handleSetGroup() {
  const hasCache = await handleGetCacheData(cacheKey, 'catid', urlType.catid)
  if (hasCache) {
    return
  }
  const res = await getGroupInterfaceApi({
    catid: urlType.catid,
    page: 1,
    limit: 20,
  }, urlObj.origin);
  console.log('获取到的群组接口数据:', res);
}

async function handleGetProjectInfo() {
  const id = urlObj.url.split('/')[4]
  const projectId = Number(id)
  const cacheData = await handleGetCacheData(projectCacheKey, 'id', projectId)
  if (cacheData) {
    return cacheData
  }
  const { data } = await getProjectBaseApi(projectId, urlObj.origin);
  await handleSetCacheData(projectCacheKey, {
    id: data._id,
    ...data
  }, 'id')
}

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
      // chrome.storage.local.set({ 'currentCookies': cookies });
    });
  } catch (error) {
    console.error('获取页面信息失败:', error);
  }
}
