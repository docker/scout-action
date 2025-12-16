const childProcess = require('child_process')
const os = require('os')
const path = require('path')
const process = require('process')

function main() {
    const binary = chooseBinary()
    const spawnSyncReturns = childProcess.spawnSync(BinaryName, { stdio: 'inherit' })
    const status = spawnSyncReturns.status
    if (typeof status === 'number') {
        process.exit(status)
    }
    process.exit(1)
}

if (require.main === module) {
    main()
}