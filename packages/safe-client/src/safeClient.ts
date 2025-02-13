import Safe from "@safe-global/protocol-kit";

export async function initializeSafeClient(
  provider: string,
  signer: `0x${string}`,
  safeAddress: `0x${string}`,
) {
  const protocolKit = (await Safe.default.init({
    provider,
    signer,
    safeAddress,
  })) as Safe;

  return protocolKit;
}

export default initializeSafeClient;
