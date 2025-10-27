import * as React from 'react';

type PossibleRef<T> = React.Ref<T> | undefined;

export function composeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T>).current = node;
      }
    }
  };
}

export function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  return React.useCallback(composeRefs(...refs), refs);
}
