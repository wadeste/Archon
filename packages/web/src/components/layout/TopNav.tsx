import { NavLink, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, MessageSquare, Workflow, Settings } from 'lucide-react';
import { listDashboardRuns, getUpdateCheck } from '@/lib/api';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/chat', end: false, icon: MessageSquare, label: 'Chat' },
  { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workflows', end: false, icon: Workflow, label: 'Workflows' },
  { to: '/settings', end: false, icon: Settings, label: 'Settings' },
] as const;

export function TopNav(): React.ReactElement {
  // We only need `counts.running` — a server-side aggregate independent of
  // the `runs` array. `limit: 1` minimises the `runs` payload that the API
  // returns alongside the counts (we discard it).
  const { data: dashboardRuns } = useQuery({
    queryKey: ['dashboardRuns', { status: 'running', forCount: true }],
    queryFn: () => listDashboardRuns({ status: 'running', limit: 1 }),
    refetchInterval: 10_000,
  });
  const runningCount = dashboardRuns?.counts.running ?? 0;

  const { data: updateCheck } = useQuery({
    queryKey: ['update-check'],
    queryFn: getUpdateCheck,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: false,
  });

  return (
    <nav className="flex items-center gap-1 border-b-[3px] border-black bg-white px-4">
      {/* Brand logo */}
      <Link to="/chat" className="flex items-center gap-2 mr-4 hover:underline">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-black">
          <span className="font-display text-base text-white">K</span>
        </div>
        <span className="font-display text-base uppercase tracking-[0.05em] text-black">
          Kairon
        </span>
      </Link>

      {tabs.map(({ to, end, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }: { isActive: boolean }): string =>
            cn(
              'flex items-center gap-2 px-3 py-3 font-sans text-sm font-semibold uppercase tracking-[0.05em] transition-colors border-b-[3px] -mb-[3px]',
              isActive
                ? 'border-black text-black'
                : 'border-transparent text-[var(--text-secondary)] hover:text-black hover:underline'
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
          {to === '/dashboard' && runningCount > 0 && (
            <span
              className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-none bg-black px-1.5 py-0.5 font-mono text-[10px] font-bold text-white"
              aria-label={`${runningCount} workflows running`}
            >
              {runningCount}
            </span>
          )}
        </NavLink>
      ))}
      <span className="ml-auto font-mono text-xs text-[var(--text-secondary)]">
        v{import.meta.env.VITE_APP_VERSION as string}
        {updateCheck?.updateAvailable && updateCheck.releaseUrl && (
          <a
            href={updateCheck.releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 inline-flex items-center gap-1 text-xs text-[#0000ff] underline"
            title={`v${updateCheck.latestVersion} available`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-none bg-[#0000ff]" />v
            {updateCheck.latestVersion}
          </a>
        )}
      </span>
    </nav>
  );
}
