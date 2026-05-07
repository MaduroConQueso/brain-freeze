export function getBasePathAndFileName(path: string): [string, string] {
  const splitIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (splitIndex === -1) {
    return ["", path];
  } else {
    return [path.substring(0, splitIndex), path.substring(splitIndex + 1)];
  }
}

export function getFolderAndFileName(path: string): [string, string] {
  const split = path.split(/[/\\]/);
  if (split.length < 2) {
    return ["", split[0] || path];
  } else {
    return [split[split.length - 2], split[split.length - 1]];
  }
}
