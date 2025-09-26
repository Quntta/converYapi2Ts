# Yapi转Ts接口复制工具 技术文档

## 1. 项目概述

**Yapi转Ts接口复制工具**是一个Chrome浏览器扩展，旨在简化前端开发中从Yapi接口文档到TypeScript类型定义的转换过程，提供一键复制功能，提高开发效率。

### 1.1 主要功能
- 自动检测Yapi页面URL变化，获取接口信息
- 将Yapi接口定义转换为标准TypeScript类型定义（DTO/VO）
- 支持右键菜单快速复制TS类型
- 在Yapi页面中添加直观的复制按钮
- 提供弹出界面显示项目接口树形结构
- 实现本地缓存机制，提高重复访问时的响应速度

### 1.2 应用场景
- 前端开发人员在对接后端API时，快速获取准确的TypeScript类型定义
- 团队协作中确保前后端接口类型一致性
- 减少手动编写TS类型定义的工作量和错误率

## 2. 项目架构与技术栈

### 2.1 架构设计
该项目采用Chrome扩展的标准架构，主要分为以下几个部分：

- **内容脚本层**：content.js 注入到Yapi页面，负责页面监控和UI交互
- **后台服务层**：background.js 作为Service Worker运行，处理核心业务逻辑
- **数据转换层**：typeMapping.js 负责类型映射和转换
- **存储层**：使用Chrome Storage API实现数据缓存
- **用户界面层**：popup.html/popup.js 提供扩展弹出界面

### 2.2 技术栈
- **前端技术**：JavaScript (ES6+), Chrome Extension API
- **构建工具**：无（纯原生JavaScript）
- **数据存储**：Chrome Storage API, localStorage
- **目标平台**：Chrome浏览器

## 3. 核心功能模块

### 3.1 页面监控与消息通信

**功能说明**：监控Yapi页面的加载状态和URL变化，与background.js进行通信，触发接口数据获取和处理流程。

**实现细节**：
```javascript
// content.js
function reportPageStatus() {
  // 避免频繁发送消息的节流机制
  const now = Date.now();
  if (now - lastReportedTime < MIN_INTERVAL || lastReportedUrl === window.location.href) {
    return;
  }

  if (document.readyState === 'complete') {
    lastReportedTime = now;
    lastReportedUrl = window.location.href;
    
    // 向background.js发送页面加载完成的消息
    chrome.runtime.sendMessage({
      type: 'pageLoaded',
      url: window.location.href,
      domain: window.location.hostname,
      origin: window.location.origin,
    });
  }
}
```

**关键特性**：
- 使用节流机制避免频繁发送消息
- 监听页面加载完成事件和URL变化
- 提供消息错误处理机制

### 3.2 接口数据获取与缓存

**功能说明**：根据页面URL类型，从Yapi API获取接口数据，并将数据缓存到本地存储中，提高后续访问效率。

**实现细节**：
```javascript
// background.js
async function handleSetSingle() {
  // 先检查缓存中是否已有数据
  const hasCache = await handleGetCacheData(cacheKey, 'id', urlType.id)
  if (hasCache) {
    return
  }
  
  // 没有缓存时，调用API获取数据
  const res = await getSingleInterfaceApi(urlType.id, urlObj.origin);
  
  // 将获取的数据转换为TypeScript类型
  const result = await generateTypeScriptTypes(res)
  
  // 缓存处理后的结果
  await handleSetCacheData(cacheKey, result, 'id')
}
```

**关键特性**：
- 实现缓存优先的策略，减少API调用
- 支持单个接口和接口分组数据获取
- 自动关联项目信息

### 3.3 类型映射与转换

**功能说明**：将Yapi返回的Java类型接口定义映射转换为TypeScript类型定义。

**实现细节**：
```javascript
// typeMapping.js
// Java类型到JavaScript类型的映射表
export const javaToJsTypeMap = {
  // 基本数据类型
  'integer': 'number',
  'int': 'number',
  'long': 'number',
  'double': 'number',
  // ... 其他类型映射
};

// generateTypeScriptTypes函数实现了复杂的类型转换逻辑
```

**支持的类型映射**：
- 基本数据类型：int, long, double, boolean, string等
- 日期时间类型：Date, LocalDate, LocalDateTime等
- 集合类型：List, Map, Set等
- 自定义对象类型

### 3.4 复制功能实现

**功能说明**：提供多种方式（右键菜单、页面按钮、弹出界面）让用户快速复制TypeScript类型定义到剪贴板。

**实现细节**：
```javascript
// utils.js
export function copyToClipboard(text, successMessage = '', callback = null) {
  try {
    // 优先使用现代的Clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        // 处理成功逻辑
      })
    } else {
      // 降级使用传统的document.execCommand方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // ... 复制实现
    }
  } catch (err) {
    // 错误处理
  }
}
```

**关键特性**：
- 提供多种复制入口
- 支持异步复制操作
- 实现复制成功/失败的反馈机制
- 兼容不同版本的浏览器

### 3.5 用户界面增强

**功能说明**：在Yapi页面中动态添加复制按钮，并提供直观的操作反馈。

**实现细节**：
```javascript
// content.js
function insertCopyButton(element) {
  var copyButton = document.createElement('button');
  copyButton.textContent = '复制ts类型';
  copyButton.className = 'copy-button';
  // 设置按钮样式
  element.appendChild(copyButton);
  
  // 为按钮添加唯一标识符
  copyButton.dataset.copyButton = 'true';
  
  // 存储原始文本，用于状态变化
  copyButton.dataset.originalText = copyButton.textContent;
  
  // 添加点击事件
  copyButton.addEventListener('click', (event) => {
    // 处理复制逻辑
  });
}
```

