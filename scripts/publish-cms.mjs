const hook=process.env.VERCEL_DEPLOY_HOOK;
if(!hook||!hook.startsWith('https://api.vercel.com/'))throw new Error('Set a valid private VERCEL_DEPLOY_HOOK.');
const response=await fetch(hook,{method:'POST'});if(!response.ok)throw new Error('Vercel rejected the deployment hook.');console.log('Vercel deployment requested. Check its dashboard for build status.');
