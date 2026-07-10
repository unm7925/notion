import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

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

  // 페이지 내 모든 컬렉션에서 schema 수집
  const schemaMap = new Map<string, any>()
  Object.entries(response.collection).forEach(([collectionId, collectionRaw]: [string, any]) => {
    const collection = collectionRaw?.value?.value ?? collectionRaw?.value
    if (collection?.schema) {
      schemaMap.set(collectionId, collection.schema)
    }
  })

  console.log("[DEBUG] collection count:", schemaMap.size)
  console.log("[DEBUG] collection_query keys:", Object.keys(response.collection_query))

  // 모든 표에서 pageId 수집
  const pageIds = getAllPageIds(response)
  console.log("[DEBUG] total pageIds:", pageIds.length)
  if (pageIds.length === 0) return []

  const wholeBlocks = await (await api.getBlocks(pageIds)).recordMap.block

  // 각 페이지가 어느 컬렉션 소속인지 역매핑
  const pageToSchema = new Map<string, any>()
  Object.entries(response.collection_query).forEach(([collectionId, views]: [string, any]) => {
    const schema = schemaMap.get(collectionId)
    if (!schema) return
    Object.values(views).forEach((view: any) => {
      const ids: string[] = [
        ...(view?.collection_group_results?.blockIds ?? []),
        ...(view?.blockIds ?? []),
      ]
      ids.forEach((pid) => pageToSchema.set(pid, schema))
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
