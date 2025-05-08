export default function BlogPost({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>博客文章 {params.id}</h1>
      <p>这是博客文章 {params.id} 的内容。</p>
    </div>
  );
}