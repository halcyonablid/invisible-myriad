'use strict';
// Isolated, killable geometry computation. Never reads/writes owner data.
console.log=()=>{};
let input='';process.stdin.setEncoding('utf8');
process.stdin.on('data',chunk=>{input+=chunk;if(input.length>2000000)process.exit(2);});
process.stdin.on('end',async()=>{
 try{
  const job=JSON.parse(input);require('./weighted.cjs').validateFixture(job.fixture);
  let result;
  if(job.kind==='baseline')result=await require('./engine.cjs').compute(job.fixture,'cpsat-avoid');
  else if(job.kind==='route'){
   if(!Array.isArray(job.positions)||job.positions.length!==job.fixture.nodes.length)throw Error('Invalid positions');
   result=job.variant===-1?await require('./math.cjs').avoid(job.fixture,{positions:job.positions}):await require('./protected-router.cjs').route(job.fixture,job.positions,job.variant);
  }else throw Error('Unknown geometry job');
  process.stdout.write(JSON.stringify({result}));
 }catch(error){process.stdout.write(JSON.stringify({error:String(error.message).slice(0,300)}));}
});
