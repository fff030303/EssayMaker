export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>
        <h2>博客导航</h2>
        <ul>
          <li><a href="/blog/posts">所有文章</a></li>
          <li><a href="/blog/categories">分类</a></li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
}