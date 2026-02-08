export function sanitizeText(t:any):string{return String(t||"")};
export function sanitizeHtml(t:any):string{return String(t||"")};
export function sanitizeInput(t:any):any{return t};
export default{sanitizeText,sanitizeHtml,sanitizeInput};
