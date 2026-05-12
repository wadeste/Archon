import { useState, useCallback } from 'react';
import { FolderGit2, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { CodebaseResponse } from '@/lib/api';
import { deleteCodebase } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectSelectorProps {
  projects: CodebaseResponse[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  isLoading: boolean;
  searchQuery?: string;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  isLoading,
  searchQuery,
}: ProjectSelectorProps): React.ReactElement {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<CodebaseResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = useCallback((): void => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteError(null);
    void deleteCodebase(id)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['codebases'] });
        if (id === selectedProjectId) {
          onSelectProject(null);
        }
        setDeleteTarget(null);
      })
      .catch((err: Error) => {
        setDeleteError(err.message);
      });
  }, [deleteTarget, queryClient, selectedProjectId, onSelectProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="font-mono text-xs text-[var(--text-tertiary)]">Loading...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <FolderGit2 className="h-8 w-8 text-[var(--text-tertiary)]" />
        <span className="font-mono text-xs text-[var(--text-tertiary)]">No projects yet</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
          Click + to add a repository
        </span>
      </div>
    );
  }

  const filteredProjects = projects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.repository_url ?? '').toLowerCase().includes(q);
  });

  if (filteredProjects.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="font-mono text-xs text-[var(--text-tertiary)]">No matching projects</span>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col mt-1 list-none m-0 p-0">
        {/* All Projects option */}
        <li className="border-b-[3px] border-black last:border-b-0">
          <button
            onClick={(): void => {
              onSelectProject(null);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-3 text-left transition-colors w-full font-sans text-sm',
              selectedProjectId === null ? 'bg-black text-white' : 'text-black hover:underline'
            )}
          >
            <FolderGit2 className="h-4 w-4 shrink-0" />
            <span>All Projects</span>
          </button>
        </li>
        {filteredProjects.map(project => (
          <li
            key={project.id}
            className="group relative border-b-[3px] border-black last:border-b-0"
          >
            <button
              onClick={(): void => {
                onSelectProject(project.id);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-3 text-left transition-colors w-full font-sans text-sm',
                selectedProjectId === project.id
                  ? 'bg-black text-white'
                  : 'text-black hover:underline'
              )}
            >
              <FolderGit2 className="h-4 w-4 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{project.name}</span>
                {project.repository_url && (
                  <span
                    className={cn(
                      'truncate font-mono text-[10px]',
                      selectedProjectId === project.id
                        ? 'text-white/70'
                        : 'text-[var(--text-tertiary)]'
                    )}
                  >
                    {project.repository_url}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={(e): void => {
                e.stopPropagation();
                setDeleteError(null);
                setDeleteTarget(project);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-none border-[2px] border-transparent invisible group-hover:visible transition-colors hover:border-black"
              title="Remove project"
            >
              <Trash2 className="h-3.5 w-3.5 text-[#ff0000]" />
            </button>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open): void => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteTarget?.name}</strong> from Archon, delete its
              workspace directory and worktrees. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="font-mono text-sm text-[#ff0000] px-1">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
