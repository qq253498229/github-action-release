import { getInput, info, setFailed } from '@actions/core'
import { resolve } from 'node:path'
import { createWriteStream, readFileSync, statSync } from 'node:fs'
import { Octokit } from '@octokit/core'
import { env as processEnv } from 'process'
import archiver from 'archiver'

type Env = { [key: string]: string | undefined }

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // 获取传入的参数
    const files: string = getInput('files')
    info(`files:${files}`)
    const fileList = files.split('\n').map((line: string) => line)
    info(`fileList:${fileList}`)
    const draft: boolean = getInput('draft') === 'true'
    info(`draft:${draft}`)
    const env: Env = processEnv
    const envJson = JSON.stringify(env, null, 2)
    info(`envJson:${envJson}`)
    const auth = env['GITHUB_TOKEN'] || ''
    const repository = env['GITHUB_REPOSITORY'] || ''
    const owners = repository.split('/')
    const owner = owners[0]
    info(`owner: ${owner}`)
    const repo = owners[1]
    info(`repo: ${repo}`)
    const root = resolve('.')
    info(`root:${root}`)
    // 新建发布
    const octokit = new Octokit({ auth })
    const createReleaseResult = await octokit.request(
      'POST /repos/{owner}/{repo}/releases',
      {
        owner,
        repo,
        tag_name: 'latest',
        draft,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    info(`createReleaseResult.status: ${createReleaseResult.status}`)
    const json1 = JSON.stringify(createReleaseResult.data, null, 2)
    info(`createReleaseResult.data: ${json1}`)
    const release = createReleaseResult.data
    info(`release_id: ${release.id}`)
    // 上传文件
    for (const file of fileList) {
      let filePath = resolve(file)
      info(`filePath: ${filePath}`)
      const fileStat = statSync(filePath)
      const json2 = JSON.stringify(fileStat, null, 2)
      info(`fileStat: ${json2}`)
      if (fileStat.isDirectory()) {
        // 如果是文件夹那么先打成压缩包
        filePath = `${filePath}.zip`
        info(`filePath zip: ${filePath}`)
        const output = createWriteStream(filePath)
        info('createWriteStream done')
        const archive = archiver('zip', { zlib: { level: 9 } })
        info('archiver done')
        archive.directory(filePath, false)
        info('directory done')
        archive.pipe(output)
        info('pipe done')
        await archive.finalize()
        info('finalize done')
      }
      const data = readFileSync(filePath)
      info('readFileSync done')
      const uploadResult = await octokit.request(
        'POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}',
        {
          owner,
          repo,
          release_id: release.id,
          data,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )
      info(`uploadResult.status: ${uploadResult.status}`)
      const json3 = JSON.stringify(uploadResult.data, null, 2)
      info(`uploadResult.data: ${json3}`)
    }
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
