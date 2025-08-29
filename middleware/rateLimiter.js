import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests par utilisateur par 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  keyGenerator: (req, res) => {
    // CORRECTION : On se base maintenant sur l'identifiant générique
    return req.body.identifier;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Trop de tentatives de connexion avec ce compte. Veuillez réessayer dans 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    });
  },
});

export { loginLimiter };