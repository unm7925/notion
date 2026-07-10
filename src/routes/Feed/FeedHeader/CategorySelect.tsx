import useDropdown from "src/hooks/useDropdown"
import { useRouter } from "next/router"
import React from "react"
import { MdExpandMore } from "react-icons/md"
import { DEFAULT_CATEGORY } from "src/constants"
import styled from "@emotion/styled"
import { useCategoriesQuery } from "src/hooks/useCategoriesQuery"

const CategorySelect: React.FC = () => {
  const router = useRouter()
  const tree = useCategoriesQuery()
  const [dropdownRef, opened, handleOpen] = useDropdown()

  const currentProject = `${router.query.project || ``}` || undefined
  const currentCategory = `${router.query.category || ``}` || DEFAULT_CATEGORY

  const displayLabel = currentProject
    ? currentCategory !== DEFAULT_CATEGORY
      ? `${currentProject} / ${currentCategory}`
      : currentProject
    : DEFAULT_CATEGORY

  const handleProjectClick = (project: string) => {
    if (project === DEFAULT_CATEGORY) {
      router.push({ query: { ...router.query, project: undefined, category: undefined } })
    } else {
      router.push({ query: { ...router.query, project, category: undefined } })
    }
  }

  const handleCategoryClick = (project: string, category: string) => {
    router.push({ query: { ...router.query, project, category } })
  }

  return (
    <StyledWrapper>
      <div ref={dropdownRef} className="wrapper" onClick={handleOpen}>
        {displayLabel} Posts <MdExpandMore />
      </div>
      {opened && (
        <div className="content">
          {Object.entries(tree).map(([project, { count, categories }]) => (
            <React.Fragment key={project}>
              <div
                className={`item project ${currentProject === project || (project === DEFAULT_CATEGORY && !currentProject) ? "active" : ""}`}
                onClick={() => handleProjectClick(project)}
              >
                {`${project} (${count})`}
              </div>
              {project !== DEFAULT_CATEGORY &&
                Object.entries(categories).map(([cat, catCount]) => (
                  <div
                    key={cat}
                    className={`item category ${currentCategory === cat && currentProject === project ? "active" : ""}`}
                    onClick={() => handleCategoryClick(project, cat)}
                  >
                    {`· ${cat} (${catCount})`}
                  </div>
                ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </StyledWrapper>
  )
}

export default CategorySelect

const StyledWrapper = styled.div`
  position: relative;
  > .wrapper {
    display: flex;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    gap: 0.25rem;
    align-items: center;
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 700;
    cursor: pointer;
  }
  > .content {
    position: absolute;
    z-index: 40;
    padding: 0.25rem;
    border-radius: 0.75rem;
    background-color: ${({ theme }) => theme.colors.gray2};
    color: ${({ theme }) => theme.colors.gray10};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    > .item {
      padding: 0.25rem 0.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      white-space: nowrap;
      cursor: pointer;
      &:hover {
        background-color: ${({ theme }) => theme.colors.gray4};
      }
      &.active {
        font-weight: 700;
      }
      &.category {
        padding-left: 1.25rem;
        opacity: 0.8;
      }
    }
  }
`
