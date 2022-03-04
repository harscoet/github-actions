async function run(): Promise<void> {
  const workspace = process.env.GITHUB_WORKSPACE

  if (!workspace) {
    throw new Error('GITHUB_WORKSPACE is required')
  }
}

run()
