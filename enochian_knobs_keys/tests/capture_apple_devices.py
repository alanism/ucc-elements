"""Capture every reference composition and both finishes in real Chromium."""
from pathlib import Path
import hashlib
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'apple-devices/index.html'
OUT=ROOT/'.qa/apple-devices'
OUT.mkdir(parents=True,exist_ok=True)
VIEWS=[('desktop',1440,1100),('tablet',768,1100),('mobile',390,1000),('narrow',280,1000)]
EXPECTED=['display','imac','macbook','ipad','iphone']
DEVICES=['display','mac-mini','imac','keyboard','mouse','macbook','pencil','ipad','iphone']
report=[];captures=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch()
    for finish in ['ivory','obsidian']:
        for view,width,height in VIEWS:
            context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
            p=context.new_page();errors=[];remote=[];console=[]
            p.on('pageerror',lambda e:errors.append(str(e)))
            p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
            p.on('request',lambda r:remote.append(r.url) if r.url.startswith(('http:','https:')) else None)
            p.goto(SOURCE.as_uri());p.locator(f'[data-set-finish="{finish}"]').click()
            path=OUT/f'{finish}-{view}.png';p.screenshot(path=str(path),full_page=True);captures.append(str(path))
            if view=='desktop':
                for name in EXPECTED:
                    path=OUT/f'{name}-{finish}.png';p.locator(f'#{name}-study .scene').screenshot(path=str(path));captures.append(str(path))
            metrics=p.evaluate('''() => {
              const clipped=[],small=[],occluded=[];
              for(const el of document.querySelectorAll('.device,.stand,.laptop-base,.chin,.screen-slot')){
                const r=el.getBoundingClientRect(),s=el.closest('.scene').getBoundingClientRect();
                if(r.width<1||r.height<1||r.left<s.left-.5||r.right>s.right+.5||r.top<s.top-.5||r.bottom>s.bottom+.5)clipped.push(el.dataset.device||el.className);
              }
              for(const el of document.querySelectorAll('a[href],button')){
                el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();
                if(r.width<44||r.height<44)small.push(el.textContent);
                const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                if(!hit||!el.contains(hit))occluded.push(el.textContent);
              }
              return {finish:document.getElementById('device-gallery').dataset.finish,overflow:document.documentElement.scrollWidth-innerWidth,clipped,small,occluded,
                devices:[...document.querySelectorAll('[data-device]')].map(el=>el.dataset.device),
                screens:[...document.querySelectorAll('[data-screen]')].map(el=>({name:el.dataset.screen,children:el.childNodes.length,width:el.clientWidth,height:el.clientHeight}))};
            }''')
            report.append({'view':view,'expected_finish':finish,'errors':errors,'remote':remote,'console':console,**metrics})
            context.close()
    browser.close()
failures=[r for r in report if r['errors'] or r['console'] or r['remote'] or r['overflow'] or r['clipped'] or r['small'] or r['occluded'] or r['finish']!=r['expected_finish'] or r['devices']!=DEVICES or [s['name'] for s in r['screens']]!=EXPECTED or any(s['children'] for s in r['screens'])]
result={'sourcehashes':{'apple-devices/index.html':hashlib.sha256(SOURCE.read_bytes()).hexdigest()},'captures':captures,'checks':report,'failures':failures}
(OUT/'report.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'captures':len(captures),'viewport_checks':len(report),'device_count':len(DEVICES),'screen_count':len(EXPECTED),'failures':failures},indent=2))
assert len(report)==len(VIEWS)*2 and len(captures)==len(VIEWS)*2+len(EXPECTED)*2
assert not failures
