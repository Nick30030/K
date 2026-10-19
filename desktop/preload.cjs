const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nickshopDesktop',Object.freeze({getInfo:()=>ipcRenderer.invoke('nickshop:desktop-info'),setGeminiKey:key=>ipcRenderer.invoke('nickshop:set-key',key)}));
