/**
 * 类型映射工具 - 将Java数据类型映射到JavaScript数据类型
 * 用于Yapi转TypeScript接口过程中的类型转换
 */

/**
 * Java类型到JavaScript类型的映射表
 * @type {Object<string, string>}
 */
export const javaToJsTypeMap = {
  // 基本数据类型
  'integer': 'number',
  'int': 'number',
  'long': 'number',
  'double': 'number',
  'float': 'number',
  'boolean': 'boolean',
  'string': 'string',
  'char': 'string',
  'byte': 'number',
  'short': 'number',
  'BigDecimal': 'number',
  'BigInteger': 'number',
  
  // 日期时间类型
  'Date': 'Date',
  'LocalDate': 'Date',
  'LocalDateTime': 'Date',
  'Timestamp': 'Date',
  'Time': 'Date',
  'Calendar': 'Date',
  
  // 集合类型
  'List': 'Array',
  'ArrayList': 'Array',
  'LinkedList': 'Array',
  'Set': 'Array',
  'HashSet': 'Array',
  'TreeSet': 'Array',
  'Collection': 'Array',
  'Map': 'Object',
  'HashMap': 'Object',
  'LinkedHashMap': 'Object',
  'TreeMap': 'Object',
  'ConcurrentHashMap': 'Object',
  
  // 其他常用类型
  'Object': 'Object',
  'StringBuilder': 'string',
  'StringBuffer': 'string',
  'Iterator': 'Array',
  'Enumeration': 'Array',
  'Optional': 'any',
  'void': 'void',
  'null': 'null',
  'undefined': 'undefined',
  
  // 原始类型数组
  'int[]': 'Array<number>',
  'long[]': 'Array<number>',
  'double[]': 'Array<number>',
  'float[]': 'Array<number>',
  'boolean[]': 'Array<boolean>',
  'string[]': 'Array<string>',
  'char[]': 'Array<string>',
  'byte[]': 'Array<number>',
  'short[]': 'Array<number>',
};

/**
 * 将Java类型转换为JavaScript类型
 * @param {string} javaType - Java类型名称
 * @returns {string} 对应的JavaScript类型名称
 */
export const convertJavaToJsType = (javaType) => {
  if (!javaType || typeof javaType !== 'string') {
    return 'any';
  }
  
  // 移除可能的包路径前缀
  const simpleTypeName = javaType.includes('.') 
    ? javaType.substring(javaType.lastIndexOf('.') + 1)
    : javaType;
  
  // 转换为小写进行不区分大小写的匹配
  const typeKey = simpleTypeName.toLowerCase();
  
  // 检查是否是泛型集合类型（如List<User>）
  const genericMatch = simpleTypeName.match(/^([A-Za-z]+)<([^>]+)>$/);
  if (genericMatch) {
    const [, collectionType, itemType] = genericMatch;
    const jsCollectionType = javaToJsTypeMap[collectionType.toLowerCase()] || 'Array';
    
    if (jsCollectionType === 'Array') {
      // 递归转换泛型参数类型
      const jsItemType = convertJavaToJsType(itemType);
      return `Array<${jsItemType}>`;
    }
    
    return jsCollectionType;
  }
  
  // 检查是否是数组类型（如User[]）
  const arrayMatch = simpleTypeName.match(/^([^\[\]]+)\[\]$/);
  if (arrayMatch) {
    const [, itemType] = arrayMatch;
    const jsItemType = convertJavaToJsType(itemType);
    return `Array<${jsItemType}>`;
  }
  
  // 返回映射的JavaScript类型，如果没有匹配则返回'any'
  return javaToJsTypeMap[typeKey] || 'any';
};