const childProcess = require('child_process')
const os = require('os')
const path = require('path')
const process = require('process')

const BinaryName = "docker-scout-action"

function chooseBinary() {
    const platform = os.platform()
    const arch = os.arch()

    if (platform === 'darwin' && arch === 'x64') {
        return `${BinaryName}_darwin_amd64`
    }
    if (platform === 'darwin' && arch === 'arm64') {
        return `${BinaryName}_darwin_arm64`
    }
    if (platform === 'linux' && arch === 'x64') {
        return `${BinaryName}_linux_amd64`
    }
    if (platform === 'linux' && arch === 'arm64') {
        return `${BinaryName}_linux_arm64`
    }
    if (platform === 'win32' && arch === 'x64') {
        return `${BinaryName}_windows_amd64.exe`
    }
    if (platform === 'win32' && arch === 'arm64') {
        return `${BinaryName}_windows_arm64.exe`
    }

    console.error(`Unsupported platform (${platform}) and architecture (${arch})`)
    process.exit(1)

    return `${BinaryName}_${platform}_${arch}`
}

function main() {
    const binary = chooseBinary()
    const mainScript = path.join(__dirname, "dist", binary);
    const spawnSyncReturns = childProcess.spawnSync(mainScript, { stdio: 'inherit' })
    const status = spawnSyncReturns.status
    if (typeof status === 'number') {
        process.exit(status)
    }
    process.exit(1)
}

if (require.main === module) {
    main()
}