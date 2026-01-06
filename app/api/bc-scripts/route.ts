import { bigcommerceClient, getSession } from "@/lib/auth";
import db from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";

// export async function POST (req: Request) {
//   const body = await req.json();

//   const res = await fetch(
//     `https://api.bigcommerce.com/stores/noyunnhark/v3/content/scripts`,
//     {
//       method: "POST",
//       headers: {
//         "X-Auth-Token": "q0e3e3unxrwsvnwgi4fx27624lqwayg"!, // never expose this in frontend
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//     }
//   );

//   const data = await res.json();
//   return NextResponse.json(data, { status: res.status });
// }

export async function POST (req: NextRequest) {
  try {
      // First, retrieve the session by calling:
      const session = await getSession(req);

      // Check if session is valid
      if (!session) {
          return NextResponse.json({ message: 'Session not found' }, { status: 401 });
      }

      const body = await req.json();

      const { accessToken, storeHash } = session;

      // Log the session to verify it's correct
      console.log('session:', session);

      // Then, connect the Node API client (to make API calls to BigCommerce)
      const bigcommerce = bigcommerceClient(accessToken, storeHash);
      
      // Ensure src includes a public store id (opaque) for the storefront script
      const baseUrl = process?.env?.BASE_URL || '';
      let src = body?.src || '';
      if (src) {
        try {
          const url = new URL(src, baseUrl || undefined);
          const publicId = await db.getPublicStoreId(storeHash);
          url.searchParams.set('pub', publicId);
          src = url.toString();
        } catch {
          // Fallback simple concat
          const publicId = await db.getPublicStoreId(storeHash);
          src = `${src}${src.includes('?') ? '&' : '?'}pub=${encodeURIComponent(publicId)}`;
        }
        body.src = src;
      }

      // Create script
      const { data } = await bigcommerce.post('/content/scripts', body);

      // Persist script uuid against store for later updates
      if (data?.uuid) {
        // storeHash already normalized by getSession
        const { storeHash } = session;
        // dynamic import through db facade
        const dbModule = await import('@/lib/db');
        await dbModule.default.setStoreScriptUuid(storeHash, data.uuid);
      }

      // Log the data to verify it's correct
      // console.log('data:', data);

      return NextResponse.json({data: data}, {status: 200});
  } catch (error: any) {
       // Finally, handle errors
      const { message, response } = error;
      return NextResponse.json(
          { message: message || 'Something went wrong' }, 
          { status: response?.status || 500 }
      );
  }
}

export async function PUT (req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    }
    const { accessToken, storeHash } = session;
    const bigcommerce = bigcommerceClient(accessToken, storeHash);
    const uuid = req.nextUrl.searchParams.get("script_uuid");
    if (!uuid) {
      return NextResponse.json({ message: 'Missing script_uuid' }, { status: 400 });
    }
    const body = await req.json();
    // Ensure src keeps public id query param
    if (body?.src) {
      try {
        const url = new URL(body.src, process?.env?.BASE_URL || undefined);
        const publicId = await db.getPublicStoreId(storeHash);
        url.searchParams.set('pub', publicId);
        body.src = url.toString();
      } catch {
        const publicId = await db.getPublicStoreId(storeHash);
        body.src = `${body.src}${body.src.includes('?') ? '&' : '?'}pub=${encodeURIComponent(publicId)}`;
      }
    }
    const { data } = await bigcommerce.put(`/content/scripts/${uuid}`, body);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    const { message, response } = error;
    return NextResponse.json(
      { message: message || 'Something went wrong' }, 
      { status: response?.status || 500 }
    );
  }
}

