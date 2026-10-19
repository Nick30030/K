export {};
declare global {interface Window {nickshopDesktop?:{getInfo:()=>Promise<{version:string;platform:string;keyConfigured:boolean;encryptedStorage:boolean}>;setGeminiKey:(key:string)=>Promise<{configured:boolean}>}}}
