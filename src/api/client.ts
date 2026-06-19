import ky from "ky";
import * as typeHalo from "./types";
const HALO_BASE_URL = process.env.HALO_BASE_URL ?? "http://localhost:8090";
const HALO_AUTH = process.env.HALO_AUTH;

const halo = ky.create({
  baseUrl: HALO_BASE_URL,
  headers: {
    Authorization: HALO_AUTH, 
  },
});



/**
 * 查询文章列表方法
 */
export async function queryPosts(params: typeHalo.QueryPostsParams = {}): Promise<typeHalo.ListedPostVoList> {
  try {
    // 接口路径直接粘贴自 OpenAPI 的 paths
    const response = await halo.get("apis/api.content.halo.run/v1alpha1/posts", {
      // ky 会自动把对象序列化为 ?page=1&size=10 的 Query 字符串
      searchParams: params as any, 
    }).json<typeHalo.ListedPostVoList>();
    
    return response;
  } catch (error) {
    console.error("获取文章列表失败:", error);
    throw error;
  }
}

/**
 * 根据文章 name 查询单篇文章详情
 * @param name - 文章的 metadata.name
 */
export async function queryPostByName(name: string): Promise<typeHalo.PostVo> {
  try {
    const response = await halo
      .get(`apis/api.content.halo.run/v1alpha1/posts/${name}`)
      .json<typeHalo.PostVo>();
    return response;
  } catch (error) {
    console.error(`获取文章详情失败 (name: ${name}):`, error);
    throw error;
  }
}