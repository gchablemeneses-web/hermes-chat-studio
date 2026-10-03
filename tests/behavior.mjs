// Public, offline behavior suite. SDK widgets are DOM adapters; native UI is tested separately.
import fs from 'node:fs/promises'
import vm from 'node:vm'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const packageRoot=path.resolve(import.meta.dirname,'..')
const require=createRequire(process.env.CHAT_STUDIO_TEST_DEPENDENCIES || path.join(packageRoot,'package.json'))
const React=require('react'), runtime=require('react/jsx-runtime'), {JSDOM}=require('jsdom')
const dom=new JSDOM('<!doctype html><html><body><div id="plugin-mount"></div><main data-slot="aui_thread-content"><div data-slot="aui_response-group"><div data-slot="aui_assistant-message-content"><div class="aui-md"><h2>Result</h2><p id="reply">Original reply.</p><pre><code>const value = 42</code></pre></div><div data-delegate-card><div id="history-worker">Worker history</div></div><div role="alert">Actual error</div></div></div><div data-slot="aui_user-message-root"><div class="composer-human-message">Original user message.</div></div></main><div id="composer-status"><div data-delegate-card><div id="live-worker">Live worker status</div></div></div><textarea id="prompt">Original prompt</textarea></body></html>',{url:'http://localhost/'})
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})
const {createRoot}=require('react-dom/client'), {act}=React
function atom(initial) {let value=initial;const listeners=new Set();return {get:()=>value,set:next=>{value=next;for(const fn of listeners)fn()},subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}}}
function useValue(store) {return React.useSyncExternalStore(store.subscribe,store.get,store.get)}
function wrapper(tag) {return function({children,bodyClassName,showCloseButton,variant,size,...props}){return runtime.jsx(tag,{...props,children})}}
const errors=[],sdk={TITLEBAR_AREAS:{left:'titleBar.left'},PALETTE_AREA:'palette',atom,useValue,Button:wrapper('button'),Input:wrapper('input'),
 Switch:({checked,onCheckedChange,...props})=>runtime.jsx('input',{...props,type:'checkbox',role:'switch',checked,onChange:e=>onCheckedChange(e.target.checked)}),
 Dialog:({open,children})=>open?runtime.jsx('div',{role:'dialog',children}):null,DialogContent:wrapper('div'),DialogHeader:wrapper('header'),DialogTitle:wrapper('h2'),DialogDescription:wrapper('p'),host:{notifyError:message=>errors.push(message)}}
