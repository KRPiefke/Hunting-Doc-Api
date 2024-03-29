const Joi = require("joi");

// * Register Validation
const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(6).max(32).alphanum().required(),
    password: Joi.string()
      .min(8)
      .max(32)
      .required()
      .pattern(
        new RegExp(
          /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:#;<>,.?\/~_+\-=|]).{8,32}$/
        )
      ),
    email: Joi.string().min(6).required().email(),
    scopes: Joi.array().items(Joi.string().max(16)).max(16),
  });
  return schema.validate(data);
};

// * Login Validation
const loginValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(6).max(32).alphanum().required(),
    refresh_tokens: Joi.array().items(Joi.string()).max(11),
    password: Joi.string()
      .min(8)
      .max(32)
      .required()
      .pattern(
        new RegExp(
          /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:#;<>,.?\/~_+\-=|]).{8,32}$/
        )
      ),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
