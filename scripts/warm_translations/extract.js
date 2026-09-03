const fs=require('fs');
const files=[
 'utils/astrologyKnowledge.ts','utils/tarot.ts','utils/numerology.ts','utils/numerologyDetail.ts',
 'utils/zodiac.ts','utils/astrology.ts',
 'utils/jyotish/gemstones.ts','utils/jyotish/interpret.ts','utils/jyotish/forecast.ts',
 'utils/jyotish/sadeSati.ts','utils/jyotish/ashtakoota.ts','utils/jyotish/panchang.ts',
];
const set=new Set();
// Match single/double/backtick string literals.
const re=/(['"`])((?:\\.|(?!\1).)*?)\1/gs;
for(const f of files){
  if(!fs.existsSync(f))continue;
  const c=fs.readFileSync(f,'utf8');
  let m;
  while((m=re.exec(c))){
    let s=m[2];
    if(!s) continue;
    if(s.includes('${')) continue;            // runtime template — can't warm statically
    if(s.includes('\\n')) s=s.replace(/\\n/g,'\n');
    s=s.replace(/\\'/g,"'").replace(/\\"/g,'"');
    const t=s.trim();
    if(t.length<15) continue;                 // skip short/keys
    if(!/[A-Za-z]/.test(t)) continue;
    if(!t.includes(' ')) continue;            // prose = has a space
    if(/^https?:|^[./@]|^\w+\/\w+/.test(t)) continue; // urls/paths/import-ish
    if(/^[A-Z0-9_]+$/.test(t)) continue;      // CONSTANT_KEYS
    set.add(t);
  }
}
const arr=[...set];
fs.writeFileSync('/tmp/warm/strings.json',JSON.stringify(arr));
let chars=arr.reduce((a,s)=>a+s.length,0);
console.log('unique prose strings:',arr.length);
console.log('total chars:',chars,'(~',Math.round(chars/4),'tokens/lang)');
console.log('--- sample ---');
arr.slice(0,8).forEach(s=>console.log('  •',s.slice(0,80)));
