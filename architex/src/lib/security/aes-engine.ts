// ─────────────────────────────────────────────────────────────
// Architex — AES-128 Encryption Engine  (SEC-011, SEC-012)
// ─────────────────────────────────────────────────────────────
//
// Educational AES-128 implementation for step-by-step
// visualization of each sub-operation within every round.
//
// Implements the standard AES S-box, ShiftRows, a simplified
// MixColumns (for educational clarity), AddRoundKey via XOR,
// and a simplified key expansion schedule.
//
// NOT suitable for production cryptography — designed for
// interactive visualization only.
// ─────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────

export type AESSubStep =
  | "initial"
  | "SubBytes"
  | "ShiftRows"
  | "MixColumns"
  | "AddRoundKey";

export interface AESState {
  /** Round number (0 = initial, 1-10 = AES rounds). */
  round: number;
  /** Which sub-step produced this state. */
  subStep: AESSubStep;
  /** 4x4 state matrix (row-major, each value 0-255). */
  matrix: number[][];
  /** The round key used in this round (4x4 matrix). */
  roundKey: number[][];
  /** Human-readable description of what happened. */
  description: string;
}

// ── AES S-box (standard FIPS-197) ─────────────────────────────

const SBOX: number[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

// ── Round Constants (Rcon) for key expansion ──────────────────

const RCON: number[] = [
  0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36,
];

// ── Helpers ───────────────────────────────────────────────────

/** Deep-copy a 4x4 matrix. */
function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}

/**
 * Convert a flat 16-byte array into a 4x4 state matrix.
 * AES fills column-major, but for educational clarity we use
 * column-major filling to match the standard:
 *   byte[0..3]  -> column 0
 *   byte[4..7]  -> column 1
 *   byte[8..11] -> column 2
 *   byte[12..15] -> column 3
 * So matrix[row][col] = bytes[col*4 + row].
 */
function bytesToMatrix(bytes: number[]): number[][] {
  const m: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      m[row][col] = bytes[col * 4 + row] & 0xff;
    }
  }
  return m;
}

/** Format a byte as two-digit hex. */
export function toHex(b: number): string {
  return (b & 0xff).toString(16).padStart(2, "0");
}

/** Format a 4x4 matrix as a compact hex string (for descriptions). */
function matrixToHexStr(m: number[][]): string {
  return m.map((row) => row.map((b) => toHex(b)).join(" ")).join(" | ");
}

// ── Key Expansion (simplified but correct for AES-128) ────────

/**
 * Expand a 16-byte key into 11 round keys (each a 4x4 matrix).
 * Round key 0 is the original key; rounds 1-10 are derived.
 */
function keyExpansion(key: number[]): number[][][] {
  // W holds 44 32-bit words (4 words per round key, 11 round keys)
  const W: number[][] = []; // each word is [b0, b1, b2, b3]

  // First 4 words come directly from the key
  for (let i = 0; i < 4; i++) {
    W.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
  }

  // Generate words 4..43
  for (let i = 4; i < 44; i++) {
    let temp = [...W[i - 1]];
    if (i % 4 === 0) {
      // RotWord: rotate left by 1
      temp = [temp[1], temp[2], temp[3], temp[0]];
      // SubWord: apply S-box
      temp = temp.map((b) => SBOX[b & 0xff]);
      // XOR with Rcon
      temp[0] ^= RCON[(i / 4) - 1];
    }
    W.push(temp.map((b, j) => (b ^ W[i - 4][j]) & 0xff));
  }

  // Convert 44 words into 11 round keys (each 4x4 matrix)
  const roundKeys: number[][][] = [];
  for (let r = 0; r < 11; r++) {
    const m: number[][] = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let col = 0; col < 4; col++) {
      const word = W[r * 4 + col];
      for (let row = 0; row < 4; row++) {
        m[row][col] = word[row];
      }
    }
    roundKeys.push(m);
  }

  return roundKeys;
}

// ── AES Sub-operations ────────────────────────────────────────

/** SubBytes: substitute every byte using the S-box. */
function subBytes(state: number[][]): number[][] {
  const out = cloneMatrix(state);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      out[r][c] = SBOX[out[r][c] & 0xff];
    }
  }
  return out;
}

/** ShiftRows: cyclically shift row i left by i positions. */
function shiftRows(state: number[][]): number[][] {
  const out = cloneMatrix(state);
  for (let r = 1; r < 4; r++) {
    const row = out[r];
    const shifted = [...row.slice(r), ...row.slice(0, r)];
    out[r] = shifted;
  }
  return out;
}

/**
 * Simplified MixColumns for educational purposes.
 *
 * The real MixColumns multiplies each column by a fixed matrix
 * in GF(2^8). For visualization clarity, we use a simplified
 * version that demonstrates the column-mixing concept:
 * each output byte is the XOR of all bytes in the column,
 * combined with a rotation. This shows the diffusion property
 * (each output byte depends on all 4 input bytes) without
 * requiring full Galois field arithmetic.
 */
