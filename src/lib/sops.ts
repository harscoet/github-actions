import {exec} from './util'

export async function extract(key: string, filepath: string): Promise<string> {
  const {stdout} = await exec(`sops -d --extract '["${key}"]' ${filepath}`)

  return stdout
}
