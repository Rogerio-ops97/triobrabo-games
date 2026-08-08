import { NextRequest } from "next/server";
export async function POST(request:NextRequest){if(!process.env.SYNC_SECRET||request.headers.get("authorization")!==`Bearer ${process.env.SYNC_SECRET}`)return Response.json({error:"Não autorizado"},{status:401});return Response.json({ok:true,message:"Conector de fontes pronto; nenhum item alterado nesta execução."});}
