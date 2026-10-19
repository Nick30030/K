import type { Store } from './types';
import {localDate, draftCopy, conceptsFor, uid, validateBackup} from './domain.mjs';
export const STORE_KEY='nickshop-studio-v1';
export function initialStore(): Store {
  const products=[
    {id:'demo-1',name:'Éclat d’Ambre',category:'Parfum',price:12000,description:'Un parfum à découvrir dans la sélection NickShop.',features:'',stock:12,active:true,photo:'',demo:true},
    {id:'demo-2',name:'Rose de Minuit',category:'Parfum',price:15000,description:'Une sélection parfum pour votre prochain rituel.',features:'',stock:8,active:true,photo:'',demo:true},
    {id:'demo-3',name:'Sérum Éclat',category:'Soin visage',price:8500,description:'Un soin à découvrir. Caractéristiques à renseigner avant publication.',features:'',stock:6,active:true,photo:'',demo:true},
  ];
  const today=new Date();
  const posts=Array.from({length:4},(_,i)=>{const date=new Date(today);date.setDate(date.getDate()+i*2); const p=products[i%3]; const platform=(['Facebook','WhatsApp','TikTok'] as const)[i%3]; return {id:uid(),date:localDate(date),time:'19:00',platform,productId:p.id,title:['Un essentiel à découvrir','Votre prochain coup de cœur','Dans les coulisses','Le rituel du week-end'][i],text:draftCopy(p,'','Naturel','Écrivez-nous sur WhatsApp pour en savoir plus.')[platform],type:'Présentation produit',goal:'Générer des conversations',visual:conceptsFor(p,{platform})[0],format:platform==='Facebook'?'4:5':'9:16',cta:'Écrivez-nous sur WhatsApp',paid:false,status:i===0?'Prêt':'Idée',demo:true};});
  return {version:1,products,posts,contents:[],ideas:[],settings:{budget:0,whatsapp:'',brandGoal:'Faire découvrir NickShop et générer des commandes sur WhatsApp.'},results:{spend:0,conversations:0,orders:0,revenue:0,cost:0}};
}
export function loadStore(): Store {
  const value=localStorage.getItem(STORE_KEY);
  if(!value) return initialStore();
  return validateBackup(JSON.parse(value)) as Store;
}
