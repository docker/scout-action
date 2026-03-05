const core = require('@actions/core')
const github = require('@actions/github')
const tc = require('@actions/tool-cache')

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const process = require('process')

const { fileURLToPath } = require('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadRelease(version, binaryName) {
    const octokit = github.getOctokit(core.getInput('github-token'))

    let release;
    try {
        release = await octokit.rest.repos.getReleaseByTag({
            owner: 'docker',
            repo: 'scout-action',
            tag: version,
        })
    } catch (e) {
        core.info(`Failed to find release for version ${version}`)

        throw e
    }

    const downloadDir = path.join(os.tmpdir(), `scout-action-${version}`)
    fs.mkdirSync(downloadDir, { recursive: true })

    for (const asset of release.data.assets) {
        if (asset.name === binaryName) {
            let binaryPath = path.join(downloadDir, asset.name);
            core.info(`Downloading asset: ${asset.name} (${(asset.size / 1024 / 1024).toFixed(1)} MB)`)
            return await tc.downloadTool(asset.url, binaryPath, undefined, {
                accept: 'application/octet-stream',
            })
        }
    }

    throw new Error(`Binary ${binaryName} not found in release ${version}`)
}

function getBinaryName() {
    const platform = os.platform()
    const arch = os.arch()

    if (platform === 'darwin' && arch === 'x64') {
        return 'docker-scout-action_darwin_amd64'
    }
    if (platform === 'darwin' && arch === 'arm64') {
        return 'docker-scout-action_darwin_arm64'
    }
    if (platform === 'linux' && arch === 'x64') {
        return 'docker-scout-action_linux_amd64'
    }
    if (platform === 'linux' && arch === 'arm64') {
        return 'docker-scout-action_linux_arm64'
    }
    if (platform === 'win32' && arch === 'x64') {
        return 'docker-scout-action_windows_amd64.exe'
    }
    if (platform === 'win32' && arch === 'arm64') {
        return 'docker-scout-action_windows_arm64.exe'
    }

    throw new Error(`Unsupported platform (${platform}) and architecture (${arch})`)
}

async function main() {
    const version = "__VERSION__"

    let binaryName = getBinaryName();
    let binaryPath;

    const localBinaryPath = path.join(__dirname, "dist", binaryName)
    if (fs.existsSync(localBinaryPath)) {
        binaryPath = localBinaryPath
        core.info(`Using bundled binary: ${binaryPath}`)
    } else {
        binaryPath = await downloadRelease(version, binaryName)
    }

    if (!fs.existsSync(binaryPath)) {
        throw new Error(`Binary not found at ${binaryPath}`)
    }

    fs.chmodSync(binaryPath, 0o755)

    core.info(`Using binary: ${binaryPath}`)

    const result = childProcess.spawnSync(binaryPath, { stdio: 'inherit' })
    if (typeof result.status === 'number') {
        process.exit(result.status)
    }
    process.exit(1)
}

main().catch((error) => {
    core.setFailed(error.message)
})
