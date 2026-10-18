import { expect, test } from './adult-fixture';
import { layoutFixtureResponse, fixtureGrammar } from './ui-layout-fixture';

test('rate-limited status reads recover after three waits without creating another review', async ({ page }, info) => {
  const reads: number[] = [];
  const posts: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/v1/**', async route => {
    const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1','');
    const headers={'access-control-allow-origin':req.headers().origin??'*','access-control-allow-credentials':'true','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS','access-control-expose-headers':'Retry-After'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(path.startsWith('/sentence-reviews')&&req.method()==='POST')posts.push(path);
    if(path==='/study-sessions/rate-session')return route.fulfill({headers,json:{data:{id:'rate-session',grammarId:fixtureGrammar[0].id,grammar:fixtureGrammar[0],mode:'REVIEW',status:'ACTIVE',attempts:[{id:'attempt',sentence:'歩きながら話します。',aiJob:{id:'rate-job'}}]}}});
    if(path==='/sentence-reviews/rate-job'){
      reads.push(Date.now());
      if(reads.length<=3)return route.fulfill({status:429,headers:{...headers,'Retry-After':'2'},json:{error:{code:'HTTP_429',message:'Too many requests'}}});
      return route.fulfill({headers,json:{data:{id:'rate-job',status:'COMPLETED',retryCount:1,result:{id:'result',totalScore:100,grammarScore:30,connectionScore:20,completenessScore:20,naturalnessScore:20,vocabularyScore:10,isCorrect:true,usedTargetGrammar:true,targetGrammarCorrect:true,resultLevel:'CORRECT',errorSpans:[],correctedSentence:'歩きながら話します。',explanationZh:'恢复读取已完成的批改结果。',encouragement:'继续练习。',recallPolicy:{allowedRatings:['FORGOT','FUZZY','REMEMBERED'],reason:'NONE'}}}}});
    }
    return route.fulfill({headers,json:layoutFixtureResponse(req.url(),req.method())});
  });
  await page.goto('/study/rate-session');
  await expect(page).toHaveURL(/\/study\/rate-session$/);
  await expect(page.getByText('结果查询过于频繁，等待限流解除后会自动恢复，请勿重复提交。')).toBeVisible();
  await expect(page.getByRole('button',{name:'正在获取批改结果…',exact:true})).toBeDisabled();
  await expect(page.getByText('连接暂时中断，正在恢复批改状态…')).toHaveCount(0);
  await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));});
  await page.screenshot({path:`/tmp/jlpt-rate-limit-${info.project.name}-waiting.png`,fullPage:true});
  await expect(page.getByText('恢复读取已完成的批改结果。')).toBeVisible({timeout:12_000});
  expect(reads).toHaveLength(4);
  for(let i=1;i<reads.length;i++)expect(reads[i]-reads[i-1]).toBeGreaterThanOrEqual(1_900);
  expect(posts).toEqual([]);
  await page.waitForTimeout(2_100);
  expect(reads).toHaveLength(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({path:`/tmp/jlpt-rate-limit-${info.project.name}-recovered.png`,fullPage:true});
});
