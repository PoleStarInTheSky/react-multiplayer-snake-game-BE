const IDSet: Set<string> = new Set();
export function makeID(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  do {
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  } while (!IDSet.has(result));
  IDSet.add(result);
  return result;
}
export function freeID(ID: string) {
  IDSet.delete(ID);
}
