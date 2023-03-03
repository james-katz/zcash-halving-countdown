const PROTO_PATH = './service.proto';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const express = require('express');
const app = express();
const port = 3001;

const halvingInterval = 1680000;
const firstHalving = 1046400;
const avgBlockTime = 75;
const serverUri = 'mainnet.lightwalletd.com:9067';

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
	});

const compactTxStreamer = grpc.loadPackageDefinition(packageDefinition).cash.z.wallet.sdk.rpc.CompactTxStreamer;
const client = new compactTxStreamer(serverUri, grpc.credentials.createSsl());

const chainSpec = new grpc.loadPackageDefinition(packageDefinition).cash.z.wallet.sdk.rpc.ChainSpec;

function countdown() {   
    return new Promise((resolve, reject) => {
        client.GetLatestBlock(chainSpec, (err, res) => {
            if(err) reject(err);

            const height = parseInt(res.height);
            const nextHalving = nextHalvingBlock(height);
            const remainingBlocks = nextHalving - height;
            const secondsToHalving = avgBlockTime * remainingBlocks;
            
            const countdownDay = Math.floor(secondsToHalving / (3600*24));
            const countdownHrs = Math.floor(secondsToHalving % (3600*24) / 3600);
            const countdownMin = Math.floor(secondsToHalving % 3600 / 60);
            const countdownSec = Math.floor(secondsToHalving % 60);

            const halvingDate = new Date();
            halvingDate.setSeconds(secondsToHalving);                        

            const json = {
                "height": height,
                "next_halving": nextHalving,
                "remaining_blocks": remainingBlocks,                
                "countdown": {
                    "secs": countdownSec,
                    "mins": countdownMin,
                    "hours": countdownHrs,
                    "days": countdownDay,
                }
                ,
                "halving_date": halvingDate
            }

            resolve(json);
        });
    });    
}

function nextHalvingBlock(height) {    
    let next = firstHalving;
    
    while(next <= height) {
        next += halvingInterval;
    }
    return next;
}

app.get('/', async (req, res) => {
    countdown()
    .then((json) => res.json(json))
    .catch((err) => res.send(err));
});

app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});