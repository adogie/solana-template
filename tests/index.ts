import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { ClockworkProvider } from "@clockwork-xyz/sdk";
import type { BankSimulator } from "../target/types/bank_simulator";

describe("Bank Simulator", async () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BankSimulator as anchor.Program<BankSimulator>;
  
  const threadId = "bank_account-1";
  const holderName = "test";
  const balance = 10.0;

  const clockworkProvider = ClockworkProvider.fromAnchorProvider(
    program.provider
  );

  const [bankAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bank_account"), Buffer.from(threadId)],
    program.programId
  );

  const [threadAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("authority")],
    program.programId
  );
  const [threadAddress] = clockworkProvider.getThreadPDA(
    threadAuthority,
    threadId
  );

  console.log("Thread ID: ", threadId);
  console.log("Bank Account: ", bankAccount.toBase58());
  console.log("Thread Authority: ", threadAuthority.toBase58());
  console.log("Thread Address: ", threadAddress.toBase58());
  console.log(
    "Clockwork Program: ",
    clockworkProvider.threadProgram.programId.toBase58()
  );

  it("Create Account", async () => {
    await program.methods
      .initializeAccount(
        Buffer.from(threadId),
        holderName,
        Number(balance.toFixed(2))
      )
      .accounts({
        holder: program.provider.publicKey,
        bankAccount: bankAccount,
        clockworkProgram: clockworkProvider.threadProgram.programId,
        thread: threadAddress,
        threadAuthority: threadAuthority,
      })
      .rpc();
  });

  it("Deposit Amount", async () => {
    await program.methods
      .deposit(Buffer.from(threadId), balance)
      .accounts({
        bankAccount: bankAccount,
        holder: program.provider.publicKey,
      })
      .rpc();
  });

  it("Withdraw Amount", async () => {
    await program.methods
      .withdraw(Buffer.from(threadId), balance)
      .accounts({
        bankAccount: bankAccount,
        holder: program.provider.publicKey,
      })
      .rpc();
  });

  it("Delete Account", async () => {
    await program.methods
      .removeAccount(Buffer.from(threadId))
      .accounts({
        holder: program.provider.publicKey,
        bankAccount: bankAccount,
        thread: threadAddress,
        threadAuthority: threadAuthority,
        clockworkProgram: clockworkProvider.threadProgram.programId,
      })
      .rpc();
  });
});
