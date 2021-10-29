# Hands-on Solana

## Contents

- [Running Local Cluster for Testing](#running-local-cluster-for-testing)
- [Wallet](#wallet)
- [Client](#client)
- [Program](#program)

## Running Local Cluster for Testing

1. Set needed environment variables as below.

   ```bash
   $ export RUST_LOG=solana_runtime::system_instruction_processor=trace,solana_runtime::message_processor=info,solana_bpf_loader=debug,solana_rbpf=debug
   ```

2. Start the local cluster on a terminal. This terminal will show messages from the cluster.

   ```bash
   $ solana-test-validator --log
   ```

3. Open another terminal window then run the command below. The log from smart contracts will be shown here.

   ```bash
   $ solana logs -u localhost
   ```

[Source](https://docs.solana.com/developing/on-chain-programs/debugging)

[**Back to top**](#contents)

## Wallet

```bash
$ solana-keygen new <path>
```

A wallet is a keypair consisting of a public key and a private key. A wallet is not an acount. You can use the same wallet on all Solana clusters (local, dev, test, main) as an account, but the account will be different in each cluster. An account will not exists in a cluster until it has some lamports.

[**Back to top**](#contents)

## Client

Solana provides a [npm package](https://www.npmjs.com/package/@solana/web3.js) that we can use to make a client side program. More detail information on how the client works can be found [here](./client).

[**Back to top**](#contents)

## Program

A smart contract or a program for Solana can be built using Rust. The `Cargo.toml` needed to make a program is as below.

```toml
[package]
name = "program-name"
version = "0.1.0"
edition = "2018"

[features]
no-entrypoint = []

[dependencies]
borsh = "0.9.1"
borsh-derive = "0.9.1"
solana-program = "1.8.1"

[dev-dependencies]
solana-program-test = "1.8.1"
solana-sdk = "1.8.1"

[lib]
name = "executablename"
crate-type = ["cdylib", "lib"]
```

Other than `Cargo.toml` we have to include `Xargo.toml` as well. The content should be as below.

```toml
[target.bpfel-unknown-unknown.dependencies.std]
features = []
```

[**Back to top**](#contents)
