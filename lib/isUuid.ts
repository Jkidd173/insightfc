export function isUuid(value: string) {
    return /^[0-9a-f-]{36}$/i.test(value);
  }