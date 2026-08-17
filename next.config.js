module.exports = {
  images: {
    domains: [
      "www.notion.so",
      "lh5.googleusercontent.com",
      "s3-us-west-2.amazonaws.com",
    ],
  },
  transpilePackages: ["mermaid"],

  // 정적 생성 페이지가 각자 노션을 여러 번 호출하므로, 페이지를 병렬로 찍으면
  // 노션이 429로 막는다. 워커를 1개로 묶어 순차 생성해서 부하를 낮춘다.
  experimental: {
    esmExternals: "loose",
    largePageDataBytes: 1024 * 1024, // Increased data serialization threshold to 1MB
    workerThreads: false,
    cpus: 1,
  },
  // 순차 생성 + 재시도로 페이지당 시간이 늘어날 수 있어 타임아웃을 넉넉히.
  staticPageGenerationTimeout: 300,
}
