import type { ListedPostVoList, PostVo } from "../types";

export interface QueryPostsParams {
  page?: number;
  size?: number;
}

export interface BlogAdapter {
  id: string;
  name: string;
  type: "halo" | "rss";
  queryPosts(params?: QueryPostsParams): Promise<ListedPostVoList>;
  queryPostByName(name: string): Promise<PostVo>;
}
