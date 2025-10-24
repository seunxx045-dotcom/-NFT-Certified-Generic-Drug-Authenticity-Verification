/** @format */

import { describe, it, expect, beforeEach } from "vitest";
import {
  stringUtf8CV,
  uintCV,
  buffCV,
  principalCV,
} from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_BATCH_ID = 101;
const ERR_INVALID_EXPIRATION = 102;
const ERR_INVALID_COMPOSITION = 103;
const ERR_INVALID_CERT_HASH = 104;
const ERR_BATCH_ALREADY_EXISTS = 106;
const ERR_BATCH_NOT_FOUND = 107;
const ERR_INVALID_DRUG_TYPE = 115;
const ERR_INVALID_QUANTITY = 110;
const ERR_INVALID_DOSAGE = 111;
const ERR_INVALID_STORAGE_CONDITIONS = 116;
const ERR_INVALID_PACKAGING = 117;
const ERR_INVALID_LOCATION = 118;
const ERR_INVALID_CURRENCY = 119;
const ERR_INVALID_BATCH_NUMBER = 125;
const ERR_MAX_BATCHES_EXCEEDED = 114;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_BATCH_EXPIRED = 123;
const ERR_INVALID_MINT_FEE = 124;
const ERR_INVALID_OWNER = 121;

interface Batch {
  batchId: string;
  expirationDate: number;
  composition: string;
  certHash: Buffer;
  manufacturer: string;
  timestamp: number;
  minter: string;
  drugType: string;
  quantity: number;
  dosage: string;
  storageConditions: string;
  packaging: string;
  location: string;
  currency: string;
  status: boolean;
  owner: string;
  batchNumber: number;
}

interface BatchUpdate {
  updateExpiration: number;
  updateComposition: string;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class DrugBatchNFTMock {
  state: {
    nextNftId: number;
    maxBatches: number;
    mintFee: number;
    authorityContract: string | null;
    batches: Map<number, Batch>;
    batchUpdates: Map<number, BatchUpdate>;
    batchesByBatchId: Map<string, number>;
  } = {
    nextNftId: 0,
    maxBatches: 100000,
    mintFee: 500,
    authorityContract: null,
    batches: new Map(),
    batchUpdates: new Map(),
    batchesByBatchId: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextNftId: 0,
      maxBatches: 100000,
      mintFee: 500,
      authorityContract: null,
      batches: new Map(),
      batchUpdates: new Map(),
      batchesByBatchId: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
    this.stxTransfers = [];
  }

  isVerifiedAuthority(principal: string): Result<boolean> {
    return { ok: true, value: this.authorities.has(principal) };
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setMintFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.mintFee = newFee;
    return { ok: true, value: true };
  }

  mintBatch(
    batchId: string,
    expirationDate: number,
    composition: string,
    certHash: Buffer,
    drugType: string,
    quantity: number,
    dosage: string,
    storageConditions: string,
    packaging: string,
    location: string,
    currency: string,
    batchNumber: number
  ): Result<number> {
    if (this.state.nextNftId >= this.state.maxBatches)
      return { ok: false, value: ERR_MAX_BATCHES_EXCEEDED };
    if (!batchId || batchId.length > 50)
      return { ok: false, value: ERR_INVALID_BATCH_ID };
    if (expirationDate <= this.blockHeight)
      return { ok: false, value: ERR_INVALID_EXPIRATION };
    if (!composition || composition.length > 200)
      return { ok: false, value: ERR_INVALID_COMPOSITION };
    if (certHash.length !== 32)
      return { ok: false, value: ERR_INVALID_CERT_HASH };
    if (!drugType || drugType.length > 50)
      return { ok: false, value: ERR_INVALID_DRUG_TYPE };
    if (quantity <= 0) return { ok: false, value: ERR_INVALID_QUANTITY };
    if (!dosage || dosage.length > 100)
      return { ok: false, value: ERR_INVALID_DOSAGE };
    if (!storageConditions || storageConditions.length > 100)
      return { ok: false, value: ERR_INVALID_STORAGE_CONDITIONS };
    if (!packaging || packaging.length > 100)
      return { ok: false, value: ERR_INVALID_PACKAGING };
    if (!location || location.length > 100)
      return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["STX", "USD", "BTC"].includes(currency))
      return { ok: false, value: ERR_INVALID_CURRENCY };
    if (batchNumber <= 0) return { ok: false, value: ERR_INVALID_BATCH_NUMBER };
    if (!this.isVerifiedAuthority(this.caller).value)
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.state.batchesByBatchId.has(batchId))
      return { ok: false, value: ERR_BATCH_ALREADY_EXISTS };
    if (!this.state.authorityContract)
      return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({
      amount: this.state.mintFee,
      from: this.caller,
      to: this.state.authorityContract,
    });

