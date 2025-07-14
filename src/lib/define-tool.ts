import type { ZodSchema} from 'zod';
import {z} from 'zod'
import type { TSchema} from '@sinclair/typebox';
import {type Static} from '@sinclair/typebox'
import {Value} from '@sinclair/typebox/value'

/**
 * The result of a tool's parsing function.
 */
export type ParseResult = { success: true; data: any; } | { success: false; error: any; };

/**
 * A self-contained object holding all necessary information and logic for a tool.
 */
export type ToolImplementation = {
    description: string;
    parameters: any; // This will be the JSON Schema object
    parse: (rawArgs: any) => ParseResult;
    exec: (params: any) => any;
};

/**
 * Creates a complete tool implementation object using a Zod schema.
 * It handles schema-to-JSON-Schema conversion and creates a validation/parsing function.
 */
export function defineZodTool<P extends ZodSchema>(
    definition: {
        desc: string,
        params: P,
        exec: (params: z.infer<P>) => any
    }
): ToolImplementation {
    return {
        description: definition.desc,
        parameters: z.toJSONSchema(definition.params),
        exec: definition.exec,
        parse: (rawArgs: any) => {
            const result = definition.params.safeParse(rawArgs);
            if (!result.success) {
                return {
                    success: false,
                    error: {
                        status: "error",
                        message: "Error validating input parameters",
                        errors: z.flattenError(result.error)
                    }
                };
            }
            return { success: true, data: result.data };
        }
    };
}

/**
 * Creates a complete tool implementation object using a Typebox schema.
 * The Typebox schema itself is used as the JSON schema.
 */
export function defineTypeboxTool<P extends TSchema>(
    definition: {
        desc: string,
        params: P,
        exec: (params: Static<P>) => any
    }
): ToolImplementation {
    return {
        description: definition.desc,
        parameters: definition.params, // Typebox schema is already JSON Schema
        exec: definition.exec,
        parse: (rawArgs: any) => {
            try {
                const data = Value.Parse(definition.params, rawArgs);
                return { success: true, data };
            } catch (e: any) {
                if (e && typeof e.Errors === 'function') {
                    return {
                        success: false,
                        error: {
                            status: "error",
                            message: "Error validating input parameters",
                            errors: [...e.Errors()]
                        }
                    };
                }
                // This was not a validation error, rethrow it for the execution handler.
                throw e;
            }
        }
    };
}
