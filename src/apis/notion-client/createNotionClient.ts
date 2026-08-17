import { NotionAPI } from "notion-client"

// 노션 앞단 Cloudflare가 User-Agent 없는 요청을 봇으로 보고 403 차단하므로
// 브라우저 User-Agent를 붙여서 모든 요청을 통과시킨다.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export const createNotionClient = () =>
  new NotionAPI({
    ofetchOptions: {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
      },
      // 정적 생성 중 노션이 429(rate limit)를 뱉으면 4초 쉬었다 재시도한다.
      // 본문(getRecordMap) 버스트에서 몇 페이지가 걸리므로 넉넉히 8회까지.
      retry: 8,
      retryDelay: 4000,
      retryStatusCodes: [429, 500, 502, 503, 504],
    },
  })
