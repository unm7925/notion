import PostCard from "src/routes/Feed/PostList/PostCard"
import React, { useMemo } from "react"
import usePostsQuery from "src/hooks/usePostsQuery"
import { useRouter } from "next/router"
import { filterPosts } from "./filterPosts"
import { DEFAULT_CATEGORY } from "src/constants"

type Props = {
  q: string
}

const PostList: React.FC<Props> = ({ q }) => {
  const router = useRouter()
  const data = usePostsQuery()

  const currentTag = `${router.query.tag || ``}` || undefined
  const currentProject = `${router.query.project || ``}` || undefined
  const currentCategory = `${router.query.category || ``}` || DEFAULT_CATEGORY
  const currentOrder = `${router.query.order || ``}` || "desc"

  const filteredPosts = useMemo(() => {
    return filterPosts({
      posts: data,
      q,
      tag: currentTag,
      project: currentProject,
      category: currentCategory,
      order: currentOrder,
    })
  }, [data, q, currentTag, currentProject, currentCategory, currentOrder])

  return (
    <>
      <div className="my-2">
        {!filteredPosts.length && (
          <p className="text-gray-500 dark:text-gray-300">Nothing! 😺</p>
        )}
        {filteredPosts.map((post) => (
          <PostCard key={post.id} data={post} showMedia={true} />
        ))}
      </div>
    </>
  )
}

export default PostList
