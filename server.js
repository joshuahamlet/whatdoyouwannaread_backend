const fs = require('fs')
const http = require('http');
const { ApolloServer } = require('apollo-server-express')
const cors = require('cors')
const express = require('express')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt');

require('dotenv/config')

//const {doesitWork} = require('./cron')
//doesitWork()

const port = 9001
const app = express()

app.use(
  cors(), 
  express.urlencoded({ extended: true }), 
  express.json(),
  expressJwt({ credentialsRequired: false, secret: process.env.TOKEN_SECRET })   
)

const typeDefs = fs.readFileSync('./schema.graphql', {encoding: 'utf8'})
const resolvers = require('./resolvers')

function context({req, connection}) {
  if (req && req.user) {
    return {userId: req.user.sub};
  }
  if (connection && connection.context && connection.context.accessToken) {
    const decodedToken = jwt.verify(connection.context.accessToken, process.env.TOKEN_SECRET);
    return {userId: decodedToken.sub};
  }
  return {};
}

const apolloServer = new ApolloServer({typeDefs, resolvers, context})
apolloServer.applyMiddleware({app, path: '/graphql'})

const authRoute = require('./routes/auth')
app.use('/auth', authRoute)

const httpServer = http.createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);
httpServer.listen(port, () => console.log(`Server started on port ${port}`));