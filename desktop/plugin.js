// Chat Studio 1.1.0. Offline, SDK-only customization of the conversation.
import { TITLEBAR_AREAS, PALETTE_AREA, atom, useValue, Button, Input, Switch,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, host } from '@hermes/plugin-sdk'
import { useState } from 'react'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'

export const VERSION = '1.1.0'
export const DEFAULTS = Object.freeze({
  language:'en', preset:'original', width:54, fontSize:100, lineHeight:1.75,
  turnGap:1.4, paragraphGap:0.95, userWidth:85, radius:16, codeSize:92,
  headingScale:100, alignment:'right', font:'system', density:'comfortable',
  bubbles:true, borders:true, wrapCode:false, palette:false,
  background:'#17191f', surface:'#22262e', text:'#e8edf5', muted:'#a9b5c7',
  accent:'#83b7ff', border:'#414957'
})
export const RANGES = {width:[36,96],fontSize:[85,140],lineHeight:[1.3,2.2],
  turnGap:[0.6,2.6],paragraphGap:[0.3,1.5],userWidth:[50,100],radius:[0,28],
  codeSize:[80,115],headingScale:[85,130]}
const ENUMS = {language:['en','es'],alignment:['left','right','full'],
  font:['system','serif','mono'],density:['compact','comfortable','spacious']}
const COLORS = ['background','surface','text','muted','accent','border']
const FONTS = {system:'inherit',serif:'Georgia, Cambria, serif',mono:'Consolas, "Cascadia Code", monospace'}

export function normalizeSettings(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const next = {...DEFAULTS}
  for (const [key,[min,max]] of Object.entries(RANGES)) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key]))
      next[key] = Math.round(Math.min(max,Math.max(min,input[key]))*100)/100
  }
  for (const [key,options] of Object.entries(ENUMS))
    if (options.includes(input[key])) next[key] = input[key]
  for (const key of ['bubbles','borders','wrapCode','palette'])
    if (typeof input[key] === 'boolean') next[key] = input[key]
  for (const key of COLORS)
    if (typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key]))
      next[key] = input[key].toLowerCase()
  if (typeof input.preset === 'string' && /^[a-z0-9-]{1,40}$/.test(input.preset))
    next.preset = input.preset
  return next
}

export const PRESETS = [
  {id:'original',name:'Studio Original',en:'Centered conversation; follows Hermes colors.',es:'Conversación centrada; conserva los colores de Hermes.',values:{}},
  {id:'editor',name:'Editor Focus',en:'Dense graphite workspace with blue accents.',es:'Editor compacto en grafito con acentos azules.',values:{palette:true,width:68,fontSize:95,lineHeight:1.55,turnGap:0.9,paragraphGap:0.65,density:'compact',radius:8}},
  {id:'flow',name:'Agent Flow',en:'Spacious neutral chat with violet accents.',es:'Chat amplio y neutro con acentos violetas.',values:{palette:true,width:56,fontSize:105,lineHeight:1.8,turnGap:1.8,density:'spacious',radius:22,background:'#19181f',surface:'#272430',text:'#f0edf7',muted:'#b7aec8',accent:'#c2a7ff',border:'#4c425e'}},
  {id:'terminal',name:'Terminal Lab',en:'Monospaced, compact, green on charcoal.',es:'Monoespaciado, compacto, verde sobre carbón.',values:{palette:true,width:72,font:'mono',fontSize:95,lineHeight:1.55,turnGap:0.8,paragraphGap:0.55,alignment:'left',radius:4,density:'compact',background:'#0c1510',surface:'#15251a',text:'#d5f6df',muted:'#a0baa8',accent:'#7fe0a2',border:'#3b5846'}},
  {id:'paper',name:'Paper Notes',en:'Light warm notebook for long-form reading.',es:'Cuaderno claro y cálido para leer textos largos.',values:{palette:true,width:48,font:'serif',fontSize:110,lineHeight:1.9,turnGap:1.9,radius:12,density:'spacious',background:'#faf7ef',surface:'#efebe2',text:'#252a32',muted:'#5e6470',accent:'#315ca0',border:'#b9b4ab'}},
  {id:'midnight',name:'Midnight Build',en:'Navy workspace, cyan accents and ample code space.',es:'Azul nocturno, acentos cian y código amplio.',values:{palette:true,width:66,lineHeight:1.65,radius:12,background:'#111b2b',surface:'#1c2b40',text:'#e6efff',muted:'#a8bbd5',accent:'#76d9ee',border:'#3c5373'}},
  {id:'contrast',name:'Clear Contrast',en:'Large, high-contrast text and visible boundaries.',es:'Texto grande de alto contraste y bordes visibles.',values:{palette:true,width:58,fontSize:115,lineHeight:1.85,headingScale:110,radius:8,density:'spacious',background:'#000000',surface:'#141414',text:'#ffffff',muted:'#d4d4d4',accent:'#8ae8ff',border:'#9b9b9b'}}
]

