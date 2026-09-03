const fs=require('fs');
const load=n=>JSON.parse(fs.readFileSync(`i18n/_build/${n}.json`,'utf8'));
const en=load('en'),hi=load('hi'),mr=load('mr'),kn=load('kn'),ta=load('ta'),te=load('te');
const langs={en,hi,mr,kn,ta,te};
const tokset=s=>{const m=(s.match(/\{(\w+)\}/g)||[]).sort();return m.join(',');};
let problems=0;
for(const [code,d] of Object.entries(langs)){
  if(code==='en')continue;
  const miss=Object.keys(en).filter(k=>!(k in d));
  const extra=Object.keys(d).filter(k=>!(k in en));
  if(miss.length||extra.length){console.log(`${code}: missing ${miss.length} extra ${extra.length}`);problems++;}
  // token parity
  let tokBad=[];
  for(const k of Object.keys(en)){ if(k in d && tokset(en[k])!==tokset(d[k])) tokBad.push(k); }
  if(tokBad.length){console.log(`${code}: TOKEN MISMATCH in ${tokBad.length} keys:`);tokBad.slice(0,40).forEach(k=>console.log('   ',k,'| en:',JSON.stringify(en[k]),'|',code+':',JSON.stringify(d[k])));problems++;}
}
console.log('token/parity problems:', problems);

// Emit strings.ts
const nativeLabels={
  en:['English','English'], hi:['Hindi','हिंदी'], mr:['Marathi','मराठी'],
  kn:['Kannada','ಕನ್ನಡ'], ta:['Tamil','தமிழ்'], te:['Telugu','తెలుగు'],
};
const order=['en','hi','mr','kn','ta','te'];
let out='';
out+=`// Translation dictionaries for Astropanth. English is the source of truth.\n`;
out+=`// Languages: en, hi (Hindi), mr (Marathi), kn (Kannada), ta (Tamil), te (Telugu).\n`;
out+=`// Generated from i18n/_build/*.json — keep keys in sync across all dicts.\n`;
out+=`// Reference a string via t('key') — see contexts/LanguageContext. Missing keys\n`;
out+=`// fall back to English, then the key. Interpolation uses {token} placeholders.\n\n`;
out+=`export type Lang = ${order.map(c=>`'${c}'`).join(' | ')};\n\n`;
out+=`export const LANGUAGES: { code: Lang; label: string; native: string }[] = [\n`;
for(const c of order){ out+=`  { code: '${c}', label: ${JSON.stringify(nativeLabels[c][0])}, native: ${JSON.stringify(nativeLabels[c][1])} },\n`; }
out+=`];\n\n`;
out+=`type Dict = Record<string, string>;\n\n`;
for(const c of order){ out+=`const ${c}: Dict = ${JSON.stringify(langs[c],null,2)};\n\n`; }
out+=`export const DICTS: Record<Lang, Dict> = { ${order.join(', ')} };\n`;
fs.writeFileSync('i18n/strings.ts',out);
console.log('strings.ts written. bytes:', out.length);
console.log('keys per lang:', order.map(c=>c+'='+Object.keys(langs[c]).length).join(' '));
