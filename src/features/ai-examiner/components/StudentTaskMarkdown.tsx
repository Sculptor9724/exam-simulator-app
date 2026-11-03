import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface StudentTaskMarkdownProps {
  content: string;
}

const StudentTaskMarkdown = ({ content }: StudentTaskMarkdownProps) => {
  const CodeBlock = ({ inline, className, children, node, ...props }: any) => {
    // Check if it's inline code
    // In ReactMarkdown, inline code doesn't have a parent <pre> tag
    // and typically won't have a className with "language-"
    const isInline = inline || !className?.startsWith('language-');
    
    // If it's inline code (single backticks), render simple code element
    if (isInline) {
      return (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    }

    // For code blocks (triple backticks), use CodeBlockWithCopy
    return (
      <CodeBlockWithCopy className={className} {...props}>
        {children}
      </CodeBlockWithCopy>
    );
  };

  const CodeBlockWithCopy = ({ className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "text";

    // Get the string content from children
    const codeString = String(children).replace(/\n$/, "");

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    };

    return (
      <div className="relative group mb-4">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors cursor-pointer z-10"
          title="Copy to clipboard"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus as any}
          customStyle={{
            margin: 0,
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
          }}
          PreTag="div"
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div
      className="student-task bg-white p-6 rounded-md shadow-lg max-w-3xl mx-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
      style={{
        transformOrigin: "top center",
        maxHeight: "400px",
        overflow: "auto",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mb-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mb-2" {...props} />
          ),
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 mb-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-4" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          code: CodeBlock,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 italic mb-4"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-600 hover:underline" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default StudentTaskMarkdown;
