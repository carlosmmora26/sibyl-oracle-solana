import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SibylOracle } from "../target/types/sibyl_oracle";
import { assert } from "chai";

describe("sibyl-oracle", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SibylOracle as Program<SibylOracle>;
  const wallet = provider.wallet as anchor.Wallet;

  // PDA for oracle
  const [oraclePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("oracle")],
    program.programId
  );

  it("Initializes the oracle", async () => {
    // Initialize oracle
    await program.methods
      .initialize()
      .accounts({
        oracle: oraclePda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Fetch the oracle account
    const oracleAccount = await program.account.oracle.fetch(oraclePda);

    assert.equal(oracleAccount.authority.toString(), wallet.publicKey.toString());
    assert.equal(oracleAccount.predictionCount.toNumber(), 0);
    assert.equal(oracleAccount.correctPredictions.toNumber(), 0);
  });

  it("Creates a prediction", async () => {
    const statement = "SOL will reach $200 in the next 24h";
    const confidence = 75;
    const deadlineHours = 24;

    // Get current prediction count
    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    const predictionCount = oracleAccount.predictionCount.toNumber();

    // Find prediction PDA
    const [predictionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction"),
        new anchor.BN(predictionCount + 1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    // Create prediction
    await program.methods
      .createPrediction(statement, confidence, deadlineHours)
      .accounts({
        oracle: oraclePda,
        prediction: predictionPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Fetch the prediction account
    const predictionAccount = await program.account.prediction.fetch(predictionPda);

    assert.equal(predictionAccount.id.toNumber(), predictionCount + 1);
    assert.equal(predictionAccount.statement, statement);
    assert.equal(predictionAccount.confidence, confidence);
    assert.isFalse(predictionAccount.resolved);
    assert.isFalse(predictionAccount.outcome);
  });

  it("Fails to create prediction with invalid confidence", async () => {
    const statement = "Test prediction";
    const confidence = 101; // Invalid: > 100
    const deadlineHours = 24;

    // Get current prediction count
    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    const predictionCount = oracleAccount.predictionCount.toNumber();

    // Find prediction PDA
    const [predictionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction"),
        new anchor.BN(predictionCount + 1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    try {
      await program.methods
        .createPrediction(statement, confidence, deadlineHours)
        .accounts({
          oracle: oraclePda,
          prediction: predictionPda,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed with invalid confidence");
    } catch (error) {
      assert.include(error.message, "InvalidConfidence");
    }
  });

  it("Fails to create prediction with invalid deadline", async () => {
    const statement = "Test prediction";
    const confidence = 80;
    const deadlineHours = 0; // Invalid: must be > 0

    // Get current prediction count
    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    const predictionCount = oracleAccount.predictionCount.toNumber();

    // Find prediction PDA
    const [predictionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction"),
        new anchor.BN(predictionCount + 1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    try {
      await program.methods
        .createPrediction(statement, confidence, deadlineHours)
        .accounts({
          oracle: oraclePda,
          prediction: predictionPda,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed with invalid deadline");
    } catch (error) {
      assert.include(error.message, "InvalidDeadline");
    }
  });
});