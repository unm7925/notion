import Detail from "src/routes/Detail"
import { filterPosts } from "src/libs/utils/notion"
import { CONFIG } from "site.config"
import { NextPageWithLayout } from "../types"
import CustomError from "src/routes/Error"
import { getRecordMap, getPosts } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import { GetStaticProps } from "next"
import { PostDetail } from "src/types"
import { queryClient } from "src/libs/react-query"
import { queryKey } from "src/constants/queryKey"
import { dehydrate } from "@tanstack/react-query"
import usePostQuery from "src/hooks/usePostQuery"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

export const getStaticPaths = async () => {
  const posts = await getPosts()
  const filteredPost = filterPosts(posts, filter)

  return {
    paths: filteredPost.map((row) => `/${row.slug}`),
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug as string

  const posts = await getPosts()
  const postDetail = posts.find((t: any) => t.slug === slug)

  if (!postDetail) {
    return { notFound: true }
  }

  // 노션이 429(rate limit)를 뱉으면 getRecordMap이 throw → 빌드 전체가 실패한다.
  // 페이지 하나의 일시적 실패로 배포를 죽이지 않도록, 실패 시 빌드에서 제외하고
  // 짧은 주기로 재생성(ISR)을 유도한다. 첫 방문 시 정상 생성되어 self-heal 된다.
  try {
    const recordMap = await getRecordMap(postDetail.id!)

    return {
      props: {
        post: { ...postDetail, recordMap },
      },
      revalidate: CONFIG.revalidateTime,
    }
  } catch (err) {
    return { notFound: true, revalidate: 5 }
  }
}

const DetailPage: NextPageWithLayout<{ post: PostDetail }> = ({ post }) => {

  if (!post) return <CustomError />

  const image =
    post.thumbnail ??
    CONFIG.ogImageGenerateURL ??
    `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(post.title)}.png`

  const date = post.date?.start_date || post.createdTime || ""

  const meta = {
    title: `${post.title} | ${CONFIG.profile.name}`,
    date: new Date(date).toISOString(),
    image: image,
    description: post.summary || "",
    type: post.type[0],
    url: `${CONFIG.link}/${post.slug}`,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Detail post={post} />
    </>
  )
}

DetailPage.getLayout = (page) => {
  return <>{page}</>
}

export default DetailPage
