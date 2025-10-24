(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-BATCH-ID u101)
(define-constant ERR-INVALID-EXPIRATION u102)
(define-constant ERR-INVALID-COMPOSITION u103)
(define-constant ERR-INVALID-CERT-HASH u104)
(define-constant ERR-INVALID-MANUFACTURER u105)
(define-constant ERR-BATCH-ALREADY-EXISTS u106)
(define-constant ERR-BATCH-NOT-FOUND u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-QUANTITY u110)
(define-constant ERR-INVALID-DOSAGE u111)
(define-constant ERR-BATCH-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-BATCHES-EXCEEDED u114)
(define-constant ERR-INVALID-DRUG-TYPE u115)
(define-constant ERR-INVALID-STORAGE-CONDITIONS u116)
(define-constant ERR-INVALID-PACKAGING u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-CURRENCY u119)
(define-constant ERR-INVALID-STATUS u120)
(define-constant ERR-INVALID-OWNER u121)
(define-constant ERR-TRANSFER-NOT-ALLOWED u122)
(define-constant ERR-BATCH-EXPIRED u123)
(define-constant ERR-INVALID-MINT-FEE u124)
(define-constant ERR-INVALID-BATCH-NUMBER u125)

(define-data-var next-nft-id uint u0)
(define-data-var max-batches uint u100000)
(define-data-var mint-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map batches
  uint
  {
    batch-id: (string-utf8 50),
    expiration-date: uint,
    composition: (string-utf8 200),
    cert-hash: (buff 32),
    manufacturer: principal,
    timestamp: uint,
    minter: principal,
    drug-type: (string-utf8 50),
    quantity: uint,
    dosage: (string-utf8 100),
    storage-conditions: (string-utf8 100),
    packaging: (string-utf8 100),
    location: (string-utf8 100),
    currency: (string-utf8 20),
    status: bool,
    owner: principal,
    batch-number: uint
  }
)

(define-map batches-by-batch-id
  (string-utf8 50)
  uint)

(define-map batch-updates
  uint
  {
    update-expiration: uint,
    update-composition: (string-utf8 200),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-batch (id uint))
  (map-get? batches id)
)

(define-read-only (get-batch-updates (id uint))
  (map-get? batch-updates id)
)

(define-read-only (is-batch-registered (batch-id (string-utf8 50)))
  (is-some (map-get? batches-by-batch-id batch-id))
)

(define-private (validate-batch-id (batch-id (string-utf8 50)))
  (if (and (> (len batch-id) u0) (<= (len batch-id) u50))
      (ok true)
      (err ERR-INVALID-BATCH-ID))
)

(define-private (validate-expiration (expiration uint))
  (if (> expiration block-height)
      (ok true)
      (err ERR-INVALID-EXPIRATION))
)

(define-private (validate-composition (comp (string-utf8 200)))
  (if (and (> (len comp) u0) (<= (len comp) u200))
      (ok true)
      (err ERR-INVALID-COMPOSITION))
)

(define-private (validate-cert-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-CERT-HASH))
)

(define-private (validate-manufacturer (manu principal))
  (if (not (is-eq manu tx-sender))
      (ok true)
      (err ERR-INVALID-MANUFACTURER))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-drug-type (type (string-utf8 50)))
  (if (and (> (len type) u0) (<= (len type) u50))
      (ok true)
      (err ERR-INVALID-DRUG-TYPE))
)

(define-private (validate-quantity (qty uint))
  (if (> qty u0)
      (ok true)
      (err ERR-INVALID-QUANTITY))
)

(define-private (validate-dosage (dos (string-utf8 100)))
  (if (and (> (len dos) u0) (<= (len dos) u100))
      (ok true)
      (err ERR-INVALID-DOSAGE))
)

(define-private (validate-storage-conditions (stor (string-utf8 100)))
  (if (and (> (len stor) u0) (<= (len stor) u100))
      (ok true)
      (err ERR-INVALID-STORAGE-CONDITIONS))
)

(define-private (validate-packaging (pack (string-utf8 100)))
  (if (and (> (len pack) u0) (<= (len pack) u100))
      (ok true)
      (err ERR-INVALID-PACKAGING))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur u"STX") (is-eq cur u"USD") (is-eq cur u"BTC"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-batch-number (num uint))
  (if (> num u0)
      (ok true)
      (err ERR-INVALID-BATCH-NUMBER))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-batches (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-MAX-BATCHES-EXCEEDED))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-batches new-max)
    (ok true)
  )
)

