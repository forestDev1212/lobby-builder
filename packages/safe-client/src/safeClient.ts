import Safe from "@safe-global/protocol-kit";

export async function initializeSafeClient(
  provider: string,
  signer: `0x${string}`,
  safeAddress: `0x${string}`,
) {
  // Figure out where the init function is located.
  // In an ESM environment it may be inside Safe.default,
  // while in other environments it may be directly on Safe.
  const initFn = (Safe as any).default?.init ?? (Safe as any).init;

  if (typeof initFn !== "function") {
    throw new Error(
      "Could not find an init function in the Safe module. Check the SDK export or version.",
    );
  }

  const protocolKit = (await initFn({ provider, signer, safeAddress })) as Safe;
  return protocolKit;
}
export default initializeSafeClient;
