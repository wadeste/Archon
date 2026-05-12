import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  projectName?: string;
  connected?: boolean;
  isDocker?: boolean;
}

function smartPath(fullPath: string): string {
  const segments = fullPath.split('/').filter(Boolean);
  if (segments.length <= 3) return fullPath;
  return '.../' + segments.slice(-3).join('/');
}

export function Header({
  title,
  subtitle,
  projectName,
  connected,
  isDocker,
}: HeaderProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const openInVSCode = (): void => {
    if (subtitle) {
      // Normalize backslashes to forward slashes for the vscode:// URI
      const normalizedPath = subtitle.replace(/\\/g, '/');
      window.open(`vscode://file/${normalizedPath}`, '_blank');
    }
  };

  const copyPath = (): void => {
    if (subtitle) {
      void navigator.clipboard.writeText(subtitle).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      });
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center border-b-[3px] border-black bg-white px-6">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="font-display text-base uppercase tracking-[0.05em] text-black">{title}</h1>
        {subtitle ? (
          <button
            onClick={copyPath}
            className="group flex items-center gap-1 font-mono text-xs text-[var(--text-secondary)] truncate max-w-sm hover:text-black hover:underline text-left transition-colors"
            title={subtitle}
          >
            <span className="truncate">{smartPath(subtitle)}</span>
            {copied ? (
              <Check className="h-3 w-3 shrink-0 text-[#008000]" />
            ) : (
              <Copy className="h-3 w-3 shrink-0 invisible group-hover:visible" />
            )}
          </button>
        ) : projectName ? (
          <span className="font-mono text-xs text-[var(--text-secondary)]">{projectName}</span>
        ) : connected !== undefined ? (
          <span className="font-mono text-xs text-[var(--text-tertiary)] italic">No project</span>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {subtitle && !isDocker && (
          <button
            onClick={openInVSCode}
            className="flex items-center gap-1.5 rounded-none px-2 py-1 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black transition-colors hover:underline"
            title="Open in VS Code"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in IDE</span>
          </button>
        )}
        {connected !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2.5 w-2.5 border-[2px]',
                connected ? 'border-[#008000] bg-[#008000]' : 'border-[#cccccc] bg-white'
              )}
            />
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
