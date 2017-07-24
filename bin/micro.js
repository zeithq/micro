#!/usr/bin/env node

// Native
const path = require('path')
const { existsSync } = require('fs')

// Packages
const parseArgs = require('mri')

// Utilities
const serve = require('../lib')
const handle = require('../lib/handler')
const generateHelp = require('../lib/help')
const { version } = require('../package')

// Check if the user defined any options
const flags = parseArgs(process.argv.slice(2), {
  string: ['host', 'port'],
  boolean: ['help'],
  alias: {
    p: 'port',
    H: 'host',
    h: 'help'
  },
  unknown(flag) {
    console.log(generateHelp(flag))
    process.exit()
  }
})

// When `-h` or `--help` are used, print out
// the usage information
if (flags.help) {
  console.log(generateHelp())
  process.exit()
}

// Print out the package's version when
// `--version` or `-v` are used
if (flags.version) {
  console.log(version)
  process.exit(1)
}

let file = flags._[0]

if (!file) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const packageJson = require(path.resolve(process.cwd(), 'package.json'))
    file = packageJson.main || 'index.js'
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.error(`Could not read \`package.json\`: ${err.message}`)
      process.exit(1)
    }
  }
}

if (!file) {
  console.error('Please supply a file!')
  process.exit(1)
}

if (file[0] !== '/') {
  file = path.resolve(process.cwd(), file)
}

if (!existsSync(file)) {
  console.log(`The file or directory "${path.basename(file)}" doesn't exist!`)
  process.exit(1)
}

const loadedModule = handle(file)
const server = serve(loadedModule)

let host = flags.host

if (host === '0.0.0.0') {
  host = null
}

server.on('error', err => {
  console.error('micro:', err.stack)

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})

server.listen(flags.port || 4000, host, () => {
  const details = server.address()
  const url = `http://localhost:${details.port}`
  const nodeVersion = process.version.split('v')[1].split('.')[0]

  process.on('SIGINT', () => {
    if (nodeVersion >= 8) {
      // On earlier versions of Node.js (e.g. 6), `server.close` doesn't
      // have a callback, so we need to use it synchronously
      server.close(() => process.exit(0))
    } else {
      server.close()
      process.exit(0)
    }
  })

  if (!process.env.NOW) {
    console.log(`Micro is running: ${url}`)
  }
})
