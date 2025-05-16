# GiveFi-Devnet

A Solana blockchain-powered donation widget that enables micro-donations through intuitive wallet interactions.

## Overview

GiveFi is a checkbox widget that any Solana dApp can integrate, allowing users to make donations to the dApp's chosen charity when submitting their onchain transaction.

This is a version running on Solana devnet for testing and demonstration purposes.

## Features

- ✅ Seamless integration with Solana dApps
- ✅ Support for Phantom and Solflare wallets
- ✅ Real-time USD value conversion of donations
- ✅ Automatic transaction processing
- ✅ Customizable donation amounts
- ✅ Transparent transaction history

## Getting Started

### Prerequisites

- Node.js and npm installed
- Solana wallet (Phantom or Solflare)
- Access to Solana devnet

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/GiveFi-Devnet.git
   cd GiveFi-Devnet
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to the local server address shown in your terminal.

### Testing

To test donations, you'll need Devnet SOL tokens. You can get them from [Solana Faucet](https://solfaucet.com/).

## How It Works

1. Users connect their Solana wallet
2. When performing a swap or other transaction, users can opt to include a small donation
3. The donation amount (0.01 SOL) is added to the transaction
4. Funds are transferred to the designated charity wallet

## Technical Details

- Built with React, TypeScript, and Vite
- Uses Solana Web3.js for blockchain interactions
- Styled with Tailwind CSS and shadcn/ui components
- Persistent data storage with PostgreSQL

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Solana Foundation for the blockchain infrastructure
- Phantom and Solflare wallet teams for their developer-friendly APIs