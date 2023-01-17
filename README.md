# Crowd Funding DAPP

An example Dapp project build for Solana network using the Anchor framework.

## Things Learned

1. To generate a new public-private key use command:
   ```sh
   solana-keygen new -o id.json
   ```
2. After modifing src folder and Anchor.toml use command:

   ```sh
   anchor build
   ```

   we can get the program id by using command:

   ```sh
   solana address -k ./target/deploy/crowd_funding-keypair.json
   ```

   then, we copy the program id and past it in

   - crowd_funding field inside Anchor.toml.
   - declare_id! macro inside src/lib.rs.

   then run command:

   ```sh
   anchor build # again
   ```

   then run command:

   ```sh
   anchor deploy
   ```

3. To see the Dapp in Solana Explorer:
   1. copy the Program Id shown after deploying the Dapp.
   2. go to https://explorer.solana.com/ and paste the Program Id in the search field.
