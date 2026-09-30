import { corsHeaders, processBookingRequest } from '../../src/lib/booking';

export const onRequestOptions = async (context: {
  env: Record<string, string | undefined>;
}): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(undefined, context.env.PUBLIC_SITE_URL),
  });
};

export const onRequestPost = async (context: {
  request: Request;
  env: Record<string, string | undefined>;
}): Promise<Response> => {
  let body: unknown;
  const acceptHeader = context.request.headers.get('accept') || '';
  const clientIp =
    context.request.headers.get('cf-connecting-ip') ||
    context.request.headers.get('x-forwarded-for') ||
    undefined;

  try {
    const contentType = context.request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await context.request.json();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await context.request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await context.request.json();
    }
  } catch {
    return new Response(
      JSON.stringify({ ok: false, message: 'Invalid request body' }),
      {
        status: 400,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      },
    );
  }

  return processBookingRequest(
    body,
    context.env,
    new Date(),
    clientIp,
    acceptHeader,
  );
};
