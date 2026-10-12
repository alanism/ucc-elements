"""Real-browser White/Obsidian renders and reachability checks."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.qa/finishes'
OUT.mkdir(parents=True,exist_ok=True)
VIEWS=[('desktop',1440,1100),('tablet',768,1100),('mobile',390,1000),('narrow',280,1000)]
STUDIES=[('dj-decks','#controller'),('keyboard','#keyboard-controller')]
report=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch()
    for study,root in STUDIES:
        for finish in ['ivory','obsidian']:
            for view,width,height in VIEWS:
                context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
                page=context.new_page();errors=[];remote=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('request',lambda req:remote.append(req.url) if req.url.startswith(('http:','https:')) else None)
                page.goto((ROOT/study/'index.html').as_uri())
                page.locator(f'[data-set-finish={finish}]').click()
                path=OUT/f'{study}-{finish}-{view}.png'
                page.screenshot(path=str(path),full_page=True)
                page.locator('details').evaluate_all('els=>els.forEach(el=>el.open=true)')
                metrics=page.evaluate('''rootSelector=>{
                  const small=[],occluded=[];
                  for(const el of document.querySelectorAll('button,a[href],input:not([type=hidden]),select,[role=slider],summary')){
                    let r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
                    if(r.width<43.99||r.height<43.99)small.push({id:el.id,label:el.textContent.trim(),w:r.width,h:r.height});
                    el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});r=el.getBoundingClientRect();
                    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                    if(!hit||!el.contains(hit))occluded.push(el.id||el.textContent.trim());
                  }
                  return {finish:document.querySelector(rootSelector).dataset.finish,overflow:document.documentElement.scrollWidth-innerWidth,small,occluded};
                }''',root)
                report.append({'study':study,'view':view,'expected_finish':finish,'path':str(path),'errors':errors,'remote':remote,**metrics})
                context.close()
    browser.close()
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
failures=[r for r in report if r['errors'] or r['remote'] or r['overflow'] or r['small'] or r['occluded'] or r['finish']!=r['expected_finish']]
print(json.dumps({'captures':len(report),'failures':failures},indent=2))
assert len(report)==len(STUDIES)*2*len(VIEWS)
assert not failures
