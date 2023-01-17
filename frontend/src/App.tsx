import { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  web3,
  utils,
  BN,
} from "@project-serum/anchor";
import { Buffer } from "buffer";

import IDL from "./idl.json";

window.Buffer = Buffer;

const programId = new PublicKey(IDL.metadata.address);
const network = clusterApiUrl("devnet");
const opts: { confirmOptions: web3.ConfirmOptions } = {
  confirmOptions: {
    preflightCommitment: "processed",
  },
};
const { SystemProgram } = web3;

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const getProvider = () => {
    const connection = new Connection(network, opts.confirmOptions);
    const provider = new AnchorProvider(
      connection,
      (window as any).solana,
      opts.confirmOptions
    );

    return provider;
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with public key:",
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
        } else alert("Solana object not found! Get a Phantom wallet");
      }
    } catch (error) {
      console.error("Error is: ", error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window as any;
    if (solana) {
      const response = await solana.connect();

      console.log("Connected with public key: ", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const getCampaigns = async () => {
    const connection = new Connection(network, opts.confirmOptions);
    const provider = getProvider();
    const program = new Program(IDL as any, programId, provider);

    Promise.all(
      (await connection.getProgramAccounts(programId)).map(
        async (campaign) => ({
          ...(await program.account.campaign.fetch(campaign.pubkey)),
          pubKey: campaign.pubkey,
        })
      )
    ).then((campaigns) => setCampaigns(campaigns));
  };

  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(IDL as any, programId, provider);
      const [campaign] = await PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
          provider.wallet.publicKey.toBuffer(),
        ],
        programId
      );

      await program.methods
        .create("campaign name", "campaign description")
        .accounts({
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Created a new campagin with address: ", campaign.toString());
    } catch (error) {
      console.error("Error creating campaign account: ", error);
    }
  };

  const donate = async (publicKey: string) => {
    try {
      const provider = getProvider();
      const program = new Program(IDL as any, programId, provider);

      await program.methods
        .donate(new BN(0.2 * web3.LAMPORTS_PER_SOL))
        .accounts({
          campaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Donated some money to: ", publicKey.toString());
      getCampaigns();
    } catch (error) {
      console.error("Error donating: ", error);
    }
  };

  const withdraw = async (publicKey: any) => {
    try {
      const provider = getProvider();
      const program = new Program(IDL as any, programId, provider);

      await program.methods
        .withdraw(new BN(0.2 * web3.LAMPORTS_PER_SOL))
        .accounts({
          campaign: publicKey,
          user: provider.wallet.publicKey,
        })
        .rpc();

      console.log("Withdraw some money from: ", publicKey.toString());
      getCampaigns();
    } catch (error) {
      console.error("Error withdrawing: ", error);
    }
  };

  const renderNotConnectedContainer = () => {
    return <button onClick={connectWallet}>Connect to Wallet</button>;
  };

  const renderConnectedContainer = () => {
    return (
      <>
        <button onClick={createCampaign}>Create a campaign</button>
        <button onClick={getCampaigns}>Get a list of campaigns</button>
        <br />
        {campaigns.map((campaign) => (
          <div key={campaign.pubKey.toString()}>
            <p>Campaign ID: {campaign.pubKey.toString()}</p>
            <p>
              Balance:{" "}
              {(campaign.amountDonated / web3.LAMPORTS_PER_SOL).toString()}
            </p>
            <p>{campaign.name}</p>
            <p>{campaign.description}</p>
            <button onClick={() => donate(campaign.pubKey)}>
              Click to donate!
            </button>
            <button onClick={() => withdraw(campaign.pubKey)}>
              Click to withdraw
            </button>
            <br />
          </div>
        ))}
      </>
    );
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="App">
      {!walletAddress
        ? renderNotConnectedContainer()
        : renderConnectedContainer()}
    </div>
  );
};

export default App;
