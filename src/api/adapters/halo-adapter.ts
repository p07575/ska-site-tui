import ky from "ky";
import type * as types from "../types";
import type { BlogAdapter, QueryPostsParams } from "./types";

export interface HaloAdapterConfig {
  baseUrl: string;
  auth?: string;
}

export function createHaloAdapter(id: string, name: string, config: HaloAdapterConfig): BlogAdapter {
  const halo = ky.create({
    baseUrl: config.baseUrl,
    headers: config.auth ? { Authorization: config.auth } : {},
  });

  return {
    id,
    name,
    type: "halo",
    async queryPosts(params: QueryPostsParams = {}): Promise<types.ListedPostVoList> {
      const response = await halo
        .get("apis/api.content.halo.run/v1alpha1/posts", {
          searchParams: params as any,
        })
        .json<types.ListedPostVoList>();
      return response;
    },
    async queryPostByName(name: string): Promise<types.PostVo> {
      const response = await halo
        .get(`apis/api.content.halo.run/v1alpha1/posts/${name}`)
        .json<types.PostVo>();
      return response;
    },
  };
}
