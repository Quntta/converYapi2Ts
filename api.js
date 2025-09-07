/**
 * API请求工具 - 封装fetch请求
 * 提供get和post方法用于网络请求
 */

/**
 * 基础请求配置
 */
const BASE_CONFIG = {
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * 处理响应数据
 * @param {Response} response - fetch响应对象
 * @returns {Promise<any>} 解析后的数据
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP错误! 状态码: ${response.status}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    // 如果不是JSON格式，返回响应文本
    return await response.text();
  }
};

/**
 * GET请求方法
 * @param {string} url - 请求URL
 * @param {Object} params - 查询参数
 * @param {Object} config - 自定义配置
 * @returns {Promise<any>} 请求结果
 */
export const get = async (url, params = {}, config = {}) => {
  // 构建带查询参数的URL
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      ...BASE_CONFIG,
      ...config,
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('GET请求失败:', error);
    throw error;
  }
};

/**
 * POST请求方法
 * @param {string} url - 请求URL
 * @param {Object} data - 请求体数据
 * @param {Object} config - 自定义配置
 * @returns {Promise<any>} 请求结果
 */
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...BASE_CONFIG,
      ...config,
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('POST请求失败:', error);
    throw error;
  }
};