type JsonPrimitive = string | number | boolean | null;
type JsonSerializableObject = {
    [key: string]: JsonSerializable | undefined  // allow undefined here because these keys will be stripped when
                                                 // stringified
}
type JsonMap = Map<string, JsonSerializable>  // will be converted into an object
type JsonArray = Array<JsonSerializable>;
type JsonSet = Set<JsonPrimitive>  // will be converted into an array

/**
 * Represents an object that can be serialized with jsonStringify() (not the native JSON.stringify)
 */
export type JsonSerializable = JsonPrimitive | JsonSerializableObject | JsonArray | JsonSet | JsonMap

function jsonReplacer(this: any, _key: string, value: any): any {
    if(value instanceof Set) {
        return Array.from(value)
    }
    if(value instanceof Map) {
        return Object.fromEntries(value.entries())
    }
    return value
}


export function jsonStringify(obj: JsonSerializable, space?: string | number): string {
    return JSON.stringify(obj, jsonReplacer, space)
}


/**
 * Represents a possible return value from JSON.parse
 */
export type JsonResponse = JsonPrimitive | JsonResponse[] | JsonResponseObject;
export type JsonResponseObject = { [key: string]: JsonResponse };
