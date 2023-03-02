const PROTO_PATH = './service.proto';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
	});
const compactTxStreamer = grpc.loadPackageDefinition(packageDefinition).cash.z.wallet.sdk.rpc.CompactTxStreamer;
const client = new compactTxStreamer('mainnet.lightwalletd.com:9067', grpc.credentials.createSsl());

const chainSpec = new grpc.loadPackageDefinition(packageDefinition).cash.z.wallet.sdk.rpc.ChainSpec;

client.GetLatestBlock(chainSpec, (err, res) => {
	if(err) throw err;
	const height = res.height;
    const nextHalving = nextHalvingBlock(height);
    console.log(`Next halving height: ${nextHalving}`);
    console.log(`Blocks until next halving: ${nextHalving - height}`);
});

function nextHalvingBlock(height) {
    let halving = calculateHalvingNumber(height);
    let nextHalving = halving + 1;
    let halvingHeight = height;
    
    while(halving < nextHalving) {
        halvingHeight ++;
        halving = calculateHalvingNumber(halvingHeight);        
    }

    return halvingHeight;
}

function calculateHalvingNumber(height) {
    const blossomActivationHeight = 653600;
    const preBlossomHalvingInterval = 840000;
    
    const preBlossomPoWTargetSpacing = 150;
    const postBlossomPoWTargetSpacing = 75;

    const blossomPoWTargetSpacingRatio = preBlossomPoWTargetSpacing / postBlossomPoWTargetSpacing;    
    const postBlossomHalvingInterval = Math.floor(preBlossomHalvingInterval * blossomPoWTargetSpacingRatio)

    const slowStartInterval = 20000;
    const slowStartShift = slowStartInterval / 2;

    const halving = Math.floor(( (blossomActivationHeight - slowStartShift) / preBlossomHalvingInterval ) + ( (height - blossomActivationHeight) / postBlossomHalvingInterval ));

    return halving;
}