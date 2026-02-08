export const pool={connect:async()=>({query:async(...a:any[])=>({rows:[],rowCount:0}),release:()=>{}}),query:async(...a:any[])=>({rows:[],rowCount:0}),end:async()=>{}};
export function getConnection(...a:any[]):any{return pool}
export default pool;