    const id = this.state.nextNftId;
    const batch: Batch = {
      batchId,
      expirationDate,
      composition,
      certHash,
      manufacturer: this.caller,
      timestamp: this.blockHeight,
      minter: this.caller,
      drugType,
      quantity,
      dosage,
      storageConditions,
      packaging,
      location,
      currency,
      status: true,
      owner: this.caller,
      batchNumber,
    };
    this.state.batches.set(id, batch);
    this.state.batchesByBatchId.set(batchId, id);
    this.state.nextNftId++;
    return { ok: true, value: id };
  }

  getBatch(id: number): Batch | null {
    return this.state.batches.get(id) || null;
  }

  updateBatch(
    id: number,
    updateExpiration: number,
    updateComposition: string
  ): Result<boolean> {
    const batch = this.state.batches.get(id);
    if (!batch) return { ok: false, value: false };
    if (batch.minter !== this.caller) return { ok: false, value: false };
    if (updateExpiration <= this.blockHeight)
      return { ok: false, value: false };
    if (!updateComposition || updateComposition.length > 200)
      return { ok: false, value: false };

    const updated: Batch = {
      ...batch,
      expirationDate: updateExpiration,
      composition: updateComposition,
      timestamp: this.blockHeight,
    };
    this.state.batches.set(id, updated);
    this.state.batchUpdates.set(id, {
      updateExpiration,
      updateComposition,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  transferBatch(id: number, newOwner: string): Result<boolean> {
    const batch = this.state.batches.get(id);
    if (!batch) return { ok: false, value: false };
    if (batch.owner !== this.caller) return { ok: false, value: false };
    if (batch.expirationDate <= this.blockHeight)
      return { ok: false, value: ERR_BATCH_EXPIRED };
    if (newOwner === this.caller)
      return { ok: false, value: ERR_INVALID_OWNER };

    const updated: Batch = {
      ...batch,
      owner: newOwner,
    };
    this.state.batches.set(id, updated);
    return { ok: true, value: true };
  }

  getBatchCount(): Result<number> {
    return { ok: true, value: this.state.nextNftId };
  }

  checkBatchExistence(batchId: string): Result<boolean> {
    return { ok: true, value: this.state.batchesByBatchId.has(batchId) };
  }

  verifyBatch(id: number): Result<boolean> {
    const batch = this.state.batches.get(id);
    if (!batch) return { ok: false, value: false };
    if (batch.status && batch.expirationDate > this.blockHeight) {
      return { ok: true, value: true };
    }
    return { ok: false, value: ERR_BATCH_EXPIRED };
  }
}

describe("DrugBatchNFT", () => {
  let contract: DrugBatchNFTMock;

  beforeEach(() => {
    contract = new DrugBatchNFTMock();
    contract.reset();
  });

  it("mints a batch successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    const result = contract.mintBatch(
      "BATCH001",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const batch = contract.getBatch(0);
    expect(batch?.batchId).toBe("BATCH001");
    expect(batch?.expirationDate).toBe(1000);
    expect(batch?.composition).toBe("Comp1");
    expect(batch?.drugType).toBe("Type1");
    expect(batch?.quantity).toBe(500);
    expect(batch?.dosage).toBe("Dosage1");
    expect(batch?.storageConditions).toBe("Store cool");
    expect(batch?.packaging).toBe("Box");
    expect(batch?.location).toBe("Loc1");
    expect(batch?.currency).toBe("STX");
    expect(batch?.batchNumber).toBe(1);
    expect(contract.stxTransfers).toEqual([
      { amount: 500, from: "ST1TEST", to: "ST2TEST" },
    ]);
  });

  it("rejects duplicate batch ids", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH001",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    const result = contract.mintBatch(
      "BATCH001",
      2000,
      "Comp2",
      certHash,
      "Type2",
      1000,
      "Dosage2",
      "Store dry",
      "Bottle",
      "Loc2",
      "USD",
      2
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_BATCH_ALREADY_EXISTS);
  });

  it("rejects non-authorized caller", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.caller = "ST2FAKE";
    contract.authorities = new Set();
    const certHash = Buffer.alloc(32);
    const result = contract.mintBatch(
      "BATCH002",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects mint without authority contract", () => {
    const certHash = Buffer.alloc(32);
    const result = contract.mintBatch(
      "BATCH003",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid expiration", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    const result = contract.mintBatch(
      "BATCH004",
      0,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_EXPIRATION);
  });

  it("rejects invalid cert hash", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(31);
    const result = contract.mintBatch(
      "BATCH005",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CERT_HASH);
  });

  it("updates a batch successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH006",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    const result = contract.updateBatch(0, 2000, "Comp2");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const batch = contract.getBatch(0);
    expect(batch?.expirationDate).toBe(2000);
    expect(batch?.composition).toBe("Comp2");
    const update = contract.state.batchUpdates.get(0);
    expect(update?.updateExpiration).toBe(2000);
    expect(update?.updateComposition).toBe("Comp2");
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update for non-existent batch", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.updateBatch(99, 2000, "Comp2");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects update by non-minter", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH007",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    contract.caller = "ST3FAKE";
    const result = contract.updateBatch(0, 2000, "Comp2");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("transfers a batch successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH008",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    const result = contract.transferBatch(0, "ST4NEW");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const batch = contract.getBatch(0);
    expect(batch?.owner).toBe("ST4NEW");
  });

  it("rejects transfer of expired batch", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH009",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    contract.blockHeight = 1001;
    const result = contract.transferBatch(0, "ST4NEW");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_BATCH_EXPIRED);
  });

  it("verifies a valid batch", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH010",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    const result = contract.verifyBatch(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
  });

  it("rejects verification of expired batch", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH011",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    contract.blockHeight = 1001;
    const result = contract.verifyBatch(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_BATCH_EXPIRED);
  });

  it("sets mint fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setMintFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.mintFee).toBe(1000);
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH012",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(contract.stxTransfers).toEqual([
      { amount: 1000, from: "ST1TEST", to: "ST2TEST" },
    ]);
  });

  it("returns correct batch count", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH013",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    contract.mintBatch(
      "BATCH014",
      2000,
      "Comp2",
      certHash,
      "Type2",
      1000,
      "Dosage2",
      "Store dry",
      "Bottle",
      "Loc2",
      "USD",
      2
    );
    const result = contract.getBatchCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("checks batch existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH015",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    const result = contract.checkBatchExistence("BATCH015");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const result2 = contract.checkBatchExistence("NonExistent");
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("rejects mint with empty batch id", () => {
    contract.setAuthorityContract("ST2TEST");
    const certHash = Buffer.alloc(32);
    const result = contract.mintBatch(
      "",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_BATCH_ID);
  });

  it("rejects mint with max batches exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxBatches = 1;
    const certHash = Buffer.alloc(32);
    contract.mintBatch(
      "BATCH017",
      1000,
      "Comp1",
      certHash,
      "Type1",
      500,
      "Dosage1",
      "Store cool",
      "Box",
      "Loc1",
      "STX",
      1
    );
    const result = contract.mintBatch(
      "BATCH018",
      2000,
      "Comp2",
      certHash,
      "Type2",
      1000,
      "Dosage2",
      "Store dry",
      "Bottle",
      "Loc2",
      "USD",
      2
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_BATCHES_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });

  it("rejects invalid authority contract", () => {
    const result = contract.setAuthorityContract(
      "SP000000000000000000002Q6VF78"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
});
