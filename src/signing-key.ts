import {computed, type ComputedRef} from "vue";

export const ecdsaP384SigningKeyPairPromise: ComputedRef<Promise<CryptoKeyPair>> = (() => {
  const keyPairPromise = window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-384' },
    false,
    ['sign', 'verify'],
  );
  const inner = computed(() => keyPairPromise);
  return inner;
})();
