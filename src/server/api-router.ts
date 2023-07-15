import express from "express"

import { handleWhoAmI } from "kratos/index"
import { Request, Response } from "express-serve-static-core"

const jwt = require('jsonwebtoken')

let origin = ""

if(process.env.NODE_ENV === "production") {
  origin = `https://${process.env.HOST}`
} else {
  origin = `http://${process.env.HOST}:${process.env.PORT}`
}

const privatekey = (process.env.APPLE_MAPS_KEY ? process.env.APPLE_MAPS_KEY.replace(/\\n/gm, '\n') : "")
const keyid = process.env.MAPS_KEY_ID;
const issuer = process.env.APPLE_TEAM_ID;

const apiRouter = express.Router({ caseSensitive: true })

apiRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const kratosSession = await handleWhoAmI(req)

    if (!kratosSession) {
      return res.status(401).send("Invalid auth token")
    }

    const authSession = {
      identity: {
        id: kratosSession.identity.id,
        uid: kratosSession.identity.id,
        phoneNumber: kratosSession.identity.traits?.phone,
        emailAddress: kratosSession.identity.traits?.email,
        firstName: kratosSession.identity.traits.name?.first,
        lastName: kratosSession.identity.traits.name?.last,
      },
    }

    req.session = req.session || {}
    req.session.authSession = authSession
    return res.send(authSession)
  } catch (err) {
    console.error(err)
    return res
      .status(500)
      .send({ error: err instanceof Error ? err.message : "Something went wrong" })
  }
})

apiRouter.get('/token', (req, res) => {
  const token = jwt.sign({
    origin
  }, privatekey, {
    algorithm: 'ES256',
    expiresIn: "1d",
    keyid,
    issuer,
  })

  return res.status(200).send(token)
})

export default apiRouter
