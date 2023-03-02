# zcash-halving-countdown
Simple zcash halving countdown.
This code uses gRPC and connects to `mainnet.lightwalletd.com:9067` to get accurate block height.
# Install
### Clone this repo and enter directory
```sh
git clone https://github.com/james-katz/zcash-halving-countdown.git
cd zcash-halving-countdown
```
### Install dependencies
```sh
$ npm install
```

### Run the code
```sh
$ node index.js
```

# API
The code will listen on port 3001 and have the endpoint:
- `/` - Return JSON containing countdown information.
Json format:
```json
{
  "height":"2002247", // Current clockchain height
  "next_halving":2726400, // Next Halving block height
  "remaining_blocks":724153, // Ramaining blocks until next halving
  "countdown":
  {
    "secs":15, // Remaining seconds until next halving
    "mins":31, // Remaining minutes until next halving
    "hours":14, // Remaining hours until next halving
    "days":628 // Remaining days until next halving
  },
  "halving_date":"2024-11-20T06:31:15.237Z" // Estimated date the halving will occur
  }
