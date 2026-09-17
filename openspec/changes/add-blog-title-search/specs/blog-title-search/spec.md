## Purpose

Allow readers to discover published MiniBlog posts by matching text in blog
titles while preserving the existing public blog list contract.

## ADDED Requirements

### Requirement: Public blog list filters by title query
The system SHALL allow public `GET /blogs` requests to include an optional
`title` query parameter that filters results to published blogs whose titles
contain the trimmed query text using case-insensitive matching.

#### Scenario: Matching published blogs by partial title
- **WHEN** a reader requests `GET /blogs?title=flask`
- **THEN** the response includes only published blogs with titles containing
  `flask` regardless of letter case
- **AND** matching results keep the existing blog list response shape and
  newest-first ordering

#### Scenario: Draft blogs remain excluded
- **WHEN** a draft blog title contains the requested title query
- **THEN** the draft blog is not included in the public blog list response

#### Scenario: Whitespace-only title query is ignored
- **WHEN** a reader requests `GET /blogs?title=%20%20`
- **THEN** the response is equivalent to `GET /blogs` with no title filter

### Requirement: Title search composes with existing filters and pagination
The system SHALL apply title filtering together with existing public blog list
pagination and tag filtering, and pagination totals SHALL reflect the fully
filtered result set.

#### Scenario: Title and tag filters are combined
- **WHEN** a reader requests `GET /blogs?tag=python&title=testing`
- **THEN** the response includes only published blogs associated with the
  `python` tag whose titles also contain `testing`

#### Scenario: Pagination reflects matching title results
- **WHEN** a reader requests `GET /blogs?title=guide&page=1&perPage=10`
- **THEN** the `pagination.total` value counts only published blogs matching the
  title query
- **AND** `pagination.totalPages` is calculated from that filtered total

### Requirement: Public blog list UI supports title search
The public `/blogs` page SHALL provide a title search control that reads from
and writes to the URL `title` search parameter, submits searches without
requiring authentication, and renders matching published blog results.

#### Scenario: Reader searches from the public blog list
- **WHEN** a reader enters a title query and submits the search control on
  `/blogs`
- **THEN** the page navigates to a URL containing the `title` query parameter
- **AND** the rendered blog list is loaded from `GET /blogs` with the same title
  query

#### Scenario: Empty search returns the unfiltered list
- **WHEN** a reader clears the search control and submits it
- **THEN** the `title` query parameter is omitted from the URL
- **AND** the public blog list displays the normal published-post list subject
  only to any remaining supported filters

#### Scenario: No matching blogs shows an empty state
- **WHEN** a title search has no matching published blogs
- **THEN** the `/blogs` page renders an empty state that indicates no published
  posts matched the search
