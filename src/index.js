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

/**
 * Downloads the specified release of the Docker Scout Action binary from GitHub and saves it to the specified path.
 *
 * @param version The version of the release to download (e.g. "v1.2.3")
 * @param binaryPath The path to download the binary to
 * @param binaryName The name of the binary to download (e.g. "docker-scout-action_linux_amd64")
 * @returns {Promise<void>}
 */
async function downloadRelease(version, binaryPath, binaryName) {
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

    fs.mkdirSync(binaryPath, { recursive: true })

    for (const asset of release.data.assets) {
        if (asset.name === binaryName) {
            const binary = path.join(binaryPath, asset.name);
            core.info(`Downloading asset: ${asset.name} (${(asset.size / 1024 / 1024).toFixed(1)} MB)`)
            await tc.downloadTool(asset.url, binary, undefined, {
                accept: 'application/octet-stream',
            })
            return
        }
    }

    throw new Error(`Binary ${binaryName} not found in release ${version}`)
}

/**
 * Retrieves the appropriate binary name for the current platform and architecture.
 *
 * @returns {string}
 */
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

    const binaryName = getBinaryName();
    const binaryPath = path.join(__dirname, "dist");
    const binary = path.join(binaryPath, binaryName)

    // If the binary already exists (e.g. bundled with the action), use it. Otherwise, download it from GitHub.
    if (fs.existsSync(binary)) {
        core.info(`Using bundled binary: ${binaryPath}`)
    } else {
        await downloadRelease(version, binaryPath, binaryName)
    }

    if (!fs.existsSync(binary)) {
        throw new Error(`Binary not found at ${binary}`)
    }

    fs.chmodSync(binary, 0o755)

    core.info(`Using binary: ${binary}`)

    const result = childProcess.spawnSync(binary, { stdio: 'inherit' })
    if (typeof result.status === 'number') {
        process.exit(result.status)
    }
    process.exit(1)
}

main().catch((error) => {
    core.setFailed(error.message)
})
