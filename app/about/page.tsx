export default function About() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>关于我</h1>
      <p>你好！我是一名热爱编程和技术的开发者。</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>技能</h2>
        <ul>
          <li>前端开发: React, Next.js, TypeScript</li>
          <li>后端开发: Node.js, Express</li>
          <li>数据库: MongoDB, MySQL</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>联系方式</h2>
        <p>邮箱: example@example.com</p>
        <p>GitHub: github.com/example</p>
      </div>
    </div>
  );
}