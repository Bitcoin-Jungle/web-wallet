import helmet from "helmet"

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      connectSrc: ["'self'", "*"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["https://cr.bullbitcoin.com", "https://accounts.bullbitcoin.com", "https://maps.bitcoinjungle.app"],
    },
  },
  crossOriginEmbedderPolicy: false,
})
