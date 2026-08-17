import { CONFIG } from "site.config"
import { idToUuid } from "notion-utils"
import { createNotionClient } from "./createNotionClient"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

const fetchPosts = async (): Promise<TPosts> => {
  let id = CONFIG.notionConfig.pageId as string
  const api = createNotionClient()

  const response = await api.getPage(id)
  id = idToUuid(id)
  const block = response.block
  const blockData = (block[id] as any)
  const rawMetadata = blockData?.value?.value ?? blockData?.value

  // Check Type
  if (
    rawMetadata?.type !== "collection_view_page" &&
    rawMetadata?.type !== "collection_view" &&
    rawMetadata?.type !== "page"
  ) {
    return []
  }

  // response.block에서 누락된 collection_view를 찾아 수동 로드
  const loadedCollectionIds = new Set(Object.keys(response.collection_query))
  for (const [, blockRaw] of Object.entries(response.block)) {
    const blockVal = (blockRaw as any)?.value?.value ?? (blockRaw as any)?.value
    if (blockVal?.type !== "collection_view") continue
    const collectionId: string = blockVal?.collection_id
    const viewId: string = blockVal?.view_ids?.[0]
    if (!collectionId || !viewId || loadedCollectionIds.has(collectionId)) continue
    loadedCollectionIds.add(collectionId)

    const collectionData = await api.getCollectionData(collectionId, viewId)

    if (collectionData.recordMap.collection) {
      Object.entries(collectionData.recordMap.collection).forEach(([cid, cRaw]: any) => {
        response.collection[cid] = cRaw
      })
    }
    if (!response.collection_query[collectionId]) {
      response.collection_query[collectionId] = {}
    }
    response.collection_query[collectionId][viewId] = collectionData.result
  }

  // 페이지 내 모든 컬렉션에서 schema, 이름 수집
  const schemaMap = new Map<string, any>()
  const collectionNameMap = new Map<string, string>()
  Object.entries(response.collection).forEach(([collectionId, collectionRaw]: [string, any]) => {
    const collection = collectionRaw?.value?.value ?? collectionRaw?.value
    if (collection?.schema) schemaMap.set(collectionId, collection.schema)
    if (collection?.name) {
      collectionNameMap.set(collectionId, collection.name?.[0]?.[0] ?? "")
    }
  })

  // 모든 표에서 pageId 수집
  const pageIds = getAllPageIds(response)
  if (pageIds.length === 0) return []

  const wholeBlocks = await (await api.getBlocks(pageIds)).recordMap.block

  // 각 페이지가 어느 컬렉션 소속인지 역매핑
  const pageToSchema = new Map<string, any>()
  const pageToProject = new Map<string, string>()
  Object.entries(response.collection_query).forEach(([collectionId, views]: [string, any]) => {
    const schema = schemaMap.get(collectionId)
    const projectName = collectionNameMap.get(collectionId) ?? ""
    if (!schema) return
    Object.values(views).forEach((view: any) => {
      const ids: string[] = [
        ...(view?.collection_group_results?.blockIds ?? []),
        ...(view?.blockIds ?? []),
      ]
      ids.forEach((pid) => {
        pageToSchema.set(pid, schema)
        pageToProject.set(pid, projectName)
      })
    })
  })

  const data = []
  for (let i = 0; i < pageIds.length; i++) {
    const pid = pageIds[i]
    if (!wholeBlocks[pid]) continue
    const schema = pageToSchema.get(pid) ?? schemaMap.values().next().value
    const properties = (await getPageProperties(pid, wholeBlocks, schema)) || null

    const blockValue = (wholeBlocks[pid] as any)?.value?.value ?? wholeBlocks[pid].value
    properties.createdTime = new Date(blockValue?.created_time).toString()
    properties.fullWidth = (blockValue?.format as any)?.page_full_width ?? false
    properties.project = pageToProject.get(pid) ?? ""

    data.push(properties)
  }

  // Sort by date
  data.sort((a: any, b: any) => {
    const dateA: any = new Date(a?.date?.start_date || a.createdTime)
    const dateB: any = new Date(b?.date?.start_date || b.createdTime)
    return dateB - dateA
  })

  return data as TPosts
}

// getStaticProps가 페이지마다 getPosts를 호출해서 빌드 중 노션 전체를 수십 번 다시
// 긁는다. 결과를 TTL(revalidateTime) 동안 메모리에 캐싱해 중복 요청을 없앤다.
// - 빌드: 병렬도 1(단일 프로세스)이라 캐시가 살아있어 대부분 재사용됨
// - 런타임 ISR: TTL 지나면 다시 fetch → 노션 수정 반영(동기화) 유지
const TTL = CONFIG.revalidateTime * 1000
let cache: { data: TPosts; ts: number } | null = null
let inflight: Promise<TPosts> | null = null

export const getPosts = async (): Promise<TPosts> => {
  const now = Date.now()
  if (cache && now - cache.ts < TTL) return cache.data

  // 동시 호출이 겹칠 때 중복 fetch를 막고 하나의 요청을 공유한다.
  if (inflight) return inflight

  inflight = fetchPosts()
    .then((data) => {
      cache = { data, ts: Date.now() }
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
