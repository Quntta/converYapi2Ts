/**
 * 类型映射工具 - 将Java数据类型映射到JavaScript数据类型
 * 用于Yapi转TypeScript接口过程中的类型转换
 */
import { getLocalStorage, projectCacheKey, handleGetCacheData } from './utils.js';

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

/**
 * 根据JSON Schema获取对应的TypeScript类型
 * @param {Object} fieldSchema - 字段的JSON Schema
 * @returns {string} TypeScript类型字符串
 */
export function getTsTypeFromSchema(fieldSchema) {
  if (!fieldSchema || !fieldSchema.type) return 'any';

  // 处理引用类型
  if (fieldSchema.$ref) {
    // 简单处理，实际项目中可能需要更复杂的引用解析
    const refName = fieldSchema.$ref.split('/').pop();
    return refName;
  }

  // 处理基本类型，使用已有的类型映射
  if (fieldSchema.type) {
    // 先尝试直接映射
    if (javaToJsTypeMap[fieldSchema.type]) {
      return javaToJsTypeMap[fieldSchema.type];
    }

    // 对于数组类型
    if (fieldSchema.type === 'array') {
      if (fieldSchema.items) {
        const itemType = getTsTypeFromSchema(fieldSchema.items);
        return `Array<${itemType}>`;
      }
      return 'Array<any>';
    }

    // 对于对象类型
    if (fieldSchema.type === 'object') {
      if (fieldSchema.properties) {
        // 对于嵌套对象，可以生成内联类型或者返回Object
        return 'Object';
      }
      return 'Object';
    }
  }

  // 如果没有明确类型，尝试使用format属性推断
  if (fieldSchema.format === 'date-time' || fieldSchema.format === 'date') {
    return 'Date';
  }

  // 默认返回any
  return 'any';
}

/**
 * 生成属性的TypeScript接口代码
 * @param {Object} properties - 属性对象
 * @param {string} indent - 缩进字符串
 * @param {Array<string>} requiredFields - 必填字段数组
 * @param {Function} customRequiredCheck - 自定义必填字段检查函数
 * @returns {string} 生成的接口代码
 */
function generatePropertiesCode(properties, indent = '  ', requiredFields = [], customRequiredCheck = null) {
  let code = '';

  if (!properties) return code;

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const tsType = getTsTypeFromSchema(fieldSchema);
    const description = fieldSchema.description ? ` // ${fieldSchema.description}` : '';

    // 确定字段是否为必填
    let isRequired = false;
    if (customRequiredCheck) {
      isRequired = customRequiredCheck(fieldName, fieldSchema);
    } else if (requiredFields.length > 0) {
      isRequired = requiredFields.includes(fieldName);
    }

    code += `${indent}${fieldName}${isRequired ? '' : '?'}: ${tsType};${description}\n`;
  }

  return code;
}

/**
 * 从JSON Schema生成TypeScript接口
 * @param {string} interfaceName - 接口名称
 * @param {Object} schema - JSON Schema对象
 * @param {string} originalSchema - 原始JSON Schema字符串（用于fallback）
 * @returns {string} 格式化的TypeScript接口字符串
 */
export function generateInterfaceFromSchema(interfaceName, data) {
  // 解析请求体JSON Schema生成DTO
  let schema = null;
  if (data.req_body_is_json_schema && data.req_body_other) {
    try {
      schema = JSON.parse(data.req_body_other);
    } catch (error) {
      console.error('解析请求体JSON Schema失败:', error);
    }
    if (!schema || !schema.properties) {
      // 如果没有Schema，返回一个空接口
      return `export interface ${interfaceName} {\n  // 无法解析JSON Schema\n}`;
    }

    let interfaceContent = `export interface ${interfaceName} {\n`;
    const requiredFields = schema.required || [];

    // 使用通用函数生成属性代码
    interfaceContent += generatePropertiesCode(schema.properties, '  ', requiredFields);

    interfaceContent += '}';
    return interfaceContent;
  }
  if (!data.req_body_is_json_schema && data.req_query && data.req_query.length) {
    let interfaceContent = `export interface ${interfaceName} {\n`;
    data.req_query.forEach(item => {
      interfaceContent += `  ${item.name}${item.required ? '' : '?'}: ${getTsTypeFromSchema(item)};\n`;
    });
    interfaceContent += '}';
    return interfaceContent;
  }
  return `export interface ${interfaceName} {\n  // 无参数\n}`;
}

/**
 * 处理data.list.items结构的响应体
 * @param {Object} dataSchema - data属性的Schema
 * @returns {string} 生成的接口内容
 */
