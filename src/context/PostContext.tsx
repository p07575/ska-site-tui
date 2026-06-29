/** @jsxImportSource @opentui/solid */
import { createContext, useContext, createSignal, type JSX } from "solid-js";
import type { ListedPostVo } from "../api/types";

interface PostContextValue {
  showPost: () => ListedPostVo | null;
  setShowPost: (post: ListedPostVo | null) => void;
}

const PostContext = createContext<PostContextValue>();

export function PostProvider(props: { children: JSX.Element }) {
  const [showPost, setShowPost] = createSignal<ListedPostVo | null>(null);

  return (
    <PostContext.Provider value={{ showPost, setShowPost }}>
      {props.children}
    </PostContext.Provider>
  );
}

export function usePostContext() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error("usePostContext must be used within a PostProvider");
  return ctx;
}
