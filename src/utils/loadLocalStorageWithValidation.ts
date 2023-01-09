import {z} from "zod";

// Load from local storage with validation
export function loadLocalStorageWithValidation<Output>(zodType: z.ZodType<Output>, key: string): Output | undefined {
  const item: string | null = window.localStorage.getItem(key);
  if (item !== null) {
    const parseReturn = zodType.safeParse(JSON.parse(item));
    if (!parseReturn.success) {
      return undefined;
    }
    return parseReturn.data;
  }
}
