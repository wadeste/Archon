import { memo, useMemo, useState } from 'react';
import { Copy, Check, Paperclip } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, FileAttachment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArtifactViewerModal } from '@/components/workflows/ArtifactViewerModal';

// Hoisted to module scope to prevent new references on every render
const REMARK_PLUGINS = [remarkGfm, remarkBreaks];
const REHYPE_PLUGINS = [rehypeHighlight];

// Matches artifact paths (forward- and back-slash safe); groups: [1] runId, [2] filename
const ARTIFACT_PATH_RE = /artifacts[/\\]runs[/\\]([a-fA-F0-9-]+)[/\\](.+)/;

function extractArtifactInfo(text: string): { runId: string; filename: string } | null {
  const match = ARTIFACT_PATH_RE.exec(text);
  if (!match) return null;
  const filename = match[2].replace(/\\/g, '/');
  if (filename.split('/').some(s => s === '..')) return null;
  return {
    runId: match[1],
    filename,
  };
}

function makeMarkdownComponents(
  onArtifactClick: (runId: string, filename: string) => void
): Components {
  return {
    pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>): React.ReactElement => (
      <pre
        className="overflow-x-auto rounded-none border-[3px] border-black bg-white p-4 font-mono text-sm"
        {...props}
      >
        {children}
      </pre>
    ),
    code: ({
      children,
      className,
      ...props
    }: React.ComponentPropsWithoutRef<'code'> & { className?: string }): React.ReactElement => {
      const isBlock = className?.startsWith('language-') || className?.startsWith('hljs');
      if (isBlock) {
        return (
          <code className={cn(className, 'font-mono')} {...props}>
            {children}
          </code>
        );
      }
      if (typeof children === 'string') {
        const artifact = extractArtifactInfo(children);
        if (artifact) {
          const { runId, filename } = artifact;
          const displayName = filename.split('/').pop() ?? filename;
          if (filename.endsWith('.md')) {
            return (
              <button
                type="button"
                className="cursor-pointer rounded-none border-[1px] border-black bg-[#f0f0f0] px-1.5 py-0.5 font-mono text-sm text-[#0000ff] underline transition-colors"
                onClick={() => {
                  onArtifactClick(runId, filename);
                }}
              >
                {displayName}
              </button>
            );
          }
          const encodedFilename = filename.split('/').map(encodeURIComponent).join('/');
          return (
            <a
              href={`/api/artifacts/${encodeURIComponent(runId)}/${encodedFilename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-none border-[1px] border-black bg-[#f0f0f0] px-1.5 py-0.5 font-mono text-sm text-[#0000ff] underline"
            >
              {displayName}
            </a>
          );
        }
      }
      return (
        <code
          className="rounded-none border-[1px] border-black bg-[#f0f0f0] px-1.5 py-0.5 font-mono text-sm text-black"
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'table'>): React.ReactElement => (
      <div className="overflow-x-auto">
        <table {...props}>{children}</table>
      </div>
    ),
    blockquote: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'blockquote'>): React.ReactElement => (
      <blockquote
        className="border-l-[3px] border-black pl-4 text-[var(--text-secondary)]"
        {...props}
      >
        {children}
      </blockquote>
    ),
    a: ({ children, ...props }: React.ComponentPropsWithoutRef<'a'>): React.ReactElement => (
      <a className="text-[#0000ff] underline" target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
  };
}

/** Detect if a string is a complete JSON object/array */
function isJsonString(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubbleRaw({ message }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user';
  const isThinking = message.isStreaming && !message.content;
  const [copied, setCopied] = useState(false);
  const [artifactViewer, setArtifactViewer] = useState<{ runId: string; filename: string } | null>(
    null
  );
  // setArtifactViewer is a stable React state setter — empty dep array is intentional
  const markdownComponents = useMemo(
    () =>
      makeMarkdownComponents((runId, filename) => {
        setArtifactViewer({ runId, filename });
      }),
    []
  );

  const copyMessage = (): void => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <>
      <div className={cn('group flex w-full', isUser ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'relative',
            isUser
              ? 'max-w-[70%] rounded-none border-[3px] border-black bg-black px-4 py-2.5'
              : 'max-w-full rounded-none border-l-[3px] border-black pl-4'
          )}
        >
          {isUser ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-2">
                <p className="font-sans text-sm text-white whitespace-pre-wrap flex-1">
                  {message.content}
                </p>
                <button
                  onClick={copyMessage}
                  className="shrink-0 mt-0.5 invisible group-hover:visible transition-colors text-white hover:underline"
                  title="Copy message"
                  aria-label={copied ? 'Copied' : 'Copy message'}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.files.map((file: FileAttachment) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-1 rounded-none border-[2px] border-white bg-black px-1.5 py-0.5 font-mono text-xs text-white"
                      title={file.name}
                    >
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="chat-markdown max-w-none text-sm text-black">
              {isThinking && (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="h-2 w-2 animate-pulse bg-black" />
                  <span
                    className="h-2 w-2 animate-pulse bg-black"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="h-2 w-2 animate-pulse bg-black"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              )}
              {isJsonString(message.content) ? (
                <details className="group">
                  <summary className="cursor-pointer font-sans text-sm text-black hover:underline">
                    <span className="font-mono text-xs border-[2px] border-black bg-[#f0f0f0] rounded-none px-1.5 py-0.5">
                      JSON output
                    </span>
                  </summary>
                  <pre className="mt-2 text-xs bg-[#f0f0f0] border-[3px] border-black rounded-none p-3 overflow-x-auto">
                    {JSON.stringify(JSON.parse(message.content.trim()) as unknown, null, 2)}
                  </pre>
                </details>
              ) : (
                <ReactMarkdown
                  remarkPlugins={REMARK_PLUGINS}
                  rehypePlugins={REHYPE_PLUGINS}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              {message.isStreaming && message.content && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-black align-text-bottom" />
              )}
            </div>
          )}

          {!isThinking && (
            <div
              className={cn(
                'mt-0.5 font-mono text-[11px]',
                isUser ? 'text-white/70' : 'text-[var(--text-tertiary)]'
              )}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      {artifactViewer && (
        <ArtifactViewerModal
          open={true}
          onOpenChange={() => {
            setArtifactViewer(null);
          }}
          runId={artifactViewer.runId}
          filename={artifactViewer.filename}
        />
      )}
    </>
  );
}

// Memoize: only re-render when message content/state actually changes
const messageBubble = memo(MessageBubbleRaw, (prev, next) => {
  return (
    prev.message.content === next.message.content &&
    prev.message.isStreaming === next.message.isStreaming &&
    prev.message.toolCalls === next.message.toolCalls &&
    prev.message.error === next.message.error &&
    prev.message.workflowDispatch === next.message.workflowDispatch &&
    prev.message.workflowResult === next.message.workflowResult &&
    prev.message.files === next.message.files
  );
});

export { messageBubble as MessageBubble };
