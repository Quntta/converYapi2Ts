/*
 * @Author: likunda 980765465@qq.com
 * @Date: 2025-09-03 10:13:24
 * @LastEditors: likunda 980765465@qq.com
 * @LastEditTime: 2025-09-26 11:07:57
 * @FilePath: /converYapi2Ts/background.js
 * @Description:
 */
import {
  copyToClipboard,
  getUrlType,
  cacheKey,
  projectCacheKey,
  handleGetCacheData,
  handleSetCacheData,
  handleGetTreeCacheData,
  handleClearCacheData
} from './utils.js';
import { getSingleInterfaceApi, getGroupInterfaceApi, getProjectBaseApi } from './getInterFace.js';
import { generateTypeScriptTypes } from './typeMapping.js';

var urlObj = null
var urlType = null
var extraFn = null
// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
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
    await handleCopyApi(tab)
  }
  if (info.menuItemId === 'clearCurrentCache') {
    await handleClearCurrentCache()
  }
  if (info.menuItemId === 'clearAllCache') {
    await handleClearAllCache()
  }
});

// 接受content.js发送的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('background.js收到消息:', 'message: ', message, 'sender: ', sender, 'sendResponse: ', sendResponse, new Date().getTime());

  if (message.type === 'pageLoaded' && message.url) {
    urlObj = {
      ...message
    }
    handleSetInterface()
    sendResponse({ success: true, message: '页面信息已处理' });
  }

  if (message.type === 'copyItem') {
    urlObj = {
      ...message
    }
    urlType = getUrlType(urlObj.url);
    handleCopyApi(sender.tab).then(res => {
      sendResponse({ success: true })
    }).catch(err => {
      console.error('复制TS类型失败:', err);
      sendResponse({ success: false, error: err.message })
    })
    // 返回true以支持异步响应
    return true;
  }

  // 对于其他类型的消息，立即返回成功响应
  sendResponse({ success: true, message: '消息已接收' });
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
  const treeData = await handleGetTreeCacheData()
  console.log('treeData', JSON.stringify(treeData));
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

async function handleCopyApi(tab) {
  try {
    if (urlType && urlType.type === 'single') {
      const data = await handleGetCacheData(cacheKey, 'id', urlType.id)
      if (data) {
        const copyText = data.DTO + '\n\n' + data.VO
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: copyToClipboard,
          args: [copyText]
        });
      } else {
        console.warn('未找到缓存数据，尝试重新获取接口信息');
        // 如果没有缓存数据，尝试重新获取
        if (urlObj) {
          await handleSetInterface();
          // 延迟再次尝试复制
          setTimeout(() => handleCopyApi(tab), 500);
        }
      }
    } else {
      console.warn('URL类型无效或不是单个接口页面');
    }
  } catch (error) {
    console.error('处理复制API时出错:', error);
  }
}

async function handleClearCurrentCache() {
  if (urlType && urlType.type === 'single') {
    await handleClearCacheData(cacheKey, 'id', urlType.id)
  }
}

async function handleClearAllCache() {
  await handleClearCacheData(cacheKey)
  await handleClearCacheData(projectCacheKey)
}
