import { test } from './adult-fixture';
import { layoutFixtureResponse, fixtureGrammar } from './ui-layout-fixture';

for (const kind of ['grammar', 'vocabulary']) {
 test(`${kind}: reload failure, double retry and connection recovery`, async ({ page }, info) => {
 const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
 const consoleErrors: string[]=[]; page.on('console',e=>{if(e.type()==='error')consoleErrors.push(e.text());});
 let status='FAILED',posts=0,abortNext=false,aborted=false; const requestTimes: number[]=[];
 const grammarResult={totalScore:100,grammarScore:30,connectionScore:20,completenessScore:20,naturalnessScore:20,vocabularyScore:10,isCorrect:true,usedTargetGrammar:true,targetGrammarCorrect:true,resultLevel:'CORRECT',errorSpans:[],correctedSentence:'歩きながら話します。',correctedSentenceFurigana:'歩[ある]きながら話[はな]します。',correctedSentenceTranslationZh:'边走边说。',explanationZh:'测试批改结果正确。',encouragement:'测试合格结果',recallPolicy:{allowedRatings:['FORGOT','FUZZY','REMEMBERED'],reason:'NONE',scorePolicyVersion:'test'}};
 const getJob=()=>({id:'test-review',status,retryCount:1,canRetry:status==='FAILED',errorCode:status==='FAILED'?'AI_REVIEW_DEADLINE':null,...(status==='COMPLETED'?{result:grammarResult}:{})});
 const getPractice=()=>({id:'test-practice',vocabularyId:'v1',grammarId:null,linkedStudySessionId:null,unknownAtStart:false,hintLevel:0,hints:{},createdAt:'2026-09-16T00:00:00Z',status,canRetry:status==='FAILED',answer:'予定があります。',promptZh:'说说明天的安排。',errorCode:status==='FAILED'?'AI_REVIEW_DEADLINE':null,...(status==='COMPLETED'?{result:{outcome:'INDEPENDENT',usedTarget:true,targetCorrect:true,meaningCorrect:true,readingCorrect:null,explanationZh:'测试合格结果',corrections:[],correctedSentence:'予定があります。',correctedFurigana:'予定[よてい]があります。',correctedTranslationZh:'有安排。'}}:{})});
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1','');
  if(path.endsWith('/retry')){posts++;await new Promise(r=>setTimeout(r,300));status=kind==='grammar'?'QUEUED':'ASSESSING';return route.fulfill({json:{data:kind==='grammar'?getJob():getPractice()}});}
  if(path==='/sentence-reviews/test-review'||path==='/vocabulary-practices/test-practice') {
    requestTimes.push(Date.now()); if(abortNext){abortNext=false;aborted=true;return route.abort('connectionfailed');}
    return route.fulfill({json:{data:kind==='grammar'?getJob():getPractice()}});
  }
  if(path==='/study-sessions/layout-session')return route.fulfill({json:{data:{id:'layout-session',grammarId:fixtureGrammar[0].id,grammar:fixtureGrammar[0],mode:'REVIEW',status:'ACTIVE',attempts:[{id:'a',sentence:'歩きながら話します。',aiJob:{id:'test-review'}}]}}});
  return route.fulfill({json:layoutFixtureResponse(req.url(),req.method())});
 });
 const url=`/${kind==='grammar'?'study/layout-session':'vocabulary-practice/test-practice'}`;
 await page.goto(url);
 const retryName=kind==='grammar'?'重新批改':'重试批改';
 await page.getByRole('button',{name:retryName,exact:true}).waitFor();
 await page.reload(); await page.getByRole('button',{name:retryName,exact:true}).waitFor();
 await page.screenshot({path:info.outputPath('failed.png'),fullPage:true});
 const retry=page.getByRole('button',{name:retryName,exact:true});
 await retry.evaluate(element=>{(element as HTMLButtonElement).click();(element as HTMLButtonElement).click();});
 await page.getByText(kind==='grammar'?'AI 正在批改…':/句子已保存，正在批改/,{exact:kind==='grammar'}).waitFor();
 if(posts!==1)throw Error(`duplicate retries ${posts}`);
 // Abort one status read. The persisted job stays processing and recovers after reconnect.
 await new Promise(r=>setTimeout(r,2200)); abortNext=true;
 await page.waitForFunction(()=>true); // no network timing assertion is made on this synchronization point
 const abortDeadline=Date.now()+3000; while(!aborted&&Date.now()<abortDeadline)await new Promise(r=>setTimeout(r,50));
 if(!aborted)throw Error('poll did not run');
 await page.getByText(kind==='grammar'?'连接暂时中断，正在恢复批改状态…':'无法连接学习服务，请稍后重试',{exact:true}).waitFor({timeout:4000});
 status='COMPLETED';const changedAt=Date.now();
 // Native connectivity/focus events trigger normal SWR revalidation after transient failure.
 await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await page.getByText('测试合格结果',{exact:true}).waitFor({timeout:15000});
 const networkRestorePropagationMs=Date.now()-changedAt;
 if(posts!==1)throw Error('network restore resubmitted task');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 if(overflow||errors.length)throw Error(JSON.stringify({overflow,errors}));
 await page.screenshot({path:info.outputPath('complete.png'),fullPage:true});
 await info.attach('review-flow-diagnostics', {contentType: 'application/json', body: JSON.stringify({kind,posts,refreshedFailure:true,transientNetworkRecovery:true,networkRestorePropagationMs,requestIntervalsMs:requestTimes.slice(1).map((t,i)=>t-requestTimes[i]),overflow,errors,consoleErrors,measurement:'Synthetic API status propagation only; not live AI latency'})});
 });
}
