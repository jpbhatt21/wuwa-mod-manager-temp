import { atom, createStore } from "jotai";
export const previewUri = "http://127.0.0.1:5000/preview/";
export const store = createStore();
export const firstLoadAtom = atom(false);
export const tutorialProgressAtom = atom(0);
export const tutorialAtom = atom(false);
export const inProgressAtom = atom([] as any[]);
export const plannedChangesAtom = atom(
    {   title:"",
        from:[] as any,
        to:[] as any,
    }
    
);
export const categoriesAtom = atom([] as any);
export const presetsAtom = atom([] as any)
export const localItemsAtom = atom([] as any)
export const localFilterAtom=atom("All")
export const localSelectedCategoryAtom = atom("All");   
export const localSelectedItemAtom = atom(0);
export const selectedPresetAtom = atom(-1);
export const localFilteredItemsAtom = atom([] as any);
export const onlineModeAtom = atom(false);
export const localPathAtom = atom("");
export const onlinePathAtom = atom("");
export const rootPathAtom = atom("");
export const onlineDownloadListAtom = atom([]);
export const lastUpdatedAtom = atom(0);
export const settingsAtom = atom({} as any)
export const localDataAtom = atom([] as any);