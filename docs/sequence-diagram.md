# Auction Flow — Sequence Diagram

The diagram below shows a typical client-server interaction for joining an auction and placing bids.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Auth
    participant Socket
    participant Engine
    participant DynamoDB

    Client->>Server: HTTP GET / (initial)
    Client->>Server: WebSocket handshake (optional token)
    Server->>Auth: validate token
    Auth-->>Server: token OK
    Server->>Socket: accept connection

    Client->>Socket: join_auction(auctionId)
    Socket->>Auth: verify token (if needed)
    Auth-->>Socket: ok
    Socket->>Engine: joinAuction(auctionId, userId)
    Engine->>DynamoDB: load auction state
    DynamoDB-->>Engine: auction state
    Engine-->>Socket: subscription confirmed
    Socket-->>Client: joined

    Client->>Socket: place_bid(amount)
    Socket->>Engine: placeBid(auctionId, userId, amount)
    Engine->>Engine: validate rules & update in-memory state
    Engine->>DynamoDB: persist bid/update
    DynamoDB-->>Engine: ack
    Engine-->>Socket: emit highest_bid / auction_state
    Socket-->>Client: broadcast highest_bid

    Note over Engine,Socket: Engine may emit periodic countdown events
    Engine->>Socket: countdown
    Socket-->>Client: countdown update

    alt Auction ends
        Engine->>DynamoDB: finalize results
        Engine->>Socket: emit auction_result
        Socket-->>Client: auction_result
    end
```

This file is illustrative — use it to export PNG/SVG from Mermaid tools or convert into a diagram in docs.
