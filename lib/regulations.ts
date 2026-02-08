export interface RegulationDocument{id:string;title:string;type:string;content:string;source?:string;category?:string;version?:string;lastUpdated?:string;url?:string;sections?:any[]}
export const chicagoConventionAnnexes:RegulationDocument[]=[];
export default{chicagoConventionAnnexes};