export function buildCss(value) {
  const s=normalizeSettings(value), root='[data-slot="aui_thread-content"]', md=`${root} .aui-md`
  const padding={compact:6,comfortable:10,spacious:14}[s.density]
  return `
${root} { max-width:${s.width}rem; --conversation-turn-gap:${s.turnGap}rem; --scaffold-block-gap:${s.turnGap*0.6}rem;
  ${s.palette ? `--ui-text-primary:${s.text}; --ui-text-secondary:${s.muted}; --ui-text-tertiary:${s.muted}; --ui-surface-background:${s.surface}; --ui-stroke-tertiary:${s.border}; --background:${s.background}; --foreground:${s.text}; --muted:${s.surface}; --muted-foreground:${s.muted}; --card:${s.surface}; --card-foreground:${s.text}; --border:${s.border}; --primary:${s.accent}; background:${s.background}; color:${s.text}; border-radius:12px;` : ''} }
${root} [data-slot="aui_response-group"] { gap:${s.turnGap*0.7}rem; }
${root} [data-slot="aui_assistant-message-content"], ${root} [data-slot="aui_user-message-root"] { font-size:${s.fontSize}%; line-height:${s.lineHeight}; font-family:${FONTS[s.font]}; }
${md} { line-height:${s.lineHeight}; color:var(--ui-text-primary); }
${md} p { margin-block:0.6em ${s.paragraphGap}em; }
${md} :where(h1,h2,h3,h4) { color:var(--ui-text-primary); font-weight:600; line-height:1.35; margin-block:1.5em 0.65em; text-wrap:balance; }
${md} h1 { font-size:${1.55*s.headingScale/100}em; }
${md} h2 { font-size:${1.3*s.headingScale/100}em; }
${md} h3 { font-size:${1.12*s.headingScale/100}em; }
${md} :where(ul,ol) { margin-block:0.6em 1em; padding-inline-start:1.55em; }
${md} li { margin-block:${s.paragraphGap*0.42}em; }
${md} li > p { margin-block:0.25em; }
${md} strong { font-weight:600; }
${md} blockquote { border-inline-start:2px solid var(--ui-stroke-tertiary); padding-inline-start:1em; color:var(--ui-text-secondary); }
${md} :where(pre,table) { max-width:100%; overflow-x:auto; }
${md} pre { font-size:${s.codeSize}%; ${s.wrapCode ? 'white-space:pre-wrap; overflow-wrap:anywhere;' : ''} }
${md} pre code { ${s.wrapCode ? 'white-space:inherit;' : ''} }
${md} a { ${s.palette ? `color:${s.accent};` : ''} }
${root} [data-slot="aui_user-message-root"] .composer-human-message {
  width:${s.alignment==='full' ? '100%' : 'fit-content'}; max-width:${s.alignment==='full' ? 100 : s.userWidth}%;
  margin-inline-start:${s.alignment==='right' ? 'auto' : '0'}; margin-inline-end:${s.alignment==='left' ? 'auto' : '0'};
  border-radius:${s.bubbles ? s.radius : 0}px; padding:${s.bubbles ? '0.8rem 1rem' : '0.45rem 0'};
  ${!s.bubbles ? 'background:transparent; border-color:transparent;' : s.palette ? `background:${s.surface}; color:${s.text}; border-color:${s.borders ? s.border : 'transparent'};` : ''} }
${root} [data-delegate-card] > div { border-radius:${s.radius*0.45}px; padding:${padding}px ${padding+3}px; background:var(--ui-surface-background); border-color:${s.borders ? 'var(--ui-stroke-tertiary)' : 'transparent'}; }
${root} [data-slot="aui_thinking-disclosure"] { margin-block:0.3rem; }
${root} [data-slot="aui_background-result"] { padding-block:0.45rem; border-inline-start:${s.borders ? 2 : 0}px solid var(--ui-stroke-tertiary); padding-inline-start:0.8rem; }
${root} [data-slot="aui_msg-actions"] { margin-block-start:0.7rem; }
@media (max-width:640px) { ${root} { padding-inline:1.25rem; } ${root} [data-slot="aui_user-message-root"] .composer-human-message { max-width:100%; } }
`
}
export const TRANSCRIPT_CSS=buildCss(DEFAULTS)

