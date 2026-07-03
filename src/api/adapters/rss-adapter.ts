import ky from "ky";
import type * as types from "../types";
import type { BlogAdapter, QueryPostsParams } from "./types";

export interface RssAdapterConfig {
  rssUrl: string;
  /** 若为 true，抓取每篇文章的 HTML 页面获取全文；否则使用 description 作为 content */
  fetchFullContent?: boolean;
  /** 从 HTML 页面中提取正文的 CSS 选择器表达式（默认提取 <article>） */
  articleSelector?: string;
}

// ── RSS 解析工具 ──

function unescapeCdata(raw: string | undefined): string {
  return (raw ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function extractItems(xml: string): string[] {
  const items: string[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    items.push(m[1] ?? "");
  }
  return items;
}

function getTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(block);
  return m ? unescapeCdata(m[1] ?? "") : "";
}

function getTagRaw(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(block);
  return m ? unescapeCdata(m[1] ?? "") : "";
}

function getTags(block: string, tag: string): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    results.push(unescapeCdata(m[1] ?? ""));
  }
  return results;
}

/** 解码 XML/HTML 实体 */
function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function extractCoverFromHtml(html: string): string | undefined {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m?.[1];
}

/** 从 guid 中提取数字编号作为 name，回退为完整 guid */
function extractName(guid: string, link: string): string {
  const numMatch = guid.match(/\/(\d+)\.html$/);
  if (numMatch) return numMatch[1] ?? "";
  // 用 link 的路径部分作为 name
  try {
    const url = new URL(link);
    return url.pathname.replace(/\//g, "_").replace(/^_/, "") || guid.replace(/\//g, "_");
  } catch {
    return guid.replace(/\//g, "_");
  }
}

// ── 缓存 ──

const rssCache = new Map<string, types.PostVo[]>();
const articleHtmlCache = new Map<string, string>();

async function fetchArticleHtml(url: string, selector?: string): Promise<string> {
  const cached = articleHtmlCache.get(url);
  if (cached) return cached;

  const html: string = await ky.get(url).text();
  let content = html;

  if (selector) {
    const re = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, "i");
    const m = re.exec(html);
    if (m) content = m[1] ?? "";
  } else {
    // 默认尝试 <article>
    const articleMatch = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html);
    if (articleMatch) content = articleMatch[1] ?? "";
    else {
      const divMatch = /<div[^>]+id="article-content"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      if (divMatch) content = divMatch[1] ?? "";
    }
  }

  articleHtmlCache.set(url, content);
  return content;
}

export function createRssAdapter(id: string, name: string, config: RssAdapterConfig): BlogAdapter {
  return {
    id,
    name,
    type: "rss",
    async queryPosts(params: QueryPostsParams = {}): Promise<types.ListedPostVoList> {
      let posts = rssCache.get(id);
      if (!posts) {
        let xml: string;
        try {
          xml = await ky.get(config.rssUrl).text();
        } catch (e) {
          console.error(`RSS 拉取失败 (${name}):`, e);
          return { first: true, hasNext: false, hasPrevious: false, items: [], last: true, page: 1, size: 10, total: 0, totalPages: 0 };
        }
        const rawItems = extractItems(xml);

        posts = rawItems.map((block) => {
          const title = getTag(block, "title");
          const link = getTag(block, "link");
          const guid = getTag(block, "guid");
          const pubDate = getTag(block, "pubDate");
          const author = getTag(block, "author") || name;
          const description = getTagRaw(block, "description");
          const categories = getTags(block, "category");
          // haoyn231 使用 content:encoded
          const contentEncoded = getTagRaw(block, "content:encoded");

          const postName = extractName(guid || link, link);
          const cover = extractCoverFromHtml(description) ?? undefined;

          const contentRaw = decodeEntities(contentEncoded) || description;

          const post: types.PostVo = {
            metadata: {
              name: postName,
              creationTimestamp: pubDate ? new Date(pubDate).toISOString() : undefined,
            },
            spec: {
              title,
              slug: postName,
              cover: cover ?? undefined,
              deleted: false,
              publish: true,
              publishTime: pubDate ? new Date(pubDate).toISOString() : undefined,
              pinned: false,
              allowComment: true,
              visible: "PUBLIC",
              priority: 0,
              excerpt: { autoGenerate: false, raw: description },
              categories,
            },
            status: {
              phase: "PUBLISHED",
              permalink: link,
              commentsCount: 0,
              excerpt: description,
            },
            content: {
              raw: contentRaw,
              content: contentRaw,
            },
            owner: {
              metadata: { name: author },
              displayName: author,
            },
            categories: categories.map((cat) => ({
              metadata: { name: cat },
              spec: {
                displayName: cat,
                slug: cat,
                priority: 0,
                hidden: false,
                hideFromList: false,
              },
            })),
          };

          return post;
        });

        rssCache.set(id, posts);
      }

      const page = params.page ?? 1;
      const size = params.size ?? posts.length;
      const total = posts.length;
      const totalPages = Math.ceil(total / size);
      const start = (page - 1) * size;
      const items = posts.slice(start, start + size);

      return {
        first: page === 1,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        items: items.map((post) => ({
          metadata: {
            name: post.metadata.name,
            creationTimestamp: post.metadata.creationTimestamp,
          },
          spec: {
            title: post.spec?.title ?? "",
            publishTime: post.spec?.publishTime,
          },
          owner: post.owner
            ? { displayName: post.owner.displayName, name: post.owner.name }
            : null,
        })),
        last: page === totalPages,
        page,
        size,
        total,
        totalPages,
      };
    },
    async queryPostByName(name: string): Promise<types.PostVo> {
      const posts = (() => {
        const cached = rssCache.get(id);
        if (cached) return cached;
        // 需要先加载
        return null;
      })();

      if (!posts) {
        // 触发加载
        await this.queryPosts({ page: 1, size: 1 });
        return this.queryPostByName(name);
      }

      const post = posts.find((p) => p.metadata.name === name);
      if (!post) throw new Error(`文章不存在: ${name}`);

      const link = post.status?.permalink;
      if (link) {
        if (config.fetchFullContent) {
          const fullHtml = await fetchArticleHtml(link, config.articleSelector);
          post.content = { raw: fullHtml, content: fullHtml };
        }
        // 不需要 fetchFullContent 的情况（如 haoyn231），content 已在 RSS 中填充
      }

      return post;
    },
  };
}
