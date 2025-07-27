export default {
  branches: [
    // Production branch for stable releases (e.g., 1.5.0)
    'main',
    // Pre-release branch for release candidates (e.g., 1.6.0-rc.1)
    {
      name: 'next',
      prerelease: 'rc',
      channel: 'next',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@anolilab/semantic-release-pnpm',
      {
        npmPublish: true,
        pkgRoot: '.',
        tarballDir: 'dist',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          // eslint-disable-next-line no-template-curly-in-string
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
}
