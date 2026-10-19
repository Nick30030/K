import {draftCopy,conceptsFor} from '../domain.mjs';
import type {Product,Platform,Concept} from '../types';
type Brief={kind:'copy'|'visual';product?:Product;original?:string;tone?:string;goal?:string;cta?:string;variant?:number;options?:Record<string,string>};
export async function generateContent(input:Brief):Promise<{mode:string;result:Record<Platform,string>|Concept[]}>{
 if(input.product&&(!input.product.active||input.product.stock===0))throw Error('Ce produit est inactif ou en rupture de stock.');
 const response=await fetch(new URL('api/generate',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
 // Static hosting has no API. Use explicitly labelled local models in this case.
 if(response.status===404||response.status===405||!(response.headers.get('content-type')||'').includes('application/json')){
 const p=input.product?{...input.product,description:[input.product.description,input.product.features].filter(Boolean).join('\n')}:undefined;
 return {mode:'template',result:input.kind==='copy'?draftCopy(p,input.original,input.tone,input.cta,input.variant):conceptsFor(p,input.options,input.variant)};
 }
 const data=await response.json();if(!response.ok)throw Error(data.error||'Service indisponible.');return data;
}
