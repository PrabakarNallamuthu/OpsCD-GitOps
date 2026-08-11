export interface GitCommit {
    readonly sha: string;
    readonly message: string;
    readonly authorEmail: string;
    readonly timestamp: string;
}
export interface GitPullRequest {
    readonly number: number;
    readonly title: string;
    readonly url: string;
    readonly state: 'open' | 'closed' | 'merged';
    readonly mergedAt: string | null;
}
export interface GitDiffStats {
    readonly filesChanged: number;
    readonly additions: number;
    readonly deletions: number;
}
/**
 * Adapter interface for Git provider integrations (GitHub, GitLab, Bitbucket).
 * Implemented per-provider in WO-033.
 */
export interface GitProviderAdapter {
    readonly provider: 'github' | 'gitlab' | 'bitbucket';
    getCommit(repoFullName: string, sha: string): Promise<GitCommit>;
    getPullRequest(repoFullName: string, prNumber: number): Promise<GitPullRequest>;
    listCommitsInRange(repoFullName: string, base: string, head: string): Promise<GitCommit[]>;
    getDiffStats(repoFullName: string, base: string, head: string): Promise<GitDiffStats>;
    createBranch(repoFullName: string, branchName: string, fromRef: string): Promise<void>;
    createPullRequest(repoFullName: string, title: string, body: string, head: string, base: string): Promise<GitPullRequest>;
}
//# sourceMappingURL=git-provider.adapter.d.ts.map