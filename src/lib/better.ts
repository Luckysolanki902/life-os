// @/lib/better.ts

export const getBetterPercentage = (points: number) => {
    // so if points are 480 means we'll divide it by 100 first, and then take floor which will give us, 4
    const betterPercentage = Math.floor(points / 100);
    return betterPercentage;
}