function handleListItemsResponse(dataSchema) {
  let interfaceContent = '';

  if (dataSchema.list && dataSchema.list.type === 'array' && dataSchema.list.items) {
    if (dataSchema.list.items.properties) {
      const itemProperties = dataSchema.list.items.properties;

      // 使用通用函数，自定义必填字段检查（只有id是必填）
      interfaceContent += generatePropertiesCode(itemProperties, '  ', [], (fieldName) => fieldName === 'id');
    } else if (dataSchema.list.items.type) {
      // 处理items是基本类型的情况
      const itemType = getTsTypeFromSchema(dataSchema.list.items);
      interfaceContent += `  // data.list是${itemType}类型的数组\n`;
      interfaceContent += `  items?: Array<${itemType}>;\n`;
    }
  } else {
    interfaceContent += '  // 无法从响应体中提取列表项结构\n';
  }

  return interfaceContent;
}

/**
 * 处理data本身是对象的响应体
 * @param {Object} dataSchema - data属性的Schema
 * @returns {string} 生成的接口内容
 */
function handleObjectResponse(dataSchema) {
  let interfaceContent = '';

  if (dataSchema.properties) {
    // 使用通用函数生成属性代码
    interfaceContent += generatePropertiesCode(dataSchema.properties, '  ');
  } else {
    interfaceContent += '  // 无法解析data对象结构\n';
  }

  return interfaceContent;
}

/**
 * 处理data本身是基础类型的响应体
 * @param {Object} dataSchema - data属性的Schema
 * @returns {string} 生成的接口内容
 */
function handlePrimitiveResponse(dataSchema) {
  const tsType = getTsTypeFromSchema(dataSchema);
  return `  // data是${tsType}类型\n  data?: ${tsType};\n`;
}

/**
 * 处理data本身是嵌套对象的响应体，生成多个接口
 * @param {Object} dataSchema - data属性的Schema
 * @returns {Object} 包含主接口内容和额外接口的对象
 */
function handleNestedObjectResponse(dataSchema) {
  let mainInterfaceContent = '';
  let extraInterfaces = '';

  if (dataSchema.properties) {
    // 遍历data对象的所有属性
    for (const [fieldName, fieldSchema] of Object.entries(dataSchema.properties)) {
      if (fieldSchema.type === 'object' && fieldSchema.properties) {
        // 为嵌套对象生成单独的接口
        const nestedInterfaceName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        let nestedInterfaceContent = `export interface ${nestedInterfaceName} {\n`;

        // 使用通用函数生成嵌套对象的属性代码
        nestedInterfaceContent += generatePropertiesCode(fieldSchema.properties, '  ');

        nestedInterfaceContent += '}\n\n';
        extraInterfaces += nestedInterfaceContent;

        // 在主接口中引用嵌套接口
        mainInterfaceContent += `  ${fieldName}?: ${nestedInterfaceName};\n`;
      } else {
        const tsType = getTsTypeFromSchema(fieldSchema);
        const description = fieldSchema.description ? ` // ${fieldSchema.description}` : '';
        mainInterfaceContent += `  ${fieldName}?: ${tsType};${description}\n`;
      }
    }
  }

  return { mainInterfaceContent, extraInterfaces };
}

/**
 * 处理data本身是数组的响应体
 * @param {Object} dataSchema - data属性的Schema
 * @returns {string} 生成的接口内容
 */
function handleArrayResponse(dataSchema) {
  let interfaceContent = '';

  if (dataSchema.items) {
    if (dataSchema.items.properties) {
      // 数组中的元素是对象
      interfaceContent += '  // data是对象数组\n';
      interfaceContent += '  items?: Array<{\n';

      // 使用通用函数，增加缩进级别
      interfaceContent += generatePropertiesCode(dataSchema.items.properties, '    ');

      interfaceContent += '  }>;\n';
    } else {
      // 数组中的元素是基本类型
      const itemType = getTsTypeFromSchema(dataSchema.items);
      interfaceContent += `  // data是${itemType}类型的数组\n`;
      interfaceContent += `  items?: Array<${itemType}>;\n`;
    }
  } else {
    interfaceContent += '  // 无法解析data数组结构\n';
  }

  return interfaceContent;
}

// export interface TestData {
//   gameId: string
//   channelSource: string
//   account: number
//   list: {
//     gameAccount: string
//     gamePassword: string
//     gameArea: string
//     gameServer: string
//     info: {
//       level: number
//       vip: number
//     }
//     attrs: { key: string; value: string }[]
//   }[]
//   extraField?: string
//   extraData?: {
//     id: number
//     info: string
//     list: { key: string }[]
//   }
// }

