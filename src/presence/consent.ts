/** @file Reads the versioned regional-sharing preference, defaulting to private when consent is absent or unreadable. */

export const REGION_SHARING_KEY = "globe-region-sharing-v2";

export function regionSharingEnabled(storage: Pick<Storage, "getItem">) {
  try {
    return storage.getItem(REGION_SHARING_KEY) === "true";
  } catch {
    return false;
  }
}
