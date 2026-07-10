import { idToUuid } from "notion-utils"
import { ExtendedRecordMap, ID } from "notion-types"

export default function getAllPageIds(
  response: ExtendedRecordMap,
  viewId?: string
) {
  const collectionQuery = response.collection_query
  const pageSet = new Set<ID>()

  if (viewId) {
    const views = Object.values(collectionQuery)[0]
    const vId = idToUuid(viewId)
    const ids = views[vId]?.blockIds ?? []
    ids.forEach((id: ID) => pageSet.add(id))
  } else {
    Object.values(collectionQuery).forEach((views: any) => {
      Object.values(views).forEach((view: any) => {
        view?.collection_group_results?.blockIds?.forEach((id: ID) =>
          pageSet.add(id)
        )
        view?.blockIds?.forEach((id: ID) => pageSet.add(id))
      })
    })
  }

  return [...pageSet]
}
