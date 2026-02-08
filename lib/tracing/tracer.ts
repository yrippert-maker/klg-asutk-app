export const tracer:any={createTrace:(...a:any[])=>({traceId:"stub"}),finishSpan:(...a:any[])=>{},addTag:(...a:any[])=>{},exportTrace:(...a:any[])=>({}),getAllTraces:()=>new Map()};
export function tracedOperation(...a:any[]):any{return null}
export default tracer;
