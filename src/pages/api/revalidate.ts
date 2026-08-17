import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../apis"
import { queryClient } from "src/libs/react-query"
import { queryKey } from "src/constants/queryKey"

// for all path revalidate, https://<your-site.com>/api/revalidate?secret=<token>
// for specific path revalidate, https://<your-site.com>/api/revalidate?secret=<token>&path=<path>
// example, https://<your-site.com>/api/revalidate?secret=이것은_키&path=feed
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await queryClient.removeQueries(queryKey.posts())
  const { secret, path } = req.query
  if (secret !== process.env.TOKEN_FOR_REVALIDATE) {
    return res.status(401).json({ message: "Invalid token" })
  }

  try {
    if (path && typeof path === "string") {
      await res.revalidate(path)
      return res.json({ revalidated: true, paths: [path] })
    }

    const posts = await getPosts()
    // slug 없는 글은 `/undefined` 재생성 시도 → 404 → throw 하므로 걸러냄
    const targets = posts
      .filter((row) => !!row.slug)
      .map((row) => `/${row.slug}`)

    // 하나가 실패해도 나머지는 계속 진행 (Promise.all은 하나라도 실패 시 전체 실패)
    const results = await Promise.allSettled([
      ...targets.map((p) => res.revalidate(p)),
      res.revalidate("/"),
    ])

    const failed = results
      .map((r, i) => ({ r, path: i < targets.length ? targets[i] : "/" }))
      .filter(({ r }) => r.status === "rejected")
      .map(({ r, path }) => ({
        path,
        reason: (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason),
      }))

    if (failed.length > 0) {
      console.error("Revalidate failures:", failed)
      return res.status(500).json({
        revalidated: false,
        total: targets.length + 1,
        failedCount: failed.length,
        failed,
      })
    }

    return res.json({ revalidated: true, total: targets.length + 1 })
  } catch (err: any) {
    console.error("Revalidate error:", err)
    return res.status(500).json({
      revalidated: false,
      error: err?.message ?? String(err),
      stack: err?.stack,
    })
  }
}
