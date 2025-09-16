/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:24
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-15 20:08:03
 * @FilePath: \converYapi2Ts\background.js
 * @Description:
 */
import { copyToClipboard, getLocalStorage, setLocalStorage, getUrlType, cacheKey, projectCacheKey } from './utils.js';
import { getSingleInterfaceApi, getGroupInterfaceApi, getProjectBaseApi } from './getInterFace.js';
import { generateTypeScriptTypes } from './typeMapping.js';

var urlObj = null
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
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyAsTs') {
    getLocalStorage(cacheKey).then(data => {
      console.log('获取到的存储数据:', data[cacheKey]);
    });
    // setLocalStorage('yapi2ts', [])
  }
  if (info.menuItemId === 'copyInterface') {
    console.log('复制接口', info);
    // 向剪贴板中写入内容
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: copyToClipboard,
        args: ['gagaga111']
      });
    }, 1000);
    getLocalStorage('yapi2ts').then(data => {
      console.log('获取到的存储数据:', data);
    });
    setLocalStorage('yapi2ts', [])
    // 获取当前页面的cookie和localStorage
    // getCurrentPageInfo(tab.url);
  }
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
  const urlType = getUrlType(urlObj.url);
  // 查询项目信息并缓存，在拼接url的时候有用
  await handleGetProjectInfo()
  if (!urlType) return;
  if (urlType.type === 'single') {
    handleSetSingle(urlType)
  } else if (urlType.type === 'group') {
    handleSetGroup(urlType)
  }
}

async function handleGetCacheData() {
  const cacheData = await getLocalStorage(cacheKey);
  if (!cacheData[cacheKey]) {
    return null
  }
  return cacheData[cacheKey]
}

async function handleGetSingle(id) {
  const data = await handleGetCacheData()
  console.log('data', data, 'id', id);
  if (!data) {
    return null
  }
  const hasCache = data.find(item => item.id === id)
  if (hasCache) {
    return hasCache
  }
  return null
}

async function handleGetGroup(catid) {
  const data = await handleGetCacheData()
  if (!data) {
    return null
  }
  const hasCache = data.filter(item => item.catid === catid)
  if (hasCache) {
    return hasCache
  }
  return null
}

async function handleSetSingle(urlType) {
  const hasCache = await handleGetSingle(urlType.id)
  console.log('hasCache', hasCache);
  if (hasCache) {
    return
  }
  const res = await getSingleInterfaceApi(urlType.id, urlObj.origin);
  const result = await generateTypeScriptTypes(res)
  const data = await handleGetCacheData()
  if (!data) {
    setLocalStorage(cacheKey, [result])
    return
  } else {
    setLocalStorage(cacheKey, [...data, result])
  }
  console.log('获取到的单个接口数据:', res, '转换数据:', result);
}

async function handleSetGroup(urlType) {
  const hasCache = await handleGetGroup(urlType.catid)
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
  const cacheData = await getLocalStorage(projectCacheKey);
  if (cacheData[projectCacheKey] && cacheData[projectCacheKey].id === projectId) {
    return cacheData[projectCacheKey]
  }
  const { data } = await getProjectBaseApi(projectId, urlObj.origin);
  setLocalStorage(projectCacheKey, {
    id: data._id,
    ...data
  })
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
