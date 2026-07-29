/** @format */

export function logError(error: unknown, message: string): void {
  console.log(`${message}: ${error instanceof Error ? error.stack : String(error)}`);
}
