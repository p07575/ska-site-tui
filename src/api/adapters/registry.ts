import type { BlogAdapter } from "./types";
import { BLOG_SOURCES, createAdapterFromConfig } from "./config";

const adapterMap = new Map<string, BlogAdapter>();

/** 获取指定 id 的 adapter，懒初始化 */
export function getAdapter(id: string): BlogAdapter {
  let adapter = adapterMap.get(id);
  if (!adapter) {
    const source = BLOG_SOURCES.find((s) => s.id === id);
    if (!source) throw new Error(`未知博客源: ${id}`);
    adapter = createAdapterFromConfig(source);
    adapterMap.set(id, adapter);
  }
  return adapter;
}

/** 获取所有博客源列表（id + name） */
export function getBlogSourceList(): { id: string; name: string }[] {
  return BLOG_SOURCES.map((s) => ({ id: s.id, name: s.name }));
}
