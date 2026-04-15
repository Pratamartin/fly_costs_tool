//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let hono_validator = require("hono/validator");
hono_validator = __toESM(hono_validator);

//#region src/index.ts
function zValidatorFunction(target, schema, hook, options) {
	return (0, hono_validator.validator)(target, async (value, c) => {
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
exports.zValidator = zValidator;