export function setComponentNameForDebugging(
  Fn: Function & Partial<Record<'name' | 'displayName', string>>,
  error: Error,
) {
  const sourceFileLine = error.stack?.split('\n')?.[2];

  // @example http://localhost:9005/root/navBar/NavBar.tsx?t=1708482663107:34:26
  const stackPath = sourceFileLine
    ?.split(/\s*at /)?.[1]
    ?.replace(/[?]t=\d+/, '');

  const fileName = stackPath?.match(/\/([^/]+)\.tsx?/)?.[1];
  const name = `COMPONENT in ${fileName} ${stackPath}`;

  return Object.defineProperties(Fn, {
    name: { value: name },
    displayName: { value: name },
  });
}
