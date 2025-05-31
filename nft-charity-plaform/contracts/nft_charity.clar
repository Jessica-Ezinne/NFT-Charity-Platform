;; NFT-based charity platform smart contract
;; This contract allows users to mint NFTs, donate to charities, and participate in charitable campaigns

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-listing-expired (err u102))
(define-constant err-invalid-price (err u103))
(define-constant err-campaign-not-found (err u104))
(define-constant err-campaign-expired (err u105))
(define-constant err-insufficient-funds (err u106))
(define-constant err-invalid-parameter (err u107))

;; Data variables
(define-data-var total-nfts uint u0)
(define-data-var charity-address principal 'SP000000000000000000002Q6VF78)
(define-data-var donation-percentage uint u20)
(define-data-var total-donations uint u0)
(define-data-var paused bool false)