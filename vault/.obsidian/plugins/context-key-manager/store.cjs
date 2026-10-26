'use strict';
// Retires legacy catch-and-classify downgrade while retaining proven v3 recovery.
const original=require('./v3-store.cjs'),gate=require('./version-gate.cjs');
class Store extends original.Store {
 status(){gate.inspect(this);return super.status()}
 previewRecovery(){gate.inspect(this);return super.previewRecovery()}
 lock(...args){gate.inspect(this);return super.lock(...args)}
 publish(name,frame){gate.inspect(this);this.frame(frame);return super.publish(name,frame)}
 execute(p,...args){gate.inspect(this);this.pending(JSON.stringify(p));return super.execute(p,...args)}
 recover(...args){gate.inspect(this);return super.recover(...args)}
}
module.exports={...original,Store};
