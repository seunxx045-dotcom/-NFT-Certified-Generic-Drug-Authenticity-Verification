# 🛡️ NFT-Certified Generic Drug Authenticity Verification

Welcome to a groundbreaking Web3 solution tackling counterfeit drugs in low-income markets! This project uses NFTs on the Stacks blockchain (built with Clarity) to certify the authenticity of generic drug batches. By leveraging immutable blockchain records, manufacturers can mint NFTs for each batch, enabling transparent supply chain tracking and easy verification by distributors, retailers, and end-users. This helps prevent fake drugs from entering the market, saving lives and building trust in affordable healthcare.

## ✨ Features

🔒 NFT minting for drug batches with unique identifiers  
📦 Supply chain tracking from manufacturer to end-user  
✅ Instant authenticity verification via QR codes or NFC scans linked to NFTs  
🚨 Counterfeit reporting and blacklisting mechanism  
💰 Incentive system for verifiers using utility tokens  
🌍 Low-cost transactions on Stacks for accessibility in low-income regions  
📊 Analytics dashboard for regulatory oversight (off-chain integration)  
🛡️ Governance for updating standards and approving new manufacturers  

## 🛠 How It Works

This project involves 8 smart contracts written in Clarity, ensuring a secure and decentralized system. Here's a high-level overview:

### Smart Contracts Overview
1. **ManufacturerRegistry.clar**: Registers and verifies manufacturers, storing their credentials and approval status. Only approved manufacturers can mint NFTs.
2. **DrugBatchNFT.clar**: Core NFT contract for minting unique tokens representing drug batches. Each NFT includes metadata like batch ID, expiration date, composition, and hash of certification documents.
3. **SupplyChainTracker.clar**: Tracks ownership transfers of NFTs along the supply chain (e.g., manufacturer → distributor → retailer). Logs events immutably for traceability.
4. **AuthenticityVerifier.clar**: Allows anyone to query an NFT's status to confirm if a drug batch is authentic, unexpired, and not blacklisted.
5. **CounterfeitReporter.clar**: Enables users to report suspected fakes. If verified (via governance), the associated NFT is blacklisted.
6. **IncentiveToken.clar**: Mints and distributes utility tokens to reward users who perform verifications or report valid counterfeits.
7. **Governance.clar**: Manages DAO-like voting for approving manufacturers, updating drug standards, or resolving disputes.
8. **Escrow.clar**: Handles secure transfers of NFTs during supply chain handoffs, ensuring payments or conditions are met before release.

**For Manufacturers**  
- Register via ManufacturerRegistry and get approved.  
- Mint an NFT for a new drug batch using DrugBatchNFT, including a hash of lab tests and certifications.  
- Transfer the NFT to distributors via SupplyChainTracker.  

**For Distributors/Retailers**  
- Receive NFTs through Escrow for secure handoffs.  
- Use AuthenticityVerifier to check batch legitimacy before selling.  

**For End-Users**  
- Scan a QR code on the drug packaging linked to the NFT.  
- Call AuthenticityVerifier to confirm details.  
- Report issues via CounterfeitReporter and earn tokens from IncentiveToken.  

**For Regulators**  
- Use Governance to oversee the system and query SupplyChainTracker for audits.  