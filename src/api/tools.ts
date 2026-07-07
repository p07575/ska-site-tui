import { tool } from "ai";
import { z } from "zod";
import { getAdapter } from "./adapters";
import type { ListedPostVoList } from "./types";

// ── 工具定义 ────────────────────────────────────────────────────────

/**
 * 查询文章列表工具（无参数，直接返回全部文章）
 */
export const queryPostsTool = tool({
  description:
    "Query the full list of articles on the ska blog. Use this when the user wants to browse the article list or see the latest posts. Each result includes the article's name (UUID) and title; to read a specific article's full content, call the queryPostByName tool with the corresponding name.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const adapter = getAdapter("master");
      const result = await adapter.queryPosts({
        page: 1,
        size: 1000,
      });
      return {
        success: true,
        data: {
          total: result.total,
          items: result.items.map((item) => ({
            name: item.metadata.name,
            title: item.spec.title,
            publishTime: item.spec.publishTime,
            author: item.owner?.displayName ?? "Unknown author",
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to query the post list",
      };
    }
  },
});

// /**
//  * 按标题搜索文章工具
//  * AI 不知道文章的 metadata.name（UUID），需要先通过标题搜索获取
//  */
// export const searchPostByTitleTool = tool({
//   description:
//     "按标题关键词搜索文章，返回匹配的文章列表（包含 name 和 title）。当用户提到某篇文章的标题时，必须先用此工具搜索获取文章的 name（UUID），然后再用 queryPostByName 查询详情。",
//   inputSchema: z.object({
//     keyword: z.string().describe("文章标题的关键词或完整标题"),
//     page: z.number().optional().default(1).describe("页码，从1开始"),
//     size: z.number().optional().default(20).describe("每页数量，默认20条"),
//   }),
//   execute: async (params) => {
//     try {
//       // 获取多页文章进行标题匹配
//       const result: ListedPostVoList = await queryPosts({
//         page: params.page,
//         size: params.size,
//         sort: ["metadata.creationTimestamp,desc"],
//       });

//       const keyword = params.keyword.toLowerCase();
//       const matched = result.items.filter((item) =>
//         item.spec.title.toLowerCase().includes(keyword)
//       );

//       if (matched.length === 0 && result.totalPages > params.page) {
//         // 当前页没找到，尝试下一页
//         const nextResult = await queryPosts({
//           page: params.page + 1,
//           size: params.size,
//           sort: ["metadata.creationTimestamp,desc"],
//         });
//         const nextMatched = nextResult.items.filter((item) =>
//           item.spec.title.toLowerCase().includes(keyword)
//         );
//         matched.push(...nextMatched);
//       }

//       return {
//         success: true,
//         data: {
//           total: matched.length,
//           items: matched.map((item) => ({
//             name: item.metadata.name,
//             title: item.spec.title,
//             publishTime: item.spec.publishTime,
//             author: item.owner?.displayName ?? "未知作者",
//           })),
//           hint: matched.length > 0
//             ? "请使用返回结果中的 name 字段调用 queryPostByName 获取文章详情"
//             : "未找到匹配的文章，请尝试不同的关键词",
//         },
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "搜索文章失败",
//       };
//     }
//   },
// });

/**
 * 查询文章详情工具
 */
export const queryPostByNameTool = tool({
  description:
    "Query the full information of a single article by its metadata.name (a UUID, e.g. 019edc19-47fe-713a-a9f9-c85f4c5581f2). Note: this parameter is the article's name (UUID), NOT its title! First call queryPosts to get the article list, find the matching name there, then call this tool.",
  inputSchema: z.object({
    name: z.string().describe("The article's metadata.name; must be a UUID such as 019edc19-47fe-713a-a9f9-c85f4c5581f2, definitely not the article title"),
  }),
  execute: async (params) => {
    try {
      const adapter = getAdapter("master");
      const post = await adapter.queryPostByName(params.name);
      return {
        success: true,
        data: {
          name: post.metadata.name,
          title: post.spec?.title,
          slug: post.spec?.slug,
          publishTime: post.spec?.publishTime,
          visible: post.spec?.visible,
          excerpt: post.content?.raw
            ? post.content.raw.substring(0, 500) + (post.content.raw.length > 500 ? "..." : "")
            : "No excerpt",
          content: post.content?.content ?? post.content?.raw ?? "No content",
          author: post.owner?.displayName ?? "Unknown author",
          categories: post.categories?.map((c) => c.spec?.displayName ?? c.metadata.name) ?? [],
          tags: post.tags?.map((t) => t.spec?.displayName ?? t.metadata.name) ?? [],
          stats: post.stats
            ? {
                visits: post.stats.visit ?? 0,
                comments: post.stats.comment ?? 0,
                upvotes: post.stats.upvote ?? 0,
              }
            : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to query post detail",
      };
    }
  },
});

/**
 * 所有工具的集合
 */
export const blogTools = {
  queryPosts: queryPostsTool,
  // searchPostByTitle: searchPostByTitleTool,
  queryPostByName: queryPostByNameTool,
};