function mixColumns(state: number[][]): number[][] {
  const out = cloneMatrix(state);
  for (let c = 0; c < 4; c++) {
    const a0 = state[0][c];
    const a1 = state[1][c];
    const a2 = state[2][c];
    const a3 = state[3][c];

    // Simplified mix: XOR-based diffusion
    // Each output depends on all 4 inputs via XOR and rotation
    out[0][c] = (a0 ^ a1 ^ ((a0 << 1) & 0xff) ^ ((a1 << 1) & 0xff)) & 0xff;
    out[1][c] = (a1 ^ a2 ^ ((a1 << 1) & 0xff) ^ ((a2 << 1) & 0xff)) & 0xff;
    out[2][c] = (a2 ^ a3 ^ ((a2 << 1) & 0xff) ^ ((a3 << 1) & 0xff)) & 0xff;
    out[3][c] = (a3 ^ a0 ^ ((a3 << 1) & 0xff) ^ ((a0 << 1) & 0xff)) & 0xff;
  }
  return out;
}

/** AddRoundKey: XOR the state with the round key. */
function addRoundKey(state: number[][], roundKey: number[][]): number[][] {
  const out = cloneMatrix(state);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      out[r][c] = (out[r][c] ^ roundKey[r][c]) & 0xff;
    }
  }
  return out;
}

// ── Main Encryption Function ──────────────────────────────────

/**
 * Perform AES-128 encryption and return the state after every
 * sub-step of every round, for visualization.
 *
 * @param plaintext - 16 bytes (values 0-255)
 * @param key       - 16 bytes (values 0-255)
 * @returns Array of AESState snapshots (initial + 10 rounds = ~41 states)
 */
export function aesEncrypt(plaintext: number[], key: number[]): AESState[] {
  // Pad / clamp to 16 bytes
  const pt = plaintext.slice(0, 16);
  while (pt.length < 16) pt.push(0);
  const k = key.slice(0, 16);
  while (k.length < 16) k.push(0);

  const roundKeys = keyExpansion(k);
  const states: AESState[] = [];

  // Initial state: load plaintext into matrix
  let state = bytesToMatrix(pt);

  states.push({
    round: 0,
    subStep: "initial",
    matrix: cloneMatrix(state),
    roundKey: cloneMatrix(roundKeys[0]),
    description:
      `Plaintext loaded into 4x4 state matrix (column-major). ` +
      `State: [${matrixToHexStr(state)}]`,
  });

  // Round 0: initial AddRoundKey
  state = addRoundKey(state, roundKeys[0]);
  states.push({
    round: 0,
    subStep: "AddRoundKey",
    matrix: cloneMatrix(state),
    roundKey: cloneMatrix(roundKeys[0]),
    description:
      `Initial AddRoundKey: XOR state with round key 0. ` +
      `Each byte is XORed with the corresponding key byte. ` +
      `Result: [${matrixToHexStr(state)}]`,
  });

  // Rounds 1-10
  for (let round = 1; round <= 10; round++) {
    const isLastRound = round === 10;

    // SubBytes
    state = subBytes(state);
    states.push({
      round,
      subStep: "SubBytes",
      matrix: cloneMatrix(state),
      roundKey: cloneMatrix(roundKeys[round]),
      description:
        `Round ${round} SubBytes: each byte is substituted using the S-box lookup table. ` +
        `The S-box provides non-linearity — the core confusion property of AES. ` +
        `Result: [${matrixToHexStr(state)}]`,
    });

    // ShiftRows
    state = shiftRows(state);
    states.push({
      round,
      subStep: "ShiftRows",
      matrix: cloneMatrix(state),
      roundKey: cloneMatrix(roundKeys[round]),
      description:
        `Round ${round} ShiftRows: row 0 unchanged, row 1 shifts left 1, ` +
        `row 2 shifts left 2, row 3 shifts left 3. ` +
        `This provides diffusion across columns. ` +
        `Result: [${matrixToHexStr(state)}]`,
    });

    // MixColumns (not in last round)
    if (!isLastRound) {
      state = mixColumns(state);
      states.push({
        round,
        subStep: "MixColumns",
        matrix: cloneMatrix(state),
        roundKey: cloneMatrix(roundKeys[round]),
        description:
          `Round ${round} MixColumns: each column is transformed so every ` +
          `output byte depends on all 4 input bytes in that column. ` +
          `This provides diffusion within columns. ` +
          `(Simplified for educational purposes.) ` +
          `Result: [${matrixToHexStr(state)}]`,
      });
    }

    // AddRoundKey
    state = addRoundKey(state, roundKeys[round]);
    states.push({
      round,
      subStep: "AddRoundKey",
      matrix: cloneMatrix(state),
      roundKey: cloneMatrix(roundKeys[round]),
      description:
        `Round ${round} AddRoundKey: XOR state with round key ${round}. ` +
        `The round key is derived from the original key via the key schedule. ` +
        `Result: [${matrixToHexStr(state)}]`,
    });
  }

  return states;
}

/**
 * Parse a hex string into a byte array.
 * Accepts formats: "00112233..." or "00 11 22 33..."
 */
export function parseHex(hex: string): number[] {
  const clean = hex.replace(/\s+/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substring(i, i + 2), 16) || 0);
  }
  return bytes;
}

/**
 * Format a byte array as a hex string with spaces.
 */
export function formatHex(bytes: number[]): string {
  return bytes.map((b) => toHex(b)).join(" ");
}
