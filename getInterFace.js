import { get } from "./request.js";

export const getProjectBaseApi = async (id, baseUrl) => {
  return get(`${baseUrl}/api/project/get`, { id });
}

export const getSingleInterfaceApi = async (id, baseUrl) => {
  return get(`${baseUrl}/api/interface/get`, { id });
}

export const getGroupInterfaceApi = async (data, baseUrl) => {
  return get(`${baseUrl}/api/interface/list_cat`, {
    page: data.page || 1,
    limit: data.limit || 20,
    catid: data.catid,
  });
}