const context=vm.createContext({console})
function shim(id,exports) {return new vm.SyntheticModule(Object.keys(exports),function(){for(const [key,value] of Object.entries(exports))this.setExport(key,value)},{context,identifier:id})}
const deps={'@hermes/plugin-sdk':shim('@hermes/plugin-sdk',sdk),react:shim('react',React),'react/jsx-runtime':shim('react/jsx-runtime',runtime)}
const source=await fs.readFile(path.join(packageRoot,'desktop/plugin.js'),'utf8')
const module=new vm.SourceTextModule(source,{context,identifier:'chat-studio/plugin.js'})
await module.link(specifier=>{assert(deps[specifier],`Unsupported import: ${specifier}`);return deps[specifier]})
await module.evaluate()
const api=module.namespace, container=document.getElementById('plugin-mount'), persisted=new Map()
let contributions=[],root,failWrites=false,copied=null
const ctx={register:item=>{contributions.push(item);return()=>{}},storage:{get:(key,fallback)=>persisted.get(key)??fallback,set:(key,value)=>{if(failWrites)throw Error('Storage full');persisted.set(key,JSON.parse(JSON.stringify(value)))}},os:{writeClipboard:async text=>{copied=text;return true}}}
async function mount() {contributions=[];api.default.register(ctx);root=createRoot(container);await act(()=>root.render(contributions.find(c=>c.area==='titleBar.left').render()))}
async function click(label) {const button=Array.from(container.querySelectorAll('button')).find(el=>el.getAttribute('aria-label')===label||el.textContent===label);assert(button,`Missing button: ${label}`);await act(()=>button.click())}
async function input(label,value) {const el=container.querySelector(`[aria-label="${label}"]`);assert(el,`Missing input: ${label}`);await act(()=>{const proto=el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:el.tagName==='SELECT'?dom.window.HTMLSelectElement.prototype:dom.window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,String(value));el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));el.dispatchEvent(new dom.window.Event('change',{bubbles:true}))})}
function stylesheet() {return document.querySelector('style[data-hermes-chat-studio]')}
function assertScope() {
 const selectors=[]
 function visit(rules){for(const rule of rules){if(rule.selectorText)selectors.push(rule.selectorText);if(rule.cssRules)visit(rule.cssRules)}}
 visit(stylesheet().sheet.cssRules)
 assert(selectors.length>10)
 for(const selector of selectors)for(const id of ['live-worker','composer-status','prompt'])assert.equal(document.getElementById(id).matches(selector),false,`${id}: ${selector}`)
 assert.equal(document.getElementById('reply').textContent,'Original reply.')
 assert.equal(document.querySelector('main code').textContent,'const value = 42')
 assert.equal(document.querySelector('main [role="alert"]').textContent,'Actual error')
 assert.equal(document.getElementById('prompt').value,'Original prompt')
}
const checks=[]
async function check(name,fn){await fn();checks.push({name,passed:true});console.log(`PASS ${name}`)}
await mount()
await check('sdk_mount_and_default_scope',()=>{assert.equal(contributions.length,2);assert.equal(dom.window.getComputedStyle(document.querySelector('main')).maxWidth,'54rem');assertScope()})
await check('one_click_presets_and_live_status_preserved',async()=>{
 await click('Chat Studio settings')
 for(const p of api.PRESETS){await click(`Apply ${p.name}`);assert.equal(persisted.get('state.v2').settings.preset,p.id);assert.equal(dom.window.getComputedStyle(document.querySelector('main')).maxWidth,`${api.normalizeSettings({...api.DEFAULTS,...p.values}).width}rem`);assertScope()}
})
await check('custom_controls_apply_and_persist',async()=>{
 await click('Customize');await input('Reading width (rem)',62);await input('Text size (%)',112);await input('User alignment','left')
 assert.equal(persisted.get('state.v2').settings.width,62);assert.equal(persisted.get('state.v2').settings.fontSize,112);assert.equal(persisted.get('state.v2').settings.alignment,'left')
 assert.equal(dom.window.getComputedStyle(document.querySelector('main')).maxWidth,'62rem')
 await click('Done');assert.equal(container.querySelector('[role="dialog"]'),null)
 await click('Chat Studio settings');await act(()=>root.unmount());await mount()
 assert.equal(dom.window.getComputedStyle(document.querySelector('main')).maxWidth,'62rem')
})
await check('saved_style_and_export_import_roundtrip',async()=>{
 await click('Chat Studio settings');await click('Saved & JSON');await input('Style name','My reading style');await click('Save this style')
 assert.equal(persisted.get('state.v2').saved.length,1)
 await click('Copy configuration JSON');const exported=JSON.parse(copied);assert.equal(exported.settings.width,62);assert.equal(exported.saved[0].name,'My reading style')
 await click('Presets');await click('Apply Editor Focus');await click('Saved & JSON');await click('My reading style');assert.equal(persisted.get('state.v2').settings.width,62)
 await input('Paste a Chat Studio configuration',copied);await click('Import configuration');assert.equal(persisted.get('state.v2').settings.width,62)
 const before=JSON.stringify(persisted.get('state.v2'));await input('Paste a Chat Studio configuration','{"format":"unrelated","version":2}');await click('Import configuration');assert.equal(JSON.stringify(persisted.get('state.v2')),before)
})
await check('validation_clamps_and_blocks_css_injection',()=>{
 const malicious=api.normalizeSettings({width:1e9,fontSize:NaN,font:'x; } body{display:none}',background:'#000000; } body{display:none}',alignment:'random',palette:'true',unknown:'secret'})
 assert.equal(malicious.width,96);assert.equal(malicious.fontSize,100);assert.equal(malicious.font,'system');assert.equal(malicious.palette,false);assert.equal(malicious.unknown,undefined)
 assert(!api.buildCss(malicious).includes('body{'))
 assert.throws(()=>api.parseConfiguration('x'.repeat(50001)))
 assert.throws(()=>api.parseConfiguration('{"format":"chat-studio","version":2,"settings":[]}'))
})
await check('storage_failure_does_not_apply_partial_settings',async()=>{
 await click('Customize');const before=JSON.stringify(persisted.get('state.v2'));failWrites=true
 await input('Reading width (rem)',80);failWrites=false
 assert.equal(JSON.stringify(persisted.get('state.v2')),before);assert.equal(dom.window.getComputedStyle(document.querySelector('main')).maxWidth,'62rem');assert(errors.length>0)
})
await check('spanish_ui_and_reset_keep_saved_styles',async()=>{
 await input('Language','es');assert(container.textContent.includes('Configuración de Chat Studio'))
 await click('Restaurar valores');assert.equal(dom.window.getComputedStyle(document.querySelector('main')).maxWidth,'54rem');assert.equal(persisted.get('state.v2').saved.length,1);assert.equal(persisted.get('state.v2').settings.language,'es')
})
await check('disable_and_repeated_reload_remove_side_effects',async()=>{
 await act(()=>root.unmount());assert.equal(document.querySelectorAll('style[data-hermes-chat-studio]').length,0);assert.equal(container.textContent,'')
 for(let i=0;i<3;i++){await mount();assert.equal(document.querySelectorAll('style[data-hermes-chat-studio]').length,1);await act(()=>root.unmount());assert.equal(document.querySelectorAll('style[data-hermes-chat-studio]').length,0)}
})
const result={plugin:'chat-studio',version:api.VERSION,passed:true,checks,scope:'React DOM behavior with SDK adapters; native GUI verification is separate.'}
await fs.writeFile(path.join(packageRoot,'test-result.json'),JSON.stringify(result,null,2))
console.log(JSON.stringify(result))
