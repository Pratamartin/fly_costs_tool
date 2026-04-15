import { validator } from "hono/validator";

//#region src/index.ts
function zValidatorFunction(target, schema, hook, options) {
	return validator(target, async (value, c) => {
		let validatorValue = value;
		if (target === "header" && "_def" in schema || target === "header" && "_zod" in schema) {
			const schemaKeys = Object.keys("in" in schema ? schema.in.shape : schema.shape);
			const caseInsensitiveKeymap = Object.fromEntries(schemaKeys.map((key) => [key.toLowerCase(), key]));
			validatorValue = Object.fromEntries(Object.entries(value).map(([key, value$1]) => [caseInsensitiveKeymap[key] || key, value$1]));
		}
		const result = options && options.validationFunction ? await options.validationFunction(schema, validatorValue) : await schema.safeParseAsync(validatorValue);
		if (hook) {
			const hookResult = await hook({
				data: validatorValue,
				...result,
				target
			}, c);
			if (hookResult) {
				if (hookResult instanceof Response) return hookResult;
				if ("response" in hookResult) return hookResult.response;
			}
		}
		if (!result.success) return c.json(result, 400);
		return result.data;
	});
}
const zValidator = zValidatorFunction;

//#endregion
export { zValidator };
//# sourceMappingURL=index.js.map