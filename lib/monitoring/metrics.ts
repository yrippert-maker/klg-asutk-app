export function recordPerformance(...a:any[]){}
export function recordMetric(...a:any[]){}
export function getMetrics(){return{}}
const handler={get:()=>(...a:any[])=>({})};
export const metrics:any=new Proxy({},{get:()=>(...a:any[])=>({})});
export default metrics;
