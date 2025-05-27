// Markdown 组件配置文件 - 从 DraftResultDisplay.tsx 中提取的 ReactMarkdown 组件配置

import React from "react";

export const markdownComponents = {
  h1: ({ children }: { children: React.ReactNode }) => {
    console.log("渲染H1:", children);
    return (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 border-b border-gray-200 pb-2">
        {children}
      </h1>
    );
  },
  h2: ({ children }: { children: React.ReactNode }) => {
    console.log("渲染H2:", children);
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
    console.log("渲染段落:", children);
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
    console.log("渲染粗体:", children);
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
