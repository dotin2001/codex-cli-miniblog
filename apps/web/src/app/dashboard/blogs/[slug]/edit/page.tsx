import { EditBlogClient } from "./edit-blog-client";

type EditBlogPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { slug } = await params;

  return <EditBlogClient slug={slug} />;
}
