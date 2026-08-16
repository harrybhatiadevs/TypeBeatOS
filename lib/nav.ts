export function pathMatches(
  pathname: string,
  href: string,
  aliases: string[] = [],
) {
  return [href, ...aliases].some(
    (candidate) =>
      pathname === candidate || pathname.startsWith(`${candidate}/`),
  );
}
