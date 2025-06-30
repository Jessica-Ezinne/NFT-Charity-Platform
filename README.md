# NFT Charity Platform

A comprehensive NFT marketplace built on Stacks blockchain that automatically donates a percentage of all sales to charity, while enabling direct charitable campaigns and NFT donations.

## 🌟 Features

### Core NFT Functionality

- **NFT Minting**: Create unique NFTs with metadata and categories
- **Ownership Management**: Secure transfer and ownership tracking
- **Marketplace**: List and sell NFTs with automatic pricing
- **Metadata Storage**: Store token URIs and creator information

### Charity Integration

- **Automatic Donations**: 20% of all NFT sales automatically donated to charity (configurable)
- **Campaign System**: Create and manage targeted charity campaigns
- **Direct Donations**: Support campaigns with direct STX contributions
- **NFT Donations**: Donate NFTs directly to specific campaigns

### Advanced Features

- **Milestone System**: Track campaign progress with reward milestones
- **User Analytics**: Track participation, donations, and rewards
- **Administrative Controls**: Owner-only functions for platform management
- **Emergency Pause**: Platform-wide pause functionality for security

## 🏗️ Contract Architecture

### Data Structures

#### NFT Management

- `nft-owners`: Maps token IDs to owner addresses
- `token-uri`: Stores metadata URIs for each NFT
- `nft-price`: Marketplace pricing for listed NFTs
- `nft-metadata`: Creator, timestamp, and category information

#### Charity Campaigns

- `charity-campaigns`: Campaign details, goals, and progress
- `campaign-nfts`: NFTs donated to each campaign
- `user-campaign-participation`: User contribution tracking
- `campaign-milestones`: Progress milestones with rewards

#### Platform Settings

- `charity-address`: Destination for automatic donations
- `donation-percentage`: Configurable donation rate (default: 20%)
- `total-donations`: Running total of all charitable contributions
- `paused`: Emergency pause state

## 🔧 Core Functions

### NFT Operations

```clarity
(mint (uri string-utf8) (category string-utf8))
(transfer (token-id uint) (recipient principal))
(list-for-sale (token-id uint) (price uint))
(buy-nft (token-id uint))
```

### Charity Functions

```clarity
(create-charity-campaign (name string-utf8) (description string-utf8) (goal uint) (duration uint))
(donate-to-campaign (campaign-id uint) (amount uint))
(donate-nft-to-campaign (token-id uint) (campaign-id uint))
(add-campaign-milestone (campaign-id uint) (milestone-id uint) ...)
```

### Administrative Functions

```clarity
(set-charity-address (new-address principal))
(set-donation-percentage (new-percentage uint))
(toggle-pause)
(end-campaign (campaign-id uint))
```

## 🛡️ Security Features

### Access Control

- **Owner-only functions**: Campaign creation, administrative settings
- **Token ownership verification**: Only owners can transfer or list NFTs
- **Campaign validation**: Active status and deadline checks

### Error Handling

- `err-owner-only (u100)`: Unauthorized access attempt
- `err-not-token-owner (u101)`: Invalid token ownership
- `err-campaign-expired (u105)`: Campaign past deadline
- `err-insufficient-funds (u106)`: Inadequate balance for transaction
- `err-invalid-parameter (u107)`: Invalid input parameters

### Emergency Controls

- **Pause functionality**: Disable minting and sales during emergencies
- **Campaign management**: Ability to end campaigns when necessary
- **Configurable settings**: Adjust charity percentage and addresses

## 🧪 Testing

The contract includes a comprehensive test suite covering:

- **NFT Lifecycle**: Minting, transferring, listing, and purchasing
- **Marketplace Operations**: Price setting, sales with charity donations
- **Campaign Management**: Creation, donations, and milestone tracking
- **Access Controls**: Owner-only function restrictions
- **Error Conditions**: Invalid parameters and unauthorized access
- **Administrative Functions**: Pause, settings changes, campaign management

### Running Tests

```bash
clarinet test
```

## 🚀 Deployment

### Prerequisites

- Clarinet CLI installed
- Stacks wallet with STX for deployment
- Access to Stacks testnet or mainnet

### Deploy Steps

1. Clone the repository
2. Configure your deployment settings in `Clarinet.toml`
3. Deploy to testnet for testing:
   ```bash
   clarinet deploy --testnet
   ```
4. Deploy to mainnet when ready:
   ```bash
   clarinet deploy --mainnet
   ```

## 📊 Usage Examples

### Creating and Selling an NFT

```typescript
// Mint NFT
await contractCall("nft_charity", "mint", [
  "https://myart.com/metadata.json",
  "Digital Art",
]);

// List for sale (1 STX = 1,000,000 microSTX)
await contractCall("nft_charity", "list-for-sale", [
  1, // token-id
  1000000, // 1 STX
]);

// Purchase (automatically donates 20% to charity)
await contractCall("nft_charity", "buy-nft", [1]);
```

### Supporting a Charity Campaign

```typescript
// Direct donation
await contractCall("nft_charity", "donate-to-campaign", [
  1, // campaign-id
  500000, // 0.5 STX
]);

// Donate NFT to campaign
await contractCall("nft_charity", "donate-nft-to-campaign", [
  1, // token-id
  1, // campaign-id
]);
```

_Building a better world, one NFT at a time._ 🌍✨
