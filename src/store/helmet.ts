import helmet from "helmet"

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      connectSrc: ["'self'", "*"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["https://orders.bitcoinjungle.app", "https://maps.bitcoinjungle.app"],
    },
  },
  crossOriginEmbedderPolicy: false,
})
