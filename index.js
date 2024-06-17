const PROTO_PATH = './service.proto';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const express = require('express');
const app = express();
const port = 3001;

// Define all the constants
const blossomActivationHeight = 653600;
const preBlossomHalvingInterval = 840000;

const preBlossomPoWTargetSpacing = 150;
const postBlossomPoWTargetSpacing = 75;

const blossomPoWTargetSpacingRatio = preBlossomPoWTargetSpacing / postBlossomPoWTargetSpacing; 
const postBlossomHalvingInterval = Math.floor(preBlossomHalvingInterval * blossomPoWTargetSpacingRatio)

const slowStartInterval = 20000;
const slowStartShift = slowStartInterval / 2;
    
const maxBlockSubsidy = 1250000000;
const halvingInterval = 1680000;

const firstHalving = 1046400;
const avgBlockTime = 75;

const serverUri = 'zec.rocks:443';

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
            const halvingNumber = calculateHalving(height);

            const nextHalving = nextHalvingBlock(halvingNumber);
            const remainingBlocks = nextHalving - height;
            const secondsToHalving = avgBlockTime * remainingBlocks;
            
            const currSubisidy = calculateBlockSubsidy(halvingNumber);
            const nextSubisidy = calculateBlockSubsidy(halvingNumber + 1);

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
                "current_subsidy": currSubisidy,
                "next_subsidy": nextSubisidy,
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

function nextHalvingBlock(halving) {    
    return firstHalving + (halvingInterval * halving);
}

function calculateHalving(height) {    
    const halving = Math.floor(( (blossomActivationHeight - slowStartShift) / preBlossomHalvingInterval ) + ( (height - blossomActivationHeight) / postBlossomHalvingInterval ));
    
    return halving;
}

function calculateBlockSubsidy(halving) {
    const blockSubsidy = Math.floor(maxBlockSubsidy / (blossomPoWTargetSpacingRatio * (2 ** halving)));

    return blockSubsidy;
}

app.get('/', async (req, res) => {
    countdown()
    .then((json) => res.json(json))
    .catch((err) => res.send(err));
});

app.listen(port, () => {
    console.log(`Express listening on port: ${port}`);
});