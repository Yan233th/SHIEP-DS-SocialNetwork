export type TauriResult<T> =
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

export function unwrap<T>(r: TauriResult<T>): T {
  if (r.status === "ok") return r.data;
  throw new Error(r.error);
}
