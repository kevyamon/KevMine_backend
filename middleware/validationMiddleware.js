import Joi from 'joi';

const userRegisterSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required().messages({
    'string.base': 'Le nom doit être une chaîne de caractères.',
    'string.empty': 'Le nom ne peut pas être vide.',
    'string.min': 'Le nom doit contenir au moins {#limit} caractères.',
    'string.max': 'Le nom ne peut pas dépasser {#limit} caractères.',
    'any.required': 'Le nom est requis.',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.base': 'L\'email doit être une chaîne de caractères.',
    'string.empty': 'L\'email ne peut pas être vide.',
    'string.email': 'L\'email doit être une adresse email valide.',
    'any.required': 'L\'email est requis.',
  }),
  phone: Joi.string().trim().optional().allow('').messages({ // On ajoute la validation pour le téléphone
    'string.base': 'Le numéro de téléphone doit être une chaîne de caractères.',
  }),
  password: Joi.string().min(6).required().messages({
    'string.base': 'Le mot de passe doit être une chaîne de caractères.',
    'string.empty': 'Le mot de passe ne peut pas être vide.',
    'string.min': 'Le mot de passe doit contenir au moins {#limit} caractères.',
    'any.required': 'Le mot de passe est requis.',
  }),
});

const userLoginSchema = Joi.object({
  // Mise à jour de ce champ pour accepter email ou nom d'utilisateur/téléphone
  identifier: Joi.string().trim().required().messages({
    'string.base': 'L\'identifiant doit être une chaîne de caractères.',
    'string.empty': 'L\'identifiant ne peut pas être vide.',
    'any.required': 'L\'identifiant est requis.',
  }),
  password: Joi.string().required().messages({
    'string.base': 'Le mot de passe doit être une chaîne de caractères.',
    'string.empty': 'Le mot de passe ne peut pas être vide.',
    'any.required': 'Le mot de passe est requis.',
  }),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join('. ');
    res.status(400).json({ message });
  } else {
    next();
  }
};

export { validate, userRegisterSchema, userLoginSchema };