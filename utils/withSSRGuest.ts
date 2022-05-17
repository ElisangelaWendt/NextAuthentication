//função para que seja utilizada em páginas que o usuário não precisará estar logado para ver
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export function withSSRGuest<P>(fn: GetServerSideProps<P>){
  return async(ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

    const cookies = parseCookies(ctx)
    //quando estiver utilizando o nookies, pelo lado do servidor o primeiro parametro sempre será o contexto (ctx)
    if(cookies['nextauth.token']){
      return{
        redirect:{
          destination: '/dashboard',
          permanent: false,
        }
      }
    }
    return await fn(ctx)
  }
}