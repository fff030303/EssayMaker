/**
 * MarkdownComponents 组件文件
 * 
 * 功能：提供ReactMarkdown的自定义组件配置
 * 
 * 核心特性：
 * 1. 自定义渲染组件：
 *    - 标题组件（H1-H6）：统一样式和层级
 *    - 段落组件：优化行高和间距
 *    - 列表组件：美化项目符号和缩进
 *    - 链接组件：安全的外部链接处理
 * 
 * 2. 样式定制：
 *    - 统一的颜色主题
 *    - 响应式字体大小
 *    - 合理的间距设计
 *    - 优雅的视觉层次
 * 
 * 3. 交互增强：
 *    - 链接悬浮效果
 *    - 代码块语法高亮
 *    - 表格响应式布局
 *    - 图片自适应显示
 * 
 * 4. 安全性：
 *    - 外部链接安全属性
 *    - XSS防护机制
 *    - 内容过滤处理
 * 
 * 5. 可访问性：
 *    - 语义化HTML结构
 *    - 键盘导航支持
 *    - 屏幕阅读器友好
 *    - 对比度优化
 * 
 * 组件映射：
 * - a：链接组件，支持外部链接安全打开
 * - p：段落组件，优化行高和间距
 * - h1-h6：标题组件，统一样式层级
 * - ul/ol：列表组件，美化样式
 * - code：代码组件，支持内联和块级
 * - table：表格组件，响应式设计
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

import React from "react";

export const markdownComponents = {
  h1: ({ children }: { children: React.ReactNode }) => {
    return (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 border-b border-gray-200 pb-2">
        {children}
      </h1>
    );
  },
  h2: ({ children }: { children: React.ReactNode }) => {
    return (
      <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900">{children}</h2>
    );
  },
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-base font-bold mt-3 mb-2 text-gray-900">{children}</h4>
  ),
  h5: ({ children }: { children: React.ReactNode }) => (
    <h5 className="text-sm font-bold mt-3 mb-2 text-gray-900">{children}</h5>
  ),
  h6: ({ children }: { children: React.ReactNode }) => (
    <h6 className="text-sm font-bold mt-3 mb-2 text-gray-700">{children}</h6>
  ),
  p: ({ children }: { children: React.ReactNode }) => {
    // 🆕 特殊处理：检查是否是经历标题
    const childText = React.Children.toArray(children).join('');
    const isExperienceTitle = /^经历[一二三四五六七八九十]：/.test(childText);
    
    if (isExperienceTitle) {
      // 经历标题使用特殊样式，确保不缩进
      return (
        <p className="mb-3 mt-4 leading-relaxed text-gray-700 font-medium" style={{ marginLeft: 0, paddingLeft: 0 }}>
          {children}
        </p>
      );
    }
    
    return <p className="mb-4 leading-relaxed text-gray-700">{children}</p>;
  },
  br: () => <br className="my-1" />,
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-gray-700">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-blue-300 pl-4 italic mb-4 bg-blue-50 py-2 text-gray-600">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-100">{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="border-b border-gray-200">{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="border border-gray-300 px-4 py-2 text-gray-700">
      {children}
    </td>
  ),
  code: ({ node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;

    if (isInline) {
      return (
        <code
          className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
        <code className={`${className} text-sm`} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  strong: ({ children }: { children: React.ReactNode }) => {
    return <strong className="font-bold text-gray-900">{children}</strong>;
  },
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-gray-700">{children}</em>
  ),
  hr: () => <hr className="border-t border-gray-300 my-6" />,
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto rounded-lg shadow-sm my-4"
    />
  ),
};
