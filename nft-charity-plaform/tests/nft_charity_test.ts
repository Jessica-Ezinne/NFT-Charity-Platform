import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that NFT minting works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
        
        // Verify owner
        let ownerResult = chain.callReadOnlyFn('nft_charity', 'get-owner', [types.uint(1)], wallet1.address);
        assertEquals(ownerResult.result.expectSome(), wallet1.address);
        
        // Verify metadata
        let metadataResult = chain.callReadOnlyFn('nft_charity', 'get-token-metadata', [types.uint(1)], wallet1.address);
        let metadata = metadataResult.result.expectSome().expectTuple();
        assertEquals(metadata['creator'], wallet1.address);
        assertEquals(metadata['category'], types.utf8("Art"));
    },
});

Clarinet.test({
    name: "Ensure that NFT transfer works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // First mint an NFT
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
        
        // Transfer NFT
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'transfer', [
                types.uint(1),
                types.principal(wallet2.address)
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify new owner
        let ownerResult = chain.callReadOnlyFn('nft_charity', 'get-owner', [types.uint(1)], wallet1.address);
        assertEquals(ownerResult.result.expectSome(), wallet2.address);
    },
});

Clarinet.test({
    name: "Ensure that only NFT owner can transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        let wallet3 = accounts.get('wallet_3')!;
        
        // Mint NFT
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address)
        ]);
        
        // Try to transfer from non-owner (should fail)
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'transfer', [
                types.uint(1),
                types.principal(wallet3.address)
            ], wallet2.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(101)); // err-not-token-owner
    },
});

Clarinet.test({
    name: "Ensure that NFT listing for sale works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        
        // Mint NFT
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address)
        ]);
        
        // List for sale
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'list-for-sale', [
                types.uint(1),
                types.uint(1000000) // 1 STX in microSTX
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify price is set
        let priceResult = chain.callReadOnlyFn('nft_charity', 'get-price', [types.uint(1)], wallet1.address);
        assertEquals(priceResult.result.expectSome(), types.uint(1000000));
    },
});

Clarinet.test({
    name: "Ensure that NFT purchase with charity donation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Mint and list NFT
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address),
            Tx.contractCall('nft_charity', 'list-for-sale', [
                types.uint(1),
                types.uint(1000000) // 1 STX
            ], wallet1.address)
        ]);
        
        // Buy NFT
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'buy-nft', [
                types.uint(1)
            ], wallet2.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify ownership transfer
        let ownerResult = chain.callReadOnlyFn('nft_charity', 'get-owner', [types.uint(1)], wallet1.address);
        assertEquals(ownerResult.result.expectSome(), wallet2.address);
        
        // Verify price is cleared
        let priceResult = chain.callReadOnlyFn('nft_charity', 'get-price', [types.uint(1)], wallet1.address);
        assertEquals(priceResult.result.expectNone(), types.none());
    },
});

Clarinet.test({
    name: "Ensure that charity campaign creation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Save the Whales"),
                types.utf8("A campaign to protect marine life"),
                types.uint(10000000), // 10 STX goal
                types.uint(1000) // 1000 blocks duration
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
        
        // Verify campaign details
        let campaignResult = chain.callReadOnlyFn('nft_charity', 'get-campaign-details', [types.uint(1)], deployer.address);
        let campaign = campaignResult.result.expectSome().expectTuple();
        assertEquals(campaign['name'], types.utf8("Save the Whales"));
        assertEquals(campaign['goal'], types.uint(10000000));
        assertEquals(campaign['raised'], types.uint(0));
        assertEquals(campaign['active'], types.bool(true));
    },
});

Clarinet.test({
    name: "Ensure that only contract owner can create campaigns",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Unauthorized Campaign"),
                types.utf8("Should fail"),
                types.uint(1000000),
                types.uint(100)
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(100)); // err-owner-only
    },
});

Clarinet.test({
    name: "Ensure that direct donations to campaigns work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Create campaign
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Test Campaign"),
                types.utf8("Test description"),
                types.uint(5000000),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // Donate to campaign
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'donate-to-campaign', [
                types.uint(1),
                types.uint(1000000) // 1 STX
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify campaign raised amount
        let campaignResult = chain.callReadOnlyFn('nft_charity', 'get-campaign-details', [types.uint(1)], deployer.address);
        let campaign = campaignResult.result.expectSome().expectTuple();
        assertEquals(campaign['raised'], types.uint(1000000));
        
        // Verify donation history
        let donationResult = chain.callReadOnlyFn('nft_charity', 'get-user-donation-history', [
            types.principal(wallet1.address),
            types.uint(1)
        ], wallet1.address);
        let donation = donationResult.result.expectSome().expectTuple();
        assertEquals(donation['amount'], types.uint(1000000));
    },
});

