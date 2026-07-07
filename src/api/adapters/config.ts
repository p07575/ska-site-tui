import type { BlogAdapter } from "./types";
import { createHaloAdapter } from "./halo-adapter";
import { createRssAdapter } from "./rss-adapter";

export interface BlogSourceConfig {
  id: string;
  name: string;
  type: "halo" | "rss";
  config: Record<string, string>;
}

/** 所有支持的博客源配置 */
export const BLOG_SOURCES: BlogSourceConfig[] = [
  {
    id: "master",
    name: "Jx Blog",
    type: "halo",
    config: {
      baseUrl: process.env.HALO_BASE_URL ?? "http://localhost:8090",
      auth: process.env.HALO_AUTH ?? "",
    },
  },
  // Add more sources here (halo or rss) to populate the sidebar's "Links".
];

/** 根据配置创建 adapter 实例 */
export function createAdapterFromConfig(source: BlogSourceConfig): BlogAdapter {
  if (source.type === "halo") {
    return createHaloAdapter(source.id, source.name, {
      baseUrl: source.config.baseUrl ?? "",
      auth: source.config.auth,
    });
  }
  return createRssAdapter(source.id, source.name, {
    rssUrl: source.config.rssUrl ?? "",
    fetchFullContent: source.config.fetchFullContent === "true",
    articleSelector: source.config.articleSelector,
  });
}
