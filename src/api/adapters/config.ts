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
    name: "回到主站",
    type: "halo",
    config: {
      baseUrl: process.env.HALO_BASE_URL ?? "http://localhost:8090",
      auth: process.env.HALO_AUTH ?? "",
    },
  },
  {
    id: "none",
    name: "none",
    type: "halo",
    config: {
      baseUrl: "https://none-blog.top",
    },
  },
  {
    id: "rss-qaqbuyan",
    name: "qaq-buyan",
    type: "rss",
    config: {
      rssUrl: "https://qaqbuyan.com:88/%E4%B9%94%E5%AE%89%E6%96%87%E7%AB%A0/rss",
      fetchFullContent: "true",
    },
  },
  {
    id: "haoyn231",
    name: "haoyn231",
    type: "rss",
    config: {
      rssUrl: "https://haoyn231.github.io/rss.xml",
    },
  },
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