export function normalizeSaved(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0,12).filter(v=>v && typeof v.name==='string' && v.name.trim()).map(v=>({name:v.name.trim().slice(0,60),settings:normalizeSettings(v.settings)}))
}
export function parseConfiguration(text) {
  if (typeof text!=='string' || text.length>50000) throw new Error('Invalid configuration')
  const value=JSON.parse(text)
  if (!value || value.format!=='chat-studio' || value.version!==2 || !value.settings || typeof value.settings!=='object' || Array.isArray(value.settings)) throw new Error('Invalid configuration')
  return {settings:normalizeSettings(value.settings),saved:normalizeSaved(value.saved)}
}

const TEXT = {
 en:{title:'Chat Studio settings',intro:'Your plugin, your reading style. Changes apply immediately and stay on this device.',presets:'Presets',customize:'Customize',saved:'Saved & JSON',done:'Done',reset:'Restore defaults',language:'Language',preview:'Live preview',sampleTitle:'Result ready',sampleText:'The agent completed the change and checked it. Files and instructions stay in your conversation.',sampleUser:'Build an app and check it.',sampleTool:'Worker · completed',note:'These presets style the transcript. The original live subagent panel above the prompt keeps its layout.',width:'Reading width (rem)',fontSize:'Text size (%)',lineHeight:'Line height',turnGap:'Space between turns (rem)',paragraphGap:'Paragraph spacing (em)',userWidth:'User message width (%)',radius:'Corner radius (px)',codeSize:'Code size (%)',headingScale:'Heading size (%)',font:'Text font',alignment:'User alignment',density:'Tool card density',bubbles:'User message bubbles',borders:'Card borders',wrapCode:'Wrap long code lines',palette:'Custom transcript colors',background:'Background',surface:'Cards / bubbles',text:'Text',muted:'Secondary text',accent:'Links / accent',border:'Borders',system:'System',serif:'Book / serif',mono:'Monospaced',left:'Left',right:'Right',full:'Full width',compact:'Compact',comfortable:'Comfortable',spacious:'Spacious',save:'Save this style',name:'Style name',empty:'No saved styles yet.',export:'Copy configuration JSON',import:'Import configuration',json:'Paste a Chat Studio configuration',savedOk:'Style saved.',applied:'Style applied.',copied:'Configuration copied.',invalid:'Invalid Chat Studio configuration.',storageError:'Settings could not be saved. Your previous style is still active.',maxSaved:'You can save up to 12 styles.',nameRequired:'Enter a style name.',copyError:'Clipboard unavailable. Configuration is shown below.',delete:'Delete style'},
 es:{title:'Configuración de Chat Studio',intro:'Tu plugin, tu estilo de lectura. Los cambios se aplican al instante y se guardan en este equipo.',presets:'Presets',customize:'Personalizar',saved:'Guardados y JSON',done:'Listo',reset:'Restaurar valores',language:'Idioma',preview:'Vista previa en vivo',sampleTitle:'Resultado listo',sampleText:'El agente terminó el cambio y lo comprobó. Los archivos y las instrucciones siguen en tu conversación.',sampleUser:'Crea una app y compruébala.',sampleTool:'Worker · terminado',note:'Estos presets cambian el historial. El panel original de subagentes encima del prompt conserva su distribución.',width:'Ancho de lectura (rem)',fontSize:'Tamaño de texto (%)',lineHeight:'Interlineado',turnGap:'Espacio entre turnos (rem)',paragraphGap:'Espacio entre párrafos (em)',userWidth:'Ancho de tu mensaje (%)',radius:'Radio de esquinas (px)',codeSize:'Tamaño de código (%)',headingScale:'Tamaño de títulos (%)',font:'Fuente de texto',alignment:'Alineación de tu mensaje',density:'Densidad de tarjetas',bubbles:'Burbujas de tus mensajes',borders:'Bordes de tarjetas',wrapCode:'Ajustar líneas largas de código',palette:'Colores personalizados del historial',background:'Fondo',surface:'Tarjetas / burbujas',text:'Texto',muted:'Texto secundario',accent:'Enlaces / acento',border:'Bordes',system:'Sistema',serif:'Libro / serif',mono:'Monoespaciada',left:'Izquierda',right:'Derecha',full:'Todo el ancho',compact:'Compacta',comfortable:'Cómoda',spacious:'Amplia',save:'Guardar este estilo',name:'Nombre del estilo',empty:'Todavía no hay estilos guardados.',export:'Copiar configuración JSON',import:'Importar configuración',json:'Pega una configuración de Chat Studio',savedOk:'Estilo guardado.',applied:'Estilo aplicado.',copied:'Configuración copiada.',invalid:'Configuración de Chat Studio no válida.',storageError:'No se pudo guardar. Tu estilo anterior sigue activo.',maxSaved:'Puedes guardar hasta 12 estilos.',nameRequired:'Escribe un nombre para el estilo.',copyError:'Portapapeles no disponible. La configuración aparece abajo.',delete:'Eliminar estilo'}
}

