import { NextRequest, NextResponse } from 'next/server';
import { getBCVerify, removeSession } from '../../../lib/auth';
 
export async function GET (req: NextRequest) {
    try {
        console.log('************************ Uninstalling app ************************');
        const { searchParams } = new URL(req.url);
        const session = await getBCVerify(Object.fromEntries(searchParams));
 
        await removeSession(session);
        return NextResponse.json({}, { status: 200 });
    } catch (error: unknown) {
        const { message, response } = error as { message?: string; response?: { status?: number } };
        return NextResponse.json(
            { message: message || 'Something went wrong' }, 
            { status: response?.status || 500 }
        );
    }
}