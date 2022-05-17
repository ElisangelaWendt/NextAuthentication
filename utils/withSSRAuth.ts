//função para que seja utilizada em páginas que o usuário precisará estar logado
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../errors/AuthTokenError";
import decode from 'jwt-decode'

type WithSSRAuthOptions = {
  permissions?:string[]
  roles?: string[]
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions){
  return async(ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

    const cookies = parseCookies(ctx)
    //quando estiver utilizando o nookies, pelo lado do servidor o primeiro parametro sempre será o contexto (ctx)
    const token = cookies['nextauth.token']

    if(!token){
      return{
        redirect:{
          destination: '/',
          permanent: false,
        }
      }
    }

    const user = decode(token)
    console.log(user)

    try{
    return await fn(ctx)
    }catch(err){
      if(err instanceof AuthTokenError){
        //os cookies devem ser apagados, pois, se não forem, a página de login irá tentar redirecionar novamente para o Dashboard
      //e vai ocorrer um erro 
      destroyCookie(ctx, 'nextauth.token')
      destroyCookie(ctx, 'nextauth.refreshToken')
      // console.log(err instanceof AuthTokenError) //se o erro que está sendo retornado for do tipo AuthTokenError será true
      return{
        //pelo lado do servidor não é possivel utilizar o Router.push, então é utilizado o redirect
        redirect:{//redirecionar o usuário para a tela de login
          destination: '/',
          permanent: false
        }
      }
      }
    }
  }
}