function PluginView({ctx,settings,opened,saved,commit}) {
 const s=useValue(settings), open=useValue(opened), stored=useValue(saved), t=TEXT[s.language]
 const [tab,setTab]=useState('presets'), [name,setName]=useState(''), [json,setJson]=useState(''), [message,setMessage]=useState('')
 const change=(key,value)=>commit({...s,[key]:value,preset:'custom'})
 const apply=(value,id)=>{if(commit({...DEFAULTS,...value,language:s.language,preset:id}))setMessage(t.applied)}
 const control={width:'100%',padding:'8px',border:'1px solid var(--ui-stroke-tertiary)',borderRadius:'6px',background:'var(--ui-surface-background)',color:'var(--ui-text-primary)'}
 const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'14px'}
 function field(key,input) {return jsxs('label',{style:{display:'grid',gap:'6px',fontSize:'13px'},children:[jsx('span',{children:t[key]}),input]},key)}
 function number(key) {
  const [min,max]=RANGES[key]
  return field(key,jsxs('div',{style:{display:'flex',alignItems:'center',gap:'10px'},children:[jsx('input',{'aria-label':t[key],type:'range',min,max,step:['lineHeight','turnGap','paragraphGap'].includes(key)?0.05:1,value:s[key],style:{width:'100%',accentColor:'var(--ui-text-primary)'},onChange:e=>change(key,Number(e.target.value))}),jsx('output',{style:{minWidth:'38px',textAlign:'right'},children:String(s[key])})]}))
 }
 function select(key) {return field(key,jsx('select',{'aria-label':t[key],value:s[key],style:control,onChange:e=>change(key,e.target.value),children:ENUMS[key].map(v=>jsx('option',{value:v,children:t[v]||v},v))}))}
 function toggle(key) {return jsxs('label',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',fontSize:'13px'},children:[jsx('span',{children:t[key]}),jsx(Switch,{'aria-label':t[key],checked:s[key],onCheckedChange:v=>change(key,v)})]},key)}
 const preview=jsxs('section',{'aria-label':t.preview,style:{padding:'18px',border:'1px solid var(--ui-stroke-tertiary)',borderRadius:'12px',background:s.palette?s.background:'var(--ui-surface-background)',color:s.palette?s.text:'var(--ui-text-primary)',fontFamily:FONTS[s.font],fontSize:`${s.fontSize}%`,lineHeight:s.lineHeight},children:[
  jsx('div',{style:{fontSize:'11px',opacity:0.75,marginBottom:'14px'},children:t.preview}),
  jsx('div',{style:{background:s.bubbles?(s.palette?s.surface:'var(--ui-surface-background)'):'transparent',borderRadius:`${s.radius}px`,padding:'10px',textAlign:s.alignment==='right'?'right':'left',marginBottom:`${s.turnGap}rem`},children:t.sampleUser}),
  jsx('h3',{style:{fontWeight:600,fontSize:`${1.12*s.headingScale/100}em`,marginBottom:'10px'},children:t.sampleTitle}),
  jsx('p',{style:{marginBottom:`${s.paragraphGap}em`},children:t.sampleText}),
  jsx('pre',{style:{padding:'10px',borderRadius:`${s.radius*0.45}px`,background:s.palette?s.surface:'var(--ui-surface-background)',overflowX:'auto',fontSize:`${s.codeSize}%`,whiteSpace:s.wrapCode?'pre-wrap':'pre'},children:'const result = { passed: true }'}),
  jsx('div',{style:{marginTop:'12px',padding:s.density==='compact'?'6px':'12px',fontSize:'12px',border:s.borders?`1px solid ${s.palette?s.border:'var(--ui-stroke-tertiary)'}`:'none',borderRadius:`${s.radius*0.45}px`},children:t.sampleTool})
 ]})
 const presetPanel=jsx('div',{style:{...grid,gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'10px'},children:PRESETS.map(p=>jsxs(Button,{type:'button',variant:'outline','aria-label':`Apply ${p.name}`,'aria-pressed':s.preset===p.id,onClick:()=>apply(p.values,p.id),style:{height:'auto',padding:'14px',display:'grid',gap:'8px',textAlign:'left',whiteSpace:'normal'},children:[
  jsx('strong',{children:p.name}),jsx('span',{style:{fontSize:'12px',fontWeight:400,opacity:0.75},children:p[s.language]}),
  jsx('div',{'aria-hidden':true,style:{display:'flex',gap:'5px'},children:[p.values.background||DEFAULTS.background,p.values.surface||DEFAULTS.surface,p.values.accent||DEFAULTS.accent].map(color=>jsx('span',{style:{display:'block',width:'22px',height:'8px',borderRadius:'3px',background:color}},color))})
 ]},p.id))})
 const customPanel=jsxs('div',{style:{display:'grid',gap:'16px'},children:[
  jsx('div',{style:grid,children:[...Object.keys(RANGES).map(number),select('font'),select('alignment'),select('density')]}),
  jsx('div',{style:{...grid,gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'},children:['bubbles','borders','wrapCode','palette'].map(toggle)}),
  s.palette?jsx('div',{style:{...grid,gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'},children:COLORS.map(key=>field(key,jsx('input',{type:'color','aria-label':t[key],value:s[key],onChange:e=>change(key,e.target.value),style:{...control,height:'38px',padding:'3px'}})))}):null
 ]})
 const savedPanel=jsxs('div',{style:{display:'grid',gap:'12px'},children:[
  field('name',jsx(Input,{'aria-label':t.name,value:name,maxLength:60,onChange:e=>setName(e.target.value)})),
  jsx(Button,{type:'button',variant:'outline',children:t.save,onClick:()=>{
   if(!name.trim())return setMessage(t.nameRequired)
   if(stored.length>=12)return setMessage(t.maxSaved)
   if(commit(s,[...stored,{name:name.trim().slice(0,60),settings:s}])) {setName('');setMessage(t.savedOk)}
  }}),
  stored.length?jsx('div',{style:{display:'grid',gap:'8px'},children:stored.map((p,index)=>jsxs('div',{style:{display:'flex',gap:'8px'},children:[jsx(Button,{type:'button',variant:'outline',children:p.name,onClick:()=>apply(p.settings,'custom')}),jsx(Button,{type:'button',variant:'ghost','aria-label':`${t.delete}: ${p.name}`,children:'×',onClick:()=>commit(s,stored.filter((_,i)=>i!==index))})]},index))}):jsx('p',{children:t.empty}),
  jsx(Button,{type:'button',variant:'outline',children:t.export,onClick:async()=>{
   const text=JSON.stringify({format:'chat-studio',version:2,settings:s,saved:stored},null,2)
   setJson(text)
   try {setMessage(await ctx.os.writeClipboard(text)?t.copied:t.copyError)}catch {setMessage(t.copyError)}
  }}),
  field('json',jsx('textarea',{'aria-label':t.json,value:json,maxLength:50000,onChange:e=>setJson(e.target.value),rows:6,spellCheck:false,style:{...control,fontFamily:'monospace',fontSize:'12px'}})),
  jsx(Button,{type:'button',variant:'outline',children:t.import,onClick:()=>{
   try {const parsed=parseConfiguration(json);if(commit(parsed.settings,parsed.saved))setMessage(t.applied)}catch {setMessage(t.invalid)}
  }})
 ]})
 return jsxs(Fragment,{children:[
  jsx('style',{'data-hermes-chat-studio':VERSION,children:buildCss(s)}),
  jsx(Button,{type:'button',size:'sm',variant:'ghost','aria-label':t.title,title:t.title,onClick:()=>opened.set(true),children:'Chat Studio'}),
  jsx(Dialog,{open,onOpenChange:v=>opened.set(v),children:jsxs(DialogContent,{style:{width:'min(1020px,94vw)',maxWidth:'1020px'},bodyClassName:'flex flex-col gap-4 p-5',children:[
   jsxs(DialogHeader,{children:[jsx(DialogTitle,{children:t.title}),jsx(DialogDescription,{children:t.intro})]}),
   jsxs('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'},children:[
    ...['presets','customize','saved'].map(id=>jsx(Button,{type:'button',size:'sm',variant:tab===id?'default':'outline','aria-pressed':tab===id,onClick:()=>setTab(id),children:t[id]},id)),
    jsx('select',{'aria-label':t.language,value:s.language,style:{...control,width:'auto',marginInlineStart:'auto'},onChange:e=>commit({...s,language:e.target.value}),children:[jsx('option',{value:'en',children:'English'},'en'),jsx('option',{value:'es',children:'Español'},'es')]})
   ]}),
   jsx('p',{style:{fontSize:'12px',opacity:0.75},children:t.note}),
   tab==='presets'?presetPanel:tab==='customize'?customPanel:savedPanel,
   preview,message?jsx('div',{role:'status',style:{fontSize:'13px'},children:message}):null,
   jsxs('div',{style:{display:'flex',gap:'10px',justifyContent:'space-between'},children:[jsx(Button,{type:'button',variant:'outline',onClick:()=>apply({},'original'),children:t.reset}),jsx(Button,{type:'button',onClick:()=>opened.set(false),children:t.done})]})
  ]})})
 ]})
}

export default {
 id:'chat-studio',name:'Chat Studio',defaultEnabled:true,
 register(ctx) {
  const state=ctx.storage.get('state.v2',{})
  const settings=atom(normalizeSettings(state?.settings)), saved=atom(normalizeSaved(state?.saved)), opened=atom(false)
  const commit=(value,nextSaved=saved.get())=>{
   const next=normalizeSettings(value), sanitizedSaved=normalizeSaved(nextSaved)
   try {ctx.storage.set('state.v2',{settings:next,saved:sanitizedSaved});settings.set(next);saved.set(sanitizedSaved);return true}
   catch {host.notifyError(TEXT[settings.get().language].storageError);return false}
  }
  ctx.register({id:'transcript-style',area:TITLEBAR_AREAS.left,order:999,render:()=>jsx(PluginView,{ctx,settings,opened,saved,commit})})
  ctx.register({id:'settings',area:PALETTE_AREA,data:{id:'chat-studio.settings',label:'Chat Studio: Configure conversation',keywords:['chat','studio','theme','preset','configurar'],run:()=>opened.set(true)}})
 }
}
