import {en} from "@/strings/en";
import {ja} from "@/strings/ja";

export function stringsByLang(language: string): typeof defaultStr {
  if(language.startsWith("en")) {
    return en;
  } else if(language.startsWith("ja")) {
    return ja;
  } else {
    return defaultStr;
  }
}

const defaultStr = en;
