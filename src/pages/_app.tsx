import { AppPropsWithLayout } from "../types"
import { Hydrate, QueryClientProvider } from "@tanstack/react-query"
import Sparkle from "src/components/Sparkle"
import { RootLayout } from "src/layouts"
import { queryClient } from "src/libs/react-query"

import "/src/styles/themes/prism.css"

function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <RootLayout>{getLayout(<Component {...pageProps} />)}</RootLayout>
      </Hydrate>
      {/* <AnimatedCursor /> */}
      {/* <Sparkle /> */}
    </QueryClientProvider>
  )
}

export default App
