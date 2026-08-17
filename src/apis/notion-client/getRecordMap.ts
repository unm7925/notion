import { createNotionClient } from "./createNotionClient"

export const getRecordMap = async (pageId: string) => {
  const api = createNotionClient()
  const recordMap = await api.getPage(pageId)
  return recordMap
}
