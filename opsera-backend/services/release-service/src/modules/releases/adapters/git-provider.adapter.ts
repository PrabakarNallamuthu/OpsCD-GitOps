import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import axios, { type AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

export interface CommitMetadata {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  metadataStatus: 'complete' | 'partial' | 'timeout' | 'error';
}

export interface PRMetadata {
  id: string | number;
  title: string;
  body?: string;
  author: string;
  mergedAt?: string;
  labels: string[];
  reviewers: string[];
  metadataStatus: 'complete' | 'partial' | 'timeout' | 'error';
}

export interface FileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GitProviderAdapter {
  getCommitDetails(repoUrl: string, sha: string): Promise<CommitMetadata>;
  getPullRequestDetails(repoUrl: string, prId: string | number): Promise<PRMetadata>;
  getFileDiffs(repoUrl: string, sha: string): Promise<FileDiff[]>;
}

@Injectable()
export class GitHubAdapter implements GitProviderAdapter {
  private readonly logger = new Logger(GitHubAdapter.name);
  private readonly http: AxiosInstance;
  private readonly breaker: CircuitBreaker;
  private remainingQuota = 5000;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {
    this.http = axios.create({
      baseURL: 'https://api.github.com',
      timeout: 15_000,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${config.get<string>('GITHUB_TOKEN', '')}`,
        'User-Agent': 'opsera-release-service/1.0',
      },
    });

    this.breaker = new CircuitBreaker(
      async (fn: () => Promise<unknown>) => fn(),
      {
        timeout: 15_000,
        errorThresholdPercentage: 50,
        resetTimeout: 60_000,
        volumeThreshold: 5,
        name: 'github-adapter',
      },
    );

    this.breaker.on('open', () => this.logger.warn('GitHub adapter circuit OPEN'));
  }

  async getCommitDetails(repoUrl: string, sha: string): Promise<CommitMetadata> {
    const cacheKey = `git:github:${repoUrl}:commit:${sha}`;
    const cached = await this.cache.get<CommitMetadata>(cacheKey);
    if (cached) return cached;

    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      const result = await this.breaker.fire(async () => {
        const resp = await this.http.get(`/repos/${owner}/${repo}/commits/${sha}`);
        this.trackQuota(resp.headers as Record<string, string>);
        return resp.data;
      }) as Record<string, unknown>;

      const metadata: CommitMetadata = {
        sha,
        message: ((result['commit'] as Record<string, unknown>)['message'] as string) ?? '',
        author: (((result['commit'] as Record<string, unknown>)['author'] as Record<string, unknown>)['name'] as string) ?? '',
        authorEmail: (((result['commit'] as Record<string, unknown>)['author'] as Record<string, unknown>)['email'] as string) ?? '',
        timestamp: (((result['commit'] as Record<string, unknown>)['author'] as Record<string, unknown>)['date'] as string) ?? '',
        filesChanged: ((result['files'] as unknown[]) ?? []).length,
        additions: (result['stats'] as Record<string, unknown>)['additions'] as number ?? 0,
        deletions: (result['stats'] as Record<string, unknown>)['deletions'] as number ?? 0,
        metadataStatus: 'complete',
      };

      // Commits are immutable — cache indefinitely (7-day TTL for memory management)
      await this.cache.set(cacheKey, metadata, 7 * 24 * 3600 * 1000);
      return metadata;
    } catch (err) {
      this.logger.warn(`GitHub getCommitDetails failed for ${sha}: ${(err as Error).message}`);
      return {
        sha,
        message: '',
        author: '',
        authorEmail: '',
        timestamp: new Date().toISOString(),
        filesChanged: 0,
        additions: 0,
        deletions: 0,
        metadataStatus: 'error',
      };
    }
  }

  async getPullRequestDetails(repoUrl: string, prId: string | number): Promise<PRMetadata> {
    const cacheKey = `git:github:${repoUrl}:pr:${prId}`;
    const cached = await this.cache.get<PRMetadata>(cacheKey);
    if (cached) return cached;

    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      const result = await this.breaker.fire(async () => {
        const resp = await this.http.get(`/repos/${owner}/${repo}/pulls/${prId}`);
        this.trackQuota(resp.headers as Record<string, string>);
        return resp.data;
      }) as Record<string, unknown>;

      const metadata: PRMetadata = {
        id: prId,
        title: (result['title'] as string) ?? '',
        body: (result['body'] as string) ?? '',
        author: ((result['user'] as Record<string, unknown>)['login'] as string) ?? '',
        mergedAt: (result['merged_at'] as string) ?? undefined,
        labels: ((result['labels'] as Array<Record<string, string>>) ?? []).map((l) => l['name'] ?? ''),
        reviewers: ((result['requested_reviewers'] as Array<Record<string, string>>) ?? []).map((r) => r['login'] ?? ''),
        metadataStatus: 'complete',
      };

      if (result['merged_at']) {
        await this.cache.set(cacheKey, metadata, 7 * 24 * 3600 * 1000);
      }
      return metadata;
    } catch (err) {
      this.logger.warn(`GitHub getPullRequestDetails failed for ${prId}: ${(err as Error).message}`);
      return {
        id: prId,
        title: '',
        author: '',
        labels: [],
        reviewers: [],
        metadataStatus: 'error',
      };
    }
  }

  async getFileDiffs(repoUrl: string, sha: string): Promise<FileDiff[]> {
    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      const result = await this.breaker.fire(async () => {
        const resp = await this.http.get(`/repos/${owner}/${repo}/commits/${sha}`, {
          headers: { Accept: 'application/vnd.github.v3.diff' },
        });
        this.trackQuota(resp.headers as Record<string, string>);
        return resp.data;
      }) as { files?: Array<Record<string, unknown>> };

      return (result.files ?? []).map((f) => ({
        filename: f['filename'] as string,
        status: f['status'] as string,
        additions: f['additions'] as number,
        deletions: f['deletions'] as number,
        patch: f['patch'] as string | undefined,
      }));
    } catch (err) {
      this.logger.warn(`GitHub getFileDiffs failed for ${sha}: ${(err as Error).message}`);
      return [];
    }
  }

  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (!match) throw new Error(`Cannot parse GitHub URL: ${repoUrl}`);
    return { owner: match[1]!, repo: match[2]! };
  }

  private trackQuota(headers: Record<string, string>): void {
    const remaining = parseInt(headers['x-ratelimit-remaining'] ?? '5000', 10);
    this.remainingQuota = remaining;
    if (remaining < 100) {
      this.logger.warn(`GitHub API quota low: ${remaining} requests remaining`);
    }
  }
}

@Injectable()
export class GitLabAdapterStub implements GitProviderAdapter {
  async getCommitDetails(): Promise<CommitMetadata> {
    throw new NotImplementedException('GitLab adapter not yet implemented');
  }
  async getPullRequestDetails(): Promise<PRMetadata> {
    throw new NotImplementedException('GitLab adapter not yet implemented');
  }
  async getFileDiffs(): Promise<FileDiff[]> {
    throw new NotImplementedException('GitLab adapter not yet implemented');
  }
}

@Injectable()
export class GitProviderAdapterFactory {
  constructor(
    private readonly github: GitHubAdapter,
    private readonly gitlab: GitLabAdapterStub,
  ) {}

  resolve(providerType: string): GitProviderAdapter {
    const registry: Record<string, GitProviderAdapter> = {
      github: this.github,
      gitlab: this.gitlab,
    };
    const adapter = registry[providerType.toLowerCase()];
    if (!adapter) {
      throw new Error(`Unsupported Git provider: ${providerType}. Supported: ${Object.keys(registry).join(', ')}`);
    }
    return adapter;
  }
}
