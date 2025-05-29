import { getInput, info, setFailed } from '@actions/core'
import { basename, resolve } from 'node:path'
import { Octokit } from '@octokit/core'
import { env } from 'process'

type Env = { [key: string]: string | undefined }

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const files: string = getInput('files')
    info(`files:${files}`)
    const env1: Env = env
    const envJson = JSON.stringify(env1, null, 2)
    info(`envJson:${envJson}`)
    const auth = ``
    const owner = `qq253498229`
    const repo = `docs-me`

    const octokit = new Octokit({ auth })
    const releases = await octokit.request(
      'GET /repos/{owner}/{repo}/releases',
      {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    const status = releases.status
    info(`status:${status}`)
    const data = releases.data
    const json = JSON.stringify(data, null, 2)
    info(`json:${json}`)

    const root = resolve('.')
    info(`root:${root}`)
    const name = basename(root)
    info(`basename:${name}`)

    // const scanResult = await scanAsync(root)
    // const result = JSON.stringify(scanResult)
    // info(`result:${result}`)

    // const result = parse('.')
    // info(`result:${result}`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message)
  }
}
