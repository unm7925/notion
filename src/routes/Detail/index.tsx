import useMermaidEffect from "./hooks/useMermaidEffect"
import PostDetail from "./PostDetail"
import PageDetail from "./PageDetail"
import styled from "@emotion/styled"
import { PostDetail as TPostDetail } from "src/types"

type Props = {
  post: TPostDetail
}

const Detail: React.FC<Props> = ({ post: data }) => {
  useMermaidEffect()

  if (!data) return null
  return (
    <StyledWrapper data-type={data.type}>
      {data.type[0] === "Page" && <PageDetail post={data} />}
      {data.type[0] !== "Page" && <PostDetail post={data} />}
    </StyledWrapper>
  )
}

export default Detail

const StyledWrapper = styled.div`
  padding: 2rem 0;

  &[data-type="Paper"] {
    padding: 40px 0;
  }
`
