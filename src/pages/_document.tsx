import Document, { Html, Head, Main, NextScript } from "next/document"
import { CONFIG } from "site.config"

class MyDocument extends Document {
  render() {
    return (
      <Html lang={CONFIG.lang}>
        <Head>
          {/* 테마 깜빡임 방지 - 가장 먼저 실행됨 */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    // site.config.js의 scheme 값 사용
                    const configScheme = '${CONFIG.blog.scheme}';
                    
                    // 쿠키에서 저장된 테마 확인
                    const cookieMatch = document.cookie.match(/scheme=([^;]+)/);
                    const savedScheme = cookieMatch ? cookieMatch[1] : null;
                    
                    // 우선순위: 쿠키 → config 설정
                    let scheme = savedScheme || configScheme;
                    
                    // system 설정일 경우 브라우저 설정 확인
                    if (scheme === 'system') {
                      scheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
                        ? 'dark' 
                        : 'light';
                    }
                    
                    // 즉시 테마 적용 (JavaScript 로드 전)
                    document.documentElement.classList.add(scheme);
                    document.documentElement.style.colorScheme = scheme;
                  } catch (e) {
                    // 에러 발생 시 기본값
                    document.documentElement.classList.add('${CONFIG.blog.scheme}');
                  }
                })();
              `,
            }}
          />
          
          <link rel="icon" href="/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="192x192"
            href="/apple-touch-icon.png"
          ></link>
          <link rel="manifest" href="/manifest.json" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
          <meta name="theme-color" content="#ffffff" />
          <link
            rel="alternate"
            type="application/rss+xml"
            title="RSS 2.0"
            href="/feed"
          ></link>
          {/* google search console */}
          {CONFIG.googleSearchConsole.enable === true && (
            <>
              <meta
                name="google-site-verification"
                content={CONFIG.googleSearchConsole.config.siteVerification}
              />
            </>
          )}
          {/* naver search console */}
          {CONFIG.naverSearchAdvisor.enable === true && (
            <>
              <meta
                name="naver-site-verification"
                content={CONFIG.naverSearchAdvisor.config.siteVerification}
              />
            </>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument