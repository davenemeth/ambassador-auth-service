/*
This is a sample implementation to test ambassador external auth capabilities.
DO NOT USE THIS SERVICE IN A PRODUCTIVE ENVIRONMENT!
*/

const express = require('express')
const app = express()
const addRequestId = require('express-request-id')()

// Set up authentication middleware
const basicAuth = require('express-basic-auth')
const authenticate = basicAuth({
  'users': { 'username': 'password' },
  'challenge': true,
  'realm': 'Ambassador Realm'
})

// Always have a request ID.
app.use(addRequestId)

// Add verbose logging of requests (see below)
app.use(logRequests)

// Require authentication for /httpbin requests
app.all('/httpbin/*', authenticate, function (req, res) {
  var session = req.headers['x-leoni-session']

  if (!session) {
    console.log(`Creating x-leoni-session: ${req.id}`)
    session = req.id
    res.set('x-leoni-session', session)
  }

  console.log(`Allowing request, session ${session}`)
  res.send('OK (authenticated)')
})

// allow kubernetes ready check
app.all('/ready', function (req, res) {
  console.log('Allowing Kubernetes ready check')
  res.send('OK (kubernetes ready check)')
})

/*
// Require authentication for all requests
app.all('*', authenticate, function (req, res) {
  var session = req.headers['x-leoni-session']

  if (!session) {
    console.log(`creating x-leoni-session: ${req.id}`)
    session = req.id
    res.set('x-leoni-session', session)
  }

  console.log(`allowing QotM request, session ${session}`)
  res.send('OK (authenticated)')
})
*/

app.listen(3000, function () {
  console.log('Ambassador auth server listening on port 3000')
})

// Middleware to log requests, including basic auth header info
function logRequests (req, res, next) {
  // do not log ready checks
  if ( "/ready" == `${req.path}` ) {
    return
  }

  console.log('\nNew request')
  console.log(`  Path: ${req.path}`)
  console.log(`  Incoming headers >>>`)
  Object.entries(req.headers).forEach(
    ([key, value]) => console.log(`    ${key}: ${value}`)
  )

  // Check for expected authorization header
  const auth = req.headers['authorization']
  if (!auth) {
    console.log('  No authorization header')
    return next()
  }
  if (!auth.toLowerCase().startsWith('basic ')) {
    console.log('  Not Basic Auth')
    return next()
  }

  // Parse authorization header
  const userpass = Buffer.from(auth.slice(6), 'base64').toString()
  console.log(`  Auth decodes to "${userpass}"`)
  const splitIdx = userpass.search(':')
  if (splitIdx < 1) {  // No colon or empty username
    console.log('  Bad authorization format')
    return next()
  }

  // Extract username and password pair
  const username = userpass.slice(0, splitIdx)
  const password = userpass.slice(splitIdx + 1)
  console.log(`  Auth user="${username}" pass="${password}"`)
  return next()
}
