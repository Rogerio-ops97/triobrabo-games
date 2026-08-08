export async function GET(){const key=process.env.VAPID_PUBLIC_KEY;return key?Response.json({key}):Response.json({error:"Web Push não configurado"},{status:503})}
