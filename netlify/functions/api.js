const serverless = require('serverless-http')
const { app, initialise } = require('../../server')

const expressHandler = serverless(app)

exports.handler = async (event, context) => {
  try {
    await initialise()
    return await expressHandler(event, context)
  } catch (error) {
    console.error('API startup failed:', error)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: { message: 'The API is not configured correctly.' } }),
    }
  }
}
