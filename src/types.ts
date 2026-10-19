export type Platform = 'Facebook' | 'TikTok' | 'WhatsApp';
export type Product = {id:string;name:string;category:string;price:number;description:string;features:string;stock:number;active:boolean;photo:string;demo?:boolean};
export type Concept = {id:string;title:string;scene:string;palette:string;typo:string;why:string;text:string;format:string;prompt:string;productId?:string;demo?:boolean};
export type Post = {id:string;date:string;time:string;platform:Platform;productId:string;title:string;text:string;type:string;goal:string;visual?:Concept;format:string;cta:string;paid:boolean;status:string;demo?:boolean};
export type Content = {id:string;platform:Platform;text:string;productId:string;created:string;demo?:boolean};
export type Store = {version:1;products:Product[];posts:Post[];contents:Content[];ideas:Concept[];settings:{budget:number;whatsapp:string;brandGoal:string};results:{spend:number;conversations:number;orders:number;revenue:number;cost:number}};
