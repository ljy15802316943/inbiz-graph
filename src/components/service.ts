import request from '@/utils/request';

// 获取主题色
export async function globalConfig(params: any) {
  return request(`/inwise/api/service/globalConfig`, {
    method: 'GET',
    params,
  });
}

// 获取图谱
export async function graph2(params: any) {
  return request(`/inwise/graph2.jsp`, {
    method: 'GET',
    params,
  });
}

// 获取列表
export async function filesSearch(params: any) {
  return request(`/inwise/files_search.jsp`, {
    method: 'GET',
    params,
  });
}
