import { DEFAULT_CATEGORY } from "src/constants"
import usePostsQuery from "./usePostsQuery"

export type TProjectTree = {
  [project: string]: {
    count: number
    categories: { [category: string]: number }
  }
}

export const useCategoriesQuery = (): TProjectTree => {
  const posts = usePostsQuery()

  const tree: TProjectTree = {
    [DEFAULT_CATEGORY]: { count: posts.length, categories: {} },
  }

  posts.forEach((post) => {
    const project = post.project || "기타"
    if (!tree[project]) {
      tree[project] = { count: 0, categories: {} }
    }
    tree[project].count++

    post.category?.forEach((cat) => {
      if (!tree[project].categories[cat]) {
        tree[project].categories[cat] = 0
      }
      tree[project].categories[cat]++
    })
  })

  return tree
}
