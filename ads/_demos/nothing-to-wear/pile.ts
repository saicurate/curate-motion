import { SORTED, shuffled } from "../data";

/** The hook's mess: 26 of her pieces in a fixed "random" order. */
export const SHUFFLE_PILE = shuffled(SORTED, 7).slice(0, 26);
