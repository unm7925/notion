import React, { useState, useEffect, useRef, ReactNode } from "react"
import { ThemeProvider } from "./ThemeProvider"
import useScheme from "src/hooks/useScheme"
import Header from "./Header"
import styled from "@emotion/styled"
import Scripts from "src/layouts/RootLayout/Scripts"
import useGtagEffect from "./useGtagEffect"
import useThrottle from "src/hooks/useThrottle"
import { useRouter } from "next/router"

type Props = {
  children: ReactNode
}

const RootLayout = ({ children }: Props) => {
  const router = useRouter()
  const [scheme] = useScheme()
  const [readingProgress, setReadingProgress] = useState(0)

  useGtagEffect()

  const scrollListener = useThrottle(() => {
    // This part will now only calculate progress for intermediate scrolls
    const scrollTop = window.scrollY
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight

    if (scrollHeight <= 0) { // Only check scrollHeight here, 0% and 100% handled by handleScroll
      setReadingProgress(0)
      return
    }
    
    let progress = (scrollTop / scrollHeight) * 100

    // Snap to 100% if very close, for intermediate scrolls
    if (progress > 98) {
      progress = 100
    }
    
    setReadingProgress(progress);
  }, 150);

  useEffect(() => {
    const handleScroll = () => {
      if (router.asPath === ">") {
        setReadingProgress(0)
        return
      }

      const scrollTop = window.scrollY;
      const scrollHeight = 
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      // Force 0% if at top
      if (scrollTop === 0) {
        setReadingProgress(0);
        return;
      }

      // Force 100% if at bottom
      const isAtBottom = window.innerHeight + scrollTop >= document.documentElement.scrollHeight;
      if (isAtBottom) {
        setReadingProgress(100);
        return;
      }

      // For intermediate scrolls, use the throttled listener
      scrollListener();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", scrollListener); // Resize can still be throttled

    // Trigger once on mount and route change to set initial state
    handleScroll(); // Call handleScroll directly for initial state

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scrollListener);
    };
  }, [router.asPath, scrollListener, setReadingProgress]);

  return (
    <ThemeProvider scheme={scheme}>
      <Scripts />
      <Header fullWidth={false} readingProgress={readingProgress} />
      {/* The expensive {children} are now safe from re-rendering on scroll */}
      <StyledMain>{children}</StyledMain>
    </ThemeProvider>
  )
}

export default RootLayout

const StyledMain = styled.main`
  margin: 0 auto;
  width: 100%;
  max-width: 1120px;
  padding: 0 1rem;
`