// 将JSON Schema转换为TypeScript接口
export function generaterInterface(interfaceName, schema, interfaceContent = '') {
  // type 为object或array时，需要递归处理， 否则直接转类型即可，array更为特殊，array中子项的schema在items字段下 interfaceContent 为当前接口的内容，在递归时需要传递
  interfaceContent = !interfaceContent ? `export interface ${interfaceName} {\n` : interfaceContent
  if (schema.type === 'object' || schema.type === 'array') {
    // 递归处理
  }
}

/**
 * 从响应体JSON Schema生成VO TypeScript接口
 * @param {Object} schema - 响应体JSON Schema对象
 * @returns {string} 格式化的TypeScript接口字符串
 */
export function generateVOInterfaceFromSchema(interfaceName, data) {
  // 解析响应体JSON Schema生成VO
  let schema = null;
  if (data.res_body_is_json_schema && data.res_body) {
    try {
      schema = JSON.parse(data.res_body);
    } catch (error) {
      schema.error('解析响应体JSON Schema失败:', error);
    }
  }
  if (!schema) {
    return `export interface ${interfaceName} {\n  // 无法解析响应体结构\n}`;
  }
  console.log('res--------------------------schema', schema)
  // 默认返回空VO接口
  let interfaceContent = `export interface ${interfaceName} {\n`;
  let extraInterfaces = '';

  try {
    // 尝试从响应体中提取data结构
    if (schema && schema.properties && schema.properties.data) {
      const dataSchema = schema.properties.data;

      // 场景1: { data: {list: [{}], total: 100} } - 解析list中的对象
      if (dataSchema.properties && dataSchema.properties.list && dataSchema.properties.list.type === 'array') {
        interfaceContent += handleListItemsResponse(dataSchema.properties);
      }
      // 场景2: { xx: xx, yy: yy } - data本身是一个对象
      else if (dataSchema.type === 'object' && Object.keys(dataSchema.properties).length > 0) {
        // 检查是否是场景4: data是嵌套对象
        const hasNestedObjects = Object.entries(dataSchema.properties).some(
          ([_, fieldSchema]) => fieldSchema.type === 'object' && fieldSchema.properties
        );

        if (hasNestedObjects) {
          const { mainInterfaceContent, nestedInterfaces } = handleNestedObjectResponse(dataSchema);
          interfaceContent += mainInterfaceContent;
          extraInterfaces = nestedInterfaces;
        } else {
          interfaceContent += handleObjectResponse(dataSchema);
        }
      }
      // 场景4: data本身是一个数组
      else if (dataSchema.type === 'array') {
        // data本身是数组，只处理数组中的对象就行，不需要给VO的定义中添加array之类的
        interfaceContent += handleObjectResponse(dataSchema.items);
      }
      // 场景5: data: 123 - data本身是一个基础类型
      else if (dataSchema.type && !dataSchema.properties) {
        interfaceContent += handlePrimitiveResponse(dataSchema);
      }
      // 其他情况
      else {
        interfaceContent += '  // 无法识别的data结构类型\n';
      }
    } else {
      interfaceContent += '  // 无法解析响应体结构\n';
    }
  } catch (error) {
    console.error('生成VO接口失败:', error);
    interfaceContent += '  // 生成VO接口时发生错误\n';
  }

  interfaceContent += '}';

  // 如果有额外的接口，将它们添加到主接口之前
  if (extraInterfaces) {
    return extraInterfaces + interfaceContent;
  }

  return interfaceContent;
}

/**
 * 从接口文档生成TypeScript类型定义（DTO和VO）
 * @param {Object} apiData - 接口文档数据
 * @returns {Object} 包含URL、方法、ID以及格式化的TypeScript类型定义
 */
export async function generateTypeScriptTypes(apiData) {
  try {
    // 提取基本信息
    const { data } = apiData;
    const projectData = await handleGetCacheData(projectCacheKey, 'id', data.project_id)
    const basepath = projectData.basepath || ''
    const url = basepath + data.path
    const method = data.method;
    const id = data._id;
    const catid = data.catid;
    const title = data.title;
    const projectid = data.project_id;

    // 生成DTO TypeScript接口
    const dtoInterface = generateInterfaceFromSchema('DTO', data);

    // 生成VO TypeScript接口
    const voInterface = generateVOInterfaceFromSchema('VO', data);

    return {
      url,
      method,
      id,
      catid,
      projectid,
      title,
      DTO: dtoInterface,
      VO: voInterface
    };
  } catch (error) {
    console.error('生成TypeScript类型定义失败:', error);
    throw error;
  }
};
