import { z } from "zod";

export const safeMinorSchema = z.number().int().nonnegative().safe();

const cartChoiceSchema = z.object({
  choiceId: z.string().min(1),
  name: z.string(),
  extraMinor: safeMinorSchema,
});

const cartOptionSchema = z.object({
  optionId: z.string().min(1),
  name: z.string(),
  choices: z.array(cartChoiceSchema),
});

export const cartLineSchema = z.object({
  lineId: z.string().min(1),
  dishId: z.string().min(1),
  dishName: z.string(),
  basePriceMinor: safeMinorSchema,
  image: z.string().nullable(),
  options: z.array(cartOptionSchema),
  quantity: z.number().int().min(1).max(99),
});

export const cartStateSchema = z
  .object({
    version: z.literal(1),
    restaurant: z.object({ id: z.string().min(1), name: z.string() }).nullable(),
    lines: z.array(cartLineSchema),
  })
  .superRefine((cart, context) => {
    if ((cart.restaurant === null) !== (cart.lines.length === 0)) {
      context.addIssue({
        code: "custom",
        message: "Restaurant and lines must both be empty or both be present.",
      });
    }
    if (new Set(cart.lines.map((line) => line.lineId)).size !== cart.lines.length) {
      context.addIssue({ code: "custom", message: "Cart line IDs must be unique." });
    }
    for (const line of cart.lines) {
      const optionIds = line.options.map((option) => option.optionId);
      if (new Set(optionIds).size !== optionIds.length) {
        context.addIssue({ code: "custom", message: "Cart options must be unique." });
      }
      for (const option of line.options) {
        const choiceIds = option.choices.map((choice) => choice.choiceId);
        if (new Set(choiceIds).size !== choiceIds.length) {
          context.addIssue({ code: "custom", message: "Cart choices must be unique." });
        }
      }
      const unitMinor =
        line.basePriceMinor +
        line.options.reduce(
          (optionTotal, option) =>
            optionTotal +
            option.choices.reduce((choiceTotal, choice) => choiceTotal + choice.extraMinor, 0),
          0,
        );
      if (!Number.isSafeInteger(unitMinor) || !Number.isSafeInteger(unitMinor * line.quantity)) {
        context.addIssue({ code: "custom", message: "Cart line total must use safe integer cents." });
      }
    }
    const totalMinor = cart.lines.reduce((total, line) => {
      const extras = line.options.reduce(
        (optionTotal, option) =>
          optionTotal + option.choices.reduce((choiceTotal, choice) => choiceTotal + choice.extraMinor, 0),
        0,
      );
      return total + (line.basePriceMinor + extras) * line.quantity;
    }, 0);
    if (!Number.isSafeInteger(totalMinor)) {
      context.addIssue({ code: "custom", message: "Cart total must use safe integer cents." });
    }
  });

export const EMPTY_CART = Object.freeze({
  version: 1 as const,
  restaurant: null,
  lines: Object.freeze([]),
});