(define-public (set-mint-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-MINT-FEE))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set mint-fee new-fee)
    (ok true)
  )
)

(define-public (mint-batch
  (batch-id (string-utf8 50))
  (expiration-date uint)
  (composition (string-utf8 200))
  (cert-hash (buff 32))
  (drug-type (string-utf8 50))
  (quantity uint)
  (dosage (string-utf8 100))
  (storage-conditions (string-utf8 100))
  (packaging (string-utf8 100))
  (location (string-utf8 100))
  (currency (string-utf8 20))
  (batch-number uint)
)
  (let (
        (next-id (var-get next-nft-id))
        (current-max (var-get max-batches))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-BATCHES-EXCEEDED))
    (try! (validate-batch-id batch-id))
    (try! (validate-expiration expiration-date))
    (try! (validate-composition composition))
    (try! (validate-cert-hash cert-hash))
    (try! (validate-drug-type drug-type))
    (try! (validate-quantity quantity))
    (try! (validate-dosage dosage))
    (try! (validate-storage-conditions storage-conditions))
    (try! (validate-packaging packaging))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (try! (validate-batch-number batch-number))
    (asserts! (is-none (map-get? batches-by-batch-id batch-id)) (err ERR-BATCH-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get mint-fee) tx-sender authority-recipient))
    )
    (map-set batches next-id
      {
        batch-id: batch-id,
        expiration-date: expiration-date,
        composition: composition,
        cert-hash: cert-hash,
        manufacturer: tx-sender,
        timestamp: block-height,
        minter: tx-sender,
        drug-type: drug-type,
        quantity: quantity,
        dosage: dosage,
        storage-conditions: storage-conditions,
        packaging: packaging,
        location: location,
        currency: currency,
        status: true,
        owner: tx-sender,
        batch-number: batch-number
      }
    )
    (map-set batches-by-batch-id batch-id next-id)
    (var-set next-nft-id (+ next-id u1))
    (print { event: "batch-minted", id: next-id })
    (ok next-id)
  )
)

(define-public (update-batch
  (nft-id uint)
  (update-expiration uint)
  (update-composition (string-utf8 200))
)
  (let ((batch (map-get? batches nft-id)))
    (match batch
      b
        (begin
          (asserts! (is-eq (get minter b) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-expiration update-expiration))
          (try! (validate-composition update-composition))
          (map-set batches nft-id
            {
              batch-id: (get batch-id b),
              expiration-date: update-expiration,
              composition: update-composition,
              cert-hash: (get cert-hash b),
              manufacturer: (get manufacturer b),
              timestamp: block-height,
              minter: (get minter b),
              drug-type: (get drug-type b),
              quantity: (get quantity b),
              dosage: (get dosage b),
              storage-conditions: (get storage-conditions b),
              packaging: (get packaging b),
              location: (get location b),
              currency: (get currency b),
              status: (get status b),
              owner: (get owner b),
              batch-number: (get batch-number b)
            }
          )
          (map-set batch-updates nft-id
            {
              update-expiration: update-expiration,
              update-composition: update-composition,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "batch-updated", id: nft-id })
          (ok true)
        )
      (err ERR-BATCH-NOT-FOUND)
    )
  )
)

(define-public (transfer-batch (nft-id uint) (new-owner principal))
  (let ((batch (map-get? batches nft-id)))
    (match batch
      b
        (begin
          (asserts! (is-eq (get owner b) tx-sender) (err ERR-NOT-AUTHORIZED))
          (asserts! (> (get expiration-date b) block-height) (err ERR-BATCH-EXPIRED))
          (asserts! (not (is-eq new-owner tx-sender)) (err ERR-INVALID-OWNER))
          (map-set batches nft-id
            (merge b { owner: new-owner })
          )
          (print { event: "batch-transferred", id: nft-id, new-owner: new-owner })
          (ok true)
        )
      (err ERR-BATCH-NOT-FOUND)
    )
  )
)

(define-public (get-batch-count)
  (ok (var-get next-nft-id))
)

(define-public (check-batch-existence (batch-id (string-utf8 50)))
  (ok (is-batch-registered batch-id))
)

(define-public (verify-batch (nft-id uint))
  (let ((batch (map-get? batches nft-id)))
    (match batch
      b
        (if (and (get status b) (> (get expiration-date b) block-height))
            (ok true)
            (err ERR-BATCH-EXPIRED))
      (err ERR-BATCH-NOT-FOUND)
    )
  )
)