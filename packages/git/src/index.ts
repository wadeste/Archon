// Types
export type {
  RepoPath,
  BranchName,
  WorktreePath,
  GitResult,
  GitError,
  WorkspaceSyncMode,
  WorkspaceSyncState,
  WorkspaceSyncResult,
  WorktreeInfo,
} from './types';
export { toRepoPath, toBranchName, toWorktreePath } from './types';

// Process and filesystem wrappers
export { execFileAsync, mkdirAsync, resolveBashPath } from './exec';

// Retry helpers for transient git errors (issue #640)
export { execGitWithRetry, isGitConfigLockError, GIT_CONFIG_LOCK_PATTERNS } from './git-retry';
export type { ExecFn, ExecGitOptions, ExecGitRetryOptions } from './git-retry';

// Worktree operations
export {
  getWorktreeBase,
  isProjectScopedWorktreeBase,
  worktreeExists,
  listWorktrees,
  findWorktreeByBranch,
  isWorktreePath,
  removeWorktree,
  getCanonicalRepoPath,
  verifyWorktreeOwnership,
} from './worktree';
export type { WorktreeLayout, WorktreeBaseOverride } from './worktree';

// Branch operations
export {
  getDefaultBranch,
  getUniqueCommitCount,
  getCurrentBranch,
  countCommitsAhead,
  checkout,
  hasUncommittedChanges,
  commitAllChanges,
  isBranchMerged,
  isPatchEquivalent,
  isAncestorOf,
  getLastCommitDate,
} from './branch';

// Forge detection
export { detectForge } from './forge';
export type { ForgeType, ForgeInfo } from './forge';

// Repository operations
export {
  findRepoRoot,
  getDefaultRemote,
  getRemoteUrl,
  listChildRepos,
  syncWorkspace,
  cloneRepository,
  syncRepository,
  addSafeDirectory,
} from './repo';