Clarinet.test({
    name: "Ensure that NFT donation to campaigns works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Create campaign
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("NFT Campaign"),
                types.utf8("Accepts NFT donations"),
                types.uint(5000000),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // Mint and list NFT
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address),
            Tx.contractCall('nft_charity', 'list-for-sale', [
                types.uint(1),
                types.uint(2000000) // 2 STX
            ], wallet1.address)
        ]);
        
        // Donate NFT to campaign
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'donate-nft-to-campaign', [
                types.uint(1),
                types.uint(1)
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify campaign NFTs list
        let nftsResult = chain.callReadOnlyFn('nft_charity', 'get-campaign-nfts', [types.uint(1)], deployer.address);
        let nftsList = nftsResult.result.expectSome().expectList();
        assertEquals(nftsList.length, 1);
        assertEquals(nftsList[0], types.uint(1));
        
        // Verify user participation stats
        let statsResult = chain.callReadOnlyFn('nft_charity', 'get-user-campaign-stats', [
            types.principal(wallet1.address),
            types.uint(1)
        ], wallet1.address);
        let stats = statsResult.result.expectSome().expectTuple();
        assertEquals(stats['total-value'], types.uint(2000000));
    },
});

Clarinet.test({
    name: "Ensure that campaign milestones can be added",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        // Create campaign first
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Milestone Campaign"),
                types.utf8("Has milestones"),
                types.uint(10000000),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // Add milestone
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'add-campaign-milestone', [
                types.uint(1),
                types.uint(1),
                types.utf8("First milestone reached!"),
                types.uint(2500000), // 2.5 STX
                types.utf8("https://example.com/reward1.json")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify milestone
        let milestoneResult = chain.callReadOnlyFn('nft_charity', 'get-campaign-milestone', [
            types.uint(1),
            types.uint(1)
        ], deployer.address);
        let milestone = milestoneResult.result.expectSome().expectTuple();
        assertEquals(milestone['description'], types.utf8("First milestone reached!"));
        assertEquals(milestone['target-amount'], types.uint(2500000));
        assertEquals(milestone['reached'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that administrative functions work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Test setting charity address
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'set-charity-address', [
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Test setting donation percentage
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'set-donation-percentage', [
                types.uint(30) // 30%
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Test pause functionality
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'toggle-pause', [], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Try to mint while paused (should fail)
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(108)); // err-paused
    },
});

Clarinet.test({
    name: "Ensure that non-owners cannot access admin functions",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'set-charity-address', [
                types.principal(wallet2.address)
            ], wallet1.address),
            Tx.contractCall('nft_charity', 'set-donation-percentage', [
                types.uint(50)
            ], wallet1.address),
            Tx.contractCall('nft_charity', 'toggle-pause', [], wallet1.address)
        ]);
        
        // All should fail with owner-only error
        assertEquals(block.receipts[0].result.expectErr(), types.uint(100));
        assertEquals(block.receipts[1].result.expectErr(), types.uint(100));
        assertEquals(block.receipts[2].result.expectErr(), types.uint(100));
    },
});

Clarinet.test({
    name: "Ensure that campaign can be ended by owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        // Create campaign
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Test Campaign"),
                types.utf8("Will be ended"),
                types.uint(5000000),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // End campaign
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'end-campaign', [
                types.uint(1)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify campaign is inactive
        let campaignResult = chain.callReadOnlyFn('nft_charity', 'get-campaign-details', [types.uint(1)], deployer.address);
        let campaign = campaignResult.result.expectSome().expectTuple();
        assertEquals(campaign['active'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that donations fail on inactive campaigns",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Create and end campaign
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Inactive Campaign"),
                types.utf8("Will be inactive"),
                types.uint(5000000),
                types.uint(1000)
            ], deployer.address),
            Tx.contractCall('nft_charity', 'end-campaign', [
                types.uint(1)
            ], deployer.address)
        ]);
        
        // Try to donate to inactive campaign
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'donate-to-campaign', [
                types.uint(1),
                types.uint(1000000)
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(104)); // err-campaign-not-found (inactive)
    },
});

Clarinet.test({
    name: "Ensure that invalid parameters are rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Try to create campaign with zero goal
        let block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'create-charity-campaign', [
                types.utf8("Invalid Campaign"),
                types.utf8("Zero goal"),
                types.uint(0), // Invalid goal
                types.uint(1000)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(107)); // err-invalid-parameter
        
        // Try to list NFT with zero price
        block = chain.mineBlock([
            Tx.contractCall('nft_charity', 'mint', [
                types.utf8("https://example.com/nft1.json"),
                types.utf8("Art")
            ], wallet1.address),
            Tx.contractCall('nft_charity', 'list-for-sale', [
                types.uint(1),
                types.uint(0) // Invalid price
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[1].result.expectErr(), types.uint(103)); // err-invalid-price
    },
});