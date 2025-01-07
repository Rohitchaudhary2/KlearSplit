import Joi from "joi";

export const createPayment = Joi.object({
  "amount": Joi.number().positive().max(9999999999.99).required(),
  "type": Joi.string().trim().valid("friends", "groups").required(),
  "id": Joi.string().uuid().required(),
  "payerId": Joi.string().uuid().required(),
  "debtorId": Joi.string().uuid().required()
});
