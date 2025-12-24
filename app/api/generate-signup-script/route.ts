import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';

type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'url';

type FormField = {
  id: number;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  labelColor: string;
  labelSize: string;
  labelWeight: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  bgColor: string;
  padding: string;
  fontSize: string;
  textColor: string;
  // Optional semantic role (supports country/state/password/etc.)
  role?: 'first_name' | 'last_name' | 'email' | 'password' | 'country' | 'state';
  // Row grouping for 2-column layout
  rowGroup?: number | null;
};

type Theme = {
  title?: string;
  subtitle?: string;
  titleColor?: string;
  titleFontSize?: number;
  titleFontWeight?: string;
  subtitleColor?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string;
  primaryColor?: string;
  layout?: 'split' | 'center';
  splitImageUrl?: string;
  buttonText?: string;
  buttonBg?: string;
  buttonColor?: string;
  buttonRadius?: number;
  formBackgroundColor?: string;
  pageBackgroundColor?: string;
};

function toMinifiedScript(fields: FormField[], containerId: string, theme?: Theme) {
  // Normalize theme layout - if split layout but no valid image URL, use center
  const normalizedTheme = theme ? { ...theme } : {};
  if (normalizedTheme.layout === 'split') {
    const hasValidImageUrl = normalizedTheme.splitImageUrl && normalizedTheme.splitImageUrl.trim().length > 0;
    if (!hasValidImageUrl) {
      normalizedTheme.layout = 'center';
    }
  }
  
  // Group fields by rowGroup before generating script
  const groupedFields: Array<{ fields: FormField[]; rowGroup: number | null }> = [];
  const processedIds = new Set<number>();
  
  for (let i = 0; i < fields.length; i++) {
    if (processedIds.has(fields[i].id)) continue;
    
    const field = fields[i];
    if (field.rowGroup != null) {
      const groupFields = fields.filter(f => f.rowGroup === field.rowGroup);
      groupedFields.push({ fields: groupFields, rowGroup: field.rowGroup });
      groupFields.forEach(f => processedIds.add(f.id));
    } else {
      groupedFields.push({ fields: [field], rowGroup: null });
      processedIds.add(field.id);
    }
  }

  const f = JSON.stringify(fields);
  const grouped = JSON.stringify(groupedFields);
  const c = JSON.stringify(containerId);
  const t = JSON.stringify(normalizedTheme);
  const code = `(function(){function run(){try{var f=${f},g=${grouped},c=${c},t=${t};var pr=t.primaryColor||'#2563eb',ttl=t.title||'Create your account',sub=t.subtitle||'Please fill in the form to continue',ttlColor=t.titleColor||pr,ttlSize=(t.titleFontSize==null?22:t.titleFontSize),ttlWeight=t.titleFontWeight||'800',subColor=t.subtitleColor||pr,subSize=(t.subtitleFontSize==null?13:t.subtitleFontSize),subWeight=t.subtitleFontWeight||'400',ly=t.layout||'center',img=t.splitImageUrl||'',btnt=t.buttonText||'Create account',btnbg=(t.buttonBg&&t.primaryColor&&t.buttonBg!==t.primaryColor)?t.buttonBg:pr,btnc=t.buttonColor||'#fff',btnr=(t.buttonRadius==null?10:t.buttonRadius),formbg=t.formBackgroundColor||'#ffffff',pagebg=t.pageBackgroundColor||'#f9fafb';var u=window.location;var p=u.pathname;var q=u.search||'';var m=/\\/login\\.php$/i.test(p)&&/(^|[?&])action=create_account(&|$)/i.test(q);if(!m)return;var d=document,b=d.body;d.documentElement.style.visibility='hidden';var css=':root{--p:'+pr+'}@keyframes cs-spin{to{transform:rotate(360deg)}}@keyframes float{0%{transform:translateY(0)}50%{transform:translateY(-8px)}100%{transform:translateY(0)}}.cs-error{color:#ef4444;font-size:12px;margin-top:6px}.cs-input-error{border-color:#ef4444 !important;}.cs-success{padding:16px;border:1px solid #d1fae5;background:#ecfdf5;color:#065f46;border-radius:10px;margin-top:8px}.cs-row-group{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media (max-width:640px){.cs-row-group{grid-template-columns:1fr !important}}';var st=d.createElement('style');st.textContent=css;d.head&&d.head.appendChild(st);while(b.firstChild)b.removeChild(b.firstChild);b.style.background=pagebg;b.style.margin='0';b.style.fontFamily='ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji';var L=d.createElement('div');L.id='custom-signup-loading';L.style.position='fixed';L.style.inset='0';L.style.background='#ffffff';L.style.display='flex';L.style.alignItems='center';L.style.justifyContent='center';L.style.zIndex='2147483647';var S=d.createElement('div');S.style.width='40px';S.style.height='40px';S.style.border='4px solid #e5e7eb';S.style.borderTopColor='var(--p)';S.style.borderRadius='50%';S.style.animation='cs-spin 1s linear infinite';L.appendChild(S);b.appendChild(L);function applyStyles(e,s){for(var k in s){if(s[k]!=null){var v=s[k];var px=(k==='borderWidth'||k==='borderRadius'||k==='padding'||k==='fontSize')&&(typeof v==='number'||/^[0-9]+$/.test(v));(e.style)[k]=v+(px?'px':'');}}}function addPlaceholder(sel){var o=d.createElement('option');o.textContent='Select an option';o.value='';sel.appendChild(o)}var CR=[{"countryName":"United States","countryShortCode":"US","regions":[{"name":"Alabama","shortCode":"AL"},{"name":"Alaska","shortCode":"AK"},{"name":"Arizona","shortCode":"AZ"},{"name":"California","shortCode":"CA"},{"name":"New York","shortCode":"NY"}]},{"countryName":"Canada","countryShortCode":"CA","regions":[{"name":"Alberta","shortCode":"AB"},{"name":"British Columbia","shortCode":"BC"},{"name":"Ontario","shortCode":"ON"},{"name":"Quebec","shortCode":"QC"}]},{"countryName":"United Kingdom","countryShortCode":"GB","regions":[{"name":"England"},{"name":"Scotland"},{"name":"Wales"},{"name":"Northern Ireland"}]},{"countryName":"Australia","countryShortCode":"AU","regions":[{"name":"New South Wales","shortCode":"NSW"},{"name":"Victoria","shortCode":"VIC"},{"name":"Queensland","shortCode":"QLD"}]},{"countryName":"India","countryShortCode":"IN","regions":[{"name":"Maharashtra"},{"name":"Karnataka"},{"name":"Delhi"}]},{"countryName":"Pakistan","countryShortCode":"PK","regions":[{"name":"Punjab"},{"name":"Sindh"},{"name":"Khyber Pakhtunkhwa"}]}];var countrySelects=[];var stateSelects=[];function fillCountries(sel){addPlaceholder(sel);for(var i=0;i<CR.length;i++){var c=CR[i];var o=d.createElement('option');o.value=c.countryShortCode;o.textContent=c.countryName;sel.appendChild(o)}}function fillStates(sel,code){while(sel.options.length>0){sel.remove(0)}addPlaceholder(sel);var ct=null;for(var i=0;i<CR.length;i++){if(CR[i].countryShortCode===code){ct=CR[i];break}}if(ct){for(var j=0;j<ct.regions.length;j++){var r=ct.regions[j];var o=d.createElement('option');o.value=r.shortCode||r.name;o.textContent=r.name;sel.appendChild(o)}}}var currentCountry='';var page=d.createElement('div');page.style.minHeight='100vh';page.style.display='grid';page.style.gridTemplateColumns= ly==='split'?'1.1fr .9fr':'1fr';page.style.alignItems='stretch';page.style.gap='0';var left=d.createElement('div');if(ly==='split'){left.style.display='flex';left.style.alignItems='center';left.style.justifyContent='center';left.style.position='relative';left.style.overflow='hidden';if(img){left.style.backgroundImage='url('+img+')';left.style.backgroundSize='cover';left.style.backgroundPosition='center';var ov=d.createElement('div');ov.style.position='absolute';ov.style.inset='0';ov.style.background='radial-gradient(1200px 600px at -10% -20%, rgba(37,99,235,.35) 0%, transparent 60%)';left.appendChild(ov);}else{left.style.background='radial-gradient(1200px 600px at -10% -20%, var(--p) 0%, transparent 60%), radial-gradient(800px 400px at 120% 120%, #22d3ee55 0%, transparent 60%)';var orb=d.createElement('div');orb.style.width='160px';orb.style.height='160px';orb.style.borderRadius='50%';orb.style.background='linear-gradient(135deg, #fff, #ffffff55)';orb.style.opacity='0.4';orb.style.animation='float 6s ease-in-out infinite';orb.style.filter='blur(4px)';left.appendChild(orb);}}var root=d.createElement('div');root.id=c;root.style.display='flex';root.style.alignItems='center';root.style.justifyContent='center';root.style.padding='48px 16px';var wrap=d.createElement('div');wrap.style.width='100%';wrap.style.maxWidth='520px';wrap.style.background=formbg;wrap.style.backdropFilter='saturate(180%) blur(8px)';wrap.style.border='1px solid #e5e7eb';wrap.style.borderRadius='16px';wrap.style.boxShadow='0 20px 30px -15px rgba(0,0,0,.2)';wrap.style.padding='28px';var title=d.createElement('h1');title.textContent=ttl;title.style.fontSize=String(ttlSize)+'px';title.style.fontWeight=ttlWeight;title.style.color=ttlColor;title.style.margin='0 0 6px 0';var subtitle=d.createElement('p');subtitle.textContent=sub;subtitle.style.fontSize=String(subSize)+'px';subtitle.style.fontWeight=subWeight;subtitle.style.color=subColor;subtitle.style.margin='0 0 18px 0';var form=d.createElement('form');form.style.display='grid';form.style.gap='14px';var inputs=[];function createField(field){var g=d.createElement('div');var label=d.createElement('label');label.textContent=field.label+(field.required?' *':'');applyStyles(label,{color:field.labelColor,fontSize:field.labelSize,fontWeight:field.labelWeight});label.style.display='block';label.style.marginBottom='6px';g.appendChild(label);var el;switch(field.type){case 'textarea':el=d.createElement('textarea');el.rows=3;break;case 'select':el=d.createElement('select');addPlaceholder(el);break;case 'file':el=d.createElement('input');el.type='file';break;default:el=d.createElement('input');el.type=(field.type==='phone'?'tel':(field.role==='password'?'password':field.type));}if(field.role==='country'){if(!(el&&el.tagName==='SELECT')){el=d.createElement('select')}fillCountries(el);el.addEventListener('change',function(){currentCountry=el.value;for(var si=0;si<stateSelects.length;si++){fillStates(stateSelects[si],currentCountry)}});countrySelects.push(el)}else if(field.role==='state'){if(!(el&&el.tagName==='SELECT')){el=d.createElement('select')}fillStates(el,currentCountry);stateSelects.push(el)}el.placeholder=field.placeholder||'';applyStyles(el,{borderColor:field.borderColor||'#e5e7eb',borderWidth:field.borderWidth||'1',borderStyle:'solid',borderRadius:field.borderRadius||'10',backgroundColor:field.bgColor||'#fff',padding:field.padding||'12',fontSize:field.fontSize||'14',color:field.textColor||'#0f172a'});el.style.width='100%';el.style.outline='none';el.setAttribute('aria-label',field.label);var err=d.createElement('div');err.className='cs-error';err.style.display='none';g.appendChild(el);g.appendChild(err);inputs.push({cfg:field,el:el,err:err});return g}for(var gi=0;gi<g.length;gi++){var group=g[gi];if(group.rowGroup!=null&&group.fields.length===2){var rowGroup=d.createElement('div');rowGroup.className='cs-row-group';for(var fi=0;fi<group.fields.length;fi++){var fieldEl=createField(group.fields[fi]);rowGroup.appendChild(fieldEl)}form.appendChild(rowGroup)}else{for(var fi=0;fi<group.fields.length;fi++){var fieldEl=createField(group.fields[fi]);form.appendChild(fieldEl)}}}var btn=d.createElement('button');btn.type='submit';btn.textContent=btnt;btn.style.height='46px';btn.style.border='0';btn.style.borderRadius=String(btnr)+'px';btn.style.background=btnbg;btn.style.color=btnc;btn.style.fontWeight='700';btn.style.letterSpacing='.02em';btn.style.cursor='pointer';btn.style.marginTop='8px';btn.style.transition='transform .12s ease, opacity .12s ease';btn.onmousedown=function(){btn.style.transform='scale(0.98)'};btn.onmouseup=function(){btn.style.transform='scale(1)'};form.appendChild(btn);function vEmail(x){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(x||'').toLowerCase())}function vUrl(x){try{return Boolean(new URL(String(x||'')))}catch(e){return false}}function vPhone(x){return /^[0-9\\-+()\\s]{7,}$/.test(String(x||''))}function vPwd(x){return /^(?=.*[A-Za-z])(?=.*\\d).{7,}$/.test(String(x||''))}function vZip(x){return /^[A-Za-z0-9 \\-]{3,12}$/.test(String(x||''))}function getVal(cfg,el){if(cfg.type==='checkbox')return !!(el.checked);return (el.value||'').trim()}function setErr(it,msg){it.err.textContent=msg||'';it.err.style.display=msg?'block':'none';if(msg){it.el.classList.add('cs-input-error')}else{it.el.classList.remove('cs-input-error')}if(msg&&el&&el.tagName==='SELECT'&&el.value===''){el.classList.add('cs-input-error')}}function validate(){var ok=true;for(var j=0;j<inputs.length;j++){var it=inputs[j];var cfg=it.cfg;var el=it.el;var val=getVal(cfg,el);var lbl=(cfg.label||'').toLowerCase();setErr(it,'');if(cfg.required&&(!val&&val!==false)){setErr(it,'This field is required');ok=false;continue}if(val){switch(cfg.type){case 'email':if(!vEmail(val)){setErr(it,'Enter a valid email');ok=false}break;case 'url':if(!vUrl(val)){setErr(it,'Enter a valid URL');ok=false}break;case 'number':if(isNaN(Number(val))){setErr(it,'Enter a valid number');ok=false}break;case 'phone':if(!vPhone(val)){setErr(it,'Enter a valid phone');ok=false}break;}if(/password/i.test(lbl)){if(!vPwd(val)){setErr(it,'Password must be 7+ chars and include letters and numbers');ok=false}}else if(cfg.type!=='phone'&&/(phone|mobile|contact)/i.test(lbl)){if(!vPhone(val)){setErr(it,'Enter a valid phone');ok=false}}else if(/(zip|postal)/i.test(lbl)){if(!vZip(val)){setErr(it,'Enter a valid postal code');ok=false}}}}return ok}function collect(){var obj={};for(var j=0;j<inputs.length;j++){var it=inputs[j];var cfg=it.cfg;var key=cfg.label||('Field '+(j+1));var val=getVal(cfg,it.el);obj[key]=val}return obj}function getEmail(){for(var j=0;j<inputs.length;j++){if(inputs[j].cfg&&inputs[j].cfg.type==='email'){var v=getVal(inputs[j].cfg,inputs[j].el);if(vEmail(v))return v.toLowerCase()}}var data=collect();for(var k in data){if(/email/i.test(k)){var vv=String(data[k]||'');if(vEmail(vv))return vv.toLowerCase()}}return ''}function hasFiles(){for(var j=0;j<inputs.length;j++){if(inputs[j].cfg&&inputs[j].cfg.type==='file'){var f=inputs[j].el.files;if(f&&f.length>0)return true}}return false}function appendFiles(fd){for(var j=0;j<inputs.length;j++){if(inputs[j].cfg&&inputs[j].cfg.type==='file'){var fl=inputs[j].el.files||[];if(fl.length){var label=encodeURIComponent(inputs[j].cfg.label||('File '+(j+1)));for(var k=0;k<fl.length;k++){fd.append('file__'+label,fl[k])}}}}}form.addEventListener('submit',function(e){e.preventDefault();if(!validate()){for(var j=0;j<inputs.length;j++){if(inputs[j].err.style.display==='block'){try{inputs[j].el.focus()}catch(_){}break}}return}var s=d.currentScript||d.querySelector('script[src*="custom-signup.min.js"]')||null;var src=s&&s.src||'';var base;var pub='';try{var us=new URL(src,window.location.origin);base=us.origin;pub=us.searchParams.get('pub')||''}catch(_){base=window.location.origin}if(!base){base='';}btn.disabled=true;var prev=btn.textContent;btn.textContent='Submitting…';var dataObj=collect();var email=getEmail();if(hasFiles()){var fd=new FormData();fd.append('pub',pub);fd.append('email',email);fd.append('data',JSON.stringify(dataObj));appendFiles(fd);fetch(base+'/api/public/signup-requests?pub='+encodeURIComponent(pub),{method:'POST',body:fd}).then(function(res){return res.json().then(function(j){if(!res.ok)throw j;return j})}).then(function(){var ok=d.createElement('div');ok.className='cs-success';ok.textContent='Thanks! Your request has been submitted for review.';form.appendChild(ok);btn.disabled=true;btn.style.opacity='0.7'}).catch(function(err){var msg=(err&&err.code==='DUPLICATE')?'You have already submitted a request. Please wait for approval or contact the store admin.':'Submission failed. Please try again.';alert(msg)}).finally(function(){btn.textContent=prev;btn.disabled=false})}else{var payload={data:dataObj,pub:pub,email:email};fetch(base+'/api/public/signup-requests?pub='+encodeURIComponent(pub),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(res){return res.json().then(function(j){if(!res.ok)throw j;return j})}).then(function(){var ok=d.createElement('div');ok.className='cs-success';ok.textContent='Thanks! Your request has been submitted for review.';form.appendChild(ok);btn.disabled=true;btn.style.opacity='0.7'}).catch(function(err){var msg=(err&&err.code==='DUPLICATE')?'You have already submitted a request. Please wait for approval or contact the store admin.':'Submission failed. Please try again.';alert(msg)}).finally(function(){btn.textContent=prev;btn.disabled=false})}});wrap.appendChild(title);wrap.appendChild(subtitle);wrap.appendChild(form);root.appendChild(wrap);if(ly==='split'){page.appendChild(left);}page.appendChild(root);b.appendChild(page);b.removeChild(L);d.documentElement.style.visibility='visible';}catch(e){try{var d=document;var L=d.getElementById('custom-signup-loading');if(L&&L.parentNode)L.parentNode.removeChild(L);d.documentElement.style.visibility='visible'}catch(_){};console&&console.error&&console.error('custom-signup error',e);}}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);window.addEventListener('load',run,{once:true});setTimeout(run,500);}else{run();}})();`;
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fields: FormField[] = body?.formFields || [];
    const containerId: string = body?.containerId || 'custom-signup-container';
    const theme: Theme | undefined = body?.theme;
    if (!Array.isArray(fields)) {
      return NextResponse.json({ ok: false, error: 'Invalid formFields' }, { status: 400 });
    }
    const script = toMinifiedScript(fields, containerId, theme);
    const outPath = path.join(process.cwd(), 'public', 'custom-signup.min.js');
    await writeFile(outPath, script, 'utf8');
    // Return content so callers can store inline in BigCommerce to avoid external dependency
    return NextResponse.json({ ok: true, path: '/custom-signup.min.js', content: script });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

