export const REGION_SHARING_KEY = "globe-region-sharing-v2";

export function regionSharingEnabled(storage: Pick<Storage, "getItem">) {
  try {
    return storage.getItem(REGION_SHARING_KEY) === "true";
  } catch {
    return false;
  }
}
