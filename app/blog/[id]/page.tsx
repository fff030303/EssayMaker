export default async function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <h1>博客文章 {id}</h1>
      <p>这是博客文章 {id} 的内容。</p>
    </div>
  );
}