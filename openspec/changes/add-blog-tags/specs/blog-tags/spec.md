## Purpose

Blog tags let authors label posts with reusable topics and let readers discover
published posts that share the same tag without exposing drafts.

## ADDED Requirements

### Requirement: Blogs expose tags
The system SHALL represent each blog tag with an `id`, display `name`, and
URL-safe `slug`. Every blog response that returns blog objects SHALL include a
`tags` array, including public blog list/detail responses, authenticated
current-user blog list responses, author-only blog detail responses, blog create
responses, and blog update responses.

#### Scenario: Blog response contains tags
- **WHEN** a blog with two tags is returned by any blog read or write endpoint
- **THEN** the blog object includes a `tags` array containing each tag's `id`, `name`, and `slug`

#### Scenario: Blog with no tags
- **WHEN** a blog has no associated tags
- **THEN** the blog object's `tags` array is empty

### Requirement: Authors can assign tags when creating blogs
The system SHALL allow authenticated blog creation requests to include an
optional `tags` array of tag names. The system MUST trim tag names, reject blank
tag names, reject non-string tag values, reject tag names longer than 40
characters, de-duplicate equivalent tag names within the request, and reject
requests with more than 10 distinct tags. The system SHALL reuse existing tags
when an equivalent tag already exists and SHALL create missing tags before
associating them with the new blog.

#### Scenario: Create blog with tags
- **WHEN** an authenticated author creates a blog with `tags` set to `["Python", " Flask "]`
- **THEN** the blog is created with the normalized tags `Python` and `Flask`

#### Scenario: Reject invalid create tags
- **WHEN** an authenticated author creates a blog with blank, non-string, overlong, or too many tag values
- **THEN** the API responds with `400 VALIDATION_ERROR` and a `tags` field error

### Requirement: Authors can replace tags when updating blogs
The system SHALL allow authenticated blog update requests to include an optional
`tags` array of tag names. When `tags` is present, the system MUST validate it
with the same rules as blog creation and replace the blog's tag associations
with the validated distinct tags. When `tags` is omitted, the system MUST leave
the blog's existing tags unchanged.

#### Scenario: Update blog tags
- **WHEN** the blog author updates a blog with `tags` set to `["SQL", "Backend"]`
- **THEN** the blog's previous tag associations are replaced by `SQL` and `Backend`

#### Scenario: Omit tags during update
- **WHEN** the blog author updates only the blog content and omits `tags`
- **THEN** the blog's existing tags remain associated with the blog

#### Scenario: Reject invalid update tags
- **WHEN** the blog author updates a blog with invalid `tags`
- **THEN** the API responds with `400 VALIDATION_ERROR` and does not change the blog's tags

### Requirement: Public blog list can filter by tag
The system SHALL allow public `GET /blogs` requests to include an optional
`tag` query parameter containing a tag slug. When `tag` is present, the system
MUST return only published blogs associated with that tag while preserving the
existing pagination response shape and draft hiding behavior.

#### Scenario: Filter published blogs by tag
- **WHEN** a reader requests `GET /blogs?tag=python`
- **THEN** the response includes only published blogs associated with the `python` tag

#### Scenario: Filter by unknown tag
- **WHEN** a reader requests `GET /blogs?tag=unknown-topic`
- **THEN** the response succeeds with an empty blog list and pagination totals of zero

#### Scenario: Drafts remain hidden in tag filtering
- **WHEN** a draft blog and a published blog share the requested tag
- **THEN** the filtered public response includes the published blog and excludes the draft blog

### Requirement: Frontend supports tag authoring and discovery
The frontend SHALL let authenticated authors enter tags when creating or editing
a blog, submit those tags through the blog API helpers, and show validation
errors returned for tag input. The frontend SHALL display blog tags on public
blog cards, public blog detail pages, and dashboard blog management views. A
reader selecting a displayed tag from public blog surfaces SHALL navigate to the
public blog list filtered by that tag.

#### Scenario: Author submits tags from blog form
- **WHEN** an authenticated author fills tag input on the create or edit blog form and submits the form
- **THEN** the frontend sends the tag names in the blog API request

#### Scenario: Reader opens tag-filtered blog list
- **WHEN** a reader selects a tag displayed on a public blog card or detail page
- **THEN** the frontend opens the public blog list with that tag filter applied

#### Scenario: Dashboard displays tags
- **WHEN** an author views their dashboard blog list
- **THEN** each listed blog displays its associated tags when tags exist
