import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getCookie, setCookie } from "cookies-next"
import { useEffect, useCallback } from "react"
import { queryKey } from "src/constants/queryKey"
import { CONFIG } from "site.config" // ← CONFIG import 추가

export type Scheme = "light" | "dark"
type SetScheme = (scheme: Scheme) => void

const useScheme = (): [Scheme, SetScheme] => {
  const queryClient = useQueryClient()

  const { data } = useQuery<Scheme>({
    queryKey: queryKey.scheme(),
    enabled: false,
    initialData: CONFIG.blog.scheme === "system" 
      ? "light" // system일 경우 기본값
      : (CONFIG.blog.scheme as Scheme), // ← CONFIG 값 사용하도록 수정
  })

  const scheme = data || (CONFIG.blog.scheme as Scheme) // ← 여기도 수정

  const setScheme: SetScheme = useCallback((newScheme: Scheme) => {
    setCookie("scheme", newScheme)
    queryClient.setQueryData(queryKey.scheme(), newScheme)
  }, [queryClient])

  useEffect(() => {
    if (!window) return

    const savedScheme = getCookie("scheme") as Scheme | undefined
    
    // 저장된 값이 없으면 config 값 사용
    const defaultScheme = CONFIG.blog.scheme === "system"
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light")
      : (CONFIG.blog.scheme as Scheme)
    
    setScheme(savedScheme || defaultScheme) // ← 수정
  }, [setScheme])

  return [scheme, setScheme]
}

export default useScheme