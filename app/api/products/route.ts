import { bigcommerceClient, getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


export async function GET (req: NextRequest) {
    try {
        // First, retrieve the session by calling:
        const session = await getSession(req);

        // Check if session is valid
        if (!session) {
            return NextResponse.json({ message: 'Session not found' }, { status: 401 });
        }

        const { accessToken, storeHash } = session;

        // Log the session to verify it's correct
        // console.log('session:', session);

        // Then, connect the Node API client (to make API calls to BigCommerce)
        const bigcommerce = bigcommerceClient(accessToken, storeHash);
        
        // For this example, we'll be connecting to the Catalog API
        const { data } = await bigcommerce.get('/catalog/summary');

        // Log the data to verify it's correct
        // console.log('data:', data);

        return NextResponse.json({data: data}, {status: 200});
    } catch (error: unknown) {
         // Finally, handle errors
        const { message, response } = error as { message?: string; response?: { status?: number } };
        return NextResponse.json(
            { message: message || 'Something went wrong' }, 
            { status: response?.status || 500 }
        );
    }
}