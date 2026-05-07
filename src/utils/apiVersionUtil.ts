export function minApiVersion(version: string, minVersion: string): boolean {
  if (!version || version === "-1") return false;
  const parseVersion = (v: string) => v.split(".").map(Number);
  const [major, minor, patch] = parseVersion(version);
  const [minMajor, minMinor, minPatch] = parseVersion(minVersion);
  if (major < minMajor) return false;
  if (major === minMajor && minor < minMinor) return false;
  if (major === minMajor && minor === minMinor && patch < minPatch) return false;
  return true;
}

export function isApiEndpointHealthy(version: string): boolean {
  return version !== "-1";
}

export function supportsRescan(version: string): boolean {
  return minApiVersion(version, "1.1");
}