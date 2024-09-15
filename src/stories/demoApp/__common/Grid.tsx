export const Col = (p: JSX.IntrinsicElements['div']) => (
  <div
    {...p}
    css={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
    }}
  />
);

export const Row = (p: JSX.IntrinsicElements['div']) => (
  <div
    {...p}
    css={{
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
    }}
  />
);
