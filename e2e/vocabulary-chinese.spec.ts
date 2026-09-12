import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from './layout';
test('Chinese vocabulary shares grammar grid, with notes, provenance and level filtering', async ({ page }, info) => {
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let selectedLevel='';let bookmarked=false;
 const words=Array.from({length:6},(_,i)=>({id:`v${i}`,word:['明白','悪どい','悪どい','彼処','あっさり','予定'][i],reading:['あからさま','あくどい','あくどい','あそこ','あっさり','よてい'][i],senseKey:String(i),partOfSpeech:[i===0?'adjectival nouns or quasi-adjectives (keiyodoshi)':'noun (common) (futsuumeishi)'],chineseGloss:['公开的；坦率的；毫不掩饰的','花哨的；刺眼的','恶毒的；不诚实的','那里；那边','清淡；素净','计划；预定'][i],glosses:[{language:'eng',text:'dictionary English original'}],chineseGlossSource:'AI辅助翻译 · DeepSeek',level:i===5?'N4':'N1',levelSource:'参考词表',sourceName:'JMdict/EDRDG',sourceVersion:'2026-09',sourceUrl:'https://www.edrdg.org/',license:'CC-BY-SA-4.0'}));
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;let data:unknown={};
  const headers={'access-control-allow-origin':req.headers().origin??'*','access-control-allow-credentials':'true','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,PUT,OPTIONS'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
  if(path.endsWith('/me'))data={id:'u1',displayName:'测试用户',targetLevel:'N1',role:'USER',timezone:'Asia/Tokyo'};
  else if(path.endsWith('/study-plans'))data={items:[{id:'p1',level:'N1',status:'ACTIVE'}]};
  else if(path.endsWith('/vocabulary')){selectedLevel=url.searchParams.get('level')??'';data=selectedLevel?words.filter(w=>w.level===selectedLevel):words;}
  else if(path.endsWith('/bookmark')){bookmarked=true;data={id:'b1'};}
  else if(path.endsWith('/grammar/levels'))data=['N1','N2','N3','N4'].map(level=>({level,count:6}));
  else if(path.endsWith('/grammar'))data=words.map(w=>({id:w.id,title:w.word,chineseExplanation:w.chineseGloss,level:'N1',progress:[]}));
  await route.fulfill({headers,contentType:'application/json',body:JSON.stringify({data,meta:{nextCursor:null}})});
 });
 await page.goto('/library');await expect(page).toHaveURL(/\/library$/);
 const grid=page.getByLabel('词汇卡片列表');await expect(grid.getByRole('heading')).toHaveCount(6);
 const columns=await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
 expect(columns).toBe(info.project.name==='desktop'?3:1);
 await expect(page.getByText('形容动词',{exact:true})).toBeVisible();
 await expect(page.getByText('花哨的；刺眼的',{exact:true}).first()).toBeVisible();
 await expect(page.getByText('恶毒的；不诚实的',{exact:true}).first()).toBeVisible();
 await expect(page.getByText('dictionary English original',{exact:false}).first()).not.toBeVisible();
 await page.screenshot({path:`/tmp/jlpt-vocabulary-zh-${info.project.name}.png`,fullPage:true});
 await expectNoHorizontalOverflow(page);
 await page.getByText('释义详情、备注与来源',{exact:true}).first().click();
 await expect(page.getByText(/词典：JMdict/).first()).toBeVisible();
 await page.getByLabel('明白 备注').fill('工作中用');await page.getByRole('button',{name:'收藏生词',exact:true}).first().click();
 await expect.poll(()=>bookmarked).toBe(true);await expect(page.getByRole('status')).toContainText('已保存生词收藏');
 await page.getByLabel('词汇参考级别').selectOption('N4');await expect.poll(()=>selectedLevel).toBe('N4');
 await expect(grid.getByRole('heading')).toHaveCount(1);await expect(page.getByText('计划；预定',{exact:true}).first()).toBeVisible();
 await expectNoHorizontalOverflow(page);expect(errors).toEqual([]);
});
