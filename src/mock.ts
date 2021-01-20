import { Callback } from 'redis';

type Res = number | undefined;

export function mockCallback(err: Error | null, res: Res) {
    return (...args: (string | number | Callback<Res>)[]): boolean => {
        const cb = args[args.length - 1];
        if (typeof cb === 'function') {
            cb(err, res);
        }
        return false;
    };
}
