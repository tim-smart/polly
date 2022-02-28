import * as E from "fp-ts/Either";
import * as RTE from "fp-ts/ReaderTaskEither";

export const tryCatch =
  <R, E, A>(
    f: (r: R) => Promise<A>,
    onRejected: (reason: unknown) => E,
  ): RTE.ReaderTaskEither<R, E, A> =>
  (r) =>
  () =>
    f(r).then(E.right, (reason) => E.left(onRejected(reason)));

export const tryCatchK =
  <R, E, A extends ReadonlyArray<unknown>, B>(
    f: (r: R) => (...a: A) => Promise<B>,
    onRejected: (reason: unknown) => E,
  ): ((...a: A) => RTE.ReaderTaskEither<R, E, B>) =>
  (...a) =>
    tryCatch((r) => f(r)(...a), onRejected);

export const chainTryCatch = <R, E, A, B>(
  f: (r: R) => Promise<B>,
  onRejected: (reason: unknown) => E,
): ((fa: RTE.ReaderTaskEither<R, E, A>) => RTE.ReaderTaskEither<R, E, B>) =>
  RTE.chain(() => tryCatch(f, onRejected));

export const chainTryCatchK = <R, E, A, B>(
  f: (r: R) => (a: A) => Promise<B>,
  onRejected: (reason: unknown) => E,
): ((fa: RTE.ReaderTaskEither<R, E, A>) => RTE.ReaderTaskEither<R, E, B>) =>
  RTE.chain(tryCatchK(f, onRejected));