export async function DELETE (req: NextRequest) {
  // #region agent log
  const logEntry = {location:'bc-scripts/route.ts:123',message:'DELETE endpoint entry',data:{url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
  await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry)}).catch(()=>{});
  // #endregion
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    }
    const { accessToken, storeHash } = session;
    const bigcommerce = bigcommerceClient(accessToken, storeHash);
    const uuid = req.nextUrl.searchParams.get("script_uuid");
    // #region agent log
    const logEntry2 = {location:'bc-scripts/route.ts:131',message:'Before bigcommerce.delete',data:{uuid,hasUuid:!!uuid,storeHash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,F'};
    await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry2)}).catch(()=>{});
    // #endregion
    if (!uuid) {
      return NextResponse.json({ message: 'Missing script_uuid' }, { status: 400 });
    }
    // Attempt to delete the script
    // Note: node-bigcommerce delete() doesn't throw on 404 (script not found), 
    // but BigCommerce API requires the script to exist and be deletable
    let deleteSucceeded = false;
    try {
      const resp = await bigcommerce.delete(`/content/scripts/${uuid}`);
      // #region agent log
      const respStr = typeof resp === 'string' ? resp : JSON.stringify(resp);
      const logEntry3 = {location:'bc-scripts/route.ts:143',message:'After bigcommerce.delete',data:{uuid,respType:typeof resp,respIsNull:resp===null,respIsUndefined:resp===undefined,respStr:respStr.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
      await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3)}).catch(()=>{});
      // #endregion
      
      // If we get here without an error, deletion likely succeeded
      // Empty response or undefined typically means successful DELETE (204 No Content)
      deleteSucceeded = true;
      
      // Verify deletion by attempting to fetch the script (should return 404 if deleted)
      try {
        // #region agent log
        const logEntry3v = {location:'bc-scripts/route.ts:154',message:'Verifying deletion with GET',data:{uuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
        await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3v)}).catch(()=>{});
        // #endregion
        await bigcommerce.get(`/content/scripts/${uuid}`);
        // If we get here, script still exists - deletion failed
        deleteSucceeded = false;
        // #region agent log
        const logEntry3f = {location:'bc-scripts/route.ts:159',message:'Verification failed - script still exists',data:{uuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
        await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3f)}).catch(()=>{});
        // #endregion
      } catch (verifyError: any) {
        // 404 means script was deleted (success), other errors are concerning
        const is404 = verifyError?.response?.status === 404 || verifyError?.message?.includes('404');
        if (!is404) {
          // #region agent log
          const logEntry3e = {location:'bc-scripts/route.ts:166',message:'Verification error (not 404)',data:{uuid,error:verifyError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
          await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3e)}).catch(()=>{});
          // #endregion
        } else {
          // #region agent log
          const logEntry3s = {location:'bc-scripts/route.ts:170',message:'Verification success - script deleted (404)',data:{uuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
          await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3s)}).catch(()=>{});
          // #endregion
        }
      }
    } catch (deleteError: any) {
      // If delete itself throws, it failed
      // #region agent log
      const logEntry3d = {location:'bc-scripts/route.ts:175',message:'delete() threw error',data:{uuid,error:deleteError?.message,status:deleteError?.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
      await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3d)}).catch(()=>{});
      // #endregion
      throw deleteError; // Re-throw to be handled by outer catch
    }
    
    if (!deleteSucceeded) {
      // #region agent log
      const logEntry3c = {location:'bc-scripts/route.ts:180',message:'Deletion verification failed',data:{uuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
      await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3c)}).catch(()=>{});
      // #endregion
      throw new Error(`Script deletion verification failed - script may still exist in BigCommerce`);
    }
    
    // Clear uuid from store doc ONLY if deletion succeeded and verified
    const dbModule = await import('@/lib/db');
    await dbModule.default.setStoreScriptUuid(storeHash, ''); // clears field now
    // #region agent log
    const logEntry4 = {location:'bc-scripts/route.ts:187',message:'DELETE endpoint success - verified',data:{uuid,dbCleared:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,F'};
    await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry4)}).catch(()=>{});
    // #endregion
    // Return 204 No Content for successful DELETE (no body needed)
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    // #region agent log
    const logEntry5 = {location:'bc-scripts/route.ts:141',message:'DELETE endpoint error',data:{errorMessage:error?.message,errorStatus:error?.response?.status,fullError:JSON.stringify(error).substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E,F'};
    await fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry5)}).catch(()=>{});
    // #endregion
    const { message, response } = error;
    return NextResponse.json(
      { message: message || 'Something went wrong' }, 
      { status: response?.status || 500 }
    );
  }
}