**关键特性**：
- 使用MutationObserver监听页面元素变化
- 动态插入自定义UI元素
- 提供视觉反馈（按钮状态变化）
- 处理不同页面结构的兼容性

## 4. 核心 API/类/函数

### 4.1 background.js核心函数

#### `handleSetInterface()`
**功能**：根据URL类型设置接口数据，是整个流程的入口函数
**参数**：无
**返回值**：Promise<void>
**使用场景**：页面加载完成后，根据URL获取接口数据

#### `handleCopyApi(tab)`
**功能**：处理复制API类型的核心函数
**参数**：`tab` - Chrome标签页对象
**返回值**：Promise<void>
**使用场景**：用户点击复制按钮时触发

#### `chrome.runtime.onMessage.addListener()`
**功能**：监听来自content.js的消息
**处理消息类型**：`pageLoaded`、`copyItem`
**关键特性**：支持异步响应，使用`return true`保持消息通道开放

### 4.2 content.js核心函数

#### `reportPageStatus()`
**功能**：向background.js报告页面状态
**参数**：无
**返回值**：无
**使用场景**：页面加载完成或URL变化时调用

#### `setupInterfaceTitleObserver()`
**功能**：设置页面元素观察器，检测接口标题元素
**参数**：无
**返回值**：无
**使用场景**：页面加载后，用于动态添加复制按钮

#### `showCopySuccessMessage() / showCopyErrorMessage()`
**功能**：显示复制操作的结果提示
**参数**：`errorMessage`（可选）- 错误信息
**返回值**：无
**使用场景**：复制操作完成后，提供用户反馈

### 4.3 utils.js核心函数

#### `copyToClipboard(text, successMessage, callback)`
**功能**：将文本复制到剪贴板
**参数**：
- `text` - 要复制的文本
- `successMessage` - 成功提示消息（可选）
- `callback` - 回调函数（可选）
**返回值**：无
**使用场景**：需要将TS类型定义复制到剪贴板时

#### `getUrlType(url)`
**功能**：解析Yapi页面URL，判断接口类型
**参数**：`url` - Yapi页面URL
**返回值**：`{type: string, id?: number, catid?: number}`
**使用场景**：确定当前页面是单个接口页面还是接口分组页面

#### 缓存相关函数
- `handleGetCacheData(cacheKey, field, value)` - 获取缓存数据
- `handleSetCacheData(cacheKey, data, field)` - 设置缓存数据
- `handleClearCacheData(cacheKey, field?, value?)` - 清除缓存数据

## 5. 工作流程

### 5.1 页面加载与数据获取流程

1. **页面监控**：content.js 监控Yapi页面的加载状态和URL变化
2. **消息通知**：当页面加载完成或URL变化时，向background.js发送`pageLoaded`消息
3. **URL解析**：background.js根据URL解析接口类型（单个接口或接口分组）
4. **数据获取**：调用Yapi API获取接口数据
5. **类型转换**：将接口数据转换为TypeScript类型定义
6. **数据缓存**：将转换后的TypeScript类型定义缓存到本地存储

### 5.2 复制操作流程

1. **触发复制**：用户通过右键菜单、页面按钮或弹出界面触发复制操作
2. **消息发送**：content.js向background.js发送`copyItem`消息，包含当前页面URL信息
3. **数据查找**：background.js根据URL查找缓存的TypeScript类型定义
4. **重新获取**：如果缓存中没有数据，自动重新获取接口数据
5. **执行复制**：调用复制函数将TypeScript类型定义复制到剪贴板
6. **结果反馈**：向content.js发送复制结果，显示成功/失败提示

## 6. 配置与部署

### 6.1 Chrome扩展安装

1. 打开Chrome浏览器，访问`chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"，选择项目文件夹
4. 扩展安装成功后，会在Chrome工具栏显示扩展图标

### 6.2 权限配置

扩展需要以下权限（在manifest.json中定义）：
- `contextMenus`：创建右键菜单项
- `activeTab`：访问当前活动标签页
- `scripting`：执行脚本
- `cookies`：访问Cookie
- `storage`：使用本地存储

### 6.3 支持的Yapi域名

默认配置中，扩展仅在以下域名生效：
- `*://yapi.pxb7.internal/*`

如需支持其他Yapi域名，需要修改manifest.json中的`host_permissions`配置。

## 7. 常见问题与解决方案

### 7.1 复制功能不工作

**问题描述**：点击复制按钮后，没有任何反应或提示

**可能原因**：
1. 当前页面URL不是有效的Yapi接口页面
2. 扩展没有正确获取接口数据
3. 消息通信出现问题

**解决方案**：
1. 确认页面URL格式正确（如：`https://yapi.xxx.com/api/123`）
2. 尝试刷新页面后再次点击
3. 查看浏览器控制台是否有错误信息

### 7.2 标签页切换后复制功能失效

**问题描述**：在多个Yapi标签页之间切换后，复制功能可能失效

**解决方案**：
扩展已实现URL自动检测和状态恢复机制，确保标签页切换后仍能正确处理复制请求。

## 8. 总结与展望

Yapi转Ts接口复制工具通过自动化的类型转换和便捷的复制功能，大大提高了前端开发对接API的效率。该工具采用Chrome扩展架构，具有良好的可扩展性和兼容性。

### 未来优化方向
1. 支持更多自定义配置选项
2. 增加类型转换的准确性和灵活性
3. 优化UI交互体验
4. 支持批量接口类型复制
5. 添加对更多API文档平台的支持

通过持续优化和更新，该工具将为前端开发团队提供更加强大和便捷的API类型转换解决方案。